"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelBar } from "@/components/pixel/PixelBar";
import { PixelButton } from "@/components/pixel/PixelButton";
import { RadarChart, type AttributeKey } from "@/components/character/RadarChart";
import { LogTimeSheet } from "@/components/skills/LogTimeSheet";
import { VitalityHUD } from "@/components/character/VitalityHUD";
import { AchievementsBoard } from "@/components/character/AchievementsBoard";
import { CompanionSprite } from "@/components/character/CompanionSprite";

const TIER_INFO: Record<string, { label: string; badge: string; color: string; desc: string }> = {
  THRIVING: {
    label: "THRIVING",
    badge: "1.00x XP",
    color: "text-emerald-400 border-emerald-500 bg-emerald-950/80",
    desc: "Peak vitality. Full reward gains.",
  },
  NEUTRAL: {
    label: "NEUTRAL",
    badge: "0.85x XP",
    color: "text-amber-400 border-amber-500 bg-amber-950/80",
    desc: "Steady state. Moderate decay buffer.",
  },
  WEAKENED: {
    label: "WEAKENED",
    badge: "0.50x XP",
    color: "text-rose-400 border-rose-500 bg-rose-950/80",
    desc: "Low vitality. Rest or log Camp activities to recover.",
  },
};

export default function CharacterPage() {
  const { data: character, isLoading, error, refetch } = trpc.character.get.useQuery();
  const [showLogSheet, setShowLogSheet] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent animate-spin" />
        <span className="font-pixel text-xs text-purple-300">Loading Character Sheet...</span>
      </div>
    );
  }

  if (error || !character) {
    return (
      <PixelCard variant="default" className="text-center p-6 my-8">
        <div className="text-3xl mb-2">⚠️</div>
        <h3 className="font-pixel text-sm text-rose-400 mb-2">Failed to load character</h3>
        <p className="text-xs text-gray-400 font-pixel mb-4">{error?.message || "Character data missing"}</p>
        <PixelButton variant="primary" size="sm" onClick={() => refetch()}>
          Retry
        </PixelButton>
      </PixelCard>
    );
  }

  // Parse attributes map
  const attributeMap: Partial<Record<AttributeKey, number>> = {};
  character.attributes.forEach((attr) => {
    attributeMap[attr.key as AttributeKey] = attr.points;
  });

  const tier = TIER_INFO[character.healthTier] ?? TIER_INFO.THRIVING;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. CHARACTER HEADER & AVATAR BADGE */}
      <PixelCard variant="highlight" padding="sm" className="relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          {/* 8-bit Pixel Avatar Frame */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-purple-950 border-2 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl select-none">
              🧙‍♂️
            </div>
            {/* Level Tag badge on avatar */}
            <div className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 bg-amber-500 border border-black text-black font-pixel text-[10px] font-bold shadow-xs">
              LV.{character.level}
            </div>
          </div>

          {/* Name & Prestige */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h1 className="font-pixel text-sm sm:text-base font-bold text-white truncate">
                {character.name || "Adventurer"}
              </h1>
              {/* Aura Points Pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-900/80 border border-black font-pixel text-xs text-purple-200">
                <span>🔮</span>
                <span className="font-bold tabular-nums">{character.auraPoints ?? 0}</span>
                <span className="text-[9px] text-purple-400">AP</span>
              </div>
            </div>

            <div className="text-[11px] font-pixel text-purple-300/90 mt-0.5">
              Title: <span className="text-gray-200">{character.titleKey ?? "Novice Nomad"}</span>
            </div>

            {/* Health Tier Badge */}
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`font-pixel text-[10px] px-2 py-0.5 border ${tier.color} font-bold`}
              >
                {tier.label} ({tier.badge})
              </span>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* 2. COMPANION / FAMILIAR SPRITE (14-DAY VITALITY REFLECTION) */}
      <CompanionSprite />

      {/* 3. VITALITY MATRIX (7-DAY ROLLING) */}
      <VitalityHUD
        vitality={character.vitality}
        checkedInToday={character.checkedInToday}
        onRefresh={() => refetch()}
      />

      {/* 3. LEVEL XP PROGRESS METER */}
      <PixelCard variant="default" padding="md">
        <PixelBar
          label={`Level ${character.level} Progress`}
          sublabel={`Total XP: ${character.totalXp}`}
          value={character.currentLevelProgress ?? 0}
          max={character.xpNeededForNext ?? 100}
          variant="xp"
          size="md"
        />
      </PixelCard>

      {/* 4. SIX ATTRIBUTES RADAR CHART */}
      <PixelCard
        title="Attribute Radar"
        headerRight={
          <span className="font-pixel text-[10px] text-gray-400">
            6 Core Pillars
          </span>
        }
        variant="default"
      >
        <RadarChart attributes={attributeMap} />

        {/* Grid Breakdown of Attributes */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/50">
          {[
            { key: "STR", name: "Strength", color: "text-red-400 border-red-900/60" },
            { key: "DEX", name: "Dexterity", color: "text-amber-400 border-amber-900/60" },
            { key: "INT", name: "Intellect", color: "text-blue-400 border-blue-900/60" },
            { key: "WIS", name: "Wisdom", color: "text-purple-400 border-purple-900/60" },
            { key: "CHA", name: "Charisma", color: "text-pink-400 border-pink-900/60" },
            { key: "AGI", name: "Agility", color: "text-emerald-400 border-emerald-900/60" },
          ].map((attr) => (
            <div
              key={attr.key}
              className={`p-2 bg-[#0b0f19] border border-black flex flex-col items-center justify-center font-pixel`}
            >
              <span className={`text-[11px] font-bold ${attr.color}`}>
                {attr.key}
              </span>
              <span className="text-xs text-gray-200 font-bold tabular-nums mt-0.5">
                {(attributeMap[attr.key as AttributeKey] ?? 0).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </PixelCard>

      {/* 5. ONE-TAP ACTION / LOGGING SHEET TOGGLE */}
      <div className="flex flex-col gap-3">
        <PixelButton
          variant={showLogSheet ? "neutral" : "primary"}
          size="lg"
          onClick={() => setShowLogSheet(!showLogSheet)}
          className="w-full"
        >
          {showLogSheet ? "▲ Close Logging Sheet" : "⚔️ Log Time / Action"}
        </PixelButton>

        {showLogSheet && (
          <div className="animate-fadeIn">
            <LogTimeSheet onSuccess={() => refetch()} />
          </div>
        )}
      </div>

      {/* 6. HALL OF FEATS / ACHIEVEMENTS BOARD */}
      <AchievementsBoard />
    </div>
  );
}
