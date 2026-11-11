/**
 * Pure rules engine for Skill Rust calculation.
 *
 * Rules:
 * - Rust begins accumulating after 30 days of inactivity on a skill.
 * - Rust scales progressively from 0.0 to 1.0 (over the subsequent 60 days).
 * - If a Rust Ward item is active, rust accumulation is completely frozen (rustLevel = 0.0).
 * - Rust NEVER decreases rank, rank index, or accumulated hours.
 * - When an activity is logged on a skill, rust resets to 0.0.
 */

export interface RustCalculationOptions {
  now?: Date;
  isRustWardActive?: boolean;
}

export interface RustStatus {
  rustLevel: number; // 0.0 to 1.0
  isRusty: boolean;
  daysInactive: number;
  label: string;
  badgeColor: string;
  borderColor: string;
  description: string;
}

const INACTIVITY_THRESHOLD_DAYS = 30;
const RUST_RAMP_DAYS = 60; // Rust reaches 1.0 at 90 days total inactivity (30 + 60)

/**
 * Pure function calculating rust level (0.0 to 1.0) based on lastPracticedAt.
 */
export function calculateRustLevel(
  lastPracticedAt: Date | string | null | undefined,
  options?: RustCalculationOptions
): number {
  // If Rust Ward is active, rust accumulation is frozen
  if (options?.isRustWardActive) {
    return 0.0;
  }

  if (!lastPracticedAt) {
    // If never practiced yet, newly forged skill is pristine
    return 0.0;
  }

  const lastDate = typeof lastPracticedAt === "string" ? new Date(lastPracticedAt) : lastPracticedAt;
  const currentDate = options?.now ?? new Date();

  const diffMs = currentDate.getTime() - lastDate.getTime();
  if (diffMs <= 0) {
    return 0.0;
  }

  const daysInactive = diffMs / (1000 * 60 * 60 * 24);

  if (daysInactive <= INACTIVITY_THRESHOLD_DAYS) {
    return 0.0;
  }

  const daysPastThreshold = daysInactive - INACTIVITY_THRESHOLD_DAYS;
  const rawRust = daysPastThreshold / RUST_RAMP_DAYS;

  // Clamp to [0.0, 1.0] and round to 2 decimal places
  const clamped = Math.min(1.0, Math.max(0.0, rawRust));
  return Math.round(clamped * 100) / 100;
}

/**
 * Evaluates the human-friendly visual status and theme attributes for a given rust level.
 */
export function getRustStatus(
  lastPracticedAt: Date | string | null | undefined,
  options?: RustCalculationOptions
): RustStatus {
  const rustLevel = calculateRustLevel(lastPracticedAt, options);

  let daysInactive = 0;
  if (lastPracticedAt) {
    const lastDate = typeof lastPracticedAt === "string" ? new Date(lastPracticedAt) : lastPracticedAt;
    const currentDate = options?.now ?? new Date();
    daysInactive = Math.max(0, Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  if (options?.isRustWardActive) {
    return {
      rustLevel: 0.0,
      isRusty: false,
      daysInactive,
      label: "Rust Ward Protected",
      badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-500",
      borderColor: "border-cyan-500",
      description: "Protected by Chrono Chirals Rust Ward. Rust accumulation is frozen.",
    };
  }

  if (rustLevel <= 0) {
    return {
      rustLevel: 0.0,
      isRusty: false,
      daysInactive,
      label: "Pristine",
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-600",
      borderColor: "border-emerald-600/40",
      description: "Regularly practiced. Sharp and polished.",
    };
  }

  if (rustLevel < 0.35) {
    return {
      rustLevel,
      isRusty: true,
      daysInactive,
      label: `Dusty (${Math.round(rustLevel * 100)}%)`,
      badgeColor: "bg-amber-950 text-amber-300 border-amber-600",
      borderColor: "border-amber-600/80",
      description: `Inactive for ${daysInactive} days. Practice once to polish back to 100%.`,
    };
  }

  if (rustLevel < 0.75) {
    return {
      rustLevel,
      isRusty: true,
      daysInactive,
      label: `Rusted (${Math.round(rustLevel * 100)}%)`,
      badgeColor: "bg-orange-950 text-orange-300 border-orange-600",
      borderColor: "border-orange-600",
      description: `Inactive for ${daysInactive} days. Skill is collecting rust. Log time to clear rust instantly.`,
    };
  }

  return {
    rustLevel,
    isRusty: true,
    daysInactive,
    label: `Heavy Rust (${Math.round(rustLevel * 100)}%)`,
    badgeColor: "bg-rose-950 text-rose-300 border-rose-600 animate-pulse",
    borderColor: "border-rose-600",
    description: `Inactive for ${daysInactive} days. Heavy rust detected. Ranks and hours are permanently safe. Practice to fully restore.`,
  };
}

