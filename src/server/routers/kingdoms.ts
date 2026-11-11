import { router, protectedProcedure } from "@/server/trpc";

export const kingdomsRouter = router({
  getProgression: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const kingdoms = await ctx.db.kingdom.findMany({
      where: { isActive: true },
      include: {
        userKingdoms: {
          where: { userId },
        },
        skills: {
          where: {
            userId,
            archivedAt: null,
          },
          orderBy: { minutesLogged: "desc" },
          take: 3,
          include: {
            rank: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return kingdoms.map((k) => {
      const userKingdom = k.userKingdoms[0];
      return {
        id: k.id,
        slug: k.slug,
        name: k.name,
        tagline: k.tagline,
        colorHex: k.colorHex,
        iconKey: k.iconKey,
        sortOrder: k.sortOrder,
        xp: userKingdom?.xp ?? 0,
        baselineMinutesPerWeek: userKingdom?.baselineMinutesPerWeek ?? 0,
        surgeMultiplier: userKingdom?.surgeMultiplier ?? null,
        surgeUntil: userKingdom?.surgeUntil ?? null,
        topSkills: k.skills.map((s) => ({
          id: s.id,
          name: s.name,
          rankIndex: s.rankIndex,
          rankName: s.rank?.name ?? `Rank ${s.rankIndex}`,
          minutesLogged: s.minutesLogged,
        })),
      };
    });
  }),
});
