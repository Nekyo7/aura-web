/**
 * Pure Rules Engine: Achievement Definitions & Criteria
 *
 * References: project-context.md Section 5.1 & Section 6
 * Pure functional TypeScript - no Prisma, Next.js, or React imports.
 */

export interface AchievementEvaluationState {
  characterLevel: number;
  totalXp: number;
  hp: number;
  healthTier: string;
  totalLogsCount: number;
  totalMinutesLogged: number;
  maxSkillRankIndex: number;
  activeKingdomsCount: number;
}

export interface AchievementCriteriaConfig {
  type:
    | "MIN_LOGS"
    | "MIN_LEVEL"
    | "MIN_HP"
    | "MIN_SKILL_RANK"
    | "MIN_ACTIVE_KINGDOMS"
    | "MIN_MINUTES";
  threshold: number;
}

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  criteria: AchievementCriteriaConfig;
  apReward: number;
  mbReward: number;
  ccReward: number;
  isSecret?: boolean;
}

export const ACHIEVEMENTS_LIST: readonly AchievementDefinition[] = [
  {
    key: "FIRST_LOG",
    name: "The First Step",
    description: "Log your first real-life skill practice into the Codex.",
    emoji: "sprout",
    criteria: { type: "MIN_LOGS", threshold: 1 },
    apReward: 25,
    mbReward: 20,
    ccReward: 0,
  },
  {
    key: "VITALITY_THRIVING",
    name: "Peak Vitality",
    description: "Reach Thriving status with 80+ HP in your rolling 7-day Vitality matrix.",
    emoji: "heart",
    criteria: { type: "MIN_HP", threshold: 80 },
    apReward: 50,
    mbReward: 40,
    ccReward: 1,
  },
  {
    key: "LEVEL_5",
    name: "Journeyman Adventurer",
    description: "Ascend to Character Level 5 through disciplined real-world effort.",
    emoji: "star",
    criteria: { type: "MIN_LEVEL", threshold: 5 },
    apReward: 100,
    mbReward: 50,
    ccReward: 1,
  },
  {
    key: "SKILL_RANK_CRAFTSMAN",
    name: "Master Artisan",
    description: "Elevate any skill to Rank 6 (Craftsman I) with 1,111+ cumulative hours.",
    emoji: "hammer",
    criteria: { type: "MIN_SKILL_RANK", threshold: 6 },
    apReward: 200,
    mbReward: 150,
    ccReward: 2,
  },
  {
    key: "REALM_EXPLORER",
    name: "Cosmic Harmony",
    description: "Log effort across at least 3 distinct Kingdom realms within your 7-day window.",
    emoji: "compass",
    criteria: { type: "MIN_ACTIVE_KINGDOMS", threshold: 3 },
    apReward: 75,
    mbReward: 50,
    ccReward: 0,
  },
  {
    key: "CENTURION",
    name: "Centurion of Time",
    description: "Amass 100 cumulative practice hours (6,000 minutes) across all disciplines.",
    emoji: "clock",
    criteria: { type: "MIN_MINUTES", threshold: 6000 },
    apReward: 150,
    mbReward: 100,
    ccReward: 1,
  },
  {
    key: "LEVEL_10",
    name: "Apex Pioneer",
    description: "Achieve Character Level 10 and solidify your legendary presence.",
    emoji: "crown",
    criteria: { type: "MIN_LEVEL", threshold: 10 },
    apReward: 300,
    mbReward: 250,
    ccReward: 2,
  },
];

/**
 * Pure evaluation function checking if a user state satisfies an achievement's criteria.
 */
export function checkAchievementCriteria(
  criteria: AchievementCriteriaConfig,
  state: AchievementEvaluationState
): boolean {
  switch (criteria.type) {
    case "MIN_LOGS":
      return state.totalLogsCount >= criteria.threshold;
    case "MIN_LEVEL":
      return state.characterLevel >= criteria.threshold;
    case "MIN_HP":
      return state.hp >= criteria.threshold;
    case "MIN_SKILL_RANK":
      return state.maxSkillRankIndex >= criteria.threshold;
    case "MIN_ACTIVE_KINGDOMS":
      return state.activeKingdomsCount >= criteria.threshold;
    case "MIN_MINUTES":
      return state.totalMinutesLogged >= criteria.threshold;
    default:
      return false;
  }
}

