"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { Sparkles, Bot, Flame, Heart } from "lucide-react";

const MOOD_THEMES = {
  THRIVING: {
    badge: "THRIVING",
    badgeColor: "text-[#00ff66] border-[#00ff66]/50 bg-black",
    containerBg: "from-black via-[#0a0a0a] to-black",
    animationClass: "animate-bounce",
    statusText: "Joyful & Energetic",
  },
  NEUTRAL: {
    badge: "BALANCED",
    badgeColor: "text-[#ffc600] border-[#ffc600]/50 bg-black",
    containerBg: "from-black via-[#0a0a0a] to-black",
    animationClass: "animate-pulse",
    statusText: "Calm & Attentive",
  },
  WEAKENED: {
    badge: "RESTING",
    badgeColor: "text-[#ff3344] border-[#ff3344]/50 bg-black",
    containerBg: "from-black via-[#0a0a0a] to-black",
    animationClass: "opacity-75",
    statusText: "Drowsy & In Repose",
  },
};

export function CompanionSprite() {
  const { data: companion, isLoading } = trpc.companion.get.useQuery();
  const [petReaction, setPetReaction] = useState<string | null>(null);

  const petMutation = trpc.companion.pet.useMutation({
    onSuccess: (data) => {
      setPetReaction(data.reaction);
      setTimeout(() => setPetReaction(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <PixelCard variant="default" padding="sm" className="animate-pulse">
        <div className="h-16 bg-neutral-900 w-full" />
      </PixelCard>
    );
  }

  if (!companion) return null;

  const theme = MOOD_THEMES[companion.mood] ?? MOOD_THEMES.NEUTRAL;

  const getFamiliarIcon = (stage: number) => {
    switch (stage) {
      case 0:
        return <Bot className="w-8 h-8 text-[#00e5ff]" strokeWidth={1.5} />;
      case 1:
        return <Bot className="w-8 h-8 text-[#b026ff]" strokeWidth={1.5} />;
      default:
        return <Flame className="w-8 h-8 text-[#ffc600]" strokeWidth={1.5} />;
    }
  };

  return (
    <PixelCard
      variant="default"
      title="Aura Familiar"
      headerRight={
        <span className={`font-sans text-[10px] px-2 py-0.5 border ${theme.badgeColor} font-semibold uppercase tracking-wider`}>
          {theme.badge}
        </span>
      }
      padding="md"
    >
      <div className="p-3 bg-[#0a0a0a] border border-[#222222] mb-3 relative overflow-hidden">
        {/* Floating Pet Reaction Toast */}
        {petReaction && (
          <div className="absolute top-2 inset-x-4 z-20 text-center py-1 px-2 bg-[#ffc600] text-black font-sans text-xs font-bold border border-black animate-bounce shadow-none">
            {petReaction}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Animated Monochrome Sprite Stage Container */}
          <div
            className="w-16 h-16 shrink-0 bg-[#0e0e0e] border border-[#333333] border-t-2 border-t-[#b026ff] flex flex-col items-center justify-center relative select-none"
          >
            {/* Ambient Aura Particles */}
            {companion.mood === "THRIVING" && (
              <span className="absolute -top-1 -right-1 text-xs animate-ping">
                <Sparkles className="w-3 h-3 text-[#00ff66]" strokeWidth={1.5} />
              </span>
            )}
            {companion.mood === "WEAKENED" && (
              <span className="absolute -top-1 -right-1 text-[9px] animate-pulse text-[#00e5ff] font-pixel">
                zZz
              </span>
            )}

            {/* The Creature Sprite (Lucide Monochrome Icon) */}
            <div className={`transition-transform ${theme.animationClass}`}>
              {getFamiliarIcon(companion.stage)}
            </div>

            {/* Stage Label Tag */}
            <span className="absolute -bottom-2 px-1 py-0.2 bg-[#0a0a0a] border border-[#333333] text-[#b026ff] font-sans text-[8px] font-bold uppercase tracking-wider leading-none">
              STAGE {companion.stage}
            </span>
          </div>

          {/* Details & Dialogue */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-pixel text-xs font-bold text-white truncate">
                  {companion.stageTitle}
                </h4>
                <span className="font-sans text-[10px] text-neutral-400">
                  {companion.formName}
                </span>
              </div>

              {/* 14-Day Rolling Health Vitality indicator */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-sans text-[10px] text-neutral-400">
                  14d Avg:
                </span>
                <span className="font-pixel text-xs font-bold text-[#ffc600]">
                  {companion.rollingHp} HP
                </span>
                <span className="font-sans text-[10px] text-neutral-500">
                  ({companion.snapshotDaysCount}d)
                </span>
              </div>
            </div>

            {/* Speech Dialogue Bubble */}
            <div className="p-2 bg-[#0e0e0e] border border-[#222222] relative text-xs font-sans text-neutral-300 leading-snug">
              <span className="font-sans text-[9px] text-[#b026ff] block mb-0.5 uppercase tracking-wide font-semibold">
                Familiar Echo:
              </span>
              &ldquo;{companion.dialogue}&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="font-sans text-[10px] text-neutral-400">
          Reflects 14-day rolling discipline average
        </span>
        <PixelButton
          variant="primary"
          size="sm"
          onClick={() => petMutation.mutate()}
          disabled={petMutation.isPending}
          icon={<Heart className="w-3.5 h-3.5" strokeWidth={1.5} />}
        >
          Pet Companion
        </PixelButton>
      </div>
    </PixelCard>
  );
}
