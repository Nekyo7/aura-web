/**
 * Pure Rules Engine: Kingdom Momentum & Surges
 *
 * Kingdoms auto-detect momentum when a player's recent training exceeds
 * their rolling weekly baseline. Surges reward hyperfocus and deep work
 * sprints with temporary XP multipliers without punishing other realms.
 *
 * References: project-context.md Section 5.2 & Section 8 (Stage 3)
 */

export interface MomentumInput {
  currentWeeklyMinutes: number;
  baselineMinutesPerWeek: number;
  currentSurgeMultiplier?: number | null;
  surgeUntil?: Date | string | null;
  now?: Date;
}

export type SurgeLevel = "NONE" | "SPARK" | "SURGE" | "TORRENT";

export interface MomentumResult {
  isSurgeActive: boolean;
  surgeMultiplier: number;
  surgeUntil: Date | null;
  updatedBaseline: number;
  surgeLevel: SurgeLevel;
  ratio: number;
  description: string;
}

const MINIMUM_BASELINE_MINUTES = 60; // 1 hour threshold before surges can activate
const SURGE_DURATION_HOURS = 48; // Surges last 48 hours

/**
 * Pure function to calculate a Kingdom's surgeMultiplier and momentum state.
 */
export function calculateKingdomMomentum(input: MomentumInput): MomentumResult {
  const now = input.now ?? new Date();
  const effectiveBaseline = Math.max(MINIMUM_BASELINE_MINUTES, input.baselineMinutesPerWeek);
  const ratio = input.currentWeeklyMinutes / effectiveBaseline;

  // Check if existing surge has not yet expired
  const existingSurgeActive =
    !!input.surgeUntil &&
    new Date(input.surgeUntil).getTime() > now.getTime() &&
    (input.currentSurgeMultiplier ?? 1.0) > 1.0;

  // Calculate updated exponential baseline (85% historical, 15% new pace)
  const updatedBaseline = Math.round(
    (input.baselineMinutesPerWeek > 0
      ? input.baselineMinutesPerWeek * 0.85 + input.currentWeeklyMinutes * 0.15
      : input.currentWeeklyMinutes) * 10
  ) / 10;

  // 1. Torrential Surge: 200%+ of baseline
  if (ratio >= 2.0 && input.currentWeeklyMinutes >= 120) {
    const surgeUntil = new Date(now.getTime() + SURGE_DURATION_HOURS * 60 * 60 * 1000);
    return {
      isSurgeActive: true,
      surgeMultiplier: 1.25,
      surgeUntil,
      updatedBaseline,
      surgeLevel: "TORRENT",
      ratio: Math.round(ratio * 100) / 100,
      description: "Torrential Surge! Massive momentum detected (200%+ of baseline). 1.25x Realm XP active!",
    };
  }

  // 2. Focused Surge: 150%+ of baseline
  if (ratio >= 1.5 && input.currentWeeklyMinutes >= 90) {
    const surgeUntil = new Date(now.getTime() + SURGE_DURATION_HOURS * 60 * 60 * 1000);
    return {
      isSurgeActive: true,
      surgeMultiplier: 1.15,
      surgeUntil,
      updatedBaseline,
      surgeLevel: "SURGE",
      ratio: Math.round(ratio * 100) / 100,
      description: "Realm Surge! Training momentum is rising (+50% over baseline). 1.15x Realm XP active!",
    };
  }

  // 3. Spark: 120%+ of baseline
  if (ratio >= 1.2 && input.currentWeeklyMinutes >= 60) {
    const surgeUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      isSurgeActive: true,
      surgeMultiplier: 1.1,
      surgeUntil,
      updatedBaseline,
      surgeLevel: "SPARK",
      ratio: Math.round(ratio * 100) / 100,
      description: "Momentum Spark! Active rhythm established (+20% over baseline). 1.10x Realm XP active!",
    };
  }

  // 4. Retain unexpired existing surge if still within window
  if (existingSurgeActive) {
    const currentMultiplier = input.currentSurgeMultiplier ?? 1.15;
    return {
      isSurgeActive: true,
      surgeMultiplier: currentMultiplier,
      surgeUntil: new Date(input.surgeUntil!),
      updatedBaseline,
      surgeLevel: currentMultiplier >= 1.25 ? "TORRENT" : currentMultiplier >= 1.15 ? "SURGE" : "SPARK",
      ratio: Math.round(ratio * 100) / 100,
      description: `Surge in effect! ${currentMultiplier}x Realm XP multiplier active.`,
    };
  }

  // 5. Default steady state (no active surge)
  return {
    isSurgeActive: false,
    surgeMultiplier: 1.0,
    surgeUntil: null,
    updatedBaseline,
    surgeLevel: "NONE",
    ratio: Math.round(ratio * 100) / 100,
    description: "Steady realm influence. Train consistently to trigger a Kingdom Surge.",
  };
}

