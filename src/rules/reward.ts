/**
 * Pure Rules Engine: Reward Engine
 *
 * All progression flows through this pure function.
 * Do NOT import Prisma, React, or Next.js here - this module must remain purely functional
 * and 100% unit-testable in any environment (server, client preview, vitest).
 *
 * References: project-context.md Section 5.1 & Section 4
 */

import { levelFromXp, rankFromMinutes } from "./level";

export type AttributeKey = "STR" | "AGI" | "INT" | "CHA" | "DEX" | "WIS";
export type HealthTier = "THRIVING" | "NEUTRAL" | "WEAKENED";
export type ActivityKind =
  | "SKILL_LOG"
  | "QUEST_COMPLETE"
  | "CHECK_IN_BONUS"
  | "ADJUSTMENT"
  | "REVERSAL";

export interface RewardInput {
  userId: string;
  idempotencyKey: string;
  kind: ActivityKind;
  minutes?: number | null;
  skillId?: string | null;
  questId?: string | null;
  questInstanceId?: string | null;
  occurredAt?: Date | string;
  note?: string | null;
}

export interface AttributeWeight {
  key: AttributeKey;
  weight: number;
}

export interface AttributeReward {
  key: AttributeKey;
  points: number;
}

export interface RewardContext {
  character: {
    id: string;
    userId: string;
    level: number;
    totalXp: number;
    hp: number;
    healthTier: HealthTier;
    graceUntil?: Date | string | null;
    healthShieldUntil?: Date | string | null;
  };
  midasSurgeActive?: boolean;
  skill?: {
    id: string;
    name: string;
    kingdomId: string;
    minutesLogged: number;
    rankIndex: number;
    attributeWeights: AttributeWeight[];
  } | null;
  quest?: {
    id: string;
    title: string;
    kingdomId: string;
    skillId?: string | null;
    baseXp: number;
    apReward: number;
    mbReward: number;
    ccReward: number;
    attributeRewards: AttributeReward[];
  } | null;
  openQuestInstances?: Array<{
    id: string;
    questId: string;
    progressMinutes: number;
    criteriaMinutes?: number | null;
  }>;
  daysSinceLastActive?: number;
  todayHealthSnapshot?: {
    hp: number;
    tier: HealthTier;
  } | null;
}

export interface RewardConfig {
  ruleVersion: number;
  xpPerMinute: number;
  attributePointsPerHour: number;
  healthMultipliers: Record<HealthTier, number>;
  healthCurrencyMultipliers: Record<HealthTier, number>;
  apPerLevelUp: number;
  apPerRankUp: number;
  mbPerRankUp: number;
  ccPerRankUp: number;
}

export interface AttributeDeltaSummary {
  key: AttributeKey;
  points: number;
}

export interface LevelUpSummary {
  oldLevel: number;
  newLevel: number;
  apGained: number;
}

export interface RankUpSummary {
  skillId: string;
  oldRank: number;
  newRank: number;
  apGained: number;
  mbGained?: number;
  ccGained?: number;
}

export interface CompletedQuestSummary {
  questId: string;
  title: string;
  apReward: number;
  mbReward: number;
  ccReward: number;
}

export interface CurrencyGains {
  ap: number;
  mb: number;
  cc: number;
}

export interface RewardSummary {
  ruleVersion: number;
  baseXp: number;
  xpAwarded: number;
  healthTier: HealthTier;
  healthMultiplier: number;
  currencyMultiplier?: number;
  midasMultiplier?: number;
  comebackBonus: boolean;
  attributeDeltas: AttributeDeltaSummary[];
  levelUps: LevelUpSummary[];
  rankUps: RankUpSummary[];
  completedQuests: CompletedQuestSummary[];
  currencyGains: CurrencyGains;
  newHp: number;
  newTier: HealthTier;
  newLevel: number;
  achievementsUnlocked: string[];
}

/**
 * Default progression configuration
 * Thriving (>= 80 HP): 1.2x currency multiplier
 * Neutral (40-79 HP): 1.0x currency multiplier
 * Weakened (< 40 HP): 0.8x currency multiplier
 */
export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  ruleVersion: 1,
  xpPerMinute: 10,
  attributePointsPerHour: 60,
  healthMultipliers: {
    THRIVING: 1.0,
    NEUTRAL: 0.85,
    WEAKENED: 0.5,
  },
  healthCurrencyMultipliers: {
    THRIVING: 1.2,
    NEUTRAL: 1.0,
    WEAKENED: 0.8,
  },
  apPerLevelUp: 10,
  apPerRankUp: 50,
  mbPerRankUp: 150,
  ccPerRankUp: 1,
};

/**
 * 14-Step Pure Progression Pipeline (Section 5.1):
 *
 * 1. Validate and dedupe via (userId, idempotencyKey) [checked in transactional service layer]
 * 2. Lock character row [handled in transactional service layer]
 * 3. Resolve context: skill, kingdom, open quest instances
 * 4. Health gate: read tier, get multiplier (1.0 / 0.85 / 0.5), apply Comeback rule (>= 3 inactive days -> 1.0)
 * 5. Base XP: SKILL_LOG = minutes * xpPerMinute; QUEST_COMPLETE = quest.baseXp
 * 6. Apply multiplier to XP and attribute points
 * 7. Attribute deltas: skill minutes * weighted split + quest attribute rewards
 * 8. Write ledger plan (ActivityEvent + AttributeDelta)
 * 9. Update caches plan: skill minutes & rank check, character XP & level check, attributes, Kingdom XP
 * 10. Auto-advance quests: accumulate progress for SKILL_MINUTES/KINGDOM_MINUTES
 * 11. Currency: quest rewards + AP for level-ups/rank-ups + Vitality & Midas Multipliers
 * 12. Achievements (Stage 2 evaluation)
 * 13. Recompute today's HealthSnapshot (instant feedback)
 * 14. Return RewardSummary
 */
export function computeReward(
  input: RewardInput,
  ctx: RewardContext,
  config: RewardConfig = DEFAULT_REWARD_CONFIG
): RewardSummary {
  // Step 3 & 4: Determine health tier and multiplier (with Comeback rule check)
  const isComeback = (ctx.daysSinceLastActive ?? 0) >= 3;
  const currentTier = ctx.todayHealthSnapshot?.tier ?? ctx.character.healthTier;
  const rawMultiplier = config.healthMultipliers[currentTier] ?? 1.0;
  const effectiveMultiplier = isComeback ? 1.0 : rawMultiplier;

  // Currency Multipliers: Vitality multiplier + Midas Surge (2.0x on MB)
  const rawCurrencyMultiplier = config.healthCurrencyMultipliers[currentTier] ?? 1.0;
  const effectiveCurrencyMultiplier = isComeback ? Math.max(1.0, rawCurrencyMultiplier) : rawCurrencyMultiplier;
  const midasMultiplier = ctx.midasSurgeActive ? 2.0 : 1.0;

  // Step 5: Base XP calculation
  let baseXp = 0;
  if (input.kind === "SKILL_LOG" && input.minutes) {
    baseXp = Math.round(input.minutes * config.xpPerMinute);
  } else if (input.kind === "QUEST_COMPLETE" && ctx.quest) {
    baseXp = ctx.quest.baseXp;
  }

  // Step 6: Multiplied XP
  const xpAwarded = Math.round(baseXp * effectiveMultiplier);

  // Step 7: Attribute deltas (skill weighted split + quest attribute rewards)
  const attributeDeltas: AttributeDeltaSummary[] = [];
  if (ctx.skill?.attributeWeights && input.minutes) {
    const totalWeight = ctx.skill.attributeWeights.reduce(
      (sum, w) => sum + w.weight,
      0
    );
    const totalPoints =
      (input.minutes / 60) * config.attributePointsPerHour * effectiveMultiplier;

    for (const weight of ctx.skill.attributeWeights) {
      if (totalWeight > 0) {
        const points = Number(
          ((weight.weight / totalWeight) * totalPoints).toFixed(2)
        );
        attributeDeltas.push({ key: weight.key, points });
      }
    }
  }

  if (ctx.quest?.attributeRewards) {
    for (const attr of ctx.quest.attributeRewards) {
      const points = Number((attr.points * effectiveMultiplier).toFixed(2));
      const existing = attributeDeltas.find((d) => d.key === attr.key);
      if (existing) {
        existing.points = Number((existing.points + points).toFixed(2));
      } else {
        attributeDeltas.push({ key: attr.key, points });
      }
    }
  }

  // Step 9 & 11: Level up check
  const currentXp = ctx.character.totalXp;
  const newTotalXp = currentXp + xpAwarded;
  const currentLevel = ctx.character.level;
  const newLevel = levelFromXp(newTotalXp);

  const levelUps: LevelUpSummary[] = [];
  let totalApGained = 0;
  if (newLevel > currentLevel) {
    const rawAp = (newLevel - currentLevel) * config.apPerLevelUp;
    const apGained = Math.round(rawAp * effectiveCurrencyMultiplier);
    totalApGained += apGained;
    levelUps.push({
      oldLevel: currentLevel,
      newLevel,
      apGained,
    });
  }

  // Rank up check (awards AP, +150 MB lump sum, and +1 CC per rank-up boundary)
  const rankUps: RankUpSummary[] = [];
  let totalRankMbGained = 0;
  let totalRankCcGained = 0;
  if (ctx.skill && input.minutes) {
    const currentMinutes = ctx.skill.minutesLogged;
    const newMinutes = currentMinutes + input.minutes;
    const currentRank = ctx.skill.rankIndex;
    const newRank = rankFromMinutes(newMinutes);

    if (newRank > currentRank) {
      const rankSteps = newRank - currentRank;
      const apGained = Math.round(rankSteps * config.apPerRankUp * effectiveCurrencyMultiplier);
      const mbGained = Math.round(rankSteps * (config.mbPerRankUp ?? 150) * effectiveCurrencyMultiplier * midasMultiplier);
      const ccGained = rankSteps * (config.ccPerRankUp ?? 1);

      totalApGained += apGained;
      totalRankMbGained += mbGained;
      totalRankCcGained += ccGained;

      rankUps.push({
        skillId: ctx.skill.id,
        oldRank: currentRank,
        newRank,
        apGained,
        mbGained,
        ccGained,
      });
    }
  }

  // Quests completion rewards
  const completedQuests: CompletedQuestSummary[] = [];
  let questApGained = 0;
  let questMbGained = 0;
  let questCcGained = 0;

  if (ctx.quest) {
    questApGained = ctx.quest.apReward > 0
      ? Math.max(1, Math.round(ctx.quest.apReward * effectiveCurrencyMultiplier))
      : 0;
    questMbGained = ctx.quest.mbReward > 0
      ? Math.max(1, Math.round(ctx.quest.mbReward * effectiveCurrencyMultiplier * midasMultiplier))
      : 0;
    questCcGained = ctx.quest.ccReward ?? 0;

    completedQuests.push({
      questId: ctx.quest.id,
      title: ctx.quest.title,
      apReward: questApGained,
      mbReward: questMbGained,
      ccReward: questCcGained,
    });
  }

  const currencyGains: CurrencyGains = {
    ap: totalApGained + questApGained,
    mb: totalRankMbGained + questMbGained,
    cc: totalRankCcGained + questCcGained,
  };

  // Step 14: Return authoritative RewardSummary
  return {
    ruleVersion: config.ruleVersion,
    baseXp,
    xpAwarded,
    healthTier: currentTier,
    healthMultiplier: effectiveMultiplier,
    currencyMultiplier: effectiveCurrencyMultiplier,
    midasMultiplier,
    comebackBonus: isComeback,
    attributeDeltas,
    levelUps,
    rankUps,
    completedQuests,
    currencyGains,
    newHp: ctx.todayHealthSnapshot?.hp ?? ctx.character.hp,
    newTier: currentTier,
    newLevel,
    achievementsUnlocked: [],
  };
}
