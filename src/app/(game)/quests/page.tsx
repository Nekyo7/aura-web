"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { CreateQuestModal } from "@/components/quests/CreateQuestModal";
import { useCompleteQuest } from "@/client/hooks/useCompleteQuest";
import {
  Scroll,
  Target,
  Globe,
  Repeat,
  Zap,
  Check,
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";

const TIER_COLORS: Record<number, { border: string; bg: string; text: string; label: string }> = {
  1: { border: "border-neutral-600", bg: "bg-[#0e0e0e]", text: "text-neutral-300", label: "T1: Novice" },
  2: { border: "border-emerald-600/70", bg: "bg-[#0e0e0e]", text: "text-emerald-300", label: "T2: Adept" },
  3: { border: "border-blue-600/70", bg: "bg-[#0e0e0e]", text: "text-blue-300", label: "T3: Veteran" },
  4: { border: "border-purple-600/70", bg: "bg-[#0e0e0e]", text: "text-purple-300", label: "T4: Master" },
  5: { border: "border-amber-600/70", bg: "bg-[#0e0e0e]", text: "text-amber-300", label: "T5: Legendary" },
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
            icon={<Plus className="w-3.5 h-3.5" strokeWidth={2} />}
          >
            New Bounty
          </PixelButton>
        }
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 bg-[#0a0a0a] border border-[#333333] border-t-2 border-t-[#00e5ff] flex items-center justify-center select-none">
            <Scroll className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm font-bold text-blue-300">
              Adventurer Bounties
            </h2>
            <p className="font-sans text-[11px] text-neutral-400">
              Daily & Weekly Cycles • Earn Mew Bucks & Chrono Chirals
            </p>
          </div>
        </div>
      </PixelCard>

      {/* Quests List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sans text-xs text-neutral-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#ffc600]" strokeWidth={1.5} />
            <span>Active Bounties ({quests?.length ?? 0})</span>
          </h3>
          <span className="font-sans text-[10px] text-neutral-500">
            Resets automatically
          </span>
        </div>

        {isLoading ? (
          <PixelCard variant="default" padding="md">
            <div className="flex items-center justify-center py-6 font-sans text-xs text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-neutral-400" strokeWidth={2} />
              <span>Inspecting bounty board...</span>
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
                      <h4 className={`font-pixel text-xs sm:text-sm font-bold ${isCompleted ? "line-through text-neutral-500" : "text-white"}`}>
                        {quest.title}
                      </h4>
                    </div>

                    {quest.description && (
                      <p className="text-xs text-neutral-400 font-sans mt-0.5 leading-relaxed">
                        {quest.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {/* Kingdom */}
                      <span
                        className="font-sans text-[10px] px-1.5 py-0.5 border border-[#222222] bg-[#0e0e0e] flex items-center gap-1 font-medium"
                        style={{ color: quest.kingdom.colorHex }}
                      >
                        <Globe className="w-2.5 h-2.5" strokeWidth={1.5} />
                        {quest.kingdom.name}
                      </span>

                      {/* Tier */}
                      <span
                        className={`font-sans text-[10px] px-1.5 py-0.5 border ${tierStyle.border} ${tierStyle.bg} ${tierStyle.text} font-medium`}
                      >
                        {tierStyle.label}
                      </span>

                      {/* Repeat cadence */}
                      <span className="font-sans text-[10px] px-1.5 py-0.5 border border-[#222222] bg-[#0e0e0e] text-purple-300 flex items-center gap-1 font-medium">
                        <Repeat className="w-2.5 h-2.5" strokeWidth={1.5} />
                        {quest.repeat}
                      </span>

                      {/* Linked Skill */}
                      {quest.skill && (
                        <span className="font-sans text-[10px] px-1.5 py-0.5 border border-[#222222] bg-[#0e0e0e] text-cyan-300 flex items-center gap-1 font-medium">
                          <Zap className="w-2.5 h-2.5" strokeWidth={1.5} />
                          {quest.skill.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completion Action / Status */}
                  <div className="flex flex-col items-end shrink-0">
                    {isCompleted ? (
                      <span className="font-sans text-[10px] px-2 py-1 border border-emerald-600/70 bg-emerald-950/40 text-emerald-300 font-bold flex items-center gap-1 select-none">
                        <Check className="w-3 h-3" strokeWidth={2} /> CLAIMED
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
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#222222] text-xs font-sans">
                  <div className="flex items-center gap-2 text-[10px] font-semibold">
                    <span className="text-neutral-500 uppercase tracking-wide">Bounty:</span>
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
                    className="font-sans text-[10px] text-neutral-500 hover:text-rose-400 underline cursor-pointer"
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
              <p className="font-sans text-xs text-neutral-400 mb-3">
                No active bounties posted. Create your first goal!
              </p>
              <PixelButton
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" strokeWidth={2} />}
              >
                Post First Bounty
              </PixelButton>
            </div>
          </PixelCard>
        )}
      </div>

      {/* Return to Character Sheet */}
      <Link href="/character">
        <PixelButton variant="neutral" size="sm" className="w-full" icon={<ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={2} />}>
          Back to Character Sheet
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
