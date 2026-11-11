import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { xpForLevel } from "@/rules/level";
import { ensureCharacterExists } from "@/server/services/onboarding.service";
import { ensureUpToDate, recordCheckIn } from "@/server/services/health.service";

export const characterRouter = router({
  /**
   * Protected query returning the authenticated user's character, attributes, AP balance,
   * and current Vitality health snapshot with 4 sub-bars.
   * Automatically ensures onboarding is complete and vitality is up to date.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name;

    // 1. Automatically ensure character and 6 attributes exist for new players
    let character = await ensureCharacterExists(userId, userName);

    // 2. Ensure Vitality snapshots are backfilled and up to date
    const healthResult = await ensureUpToDate(userId);
    if (healthResult?.character) {
      // Re-fetch character with attributes
      const refreshed = await ctx.db.character.findUnique({
        where: { userId },
        include: { attributes: true },
      });
      if (refreshed) {
        character = refreshed;
      }
    }

    // 3. Fetch user's Aura Points (AP) wallet
    const apWallet = await ctx.db.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency: "AP",
        },
      },
    });

    const levelStartXp = xpForLevel(character.level);
    const nextLevelXp = xpForLevel(character.level + 1);
    const currentLevelProgress = Math.max(0, character.totalXp - levelStartXp);
    const xpNeededForNext = Math.max(1, nextLevelXp - levelStartXp);

    const today = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
    );

    const todaySnapshot =
      healthResult?.snapshot ??
      (await ctx.db.healthSnapshot.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      }));

    // Check if user already checked in today
    const existingCheckIn = await ctx.db.checkIn.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return {
      ...character,
      auraPoints: apWallet?.balance ?? 0,
      levelStartXp,
      nextLevelXp,
      currentLevelProgress,
      xpNeededForNext,
      vitality: todaySnapshot
        ? {
            hp: todaySnapshot.hp,
            tier: todaySnapshot.tier,
            rhythm: todaySnapshot.rhythm,
            body: todaySnapshot.body,
            balance: todaySnapshot.balance,
            spirit: todaySnapshot.spirit,
          }
        : {
            hp: character.hp,
            tier: character.healthTier,
            rhythm: 100,
            body: 100,
            balance: 100,
            spirit: null,
          },
      checkedInToday: Boolean(existingCheckIn),
      checkIn: existingCheckIn,
    };
  }),

  /**
   * Optional 2-tap daily check-in (Spirit component).
   */
  checkIn: protectedProcedure
    .input(
      z.object({
        energy: z.number().int().min(1).max(5),
        mood: z.number().int().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return recordCheckIn(ctx.session.user.id, input);
    }),
});
