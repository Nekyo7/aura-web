import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import {
  completeManualQuest,
  getTierDefaultRewards,
  getQuestPeriodKey,
} from "@/server/services/quest.service";
import { TRPCError } from "@trpc/server";

export const questsRouter = router({
  /**
   * Protected query returning all active quests for the current user,
   * including their current period instance completion status.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      let quests = await ctx.db.quest.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.includeArchived ? {} : { isArchived: false }),
        },
        include: {
          kingdom: true,
          skill: true,
          attributeRewards: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // If user has no quests, seed starter quests for them
      if (quests.length === 0 && !input?.includeArchived) {
        const academy = await ctx.db.kingdom.findUnique({ where: { slug: "academy" } });
        const camp = await ctx.db.kingdom.findUnique({ where: { slug: "camp" } });
        const creativity = await ctx.db.kingdom.findUnique({ where: { slug: "creativity" } });

        if (academy && camp && creativity) {
          const starterQuests = [
            {
              title: "Daily Focus Sprint",
              description: "Complete 25 minutes of deep focus or study.",
              kingdomId: academy.id,
              tier: 1,
              repeat: "DAILY" as const,
              ...getTierDefaultRewards(1),
            },
            {
              title: "Hydration & Walk",
              description: "Move your body with a brisk walk or morning workout.",
              kingdomId: camp.id,
              tier: 1,
              repeat: "DAILY" as const,
              ...getTierDefaultRewards(1),
            },
            {
              title: "Creative Spark",
              description: "Write, sketch, or brainstorm a new idea.",
              kingdomId: creativity.id,
              tier: 2,
              repeat: "WEEKLY" as const,
              ...getTierDefaultRewards(2),
            },
          ];

          for (const q of starterQuests) {
            await ctx.db.quest.create({
              data: {
                userId: ctx.session.user.id,
                ...q,
              },
            });
          }

          quests = await ctx.db.quest.findMany({
            where: {
              userId: ctx.session.user.id,
              isArchived: false,
            },
            include: {
              kingdom: true,
              skill: true,
              attributeRewards: true,
            },
            orderBy: { createdAt: "desc" },
          });
        }
      }

      // Fetch the latest period instances for each quest to determine completion state
      const now = new Date();
      const enrichedQuests = await Promise.all(
        quests.map(async (quest) => {
          const periodKey = getQuestPeriodKey(quest.repeat, now);
          const currentInstance = await ctx.db.questInstance.findUnique({
            where: {
              questId_periodKey: {
                questId: quest.id,
                periodKey,
              },
            },
          });

          return {
            ...quest,
            currentPeriodKey: periodKey,
            isCompletedCurrentPeriod: currentInstance?.status === "COMPLETED",
            currentInstance,
          };
        })
      );

      return enrichedQuests;
    }),

  /**
   * Protected procedure to create a new Quest.
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1, "Quest title is required"),
        kingdomId: z.string().min(1, "Kingdom is required"),
        tier: z.number().int().min(1).max(5).default(1),
        description: z.string().optional(),
        skillId: z.string().optional().nullable(),
        repeat: z.enum(["ONCE", "DAILY", "WEEKLY"]).default("ONCE"),
        criteriaType: z.enum(["MANUAL", "SKILL_MINUTES", "KINGDOM_MINUTES"]).default("MANUAL"),
        criteriaMinutes: z.number().int().positive().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tierRewards = getTierDefaultRewards(input.tier);

      return ctx.db.quest.create({
        data: {
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          kingdomId: input.kingdomId,
          skillId: input.skillId ?? null,
          tier: input.tier,
          repeat: input.repeat,
          criteriaType: input.criteriaType,
          criteriaMinutes: input.criteriaMinutes ?? null,
          baseXp: tierRewards.baseXp,
          mbReward: tierRewards.mbReward,
          ccReward: tierRewards.ccReward,
          apReward: tierRewards.apReward,
        },
        include: {
          kingdom: true,
          skill: true,
          attributeRewards: true,
        },
      });
    }),

  /**
   * Protected procedure to manually complete a quest.
   */
  completeManual: protectedProcedure
    .input(
      z.object({
        questId: z.string().min(1, "Quest ID is required"),
        idempotencyKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return completeManualQuest(ctx.session.user.id, input);
    }),

  /**
   * Protected procedure to archive a quest.
   */
  archive: protectedProcedure
    .input(
      z.object({
        questId: z.string().min(1, "Quest ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.quest.findFirst({
        where: {
          id: input.questId,
          userId: ctx.session.user.id,
        },
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found or unauthorized.",
        });
      }

      return ctx.db.quest.update({
        where: { id: quest.id },
        data: { isArchived: true },
      });
    }),
});

