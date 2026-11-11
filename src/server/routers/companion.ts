import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export type CompanionMood = "THRIVING" | "NEUTRAL" | "WEAKENED";
export type CompanionAnimation = "bounce" | "pulse" | "sleep";

const STAGE_CONFIG: Record<number, { title: string; form: string; spriteEmoji: string; description: string }> = {
  0: {
    title: "Lumina Hatchling",
    form: "Nascent Sprout",
    spriteEmoji: "🐣",
    description: "A tender spark of life, eagerly absorbing the echoes of your daily habits.",
  },
  1: {
    title: "Aura Familiar",
    form: "Loyal Fox Familiar",
    spriteEmoji: "🦊",
    description: "A quick-witted, nimble guide bound to your training and discipline.",
  },
  2: {
    title: "Celestial Sovereign",
    form: "Ascendant Guardian",
    spriteEmoji: "✨🦊✨",
    description: "A luminous celestial guardian radiating raw aura and enduring vitality.",
  },
};

const MOOD_DIALOGUES: Record<CompanionMood, string[]> = {
  THRIVING: [
    "The light within you radiates! Let's conquer greatness today!",
    "Vitality is overflowing! Every minute of training feels magical!",
    "Our bond grows stronger with every focused milestone you forge!",
    "Look at this aura! Peak discipline makes us unstoppable!",
  ],
  NEUTRAL: [
    "Breathe deep, traveler. Consistency is the quiet forge of mastery.",
    "One step forward, calm and deliberate. I am right by your side.",
    "Steady rhythms build empires. What discipline shall we practice?",
    "Every small effort counts. Keep walking your path with pride.",
  ],
  WEAKENED: [
    "zZz... I am a little tired... Remember, even heroes require rest.",
    "Drink some cool water and take a gentle breath. Recovery is part of growth.",
    "A short walk or deep sleep will rekindle our flame. No rush, friend.",
    "Rest well today, and we shall return to the crucible stronger tomorrow.",
  ],
};

export const companionRouter = router({
  /**
   * Protected procedure that computes the companion's 14-day rolling health,
   * determines its mood and stage, seeds if missing, and updates the database.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // 1. Fetch character data for level and fallback HP
    const character = await ctx.db.character.findUnique({
      where: { userId },
      select: {
        id: true,
        level: true,
        hp: true,
        name: true,
      },
    });

    if (!character) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Character not found for user.",
      });
    }

    // 2. Fetch or seed Companion
    let companion = await ctx.db.companion.findUnique({
      where: { userId },
    });

    if (!companion) {
      companion = await ctx.db.companion.create({
        data: {
          userId,
          species: "Lumina Sprite",
          stage: 0,
          rollingHp: character.hp || 80,
        },
      });
    }

    // 3. Read user's HealthSnapshot rolling average over the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const snapshots = await ctx.db.healthSnapshot.findMany({
      where: {
        userId,
        date: { gte: fourteenDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    // 4. Calculate rolling average
    let rollingHp = character.hp || 80;
    if (snapshots.length > 0) {
      const sum = snapshots.reduce((acc, s) => acc + s.hp, 0);
      rollingHp = Math.round((sum / snapshots.length) * 10) / 10;
    }

    // 5. Determine Stage (Stage 0: Lv 1-4, Stage 1: Lv 5-9, Stage 2: Lv 10+)
    const stage = character.level >= 10 ? 2 : character.level >= 5 ? 1 : 0;

    // 6. Determine Mood and Animation State
    let mood: CompanionMood = "NEUTRAL";
    let animation: CompanionAnimation = "pulse";

    if (rollingHp >= 80) {
      mood = "THRIVING";
      animation = "bounce";
    } else if (rollingHp < 60) {
      mood = "WEAKENED";
      animation = "sleep";
    }

    // 7. Update companion row if values evolved
    if (companion.stage !== stage || Math.abs(companion.rollingHp - rollingHp) > 0.1) {
      await ctx.db.companion.update({
        where: { id: companion.id },
        data: {
          stage,
          rollingHp,
        },
      });
    }

    const stageMeta = STAGE_CONFIG[stage] || STAGE_CONFIG[0];
    const dialogues = MOOD_DIALOGUES[mood];
    const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];

    return {
      id: companion.id,
      species: companion.species,
      stage,
      stageTitle: stageMeta.title,
      formName: stageMeta.form,
      spriteEmoji: stageMeta.spriteEmoji,
      stageDescription: stageMeta.description,
      rollingHp,
      snapshotDaysCount: snapshots.length,
      mood,
      animation,
      dialogue,
    };
  }),

  /**
   * Playful interaction procedure allowing the player to tap/pet the companion.
   */
  pet: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const companion = await ctx.db.companion.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Companion not found.",
      });
    }

    const reactions = [
      "♥ Purrs with ethereal energy! ♥",
      "✨ Emits a cheerful ring of star particles! ✨",
      "🐾 Playfully nuzzles your hand! 🐾",
      "🌟 Your companion's aura glows brighter! 🌟",
    ];

    return {
      reaction: reactions[Math.floor(Math.random() * reactions.length)],
      timestamp: new Date().toISOString(),
    };
  }),
});

