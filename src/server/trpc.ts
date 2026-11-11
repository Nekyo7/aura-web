import { initTRPC, TRPCError } from "@trpc/server";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";

/**
 * 1. CONTEXT
 *
 * Defines the context available in backend procedures (session, database, headers).
 */
export const createTRPCContext = async (opts?: { headers?: Headers }) => {
  const session = await getServerAuthSession();

  return {
    db,
    session,
    headers: opts?.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * Initializes tRPC with our strongly-typed Context.
 */
const t = initTRPC.context<Context>().create();

/**
 * 3. ROUTER & PROCEDURES
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * Throws UNAUTHORIZED if no authenticated session exists.
 * Guarantees `ctx.session.user` is present in downstream handlers.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  });
});

