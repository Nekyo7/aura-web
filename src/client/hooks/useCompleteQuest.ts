"use client";

import { trpc } from "@/client/trpc";
import { useCelebrationStore, type CelebrationItem } from "@/client/stores/celebration.store";
import type { RewardSummary } from "@/rules/reward";

export function useCompleteQuest() {
  const utils = trpc.useUtils();
  const enqueueMany = useCelebrationStore((state) => state.enqueueMany);

  return trpc.quests.completeManual.useMutation({
    onSuccess: async (summary: RewardSummary) => {
      const celebrations: Omit<CelebrationItem, "id">[] = [];

      // 1. Process Quest Complete celebration
      if (summary.completedQuests && summary.completedQuests.length > 0) {
        for (const q of summary.completedQuests) {
          celebrations.push({
            type: "QUEST_COMPLETE",
            title: `Quest Completed: ${q.title}!`,
            description: `Claimed +${summary.xpAwarded} XP, +${q.mbReward} Mew Bucks, and +${q.apReward} AP!`,
            data: {
              questId: q.questId,
              title: q.title,
              mbReward: q.mbReward,
              apReward: q.apReward,
              ccReward: q.ccReward,
              xpAwarded: summary.xpAwarded,
            },
          });
        }
      }

      // 2. Process Level Up celebrations if quest XP leveled up the character
      if (summary.levelUps && summary.levelUps.length > 0) {
        for (const lvl of summary.levelUps) {
          celebrations.push({
            type: "LEVEL_UP",
            title: `Level Up! Level ${lvl.newLevel}`,
            description: `You reached Level ${lvl.newLevel} and earned ${lvl.apGained} AP!`,
            data: {
              oldLevel: lvl.oldLevel,
              newLevel: lvl.newLevel,
              apGained: lvl.apGained,
            },
          });
        }
      }

      if (celebrations.length > 0) {
        enqueueMany(celebrations);
      }

      // Invalidate queries so character, quests, and stats reflect newly updated values
      await Promise.all([
        utils.character.get.invalidate(),
        utils.quests.list.invalidate(),
        utils.skills.list.invalidate(),
      ]);
    },
  });
}

