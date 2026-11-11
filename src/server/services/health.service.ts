import { db } from "@/server/db";
import {
  computeVitality,
  DEFAULT_VITALITY_CONFIG,
  type VitalityResult,
} from "@/rules/vitality";

function getUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Ensures HealthSnapshot rows are backfilled and up to date up to "today".
 * Runs lazily on character read and before reward calculations (no cron jobs).
 * References: project-context.md Section 5.3
 */
export async function ensureUpToDate(userId: string) {
  const now = new Date();
  const today = getUtcDay(now);

  const character = await db.character.findUnique({
    where: { userId },
  });

  if (!character) {
    return null;
  }

  const lastComputed = character.healthComputedOn ? getUtcDay(character.healthComputedOn) : null;

  // If already computed today, return existing today's snapshot
  if (lastComputed && lastComputed.getTime() === today.getTime()) {
    const currentSnap = await db.healthSnapshot.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (currentSnap) {
      return {
        character,
        snapshot: currentSnap,
      };
    }
  }

  // Determine starting date for backfilling (at most 7 days back to prevent long loops)
  const earliestBackfill = addDays(today, -6);
  let startDay = earliestBackfill;

  if (lastComputed && lastComputed.getTime() >= earliestBackfill.getTime()) {
    startDay = addDays(lastComputed, 1);
  }

  let latestResult: VitalityResult | null = null;
  let latestDay = startDay;

  // Iterate day-by-day from startDay to today
  for (let current = new Date(startDay); current.getTime() <= today.getTime(); current = addDays(current, 1)) {
    const dayDate = getUtcDay(current);
    const windowStart = addDays(dayDate, -6);
    const windowEnd = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), 23, 59, 59, 999));

    // 1. Fetch events in the 7-day rolling window
    const events = await db.activityEvent.findMany({
      where: {
        userId,
        occurredAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        skill: {
          select: {
            countsAsBody: true,
          },
        },
      },
    });

    // 2. Active days count (distinct calendar dates with an activity event)
    const distinctDates = new Set(
      events.map((e) => getUtcDay(e.occurredAt).toISOString().split("T")[0])
    );
    const activeDaysCount = distinctDates.size;

    // 3. Body minutes (minutes logged on skills with countsAsBody = true)
    let bodyMinutes = 0;
    for (const e of events) {
      if (e.skill?.countsAsBody && e.minutes) {
        bodyMinutes += e.minutes;
      }
    }

    // 4. Distinct kingdoms active
    const distinctKingdoms = new Set(
      events.map((e) => e.kingdomId).filter((k): k is string => Boolean(k))
    );
    const distinctKingdomsCount = distinctKingdoms.size;

    // 5. Optional check-ins in the 7-day window
    const checkIns = await db.checkIn.findMany({
      where: {
        userId,
        date: {
          gte: windowStart,
          lte: dayDate,
        },
      },
      select: {
        energy: true,
        mood: true,
      },
    });

    const inGracePeriod = Boolean(character.graceUntil && character.graceUntil.getTime() > dayDate.getTime());
    const isShieldActive = Boolean(character.healthShieldUntil && character.healthShieldUntil.getTime() > dayDate.getTime());

    const result = computeVitality({
      activeDaysCount,
      bodyMinutes,
      distinctKingdomsCount,
      checkIns,
      inGracePeriod,
      isShieldActive,
    });

    latestResult = result;
    latestDay = dayDate;

    // Write / upsert daily HealthSnapshot
    await db.healthSnapshot.upsert({
      where: {
        userId_date: {
          userId,
          date: dayDate,
        },
      },
      update: {
        hp: result.hp,
        tier: result.tier,
        rhythm: result.rhythm,
        body: result.body,
        balance: result.balance,
        spirit: result.spirit,
        modelVersion: DEFAULT_VITALITY_CONFIG.modelVersion,
      },
      create: {
        userId,
        date: dayDate,
        hp: result.hp,
        tier: result.tier,
        rhythm: result.rhythm,
        body: result.body,
        balance: result.balance,
        spirit: result.spirit,
        modelVersion: DEFAULT_VITALITY_CONFIG.modelVersion,
      },
    });
  }

  // Update Character cache with the latest computed HP & Tier
  if (latestResult) {
    const updatedChar = await db.character.update({
      where: { id: character.id },
      data: {
        hp: latestResult.hp,
        healthTier: latestResult.tier,
        healthComputedOn: latestDay,
      },
    });

    const snapshot = await db.healthSnapshot.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return {
      character: updatedChar,
      snapshot,
    };
  }

  return {
    character,
    snapshot: null,
  };
}

/**
 * Record an optional 2-tap daily check-in (Spirit component).
 * Never required, never punished when skipped.
 */
export async function recordCheckIn(
  userId: string,
  input: { energy: number; mood: number }
) {
  const today = getUtcDay(new Date());

  await db.checkIn.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      energy: input.energy,
      mood: input.mood,
    },
    create: {
      userId,
      date: today,
      energy: input.energy,
      mood: input.mood,
    },
  });

  // Recompute snapshot immediately (instant feedback)
  const character = await db.character.findUnique({ where: { userId } });
  if (character) {
    await db.character.update({
      where: { id: character.id },
      data: { healthComputedOn: null }, // trigger recalculation
    });
  }

  return ensureUpToDate(userId);
}

