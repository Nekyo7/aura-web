/**
 * Level and Rank Progression Curves
 *
 * Section 5.5 of project-context.md
 * Pure TypeScript functions, no DB/React/Next dependencies.
 */

/**
 * Cumulative XP required to reach a specific level.
 * Formula: xpToReach(level) = round(100 * (level - 1)^1.6)
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.6));
}

/**
 * Derives character level from cumulative total XP.
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * 19 rank thresholds in cumulative practice hours.
 * Formula: thresholdHours(i) = round(10000 * (i / 18)^2)
 */
export const RANK_THRESHOLD_HOURS: readonly number[] = [
  0, 31, 123, 278, 494, 772, 1111, 1512, 1975, 2500,
  3086, 3735, 4444, 5216, 6049, 6944, 7901, 8920, 10000,
];

export const RANK_NAMES: readonly string[] = [
  "Origin I",
  "Origin II",
  "Origin III",
  "Reaper I",
  "Reaper II",
  "Reaper III",
  "Craftsman I",
  "Craftsman II",
  "Craftsman III",
  "Archmage I",
  "Archmage II",
  "Archmage III",
  "Prodigy I",
  "Prodigy II",
  "Prodigy III",
  "Sovereign I",
  "Sovereign II",
  "Sovereign III",
  "Kanye",
];

/**
 * Derives skill rank index (0..18) from cumulative logged minutes.
 */
export function rankFromMinutes(minutes: number): number {
  const hours = minutes / 60;
  let rankIndex = 0;
  for (let i = 0; i < RANK_THRESHOLD_HOURS.length; i++) {
    if (hours >= RANK_THRESHOLD_HOURS[i]) {
      rankIndex = i;
    } else {
      break;
    }
  }
  return rankIndex;
}

/**
 * Calculates rank progress and minutes remaining to the next rank tier.
 */
export function minutesToNextRank(minutes: number) {
  const currentRank = rankFromMinutes(minutes);
  const currentThresholdMinutes = RANK_THRESHOLD_HOURS[currentRank] * 60;
  const isMaxRank = currentRank >= RANK_THRESHOLD_HOURS.length - 1;
  const nextRank = isMaxRank ? currentRank : currentRank + 1;
  const nextThresholdMinutes = RANK_THRESHOLD_HOURS[nextRank] * 60;
  const spanMinutes = Math.max(1, nextThresholdMinutes - currentThresholdMinutes);
  const progressInRankMinutes = Math.min(spanMinutes, Math.max(0, minutes - currentThresholdMinutes));
  const remainingMinutes = Math.max(0, nextThresholdMinutes - minutes);

  return {
    currentRank,
    nextRank,
    currentRankName: RANK_NAMES[currentRank],
    nextRankName: isMaxRank ? "Mastered" : RANK_NAMES[nextRank],
    progressInRankMinutes,
    spanMinutes,
    remainingMinutes,
    isMaxRank,
  };
}

