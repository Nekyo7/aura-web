import { router, protectedProcedure } from "@/server/trpc";
import { ensureAchievementsSeeded } from "@/server/services/achievement.service";
import { ACHIEVEMENTS_LIST } from "@/rules/achievements";

export const achievementsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Ensure system achievements are in DB
    await ensureAchievementsSeeded(ctx.db);

    const [achievements, userAchievements] = await Promise.all([
      ctx.db.achievement.findMany({
        orderBy: { key: "asc" },
      }),
      ctx.db.userAchievement.findMany({
        where: { userId },
      }),
    ]);

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt])
    );

    const definitionMap = new Map(
      ACHIEVEMENTS_LIST.map((def) => [def.key, def])
    );

    return achievements.map((ach) => {
      const unlockedAt = unlockedMap.get(ach.id) ?? null;
      const def = definitionMap.get(ach.key);

      return {
        id: ach.id,
        key: ach.key,
        name: ach.name,
        description: ach.description,
        isSecret: ach.isSecret,
        emoji: def?.emoji ?? "🏆",
        apReward: ach.apReward,
        mbReward: ach.mbReward,
        ccReward: ach.ccReward,
        unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
        isUnlocked: unlockedAt !== null,
      };
    });
  }),
});

