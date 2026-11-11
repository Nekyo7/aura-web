/**
 * Pure Rules Engine: Weekly Chronicle Generator
 *
 * Deterministic phrase-bank and templating engine.
 * Generates an evocative, retro-fantasy weekly narrative from the player's
 * activity ledger, quest completions, and vitality snapshots.
 *
 * Invariant: NO AI or LLM generation. 100% deterministic, instant, and offline-testable.
 * References: project-context.md Section 6 & Section 8 (Stage 3)
 */

export interface ChronicleKingdomSummary {
  name: string;
  slug: string;
  minutes: number;
  xp: number;
  colorHex?: string;
}

export interface ChronicleSkillHighlight {
  name: string;
  minutes: number;
  rankName?: string;
}

export interface ChronicleHealthSummary {
  averageHp: number;
  tier: "THRIVING" | "NEUTRAL" | "WEAKENED";
  trend: "RISING" | "STABLE" | "FALLING";
}

export interface ChronicleInput {
  weekStart: Date;
  weekEnd: Date;
  totalMinutesLogged: number;
  eventsCount: number;
  completedQuestsCount: number;
  levelUpsCount: number;
  rankUpsCount: number;
  achievementsUnlocked: string[];
  dominantKingdom?: ChronicleKingdomSummary | null;
  kingdomBreakdown: ChronicleKingdomSummary[];
  skillHighlights: ChronicleSkillHighlight[];
  healthTrend: ChronicleHealthSummary;
}

export interface ChroniclePayload {
  weekTitle: string;
  weekRangeText: string;
  prologue: string;
  dominantKingdomText: string;
  accomplishmentsText: string;
  vitalityText: string;
  epilogue: string;
  fullNarrative: string;
  highlights: string[];
  stats: {
    totalHours: string;
    sessionsCount: number;
    questsCompleted: number;
    levelUps: number;
    rankUps: number;
    dominantKingdomName: string;
    vitalityTier: string;
  };
}

const KINGDOM_PROSE: Record<string, string> = {
  academy:
    "Your intellect delved deep into the scholarly sanctums of the Academy. Books opened, complex ideas unraveled, and your mind sharpened into an instrument of clarity.",
  career:
    "In the industrious guilds of Career, deliberate craft defined your hours. Diligent effort and professional mastery built monuments to long-term triumph.",
  alliance:
    "The warm hearths of the Alliance drew your presence. Bonds of fellowship, kinship, and mutual aid were fortified across your social sphere.",
  camp:
    "The rugged terrain of the Camp echoed with your physical exertion. The vessel of the body was tested, sweat shed, and vital fortitude rekindled.",
  creativity:
    "Sparks of original inspiration flickered into brilliant flame within the halls of Creativity. New expressions and artistic works took tangible form.",
  tavern:
    "The welcoming fires of the Tavern provided sanctuary. Joy, restorative respite, and hearty celebration replenished the traveler's weary heart.",
  treasury:
    "Prudence and calculated vigilance governed the Treasury. Resources were guarded and allocated with foresight, securing peace of mind.",
};

/**
 * Pure generator creating a rich, fantasy-themed weekly chronicle entry.
 */
export function generateWeeklyChronicle(input: ChronicleInput): ChroniclePayload {
  const totalHoursNum = input.totalMinutesLogged / 60;
  const totalHoursStr = totalHoursNum.toFixed(1);

  // 1. Prologue based on total logged volume
  let prologue = "";
  if (totalHoursNum >= 12) {
    prologue =
      "The ledger hums with formidable momentum this passage. Seven suns witnessed continuous focus, carving an unyielding trail through the challenges of the mortal realm.";
  } else if (totalHoursNum >= 5) {
    prologue =
      "Another turning of the celestial sphere has been inscribed upon the parchment. The traveler moved with deliberate intention, forging consistent hours in the crucible of daily life.";
  } else if (totalHoursNum > 0) {
    prologue =
      "A measured, quiet chapter added to the grand archive. Even amidst heavy headwinds, the quill touched parchment, claiming ground where others would have surrendered.";
  } else {
    prologue =
      "A quiet stillness fell across the traveler's encampment this cycle. The parchment rested beside the hearth, gathering silence before the next expedition.";
  }

  // 2. Dominant Kingdom Prose
  let dominantKingdomText = "";
  if (input.dominantKingdom && input.dominantKingdom.minutes > 0) {
    const realmProse = KINGDOM_PROSE[input.dominantKingdom.slug] || KINGDOM_PROSE.academy;
    const realmHours = (input.dominantKingdom.minutes / 60).toFixed(1);
    dominantKingdomText = `Dominating your journey was the realm of the ${input.dominantKingdom.name} (${realmHours} hours devoted). ${realmProse}`;
  } else {
    dominantKingdomText =
      "Your efforts were dispersed gently across the seven realms, reflecting a season of exploration rather than singular focus.";
  }

  // 3. Accomplishments and Feats
  const highlights: string[] = [];
  let accomplishmentsText = "";

  if (input.completedQuestsCount > 0) {
    highlights.push(`Completed ${input.completedQuestsCount} quests across the realms.`);
  }
  if (input.levelUpsCount > 0) {
    highlights.push(`Ascended ${input.levelUpsCount} Character Level(s).`);
  }
  if (input.rankUpsCount > 0) {
    highlights.push(`Advanced ${input.rankUpsCount} skill rank milestones.`);
  }
  if (input.achievementsUnlocked.length > 0) {
    highlights.push(`Unlocked feats: ${input.achievementsUnlocked.join(", ")}.`);
  }

  if (highlights.length > 0) {
    accomplishmentsText = `The heralds report significant conquests: ${highlights.join(
      " "
    )} Every completed trial added weight to your legendary standing.`;
  } else if (input.totalMinutesLogged > 0) {
    accomplishmentsText =
      "Though no formal quests closed this cycle, the raw minutes accumulated within the skills ledger will soon birth new rank breakthroughs.";
  } else {
    accomplishmentsText =
      "No formal milestones were recorded this cycle, but the horizon remains broad and waiting.";
  }

  // 4. Vitality Summary
  let vitalityText = "";
  const avgHp = Math.round(input.healthTrend.averageHp);
  if (input.healthTrend.tier === "THRIVING") {
    vitalityText = `Vitality radiated brightly, averaging ${avgHp} HP in the Thriving tier. The pillars of Rhythm, Body, Balance, and Spirit formed a fortress of resilience.`;
  } else if (input.healthTrend.tier === "NEUTRAL") {
    vitalityText = `Health held steady in the Neutral equilibrium, averaging ${avgHp} HP. A sustainable pace shielded you from burnout while maintaining the course.`;
  } else {
    vitalityText = `Vitality dipped into the Weakened tier, averaging ${avgHp} HP. The stars remind the traveler that retreat and restoration are sacred components of warfare. Rest freely.`;
  }

  // 5. Epilogue
  const epilogues = [
    "Let these deeds stand etched in immutable ink. Rest your hands, traveler, for the dawn brings fresh territory.",
    "The parchment dries and the tome is sealed. Carry this quiet pride into the crucible of the coming dawn.",
    "Honor the quiet hours and the fiery breakthroughs alike. The path of mastery is walked one heartbeat at a time.",
  ];
  const epilogueIndex = (input.weekStart.getDate() + input.eventsCount) % epilogues.length;
  const epilogue = epilogues[epilogueIndex];

  // 6. Assembled full narrative
  const fullNarrative = `${prologue}\n\n${dominantKingdomText}\n\n${accomplishmentsText}\n\n${vitalityText}\n\n${epilogue}`;

  const startStr = input.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = input.weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    weekTitle: `Chronicle of the Week`,
    weekRangeText: `${startStr} - ${endStr}`,
    prologue,
    dominantKingdomText,
    accomplishmentsText,
    vitalityText,
    epilogue,
    fullNarrative,
    highlights,
    stats: {
      totalHours: totalHoursStr,
      sessionsCount: input.eventsCount,
      questsCompleted: input.completedQuestsCount,
      levelUps: input.levelUpsCount,
      rankUps: input.rankUpsCount,
      dominantKingdomName: input.dominantKingdom?.name ?? "All Realms",
      vitalityTier: input.healthTrend.tier,
    },
  };
}

