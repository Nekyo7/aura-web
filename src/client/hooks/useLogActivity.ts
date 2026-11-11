"use client";

import { trpc } from "@/client/trpc";
import { useCelebrationStore, type CelebrationItem } from "@/client/stores/celebration.store";
import type { RewardSummary } from "@/rules/reward";

export function useLogActivity() {
  const utils = trpc.useUtils();
  const enqueueMany = useCelebrationStore((state) => state.enqueueMany);

  return trpc.activity.log.useMutation({
    onSuccess: async (summary: RewardSummary) => {
      const celebrations: Omit<CelebrationItem, "id">[] = [];

      // 1. Process Level Up celebrations
      if (summary.levelUps && summary.levelUps.length > 0) {
        for (const lvl of summary.levelUps) {
          celebrations.push({
            type: "LEVEL_UP",
            title: `Level Up! Level ${lvl.newLevel}`,
            description: `You reached Level ${lvl.newLevel} and gained ${lvl.apGained} AP!`,
            data: {
              oldLevel: lvl.oldLevel,
              newLevel: lvl.newLevel,
              apGained: lvl.apGained,
            },
          });
        }
      }

      // 2. Process Rank Up celebrations
      if (summary.rankUps && summary.rankUps.length > 0) {
        for (const rnk of summary.rankUps) {
          celebrations.push({
            type: "RANK_UP",
            title: "Rank Up!",
            description: `Skill advanced to Rank ${rnk.newRank}! Earned ${rnk.apGained} AP!`,
            data: {
              skillId: rnk.skillId,
              oldRank: rnk.oldRank,
              newRank: rnk.newRank,
              apGained: rnk.apGained,
            },
          });
        }
      }

      // 3. Process Achievement celebrations
      if (summary.achievementsUnlocked && summary.achievementsUnlocked.length > 0) {
        for (const achievementName of summary.achievementsUnlocked) {
          celebrations.push({
            type: "ACHIEVEMENT",
            title: "Achievement Unlocked!",
            description: `You unlocked the achievement: "${achievementName}"!`,
            data: { achievementName },
          });
        }
      }

      // Push all celebration events to the UI store queue
      if (celebrations.length > 0) {
        enqueueMany(celebrations);
      }

      // 4. Invalidate server-state caches to keep UI fresh
      await Promise.all([
        utils.character.get.invalidate(),
        utils.skills.invalidate(),
        utils.kingdoms?.getProgression?.invalidate?.(),
        utils.achievements?.list?.invalidate?.(),
      ]);
    },
  });
}

