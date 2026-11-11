"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";

interface AchievementItem {
  id: string;
  key: string;
  name: string;
  description: string;
  isSecret: boolean;
  emoji: string;
  apReward: number;
  mbReward: number;
  ccReward: number;
  unlockedAt: string | null;
  isUnlocked: boolean;
}

export function AchievementsBoard() {
  const { data: achievements, isLoading } = trpc.achievements.list.useQuery();
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);

  const unlockedCount = achievements?.filter((a) => a.isUnlocked).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  return (
    <PixelCard variant="default" title="Hall of Feats" padding="md">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 border-b border-black/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <div>
            <h3 className="font-pixel text-xs font-bold text-yellow-300">
              Achievements
            </h3>
            <p className="font-pixel text-[9px] text-gray-400">
              Milestones & Divine Proofs
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-pixel text-[9px] text-gray-400 block uppercase">
            Progress
          </span>
          <span className="font-pixel text-xs font-bold text-yellow-400">
            {unlockedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-800 border border-black p-2" />
          ))}
        </div>
      )}

      {/* Achievements Grid */}
      {!isLoading && achievements && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {achievements.map((ach) => {
            const isHidden = ach.isSecret && !ach.isUnlocked;

            return (
              <button
                key={ach.id}
                type="button"
                onClick={() => setSelectedAchievement(ach)}
                className={`flex flex-col text-left p-2 border-2 transition-all relative select-none ${
                  ach.isUnlocked
                    ? "bg-[#141b2d] border-yellow-400 text-white shadow-[0_0_8px_rgba(250,204,21,0.35)] cursor-pointer active:scale-95"
                    : "bg-[#0b0f19] border-slate-800 text-gray-400 opacity-60 hover:opacity-85 cursor-pointer"
                }`}
              >
                {/* Emoji / Lock Status */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">
                    {isHidden ? "❓" : ach.emoji}
                  </span>
                  {ach.isUnlocked ? (
                    <span className="font-pixel text-[8px] px-1 py-0.2 bg-yellow-950 text-yellow-300 border border-yellow-600">
                      DONE
                    </span>
                  ) : (
                    <span className="text-[10px]">🔒</span>
                  )}
                </div>

                {/* Name */}
                <span className="font-pixel text-[10px] font-bold truncate block mb-0.5">
                  {isHidden ? "Hidden Feat" : ach.name}
                </span>

                {/* Rewards preview */}
                <div className="flex items-center gap-1 mt-auto font-pixel text-[8px]">
                  {ach.apReward > 0 && (
                    <span className="text-purple-300">+{ach.apReward} AP</span>
                  )}
                  {ach.mbReward > 0 && (
                    <span className="text-emerald-400">+{ach.mbReward} MB</span>
                  )}
                  {ach.ccReward > 0 && (
                    <span className="text-cyan-300">+{ach.ccReward} CC</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#101624] border-2 border-yellow-400 p-4 shadow-[4px_4px_0px_0px_#000]">
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-12 h-12 border-2 flex items-center justify-center text-2xl ${
                  selectedAchievement.isUnlocked
                    ? "bg-yellow-950/40 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                    : "bg-slate-900 border-slate-700"
                }`}
              >
                {selectedAchievement.isSecret && !selectedAchievement.isUnlocked
                  ? "❓"
                  : selectedAchievement.emoji}
              </div>
              <div className="flex-1">
                <h4 className="font-pixel text-xs font-bold text-yellow-300">
                  {selectedAchievement.isSecret && !selectedAchievement.isUnlocked
                    ? "Hidden Feat"
                    : selectedAchievement.name}
                </h4>
                <span className="font-pixel text-[9px] text-gray-400">
                  {selectedAchievement.isUnlocked
                    ? `Unlocked on ${
                        selectedAchievement.unlockedAt
                          ? new Date(selectedAchievement.unlockedAt).toLocaleDateString()
                          : "Earned"
                      }`
                    : "Locked Milestone"}
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-gray-300 leading-relaxed mb-4 bg-[#090d16] p-2.5 border border-black">
              {selectedAchievement.isSecret && !selectedAchievement.isUnlocked
                ? "This achievement is veiled in mystery. Continue progressing to discover how to unlock it."
                : selectedAchievement.description}
            </p>

            {/* Rewards Breakdown */}
            <div className="mb-4">
              <span className="font-pixel text-[9px] text-gray-400 uppercase block mb-1.5">
                Bounty Rewards:
              </span>
              <div className="flex items-center gap-2">
                {selectedAchievement.apReward > 0 && (
                  <div className="px-2 py-1 bg-purple-950 border border-purple-600 font-pixel text-[10px] text-purple-300">
                    +{selectedAchievement.apReward} AP
                  </div>
                )}
                {selectedAchievement.mbReward > 0 && (
                  <div className="px-2 py-1 bg-emerald-950 border border-emerald-600 font-pixel text-[10px] text-emerald-300">
                    +{selectedAchievement.mbReward} MB
                  </div>
                )}
                {selectedAchievement.ccReward > 0 && (
                  <div className="px-2 py-1 bg-cyan-950 border border-cyan-600 font-pixel text-[10px] text-cyan-300">
                    +{selectedAchievement.ccReward} CC
                  </div>
                )}
              </div>
            </div>

            <PixelButton
              variant="neutral"
              size="sm"
              className="w-full"
              onClick={() => setSelectedAchievement(null)}
            >
              Close
            </PixelButton>
          </div>
        </div>
      )}
    </PixelCard>
  );
}

