"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";

const MOOD_THEMES = {
  THRIVING: {
    badge: "THRIVING",
    badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-500",
    containerBg: "from-amber-950/20 via-purple-950/20 to-emerald-950/30",
    glow: "shadow-[0_0_15px_rgba(52,211,153,0.35)]",
    animationClass: "animate-bounce",
    statusText: "Joyful & Energetic",
  },
  NEUTRAL: {
    badge: "BALANCED",
    badgeColor: "bg-amber-950 text-amber-300 border-amber-500",
    containerBg: "from-slate-900 via-purple-950/20 to-slate-900",
    glow: "shadow-[0_0_10px_rgba(245,158,11,0.25)]",
    animationClass: "animate-pulse",
    statusText: "Calm & Attentive",
  },
  WEAKENED: {
    badge: "RESTING",
    badgeColor: "bg-rose-950 text-rose-300 border-rose-500",
    containerBg: "from-slate-950 via-rose-950/20 to-slate-950",
    glow: "shadow-[0_0_8px_rgba(244,63,94,0.2)]",
    animationClass: "opacity-75",
    statusText: "Drowsy & In Repose",
  },
};

export function CompanionSprite() {
  const { data: companion, isLoading, refetch } = trpc.companion.get.useQuery();
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
        <div className="h-16 bg-slate-800 w-full" />
      </PixelCard>
    );
  }

  if (!companion) return null;

  const theme = MOOD_THEMES[companion.mood] ?? MOOD_THEMES.NEUTRAL;

  return (
    <PixelCard
      variant="default"
      title="Aura Familiar"
      headerRight={
        <span className={`font-pixel text-[9px] px-2 py-0.5 border ${theme.badgeColor}`}>
          {theme.badge}
        </span>
      }
      padding="md"
    >
      <div className={`p-3 bg-linear-to-b ${theme.containerBg} border border-black mb-3 relative overflow-hidden`}>
        {/* Floating Pet Reaction Toast */}
        {petReaction && (
          <div className="absolute top-2 inset-x-4 z-20 text-center py-1 px-2 bg-yellow-400 text-black font-pixel text-[10px] font-bold border-2 border-black animate-bounce shadow-md">
            {petReaction}
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Animated Pixel Sprite Stage Container */}
          <div
            className={`w-20 h-20 shrink-0 bg-[#090d16] border-2 border-black flex flex-col items-center justify-center relative select-none ${theme.glow}`}
          >
            {/* Ambient Aura Particles */}
            {companion.mood === "THRIVING" && (
              <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
            )}
            {companion.mood === "WEAKENED" && (
              <span className="absolute -top-1 -right-1 text-xs animate-pulse text-blue-300 font-pixel">
                zZz
              </span>
            )}

            {/* The Creature Sprite */}
            <div className={`text-4xl transition-transform ${theme.animationClass}`}>
              {companion.spriteEmoji}
            </div>

            {/* Stage Label Tag */}
            <span className="absolute -bottom-2 px-1.5 py-0.2 bg-purple-900 border border-black text-purple-200 font-pixel text-[8px] font-bold">
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
                <span className="font-pixel text-[9px] text-gray-400">
                  {companion.formName}
                </span>
              </div>

              {/* 14-Day Rolling Health Vitality indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-pixel text-[9px] text-gray-400">
                  14d Avg Vitality:
                </span>
                <span className="font-pixel text-[10px] font-bold text-yellow-300">
                  {companion.rollingHp} HP
                </span>
                <span className="font-pixel text-[9px] text-gray-500">
                  ({companion.snapshotDaysCount} days tracked)
                </span>
              </div>
            </div>

            {/* Speech Dialogue Bubble */}
            <div className="p-2 bg-[#090d16] border border-black/80 relative text-[11px] font-sans text-gray-300 leading-snug">
              <span className="font-pixel text-[8px] text-purple-400 block mb-0.5 uppercase tracking-wide">
                Familiar Echo:
              </span>
              "{companion.dialogue}"
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="font-pixel text-[9px] text-gray-400">
          Reflects 14-day rolling discipline average
        </span>
        <PixelButton
          variant="primary"
          size="sm"
          onClick={() => petMutation.mutate()}
          disabled={petMutation.isPending}
          icon={<span>🐾</span>}
        >
          Pet Companion
        </PixelButton>
      </div>
    </PixelCard>
  );
}
