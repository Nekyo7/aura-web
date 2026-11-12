"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import {
  Trophy,
  Lock,
  HelpCircle,
  Sparkles,
  Heart,
  Zap,
  Award,
  Hammer,
  Compass,
  Crown,
  Clock,
  Check,
} from "lucide-react";

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

const getAchievementIcon = (key: string, isSecret: boolean, isUnlocked: boolean, className = "w-5 h-5") => {
  if (isSecret && !isUnlocked) {
    return <HelpCircle className={`${className} text-neutral-500`} strokeWidth={1.5} />;
  }

  const iconProps = { className, strokeWidth: 1.5 };
  switch (key) {
    case "FIRST_LOG":
      return <Sparkles {...iconProps} className={`${className} text-[#00ff66]`} />;
    case "VITALITY_THRIVING":
      return <Heart {...iconProps} className={`${className} text-[#ff2a85]`} />;
    case "LEVEL_5":
      return <Zap {...iconProps} className={`${className} text-[#ffc600]`} />;
    case "LEVEL_10":
      return <Award {...iconProps} className={`${className} text-[#00e5ff]`} />;
    case "SKILL_RANK_CRAFTSMAN":
      return <Hammer {...iconProps} className={`${className} text-[#b026ff]`} />;
    case "KINGDOM_TRAVELER":
      return <Compass {...iconProps} className={`${className} text-[#00e5ff]`} />;
    case "SEVEN_REALMS_SOVEREIGN":
      return <Crown {...iconProps} className={`${className} text-[#ffc600]`} />;
    case "CENTURION_HOURS":
      return <Clock {...iconProps} className={`${className} text-[#00ff66]`} />;
    default:
      return <Trophy {...iconProps} className={`${className} text-[#ffc600]`} />;
  }
};

export function AchievementsBoard() {
  const { data: achievements, isLoading } = trpc.achievements.list.useQuery();
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);

  const unlockedCount = achievements?.filter((a) => a.isUnlocked).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  return (
    <PixelCard variant="default" title="Hall of Feats" padding="md">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 border-b border-[#222222] pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ffc600]" strokeWidth={1.5} />
          <div>
            <h3 className="font-pixel text-xs font-bold text-yellow-300">
              Achievements
            </h3>
            <p className="font-sans text-[10px] text-neutral-400">
              Milestones & Divine Proofs
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-sans text-[10px] text-neutral-400 block uppercase font-medium">
            Progress
          </span>
          <span className="font-pixel text-xs font-bold text-[#ffc600]">
            {unlockedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#0a0a0a] border border-[#222222] p-2" />
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
                className={`flex flex-col text-left p-2.5 border rounded-none transition-colors relative select-none ${
                  ach.isUnlocked
                    ? "bg-[#0a0a0a] border-[#ffc600]/60 border-t-2 border-t-[#ffc600] text-white cursor-pointer hover:border-[#ffc600]"
                    : "bg-[#0a0a0a] border-[#222222] text-neutral-500 opacity-60 hover:opacity-100 hover:border-neutral-600 cursor-pointer"
                }`}
              >
                {/* Monochrome Icon / Lock Status */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {getAchievementIcon(ach.key, ach.isSecret, ach.isUnlocked, "w-4 h-4")}
                  </div>
                  {ach.isUnlocked ? (
                    <span className="font-sans text-[9px] px-1.5 py-0.2 bg-[#ffc600] text-black font-bold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> DONE
                    </span>
                  ) : (
                    <Lock className="w-3 h-3 text-neutral-500" strokeWidth={1.5} />
                  )}
                </div>

                {/* Name */}
                <span className="font-pixel text-[10px] font-bold truncate block mb-1 text-white">
                  {isHidden ? "Hidden Feat" : ach.name}
                </span>

                {/* Rewards preview */}
                <div className="flex items-center gap-1 mt-auto font-sans text-[10px] font-semibold">
                  {ach.apReward > 0 && (
                    <span className="text-[#b026ff]">+{ach.apReward} AP</span>
                  )}
                  {ach.mbReward > 0 && (
                    <span className="text-[#00ff66]">+{ach.mbReward} MB</span>
                  )}
                  {ach.ccReward > 0 && (
                    <span className="text-[#00e5ff]">+{ach.ccReward} CC</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#333333] border-t-2 border-t-[#ffc600] p-4 shadow-none rounded-none">
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-11 h-11 border flex items-center justify-center ${
                  selectedAchievement.isUnlocked
                    ? "bg-[#141414] border-[#ffc600]/80"
                    : "bg-[#0e0e0e] border-[#222222]"
                }`}
              >
                {getAchievementIcon(
                  selectedAchievement.key,
                  selectedAchievement.isSecret,
                  selectedAchievement.isUnlocked,
                  "w-6 h-6"
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-pixel text-xs font-bold text-[#ffc600]">
                  {selectedAchievement.isSecret && !selectedAchievement.isUnlocked
                    ? "Hidden Feat"
                    : selectedAchievement.name}
                </h4>
                <span className="font-sans text-[10px] text-neutral-400">
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

            <p className="font-sans text-xs text-neutral-300 leading-relaxed mb-3 bg-[#0e0e0e] p-2.5 border border-[#222222]">
              {selectedAchievement.isSecret && !selectedAchievement.isUnlocked
                ? "This achievement is veiled in mystery. Continue progressing to discover how to unlock it."
                : selectedAchievement.description}
            </p>

            {/* Rewards Breakdown */}
            <div className="mb-4">
              <span className="font-sans text-[10px] text-neutral-400 uppercase block mb-1.5 font-semibold">
                Bounty Rewards:
              </span>
              <div className="flex items-center gap-2">
                {selectedAchievement.apReward > 0 && (
                  <div className="px-2 py-0.5 bg-[#0a0a0a] border border-[#b026ff]/60 font-sans text-[10px] text-[#b026ff] font-semibold">
                    +{selectedAchievement.apReward} AP
                  </div>
                )}
                {selectedAchievement.mbReward > 0 && (
                  <div className="px-2 py-0.5 bg-[#0a0a0a] border border-[#00ff66]/60 font-sans text-[10px] text-[#00ff66] font-semibold">
                    +{selectedAchievement.mbReward} MB
                  </div>
                )}
                {selectedAchievement.ccReward > 0 && (
                  <div className="px-2 py-0.5 bg-[#0a0a0a] border border-[#00e5ff]/60 font-sans text-[10px] text-[#00e5ff] font-semibold">
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
