"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { CreateQuestModal } from "@/components/quests/CreateQuestModal";
import { useCompleteQuest } from "@/client/hooks/useCompleteQuest";

const TIER_COLORS: Record<number, { border: string; bg: string; text: string; label: string }> = {
  1: { border: "border-gray-600", bg: "bg-gray-950/60", text: "text-gray-300", label: "T1: Novice" },
  2: { border: "border-emerald-600", bg: "bg-emerald-950/60", text: "text-emerald-300", label: "T2: Adept" },
  3: { border: "border-blue-600", bg: "bg-blue-950/60", text: "text-blue-300", label: "T3: Veteran" },
  4: { border: "border-purple-600", bg: "bg-purple-950/60", text: "text-purple-300", label: "T4: Master" },
  5: { border: "border-amber-600", bg: "bg-amber-950/60", text: "text-amber-300", label: "T5: Legendary" },
};

export default function QuestsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: quests, isLoading } = trpc.quests.list.useQuery();

  const completeQuestMutation = useCompleteQuest();

  const archiveMutation = trpc.quests.archive.useMutation({
    onSuccess: async () => {
      await utils.quests.list.invalidate();
    },
  });

  const handleCompleteQuest = (questId: string) => {
    setCompletingQuestId(questId);
    completeQuestMutation.mutate(
      { questId },
      {
        onSettled: () => {
          setCompletingQuestId(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <PixelCard
        variant="default"
        title="Quest Board"
        padding="md"
        headerRight={
          <PixelButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<span>+</span>}
          >
            New Bounty
          </PixelButton>
        }
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-950 border-2 border-blue-500 flex items-center justify-center text-2xl select-none">
            📜
          </div>
          <div>
            <h2 className="font-pixel text-sm font-bold text-blue-300">
              Adventurer Bounties
            </h2>
            <p className="font-pixel text-[10px] text-gray-400">
              Daily & Weekly Cycles • Earn Mew Bucks & Chrono Chirals
            </p>
          </div>
        </div>
      </PixelCard>

      {/* Quests List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-pixel text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎯</span> Active Bounties ({quests?.length ?? 0})
          </h3>
          <span className="font-pixel text-[10px] text-gray-500">
            Resets automatically
          </span>
        </div>

        {isLoading ? (
          <PixelCard variant="default" padding="md">
            <div className="flex items-center justify-center py-6 font-pixel text-xs text-gray-400">
              <span className="animate-spin mr-2">⌛</span> Inspecting bounty board...
            </div>
          </PixelCard>
        ) : quests && quests.length > 0 ? (
          quests.map((quest) => {
            const tierStyle = TIER_COLORS[quest.tier] ?? TIER_COLORS[1];
            const isCompleted = quest.isCompletedCurrentPeriod;
            const isSubmitting = completingQuestId === quest.id;

            return (
              <PixelCard
                key={quest.id}
                variant={isCompleted ? "sunken" : "default"}
                padding="md"
                className={isCompleted ? "opacity-75" : ""}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-pixel text-sm font-bold ${isCompleted ? "line-through text-gray-400" : "text-white"}`}>
                        {quest.title}
                      </h4>
                    </div>

                    {quest.description && (
                      <p className="text-[11px] text-gray-400 font-sans mt-0.5 leading-snug">
                        {quest.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {/* Kingdom */}
                      <span
                        className="font-pixel text-[9px] px-1.5 py-0.5 border border-black bg-slate-900"
                        style={{ color: quest.kingdom.colorHex }}
                      >
                        🏰 {quest.kingdom.name}
                      </span>

                      {/* Tier */}
                      <span
                        className={`font-pixel text-[9px] px-1.5 py-0.5 border ${tierStyle.border} ${tierStyle.bg} ${tierStyle.text}`}
                      >
                        {tierStyle.label}
                      </span>

                      {/* Repeat cadence */}
                      <span className="font-pixel text-[9px] px-1.5 py-0.5 border border-black bg-slate-900 text-purple-300">
                        🔄 {quest.repeat}
                      </span>

                      {/* Linked Skill */}
                      {quest.skill && (
                        <span className="font-pixel text-[9px] px-1.5 py-0.5 border border-black bg-slate-900 text-cyan-300">
                          ⚔️ {quest.skill.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completion Action / Status */}
                  <div className="flex flex-col items-end shrink-0">
                    {isCompleted ? (
                      <span className="font-pixel text-[10px] px-2.5 py-1.5 border border-emerald-600 bg-emerald-950 text-emerald-300 font-bold select-none">
                        ✓ CLAIMED
                      </span>
                    ) : (
                      <PixelButton
                        variant="success"
                        size="sm"
                        onClick={() => handleCompleteQuest(quest.id)}
                        isLoading={isSubmitting}
                      >
                        Complete
                      </PixelButton>
                    )}
                  </div>
                </div>

                {/* Reward Strip */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/40 text-xs font-pixel">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-400">BOUNTY:</span>
                    <span className="text-blue-400">+{quest.baseXp} XP</span>
                    <span className="text-amber-400">+{quest.mbReward} MB</span>
                    {quest.apReward > 0 && (
                      <span className="text-purple-400">+{quest.apReward} AP</span>
                    )}
                    {quest.ccReward > 0 && (
                      <span className="text-cyan-400">+{quest.ccReward} CC</span>
                    )}
                  </div>

                  {/* Archive button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Dismiss bounty "${quest.title}"?`)) {
                        archiveMutation.mutate({ questId: quest.id });
                      }
                    }}
                    disabled={archiveMutation.isPending}
                    className="font-pixel text-[9px] text-gray-500 hover:text-rose-400 underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </PixelCard>
            );
          })
        ) : (
          <PixelCard variant="default" padding="md">
            <div className="text-center py-4">
              <p className="font-pixel text-xs text-gray-400 mb-3">
                No active bounties posted. Create your first goal!
              </p>
              <PixelButton
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + Post First Bounty
              </PixelButton>
            </div>
          </PixelCard>
        )}
      </div>

      {/* Return to Character Sheet */}
      <Link href="/character">
        <PixelButton variant="neutral" size="sm" className="w-full">
          ◀ Back to Character Sheet
        </PixelButton>
      </Link>

      {/* Create Quest Modal */}
      <CreateQuestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
