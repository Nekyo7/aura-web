import { router } from "@/server/trpc";
import { characterRouter } from "./character";
import { activityRouter } from "./activity";
import { skillsRouter } from "./skills";
import { questsRouter } from "./quests";
import { walletRouter } from "./wallet";
import { kingdomsRouter } from "./kingdoms";
import { achievementsRouter } from "./achievements";
import { companionRouter } from "./companion";
import { chronicleRouter } from "./chronicle";

export const appRouter = router({
  character: characterRouter,
  activity: activityRouter,
  skills: skillsRouter,
  quests: questsRouter,
  wallet: walletRouter,
  kingdoms: kingdomsRouter,
  achievements: achievementsRouter,
  companion: companionRouter,
  chronicle: chronicleRouter,
});

export type AppRouter = typeof appRouter;
