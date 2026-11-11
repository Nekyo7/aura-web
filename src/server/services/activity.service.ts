import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import {
  computeReward,
  type RewardContext,
  type RewardInput,
  type RewardSummary,
  type AttributeKey,
  type HealthTier,
} from "@/rules/reward";
import { evaluateAchievements } from "@/server/services/achievement.service";
import { getRustWardStatus } from "@/server/services/rust-ward.service";
import { calculateKingdomMomentum } from "@/rules/momentum";

export interface LogActivityInput {
  skillId: string;
  minutes: number;
  idempotencyKey: string;
  occurredAt?: Date;
  note?: string;
}

/**
 * Authoritative progression write path for logging activity time.
 * Invariant: Exactly one write path for progression (project-context.md Section 3 & 7.2).
 */
export async function logActivity(
  userId: string,
  input: LogActivityInput
): Promise<RewardSummary> {
  const occurredAt = input.occurredAt ?? new Date();

  return await db.$transaction(
    async (tx) => {
    // 1. Idempotency check: if already processed, return existing result summary
    const existingEvent = await tx.activityEvent.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: {
        attributeDeltas: true,
      },
    });

    if (existingEvent) {
      const currentChar = await tx.character.findUnique({
        where: { userId },
      });

      return {
        ruleVersion: existingEvent.ruleVersion,
        baseXp: existingEvent.baseXp,
        xpAwarded: existingEvent.xpAwarded,
        healthTier: existingEvent.healthTier as HealthTier,
        healthMultiplier: existingEvent.healthMultiplier,
        comebackBonus: existingEvent.comebackBonus,
        attributeDeltas: existingEvent.attributeDeltas.map((d) => ({
          key: d.key as AttributeKey,
          points: d.points,
        })),
        levelUps: [],
        rankUps: [],
        completedQuests: [],
        currencyGains: { ap: 0, mb: 0, cc: 0 },
        newHp: currentChar?.hp ?? 80,
        newTier: (currentChar?.healthTier as HealthTier) ?? "THRIVING",
        newLevel: currentChar?.level ?? 1,
        achievementsUnlocked: [],
      };
    }

    // 2. Ensure Character row exists, then lock it via SELECT ... FOR UPDATE
    let character = await tx.character.findUnique({
      where: { userId },
    });

    if (!character) {
      character = await tx.character.create({
        data: {
          userId,
          name: "Hero",
          avatarKey: "default",
          totalXp: 0,
          level: 1,
          hp: 80,
          healthTier: "THRIVING",
        },
      });
    }

    // Concurrency control: Lock the Character row for this user
    await tx.$queryRaw`SELECT id FROM "Character" WHERE "userId" = ${userId} FOR UPDATE`;

    // 3. Resolve context: skill, kingdom, attribute weights
    const skill = await tx.skill.findFirst({
      where: {
        id: input.skillId,
        userId,
      },
      include: {
        attributeWeights: true,
        kingdom: true,
      },
    });

    if (!skill) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Skill with ID "${input.skillId}" was not found.`,
      });
    }

    // Determine days since last active for Comeback rule (>= 3 days)
    const lastEvent = await tx.activityEvent.findFirst({
      where: { userId },
      orderBy: { occurredAt: "desc" },
    });

    let daysSinceLastActive = 0;
    if (lastEvent) {
      const diffMs = occurredAt.getTime() - lastEvent.occurredAt.getTime();
      daysSinceLastActive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Check today's health snapshot
    const todayDate = new Date(
      Date.UTC(occurredAt.getUTCFullYear(), occurredAt.getUTCMonth(), occurredAt.getUTCDate())
    );
    const todaySnapshot = await tx.healthSnapshot.findFirst({
      where: {
        userId,
        date: todayDate,
      },
    });

    // 4. Pure Rules Engine execution
    const rewardCtx: RewardContext = {
      character: {
        id: character.id,
        userId: character.userId,
        level: character.level,
        totalXp: character.totalXp,
        hp: character.hp,
        healthTier: character.healthTier as HealthTier,
        graceUntil: character.graceUntil,
        healthShieldUntil: character.healthShieldUntil,
      },
      skill: {
        id: skill.id,
        name: skill.name,
        kingdomId: skill.kingdomId,
        minutesLogged: skill.minutesLogged,
        rankIndex: skill.rankIndex,
        attributeWeights: skill.attributeWeights.map((w) => ({
          key: w.key as AttributeKey,
          weight: w.weight,
        })),
      },
      daysSinceLastActive,
      todayHealthSnapshot: todaySnapshot
        ? {
            hp: todaySnapshot.hp,
            tier: todaySnapshot.tier as HealthTier,
          }
        : null,
    };

    const rewardInput: RewardInput = {
      userId,
      idempotencyKey: input.idempotencyKey,
      kind: "SKILL_LOG",
      minutes: input.minutes,
      skillId: skill.id,
      occurredAt,
      note: input.note,
    };

    const summary = computeReward(rewardInput, rewardCtx);

    // 5. Write Immutable Ledger Rows
    // 5a. ActivityEvent
    const event = await tx.activityEvent.create({
      data: {
        userId,
        kind: "SKILL_LOG",
        idempotencyKey: input.idempotencyKey,
        occurredAt,
        kingdomId: skill.kingdomId,
        skillId: skill.id,
        minutes: input.minutes,
        baseXp: summary.baseXp,
        healthTier: summary.healthTier,
        healthMultiplier: summary.healthMultiplier,
        comebackBonus: summary.comebackBonus,
        xpAwarded: summary.xpAwarded,
        ruleVersion: summary.ruleVersion,
        note: input.note,
      },
    });

    // 5b. AttributeDelta rows
    if (summary.attributeDeltas.length > 0) {
      await tx.attributeDelta.createMany({
        data: summary.attributeDeltas.map((delta) => ({
          eventId: event.id,
          key: delta.key,
          points: delta.points,
        })),
      });
    }

    // 6. Update Caches Atomically
    // 6a. Character cache
    await tx.character.update({
      where: { id: character.id },
      data: {
        totalXp: { increment: summary.xpAwarded },
        level: summary.newLevel,
        version: { increment: 1 },
      },
    });

    // 6b. CharacterAttribute caches
    for (const delta of summary.attributeDeltas) {
      await tx.characterAttribute.upsert({
        where: {
          characterId_key: {
            characterId: character.id,
            key: delta.key,
          },
        },
        update: {
          points: { increment: delta.points },
        },
        create: {
          characterId: character.id,
          key: delta.key,
          points: delta.points,
        },
      });
    }

    // 6c. Skill cache & Rust Reset
    const targetRankIndex =
      summary.rankUps.length > 0
        ? summary.rankUps[summary.rankUps.length - 1].newRank
        : skill.rankIndex;

    // Check rust ward status (freezes rust accumulation across all disciplines)
    const rustWard = await getRustWardStatus(userId, tx);

    await tx.skill.update({
      where: { id: skill.id },
      data: {
        minutesLogged: { increment: input.minutes },
        rankIndex: targetRankIndex,
        lastPracticedAt: occurredAt,
        rustLevel: 0,
      },
    });

    // 6d. UserKingdom cache & Momentum Surges
    const existingUserKingdom = await tx.userKingdom.findUnique({
      where: {
        userId_kingdomId: {
          userId,
          kingdomId: skill.kingdomId,
        },
      },
    });

    const isSurgeActive =
      !!existingUserKingdom?.surgeUntil &&
      new Date(existingUserKingdom.surgeUntil).getTime() > occurredAt.getTime() &&
      (existingUserKingdom.surgeMultiplier ?? 1.0) > 1.0;

    const surgeMultiplierToApply = isSurgeActive
      ? existingUserKingdom?.surgeMultiplier ?? 1.0
      : 1.0;
    const kingdomXpToAward = Math.round(summary.xpAwarded * surgeMultiplierToApply);

    // Calculate rolling 7-day minutes in this Kingdom to evaluate momentum
    const sevenDaysAgo = new Date(occurredAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentKingdomEvents = await tx.activityEvent.findMany({
      where: {
        userId,
        kingdomId: skill.kingdomId,
        occurredAt: { gte: sevenDaysAgo },
      },
      select: { minutes: true },
    });
    const currentWeeklyMinutes =
      recentKingdomEvents.reduce((acc, ev) => acc + (ev.minutes ?? 0), 0) + input.minutes;

    const momentum = calculateKingdomMomentum({
      currentWeeklyMinutes,
      baselineMinutesPerWeek: existingUserKingdom?.baselineMinutesPerWeek ?? 0,
      currentSurgeMultiplier: existingUserKingdom?.surgeMultiplier ?? null,
      surgeUntil: existingUserKingdom?.surgeUntil ?? null,
      now: occurredAt,
    });

    await tx.userKingdom.upsert({
      where: {
        userId_kingdomId: {
          userId,
          kingdomId: skill.kingdomId,
        },
      },
      update: {
        xp: { increment: kingdomXpToAward },
        baselineMinutesPerWeek: momentum.updatedBaseline,
        surgeMultiplier: momentum.surgeMultiplier,
        surgeUntil: momentum.surgeUntil,
      },
      create: {
        userId,
        kingdomId: skill.kingdomId,
        xp: kingdomXpToAward,
        baselineMinutesPerWeek: momentum.updatedBaseline,
        surgeMultiplier: momentum.surgeMultiplier,
        surgeUntil: momentum.surgeUntil,
      },
    });

    // 6e. Currency & Wallets (Aura Points from Level Ups / Rank Ups)
    if (summary.currencyGains.ap > 0) {
      const wallet = await tx.wallet.upsert({
        where: {
          userId_currency: {
            userId,
            currency: "AP",
          },
        },
        update: {
          balance: { increment: summary.currencyGains.ap },
        },
        create: {
          userId,
          currency: "AP",
          balance: summary.currencyGains.ap,
        },
      });

      for (const lvl of summary.levelUps) {
        if (lvl.apGained > 0) {
          await tx.currencyTransaction.create({
            data: {
              userId,
              currency: "AP",
              amount: lvl.apGained,
              balanceAfter: wallet.balance,
              reason: "LEVEL_UP",
              eventId: event.id,
            },
          });
        }
      }

      for (const rnk of summary.rankUps) {
        if (rnk.apGained > 0) {
          await tx.currencyTransaction.create({
            data: {
              userId,
              currency: "AP",
              amount: rnk.apGained,
              balanceAfter: wallet.balance,
              reason: "RANK_UP",
              eventId: event.id,
            },
          });
        }
      }
    }

    // 7. Step 12: Evaluate Achievements within the same transaction
    const totalLogsCount = await tx.activityEvent.count({ where: { userId } });
    const minutesSum = await tx.skill.aggregate({
      where: { userId },
      _sum: { minutesLogged: true },
    });
    const allUserSkills = await tx.skill.findMany({
      where: { userId },
      select: { rankIndex: true },
    });
    const maxRank = Math.max(
      targetRankIndex,
      ...allUserSkills.map((s) => s.rankIndex),
      0
    );
    const activeKingdomsCount = await tx.userKingdom.count({
      where: { userId, xp: { gt: 0 } },
    });

    const newlyUnlocked = await evaluateAchievements(
      userId,
      {
        characterLevel: summary.newLevel,
        totalXp: character.totalXp + summary.xpAwarded,
        hp: summary.newHp,
        healthTier: summary.newTier,
        totalLogsCount,
        totalMinutesLogged: minutesSum._sum.minutesLogged ?? 0,
        maxSkillRankIndex: maxRank,
        activeKingdomsCount,
      },
      tx
    );

    if (newlyUnlocked.length > 0) {
      summary.achievementsUnlocked = newlyUnlocked.map((a) => a.name);
    }

    return summary;
  },
  {
    maxWait: 5000,
    timeout: 20000,
  });
}
