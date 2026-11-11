import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import {
  generateWeeklyChronicle,
  type ChronicleInput,
  type ChronicleKingdomSummary,
  type ChronicleSkillHighlight,
  type ChroniclePayload,
} from "@/rules/chronicle";
import type { Prisma } from "@prisma/client";

function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const chronicleRouter = router({
  /**
   * Protected procedure fetching the active weekly chronicle.
   * Generates deterministically from the activity ledger and caches in ChronicleEntry.
   */
  getCurrentWeek: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    // 1. Check if already generated for this week
    const existing = await ctx.db.chronicleEntry.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    // 2. Fetch past 7 days events and snapshots
    const [events, snapshots, kingdoms, character] = await Promise.all([
      ctx.db.activityEvent.findMany({
        where: {
          userId,
          occurredAt: { gte: weekStart, lte: weekEnd },
        },
        include: {
          skill: true,
          kingdom: true,
          questInstance: true,
        },
      }),
      ctx.db.healthSnapshot.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { date: "asc" },
      }),
      ctx.db.kingdom.findMany({
        where: { isActive: true },
      }),
      ctx.db.character.findUnique({
        where: { userId },
        select: { hp: true, healthTier: true },
      }),
    ]);

    // 3. Aggregate totals
    let totalMinutes = 0;
    let completedQuestsCount = 0;
    const kingdomMinutesMap = new Map<string, { minutes: number; xp: number }>();
    const skillMinutesMap = new Map<string, { name: string; minutes: number }>();

    for (const ev of events) {
      if (ev.minutes) {
        totalMinutes += ev.minutes;
      }
      if (ev.kind === "QUEST_COMPLETE" || !!ev.questInstanceId) {
        completedQuestsCount++;
      }

      // Group by Kingdom
      if (ev.kingdomId) {
        const cur = kingdomMinutesMap.get(ev.kingdomId) ?? { minutes: 0, xp: 0 };
        cur.minutes += ev.minutes ?? 0;
        cur.xp += ev.xpAwarded;
        kingdomMinutesMap.set(ev.kingdomId, cur);
      }

      // Group by Skill
      if (ev.skillId && ev.skill) {
        const cur = skillMinutesMap.get(ev.skillId) ?? { name: ev.skill.name, minutes: 0 };
        cur.minutes += ev.minutes ?? 0;
        skillMinutesMap.set(ev.skillId, cur);
      }
    }

    // 4. Determine Kingdom Breakdown & Dominant Kingdom
    const kingdomBreakdown: ChronicleKingdomSummary[] = kingdoms.map((k) => {
      const entry = kingdomMinutesMap.get(k.id) ?? { minutes: 0, xp: 0 };
      return {
        name: k.name,
        slug: k.slug,
        minutes: entry.minutes,
        xp: entry.xp,
        colorHex: k.colorHex,
      };
    });

    const dominant = [...kingdomBreakdown].sort((a, b) => b.minutes - a.minutes)[0] ?? null;

    // 5. Skill Highlights
    const skillHighlights: ChronicleSkillHighlight[] = Array.from(skillMinutesMap.values())
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    // 6. Health Trend
    let avgHp = character?.hp ?? 80;
    if (snapshots.length > 0) {
      avgHp = snapshots.reduce((sum, s) => sum + s.hp, 0) / snapshots.length;
    }
    const healthTier = (character?.healthTier ?? "THRIVING") as "THRIVING" | "NEUTRAL" | "WEAKENED";

    const chronicleInput: ChronicleInput = {
      weekStart,
      weekEnd,
      totalMinutesLogged: totalMinutes,
      eventsCount: events.length,
      completedQuestsCount,
      levelUpsCount: 0,
      rankUpsCount: 0,
      achievementsUnlocked: [],
      dominantKingdom: dominant && dominant.minutes > 0 ? dominant : null,
      kingdomBreakdown,
      skillHighlights,
      healthTrend: {
        averageHp: avgHp,
        tier: healthTier,
        trend: "STABLE",
      },
    };

    const payload = generateWeeklyChronicle(chronicleInput);

    // 7. Upsert into ChronicleEntry
    await ctx.db.chronicleEntry.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      update: {
        payload: payload as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId,
        weekStart,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      payload,
      dominantKingdom: dominant,
      kingdomBreakdown,
      skillHighlights,
    };
  }),

  /**
   * Protected procedure returning all historical weekly chronicle entries.
   */
  listHistory: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db.chronicleEntry.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { weekStart: "desc" },
    });

    return entries.map((e) => ({
      id: e.id,
      weekStart: e.weekStart.toISOString(),
      payload: e.payload as unknown as ChroniclePayload,
      createdAt: e.createdAt.toISOString(),
    }));
  }),
});
