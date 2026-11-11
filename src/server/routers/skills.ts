import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { getRustStatus } from "@/rules/rust";
import { getRustWardStatus } from "@/server/services/rust-ward.service";

export const skillsRouter = router({
  /**
   * Protected query returning all active (non-archived) skills for the user.
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
      let skills = await ctx.db.skill.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.includeArchived ? {} : { archivedAt: null }),
        },
        include: {
          attributeWeights: true,
          rank: true,
          kingdom: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // If user has no skills yet, automatically seed starter skills for them
      if (skills.length === 0 && !input?.includeArchived) {
        const academy = await ctx.db.kingdom.findUnique({ where: { slug: "academy" } });
        const camp = await ctx.db.kingdom.findUnique({ where: { slug: "camp" } });
        const creativity = await ctx.db.kingdom.findUnique({ where: { slug: "creativity" } });

        if (academy && camp && creativity) {
          await ctx.db.skill.create({
            data: {
              userId: ctx.session.user.id,
              name: "Deep Focus / Coding",
              kingdomId: academy.id,
              attributeWeights: {
                create: [
                  { key: "INT", weight: 0.7 },
                  { key: "WIS", weight: 0.3 },
                ],
              },
            },
          });

          await ctx.db.skill.create({
            data: {
              userId: ctx.session.user.id,
              name: "Strength & Workout",
              kingdomId: camp.id,
              countsAsBody: true,
              attributeWeights: {
                create: [
                  { key: "STR", weight: 0.7 },
                  { key: "AGI", weight: 0.3 },
                ],
              },
            },
          });

          await ctx.db.skill.create({
            data: {
              userId: ctx.session.user.id,
              name: "Creative Writing",
              kingdomId: creativity.id,
              attributeWeights: {
                create: [
                  { key: "CHA", weight: 0.6 },
                  { key: "WIS", weight: 0.4 },
                ],
              },
            },
          });

          skills = await ctx.db.skill.findMany({
            where: {
              userId: ctx.session.user.id,
              archivedAt: null,
            },
            include: {
              attributeWeights: true,
              rank: true,
              kingdom: true,
            },
            orderBy: { createdAt: "asc" },
          });
        }
      }

      // Check user's active Rust Ward status
      const wardStatus = await getRustWardStatus(ctx.session.user.id, ctx.db);

      // Lazily evaluate rust status for each skill based on lastPracticedAt and ward status
      return skills.map((s) => {
        const rustStatus = getRustStatus(s.lastPracticedAt, {
          isRustWardActive: wardStatus.isActive,
        });

        return {
          ...s,
          rustLevel: rustStatus.rustLevel,
          rustStatus,
          isRustWardActive: wardStatus.isActive,
          rustWardRemainingDays: wardStatus.remainingDays,
        };
      });
    }),

  /**
   * Protected query returning all active kingdoms for selection in UI forms.
   */
  listKingdoms: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.kingdom.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  /**
   * Protected procedure to create a custom skill.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, "Skill name is required"),
        kingdomId: z.string().min(1, "Kingdom is required"),
        countsAsBody: z.boolean().optional().default(false),
        attributeWeights: z
          .array(
            z.object({
              key: z.enum(["STR", "AGI", "INT", "CHA", "DEX", "WIS"]),
              weight: z.number().positive("Weight must be positive"),
            })
          )
          .min(1, "Allocate at least one attribute"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate skill name for this user
      const existing = await ctx.db.skill.findUnique({
        where: {
          userId_name: {
            userId: ctx.session.user.id,
            name: input.name,
          },
        },
      });

      if (existing) {
        if (existing.archivedAt) {
          // If archived, unarchive it
          return ctx.db.skill.update({
            where: { id: existing.id },
            data: {
              archivedAt: null,
              kingdomId: input.kingdomId,
              countsAsBody: input.countsAsBody,
              attributeWeights: {
                deleteMany: {},
                create: input.attributeWeights,
              },
            },
            include: {
              attributeWeights: true,
              kingdom: true,
              rank: true,
            },
          });
        }

        throw new TRPCError({
          code: "CONFLICT",
          message: `A skill named "${input.name}" already exists.`,
        });
      }

      return ctx.db.skill.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          kingdomId: input.kingdomId,
          isCustom: true,
          countsAsBody: input.countsAsBody,
          attributeWeights: {
            create: input.attributeWeights,
          },
        },
        include: {
          attributeWeights: true,
          kingdom: true,
          rank: true,
        },
      });
    }),

  /**
   * Protected procedure to archive a skill (hide it from active list).
   */
  archive: protectedProcedure
    .input(
      z.object({
        skillId: z.string().min(1, "Skill ID is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.db.skill.findFirst({
        where: {
          id: input.skillId,
          userId: ctx.session.user.id,
        },
      });

      if (!skill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Skill not found or unauthorized.",
        });
      }

      return ctx.db.skill.update({
        where: { id: skill.id },
        data: { archivedAt: new Date() },
      });
    }),
});
