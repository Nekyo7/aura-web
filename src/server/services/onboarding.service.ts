import { db } from "@/server/db";
import type { Character, CharacterAttribute } from "@prisma/client";

export type CharacterWithAttributes = Character & {
  attributes: CharacterAttribute[];
};

/**
 * Onboarding Service: Ensures a Character row and 6 core attributes exist for the user.
 * Invariants: Level 1, 80 HP, 0 XP, and 0 points for STR, AGI, INT, CHA, DEX, WIS.
 */
export async function ensureCharacterExists(
  userId: string,
  name?: string | null
): Promise<CharacterWithAttributes> {
  const existing = await db.character.findUnique({
    where: { userId },
    include: {
      attributes: true,
    },
  });

  if (existing) {
    return existing;
  }

  // 7-day initial new account grace period (HP held at 80 per project-context.md 5.3)
  const graceUntil = new Date();
  graceUntil.setDate(graceUntil.getDate() + 7);

  const character = await db.character.create({
    data: {
      userId,
      name: name?.trim() || "Adventurer",
      avatarKey: "default",
      level: 1,
      hp: 80,
      totalXp: 0,
      healthTier: "THRIVING",
      graceUntil,
      attributes: {
        create: [
          { key: "STR", points: 0 },
          { key: "AGI", points: 0 },
          { key: "INT", points: 0 },
          { key: "CHA", points: 0 },
          { key: "DEX", points: 0 },
          { key: "WIS", points: 0 },
        ],
      },
    },
    include: {
      attributes: true,
    },
  });

  // Ensure AP Wallet exists
  await db.wallet.upsert({
    where: {
      userId_currency: {
        userId,
        currency: "AP",
      },
    },
    update: {},
    create: {
      userId,
      currency: "AP",
      balance: 0,
    },
  });

  return character;
}

