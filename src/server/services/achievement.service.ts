import { db } from "@/server/db";
import {
  ACHIEVEMENTS_LIST,
  checkAchievementCriteria,
  type AchievementEvaluationState,
  type AchievementDefinition,
} from "@/rules/achievements";
import type { Prisma } from "@prisma/client";

export interface UnlockedAchievementResult {
  key: string;
  name: string;
  description: string;
  emoji: string;
  apReward: number;
  mbReward: number;
  ccReward: number;
}

/**
 * Ensures system achievements are seeded in the database.
 */
export async function ensureAchievementsSeeded(tx: Prisma.TransactionClient = db) {
  for (const a of ACHIEVEMENTS_LIST) {
    await tx.achievement.upsert({
      where: { key: a.key },
      update: {
        name: a.name,
        description: a.description,
        criteria: a.criteria as unknown as Prisma.InputJsonValue,
        apReward: a.apReward,
        mbReward: a.mbReward,
        ccReward: a.ccReward,
        isSecret: a.isSecret ?? false,
      },
      create: {
        key: a.key,
        name: a.name,
        description: a.description,
        criteria: a.criteria as unknown as Prisma.InputJsonValue,
        apReward: a.apReward,
        mbReward: a.mbReward,
        ccReward: a.ccReward,
        isSecret: a.isSecret ?? false,
      },
    });
  }
}

/**
 * Evaluates achievement criteria against user's state, writes UserAchievement rows,
 * and credits AP, MB, and CC currency rewards atomically.
 */
export async function evaluateAchievements(
  userId: string,
  state: AchievementEvaluationState,
  tx: Prisma.TransactionClient = db
): Promise<UnlockedAchievementResult[]> {
  // 1. Ensure achievements exist in DB
  await ensureAchievementsSeeded(tx);

  // 2. Fetch all achievement records and user's already unlocked set
  const [allDbAchievements, userUnlocked] = await Promise.all([
    tx.achievement.findMany(),
    tx.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const unlockedIds = new Set(userUnlocked.map((u) => u.achievementId));
  const newlyUnlocked: UnlockedAchievementResult[] = [];

  // 3. Check each locked achievement
  for (const achDef of ACHIEVEMENTS_LIST) {
    const dbAch = allDbAchievements.find((a) => a.key === achDef.key);
    if (!dbAch || unlockedIds.has(dbAch.id)) {
      continue;
    }

    const isSatisfied = checkAchievementCriteria(achDef.criteria, state);
    if (isSatisfied) {
      // Create UserAchievement row
      await tx.userAchievement.create({
        data: {
          userId,
          achievementId: dbAch.id,
        },
      });

      // Credit AP reward
      if (achDef.apReward > 0) {
        const apWallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency: "AP" } },
          update: { balance: { increment: achDef.apReward } },
          create: { userId, currency: "AP", balance: achDef.apReward },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            currency: "AP",
            amount: achDef.apReward,
            balanceAfter: apWallet.balance,
            reason: "ACHIEVEMENT",
            meta: { achievementKey: achDef.key },
          },
        });
      }

      // Credit MB reward
      if (achDef.mbReward > 0) {
        const mbWallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency: "MB" } },
          update: { balance: { increment: achDef.mbReward } },
          create: { userId, currency: "MB", balance: achDef.mbReward },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            currency: "MB",
            amount: achDef.mbReward,
            balanceAfter: mbWallet.balance,
            reason: "ACHIEVEMENT",
            meta: { achievementKey: achDef.key },
          },
        });
      }

      // Credit CC reward
      if (achDef.ccReward > 0) {
        const ccWallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency: "CC" } },
          update: { balance: { increment: achDef.ccReward } },
          create: { userId, currency: "CC", balance: achDef.ccReward },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            currency: "CC",
            amount: achDef.ccReward,
            balanceAfter: ccWallet.balance,
            reason: "ACHIEVEMENT",
            meta: { achievementKey: achDef.key },
          },
        });
      }

      newlyUnlocked.push({
        key: achDef.key,
        name: achDef.name,
        description: achDef.description,
        emoji: achDef.emoji,
        apReward: achDef.apReward,
        mbReward: achDef.mbReward,
        ccReward: achDef.ccReward,
      });
    }
  }

  return newlyUnlocked;
}

