import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { ensureUpToDate } from "@/server/services/health.service";
import { activateRustWard } from "@/server/services/rust-ward.service";

export const walletRouter = router({
  /**
   * Protected query returning current balances for AP, MB, and CC.
   */
  getBalances: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const wallets = await ctx.db.wallet.findMany({
      where: { userId },
    });

    const balances = {
      ap: 0,
      mb: 0,
      cc: 0,
    };

    for (const w of wallets) {
      if (w.currency === "AP") balances.ap = w.balance;
      if (w.currency === "MB") balances.mb = w.balance;
      if (w.currency === "CC") balances.cc = w.balance;
    }

    return balances;
  }),

  /**
   * Protected query returning user's active custom Mew Bucks rewards.
   */
  listRewards: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let rewards = await ctx.db.reward.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Seed starter treats if user has none
    if (rewards.length === 0) {
      const starters = [
        { name: "Watch 1 Episode of Anime / Show", emoji: "tv", costMb: 40 },
        { name: "Guilt-Free Gaming (1 Hour)", emoji: "gamepad", costMb: 60 },
        { name: "Cheat Meal / Favorite Coffee", emoji: "coffee", costMb: 100 },
      ];

      for (const s of starters) {
        await ctx.db.reward.create({
          data: {
            userId,
            ...s,
          },
        });
      }

      rewards = await ctx.db.reward.findMany({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return rewards;
  }),

  /**
   * Protected mutation to define a new custom real-life treat.
   */
  createCustomReward: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, "Reward name is required"),
        costMb: z.number().int().positive("Cost must be at least 1 Mew Buck"),
        emoji: z.string().optional().default("gift"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db.reward.create({
        data: {
          userId,
          name: input.name,
          costMb: input.costMb,
          emoji: input.emoji || "gift",
        },
      });
    }),

  /**
   * Protected procedure to purchase a Mew Bucks treat.
   * Transactional: checks balance, deducts currency, writes CurrencyTransaction ledger row.
   */
  purchaseReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string().min(1, "Reward ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db.$transaction(
        async (tx) => {
          // 1. Fetch and validate reward
          const reward = await tx.reward.findFirst({
            where: {
              id: input.rewardId,
              userId,
              isArchived: false,
            },
          });

          if (!reward) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Reward treat not found or archived.",
            });
          }

          // 2. Lock and check MB wallet
          let mbWallet = await tx.wallet.findUnique({
            where: {
              userId_currency: {
                userId,
                currency: "MB",
              },
            },
          });

          if (!mbWallet) {
            mbWallet = await tx.wallet.create({
              data: {
                userId,
                currency: "MB",
                balance: 0,
              },
            });
          }

          if (mbWallet.balance < reward.costMb) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient Mew Bucks! Needed: ${reward.costMb} MB, Current: ${mbWallet.balance} MB.`,
            });
          }

          const newBalance = mbWallet.balance - reward.costMb;

          // 3. Deduct balance
          await tx.wallet.update({
            where: { id: mbWallet.id },
            data: { balance: newBalance },
          });

          // 4. Write immutable CurrencyTransaction ledger
          await tx.currencyTransaction.create({
            data: {
              userId,
              currency: "MB",
              amount: -reward.costMb,
              balanceAfter: newBalance,
              reason: "SHOP_PURCHASE",
              rewardId: reward.id,
              meta: { rewardName: reward.name },
            },
          });

          return {
            success: true,
            reward,
            amountSpent: reward.costMb,
            newBalance,
          };
        },
        {
          maxWait: 5000,
          timeout: 20000,
        }
      );
    }),

  /**
   * Protected procedure to purchase Chrono Chirals recovery tools.
   * Second Wind (1 CC): Vitality treated as at least NEUTRAL for 24h.
   * Rust Ward (2 CC): Freezes rust decay for 7 days.
   * Rewind (1 CC): Allows 48h activity backfill.
   */
  purchaseRecoveryItem: protectedProcedure
    .input(
      z.object({
        itemKey: z.enum(["SECOND_WIND", "RUST_WARD", "REWIND"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const costs: Record<string, number> = {
        SECOND_WIND: 1,
        RUST_WARD: 2,
        REWIND: 1,
      };

      const cost = costs[input.itemKey] ?? 1;

      const result = await ctx.db.$transaction(
        async (tx) => {
          let ccWallet = await tx.wallet.findUnique({
            where: {
              userId_currency: {
                userId,
                currency: "CC",
              },
            },
          });

          if (!ccWallet) {
            ccWallet = await tx.wallet.create({
              data: {
                userId,
                currency: "CC",
                balance: 0,
              },
            });
          }

          if (ccWallet.balance < cost) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient Chrono Chirals! Needed: ${cost} CC, Current: ${ccWallet.balance} CC.`,
            });
          }

          const newBalance = ccWallet.balance - cost;

          await tx.wallet.update({
            where: { id: ccWallet.id },
            data: { balance: newBalance },
          });

          await tx.currencyTransaction.create({
            data: {
              userId,
              currency: "CC",
              amount: -cost,
              balanceAfter: newBalance,
              reason: "RECOVERY_SPEND",
              meta: { recoveryItem: input.itemKey },
            },
          });

          // Apply Second Wind effect immediately
          if (input.itemKey === "SECOND_WIND") {
            const shieldExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await tx.character.update({
              where: { userId },
              data: {
                healthShieldUntil: shieldExpiry,
                healthComputedOn: null, // trigger recalculation
              },
            });
          }

          // Apply Rust Ward effect immediately (freeze rust for 7 days)
          if (input.itemKey === "RUST_WARD") {
            await activateRustWard(userId, 7, tx);
          }

          return {
            success: true,
            itemKey: input.itemKey,
            cost,
            newBalance,
          };
        },
        {
          maxWait: 5000,
          timeout: 20000,
        }
      );

      // Re-evaluate health snapshot if Second Wind was activated
      if (input.itemKey === "SECOND_WIND") {
        await ensureUpToDate(userId);
      }

      return result;
    }),

  /**
   * Protected procedure to archive a custom reward treat.
   */
  archiveReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string().min(1, "Reward ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reward = await ctx.db.reward.findFirst({
        where: {
          id: input.rewardId,
          userId: ctx.session.user.id,
        },
      });

      if (!reward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reward treat not found or unauthorized.",
        });
      }

      return ctx.db.reward.update({
        where: { id: reward.id },
        data: { isArchived: true },
      });
    }),
});

