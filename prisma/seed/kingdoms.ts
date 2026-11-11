import { db } from "../../src/server/db";

export const KINGDOMS = [
  {
    slug: "academy",
    name: "Academy",
    tagline: "Knowledge & Learning",
    colorHex: "#3B82F6",
    iconKey: "book",
    sortOrder: 1,
    definition: "DEFINED" as const,
  },
  {
    slug: "career",
    name: "Career",
    tagline: "Craft & Professional Growth",
    colorHex: "#F59E0B",
    iconKey: "briefcase",
    sortOrder: 2,
    definition: "DEFINED" as const,
  },
  {
    slug: "alliance",
    name: "Alliance",
    tagline: "Community & Relationships",
    colorHex: "#EC4899",
    iconKey: "users",
    sortOrder: 3,
    definition: "TBD" as const,
  },
  {
    slug: "camp",
    name: "Camp",
    tagline: "Physical Health & Fitness",
    colorHex: "#10B981",
    iconKey: "tent",
    sortOrder: 4,
    definition: "DEFINED" as const,
  },
  {
    slug: "creativity",
    name: "Creativity",
    tagline: "Art & Self-Expression",
    colorHex: "#8B5CF6",
    iconKey: "palette",
    sortOrder: 5,
    definition: "DEFINED" as const,
  },
  {
    slug: "tavern",
    name: "Tavern",
    tagline: "Rest & Celebration",
    colorHex: "#EF4444",
    iconKey: "beer",
    sortOrder: 6,
    definition: "TBD" as const,
  },
  {
    slug: "treasury",
    name: "Treasury",
    tagline: "Finance & Resources",
    colorHex: "#EAB308",
    iconKey: "coins",
    sortOrder: 7,
    definition: "TBD" as const,
  },
];

export async function seedKingdoms() {
  for (const k of KINGDOMS) {
    await db.kingdom.upsert({
      where: { slug: k.slug },
      update: {
        name: k.name,
        tagline: k.tagline,
        colorHex: k.colorHex,
        iconKey: k.iconKey,
        sortOrder: k.sortOrder,
        definition: k.definition,
        isActive: true,
      },
      create: {
        slug: k.slug,
        name: k.name,
        tagline: k.tagline,
        colorHex: k.colorHex,
        iconKey: k.iconKey,
        sortOrder: k.sortOrder,
        definition: k.definition,
        isActive: true,
      },
    });
  }
  console.log("Seeded 7 kingdoms successfully.");
}

