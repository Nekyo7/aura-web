import { db } from "../../src/server/db";
import { RANK_THRESHOLD_HOURS } from "../../src/rules/level";

export const RANK_NAMES = [
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

export const RANK_COLORS = [
  "#94A3B8", // Origin I
  "#94A3B8", // Origin II
  "#94A3B8", // Origin III
  "#22C55E", // Reaper I
  "#22C55E", // Reaper II
  "#22C55E", // Reaper III
  "#3B82F6", // Craftsman I
  "#3B82F6", // Craftsman II
  "#3B82F6", // Craftsman III
  "#A855F7", // Archmage I
  "#A855F7", // Archmage II
  "#A855F7", // Archmage III
  "#F59E0B", // Prodigy I
  "#F59E0B", // Prodigy II
  "#F59E0B", // Prodigy III
  "#EF4444", // Sovereign I
  "#EF4444", // Sovereign II
  "#EF4444", // Sovereign III
  "#EC4899", // Kanye
];

export async function seedRanks() {
  for (let i = 0; i < RANK_THRESHOLD_HOURS.length; i++) {
    const hours = RANK_THRESHOLD_HOURS[i];
    const name = RANK_NAMES[i] ?? `Rank ${i}`;
    const colorHex = RANK_COLORS[i] ?? "#FFFFFF";

    await db.rankTier.upsert({
      where: { index: i },
      update: {
        name,
        thresholdMinutes: hours * 60,
        colorHex,
      },
      create: {
        index: i,
        name,
        thresholdMinutes: hours * 60,
        colorHex,
      },
    });
  }
  console.log("Seeded 19 rank tiers successfully.");
}
