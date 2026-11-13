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
import {
  User,
  Sparkles,
  AlertTriangle,
  Plus,
  ChevronUp,
} from "lucide-react";

const TIER_INFO: Record<string, { label: string; badge: string; color: string; desc: string }> = {
  THRIVING: {
    label: "THRIVING",
    badge: "1.00x XP",
    color: "text-emerald-400 border-zinc-800 bg-zinc-900/90",
    desc: "Peak vitality. Full reward gains.",
  },
  NEUTRAL: {
    label: "NEUTRAL",
    badge: "0.85x XP",
    color: "text-amber-400 border-zinc-800 bg-zinc-900/90",
    desc: "Steady state. Moderate decay buffer.",
  },
  WEAKENED: {
    label: "WEAKENED",
    badge: "0.50x XP",
    color: "text-rose-400 border-zinc-800 bg-zinc-900/90",
    desc: "Low vitality. Rest or log Camp activities to recover.",
  },
};

export default function CharacterPage() {
  const { data: character, isLoading, error, refetch } = trpc.character.get.useQuery();
  const [showLogSheet, setShowLogSheet] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-[#b026ff] border-t-transparent animate-spin" />
        <span className="font-sans text-xs text-zinc-500">Loading Character Sheet...</span>
      </div>
    );
  }

  if (error || !character) {
    return (
      <PixelCard variant="default" className="text-center p-6 my-8">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" strokeWidth={1.5} />
        <h3 className="font-pixel text-sm text-rose-400 mb-2">Failed to load character</h3>
        <p className="text-xs text-zinc-500 font-sans mb-4">{error?.message || "Character data missing"}</p>
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
    <div className="flex flex-col gap-6">
      {/* 1. CHARACTER HEADER & AVATAR BADGE */}
      <PixelCard variant="highlight" title="CHARACTER SHEET" padding="md" className="relative overflow-hidden">
        <div className="flex items-center gap-4">
          {/* Avatar Frame */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 bg-[#0a0a0a] border border-zinc-800 border-t-2 border-t-[#b026ff] flex items-center justify-center select-none">
              <User className="w-7 h-7 text-[#b026ff]" strokeWidth={1.5} />
            </div>
            {/* Level Tag badge on avatar */}
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-amber-400 font-pixel text-[9px] font-bold">
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
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-zinc-800 font-sans text-xs text-purple-400">
                <Sparkles className="w-3 h-3 text-[#b026ff]" strokeWidth={1.5} />
                <span className="font-bold tabular-nums">{character.auraPoints ?? 0}</span>
                <span className="text-[9px] text-zinc-500 font-medium">AP</span>
              </div>
            </div>

            <div className="text-xs font-sans text-zinc-500 mt-0.5">
              Title: <span className="text-zinc-300 font-medium">{character.titleKey ?? "Novice Nomad"}</span>
            </div>

            {/* Health Tier Badge */}
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`font-sans text-[10px] px-2 py-0.5 border ${tier.color} font-medium uppercase tracking-wider`}
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
      <PixelCard variant="default" title="LEVEL REPUTATION" padding="md">
        <PixelBar
          label={`Level ${character.level} Progress`}
          sublabel={`Total XP: ${character.totalXp.toLocaleString()}`}
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
          <span className="font-sans text-xs text-zinc-500 font-medium">
            6 Core Pillars
          </span>
        }
        variant="default"
        padding="md"
      >
        <RadarChart attributes={attributeMap} />

        {/* Clean Borderless Attribute Pillars */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800/80">
          {[
            { key: "STR", name: "Strength" },
            { key: "DEX", name: "Dexterity" },
            { key: "INT", name: "Intellect" },
            { key: "WIS", name: "Wisdom" },
            { key: "CHA", name: "Charisma" },
            { key: "AGI", name: "Agility" },
          ].map((attr) => (
            <div
              key={attr.key}
              className="py-1 flex flex-col items-center justify-center text-center"
            >
              <span className="text-xs font-sans font-medium text-zinc-500">
                {attr.name}
              </span>
              <span className="text-sm text-white font-pixel font-bold tabular-nums mt-0.5">
                {(attributeMap[attr.key as AttributeKey] ?? 0).toFixed(1)}
              </span>
              <span className="text-[10px] font-sans text-zinc-600 uppercase tracking-wider">
                {attr.key}
              </span>
            </div>
          ))}
        </div>
      </PixelCard>

      {/* 5. ONE-TAP ACTION / LOGGING SHEET TOGGLE */}
      <div className="flex flex-col gap-4">
        <PixelButton
          variant={showLogSheet ? "neutral" : "primary"}
          size="md"
          onClick={() => setShowLogSheet(!showLogSheet)}
          className="w-full"
          icon={showLogSheet ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        >
          {showLogSheet ? "Close Logging Sheet" : "Log Time / Action"}
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
