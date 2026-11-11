/**
 * Pure Rules Engine: Vitality Math
 *
 * Implements the 7-day rolling health model from Section 5.3 of project-context.md.
 * Pure functional TypeScript - no Prisma, Next.js, or React imports.
 */

export type HealthTier = "THRIVING" | "NEUTRAL" | "WEAKENED";

export interface VitalityWeights {
  rhythm: number; // default 0.40
  body: number;   // default 0.30
  balance: number; // default 0.15
  spirit: number; // default 0.15
}

export interface VitalityConfig {
  modelVersion: number;
  rhythmTargetDays: number;
  bodyTargetMinutes: number;
  balanceTargetKingdoms: number;
  weights: VitalityWeights;
  hpFloor: number;
}

export const DEFAULT_VITALITY_CONFIG: VitalityConfig = {
  modelVersion: 1,
  rhythmTargetDays: 4,      // 4 out of 7 days is 100%
  bodyTargetMinutes: 150,   // 150 minutes of physical activity in 7 days
  balanceTargetKingdoms: 3, // 3 distinct life domains active in 7 days
  weights: {
    rhythm: 0.40,
    body: 0.30,
    balance: 0.15,
    spirit: 0.15,
  },
  hpFloor: 25,              // HP never drops to 0; anti-guilt baseline
};

export interface VitalityInput {
  activeDaysCount: number; // 0..7
  bodyMinutes: number;
  distinctKingdomsCount: number;
  checkIns?: Array<{ energy: number; mood: number }> | null;
  inGracePeriod?: boolean;
  isShieldActive?: boolean; // Second Wind (CC) recovery
}

export interface VitalityResult {
  hp: number;
  tier: HealthTier;
  rhythm: number;  // 0..100
  body: number;    // 0..100
  balance: number; // 0..100
  spirit: number | null; // 0..100 or null if no check-ins
  rawHp: number;
  inGracePeriod: boolean;
  isShieldActive: boolean;
}

/**
 * Determines HealthTier based on HP score and active Second Wind shield.
 */
export function tierFromHp(hp: number, isShieldActive: boolean = false): HealthTier {
  if (hp >= 80) return "THRIVING";
  if (hp >= 40) return "NEUTRAL";
  if (isShieldActive) return "NEUTRAL";
  return "WEAKENED";
}

/**
 * Computes 4 vitality sub-components and overall HP.
 */
export function computeVitality(
  input: VitalityInput,
  config: VitalityConfig = DEFAULT_VITALITY_CONFIG
): VitalityResult {
  // 1. Rhythm: Showing up (4 of 7 days is full marks, so rest days are healthy)
  const rhythmRatio = Math.min(1, Math.max(0, input.activeDaysCount / config.rhythmTargetDays));
  const rhythm = Number((rhythmRatio * 100).toFixed(1));

  // 2. Body: Physical activity (minutes on skills flagged countsAsBody)
  let body = 100;
  if (config.bodyTargetMinutes > 0) {
    const bodyRatio = Math.min(1, Math.max(0, input.bodyMinutes / config.bodyTargetMinutes));
    body = Number((bodyRatio * 100).toFixed(1));
  }

  // 3. Balance: Life breadth (distinct active kingdoms)
  const balanceRatio = Math.min(1, Math.max(0, input.distinctKingdomsCount / config.balanceTargetKingdoms));
  const balance = Number((balanceRatio * 100).toFixed(1));

  // 4. Spirit: Self-reported energy and mood from optional check-ins (1..5 scale)
  let spirit: number | null = null;
  const validCheckIns = input.checkIns?.filter(
    (c) => c && typeof c.energy === "number" && typeof c.mood === "number"
  );

  if (validCheckIns && validCheckIns.length > 0) {
    const totalScore = validCheckIns.reduce((sum, c) => {
      // (energy + mood) / 10 -> percentage
      return sum + ((c.energy + c.mood) / 10) * 100;
    }, 0);
    spirit = Number((totalScore / validCheckIns.length).toFixed(1));
  }

  // Calculate Weighted HP
  let calculatedHp = 0;
  if (spirit !== null) {
    calculatedHp =
      config.weights.rhythm * rhythm +
      config.weights.body * body +
      config.weights.balance * balance +
      config.weights.spirit * spirit;
  } else {
    // Renormalize without spirit component
    const remainingWeight = config.weights.rhythm + config.weights.body + config.weights.balance;
    if (remainingWeight > 0) {
      calculatedHp =
        (config.weights.rhythm / remainingWeight) * rhythm +
        (config.weights.body / remainingWeight) * body +
        (config.weights.balance / remainingWeight) * balance;
    } else {
      calculatedHp = 100;
    }
  }

  const rawHp = Number(calculatedHp.toFixed(1));
  let finalHp = Math.max(config.hpFloor, rawHp);

  // Anti-guilt Grace Period: new accounts hold HP at 80 for 7 days
  const inGracePeriod = Boolean(input.inGracePeriod);
  if (inGracePeriod) {
    finalHp = Math.max(80, finalHp);
  }

  const isShieldActive = Boolean(input.isShieldActive);
  const tier = tierFromHp(finalHp, isShieldActive);

  return {
    hp: Number(finalHp.toFixed(1)),
    tier,
    rhythm,
    body,
    balance,
    spirit,
    rawHp,
    inGracePeriod,
    isShieldActive,
  };
}

