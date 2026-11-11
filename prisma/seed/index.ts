import { db } from "../../src/server/db";
import { seedRanks } from "./ranks";
import { seedKingdoms } from "./kingdoms";

async function main() {
  console.log("Starting database seed...");
  await seedRanks();
  await seedKingdoms();
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

