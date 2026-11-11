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
import { randomUUID } from "crypto";

export interface CompleteManualQuestInput {
  questId: string;
  idempotencyKey?: string;
  occurredAt?: Date;
}

export function getQuestPeriodKey(repeat: "ONCE" | "DAILY" | "WEEKLY", date: Date = new Date()): string {
  if (repeat === "ONCE") {
    return "ONCE";
  }

  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  if (repeat === "DAILY") {
    return `${year}-${month}-${day}`;
  }

  // WEEKLY ISO 8601 week number
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getTierDefaultRewards(tier: number) {
  switch (tier) {
    case 1:
      return { baseXp: 50, mbReward: 10, ccReward: 0, apReward: 0 };
    case 2:
      return { baseXp: 100, mbReward: 25, ccReward: 0, apReward: 0 };
    case 3:
      return { baseXp: 200, mbReward: 50, ccReward: 0, apReward: 5 };
    case 4:
      return { baseXp: 400, mbReward: 100, ccReward: 1, apReward: 15 };
    case 5:
      return { baseXp: 800, mbReward: 200, ccReward: 2, apReward: 30 };
    default:
      return { baseXp: 50, mbReward: 10, ccReward: 0, apReward: 0 };
  }
}

/**
 * Authoritative write path for completing a manual quest.
 * Atomic Prisma transaction with character row locking and pure reward calculation.
 */
export async function completeManualQuest(
  userId: string,
  input: CompleteManualQuestInput
): Promise<RewardSummary> {
  const idempotencyKey = input.idempotencyKey ?? randomUUID();
  const occurredAt = input.occurredAt ?? new Date();

  return await db.$transaction(
    async (tx) => {
      // 1. Idempotency check
      const existingEvent = await tx.activityEvent.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey,
          },
        },
        include: {
          attributeDeltas: true,
        },
      });

      if (existingEvent) {
        const currentChar = await tx.character.findUnique({ where: { userId } });
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

      // 2. Lock character row
      let character = await tx.character.findUnique({ where: { userId } });
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

      await tx.$queryRaw`SELECT id FROM "Character" WHERE "userId" = ${userId} FOR UPDATE`;

      // 3. Resolve quest
      const quest = await tx.quest.findFirst({
        where: {
          id: input.questId,
          userId,
          isArchived: false,
        },
        include: {
          attributeRewards: true,
          kingdom: true,
          skill: true,
        },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found or is archived.",
        });
      }

      // 4. Resolve quest instance for this period
      const periodKey = getQuestPeriodKey(quest.repeat, occurredAt);
      let instance = await tx.questInstance.findUnique({
        where: {
          questId_periodKey: {
            questId: quest.id,
            periodKey,
          },
        },
      });

      if (!instance) {
        instance = await tx.questInstance.create({
          data: {
            questId: quest.id,
            userId,
            periodKey,
            status: "ACTIVE",
          },
        });
      }

      if (instance.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This quest is already completed for the current period.",
        });
      }

      // 5. Calculate Health Gate and Days Since Last Active
      const lastEvent = await tx.activityEvent.findFirst({
        where: { userId },
        orderBy: { occurredAt: "desc" },
      });

      let daysSinceLastActive = 0;
      if (lastEvent) {
        const diffMs = occurredAt.getTime() - lastEvent.occurredAt.getTime();
        daysSinceLastActive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      const todayDate = new Date(
        Date.UTC(occurredAt.getUTCFullYear(), occurredAt.getUTCMonth(), occurredAt.getUTCDate())
      );
      const todaySnapshot = await tx.healthSnapshot.findFirst({
        where: { userId, date: todayDate },
      });

      // 6. Execute Pure Reward Pipeline
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
        quest: {
          id: quest.id,
          title: quest.title,
          kingdomId: quest.kingdomId,
          skillId: quest.skillId,
          baseXp: quest.baseXp,
          apReward: quest.apReward,
          mbReward: quest.mbReward,
          ccReward: quest.ccReward,
          attributeRewards: quest.attributeRewards.map((a) => ({
            key: a.key as AttributeKey,
            points: a.points,
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
        idempotencyKey,
        kind: "QUEST_COMPLETE",
        questId: quest.id,
        questInstanceId: instance.id,
        occurredAt,
        note: `Completed quest: ${quest.title}`,
      };

      const summary = computeReward(rewardInput, rewardCtx);

      // 7. Mark instance completed
      await tx.questInstance.update({
        where: { id: instance.id },
        data: {
          status: "COMPLETED",
          completedAt: occurredAt,
        },
      });

      // 8. Write ActivityEvent ledger
      const event = await tx.activityEvent.create({
        data: {
          userId,
          kind: "QUEST_COMPLETE",
          idempotencyKey,
          occurredAt,
          kingdomId: quest.kingdomId,
          skillId: quest.skillId,
          questInstanceId: instance.id,
          minutes: null,
          baseXp: summary.baseXp,
          healthTier: summary.healthTier,
          healthMultiplier: summary.healthMultiplier,
          comebackBonus: summary.comebackBonus,
          xpAwarded: summary.xpAwarded,
          ruleVersion: summary.ruleVersion,
          note: `Completed quest: ${quest.title}`,
        },
      });

      // 9. Write AttributeDelta rows
      if (summary.attributeDeltas.length > 0) {
        await tx.attributeDelta.createMany({
          data: summary.attributeDeltas.map((delta) => ({
            eventId: event.id,
            key: delta.key,
            points: delta.points,
          })),
        });

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
      }

      // 10. Update Character cache
      await tx.character.update({
        where: { id: character.id },
        data: {
          totalXp: { increment: summary.xpAwarded },
          level: summary.newLevel,
          version: { increment: 1 },
        },
      });

      // 11. Update UserKingdom cache
      await tx.userKingdom.upsert({
        where: {
          userId_kingdomId: {
            userId,
            kingdomId: quest.kingdomId,
          },
        },
        update: {
          xp: { increment: summary.xpAwarded },
        },
        create: {
          userId,
          kingdomId: quest.kingdomId,
          xp: summary.xpAwarded,
        },
      });

      // 12. Update Currency Wallets & Ledgers
      // AP
      if (summary.currencyGains.ap > 0) {
        const apWallet = await tx.wallet.upsert({
          where: {
            userId_currency: { userId, currency: "AP" },
          },
          update: { balance: { increment: summary.currencyGains.ap } },
          create: { userId, currency: "AP", balance: summary.currencyGains.ap },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            currency: "AP",
            amount: summary.currencyGains.ap,
            balanceAfter: apWallet.balance,
            reason: "QUEST_REWARD",
            eventId: event.id,
          },
        });
      }

      // MB (Mew Bucks)
      if (summary.currencyGains.mb > 0) {
        const mbWallet = await tx.wallet.upsert({
          where: {
            userId_currency: { userId, currency: "MB" },
          },
          update: { balance: { increment: summary.currencyGains.mb } },
          create: { userId, currency: "MB", balance: summary.currencyGains.mb },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            currency: "MB",
            amount: summary.currencyGains.mb,
            balanceAfter: mbWallet.balance,
            reason: "QUEST_REWARD",
            eventId: event.id,
          },
        });
      }

      // CC (Chrono Chirals)
      if (summary.currencyGains.cc > 0) {
        const ccWallet = await tx.wallet.upsert({
          where: {
            userId_currency: { userId, currency: "CC" },
          },
          update: { balance: { increment: summary.currencyGains.cc } },
          create: { userId, currency: "CC", balance: summary.currencyGains.cc },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            currency: "CC",
            amount: summary.currencyGains.cc,
            balanceAfter: ccWallet.balance,
            reason: "QUEST_REWARD",
            eventId: event.id,
          },
        });
      }

      return summary;
    },
    {
      maxWait: 5000,
      timeout: 20000,
    }
  );
}

