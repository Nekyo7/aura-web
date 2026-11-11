import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { logActivity } from "@/server/services/activity.service";

export const activityRouter = router({
  /**
   * Authoritative activity log procedure (The Golden Path).
   */
  log: protectedProcedure
    .input(
      z.object({
        skillId: z.string().min(1, "Skill ID is required"),
        minutes: z.number().int().positive("Minutes must be a positive integer"),
        idempotencyKey: z.string().min(1, "Idempotency key is required"),
        occurredAt: z.date().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return logActivity(ctx.session.user.id, input);
    }),
});

