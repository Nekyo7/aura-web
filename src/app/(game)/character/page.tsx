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
    color: "text-[#00ff66] border-[#00ff66]/70 bg-black",
    desc: "Peak vitality. Full reward gains.",
  },
  NEUTRAL: {
    label: "NEUTRAL",
    badge: "0.85x XP",
    color: "text-[#ffc600] border-[#ffc600]/70 bg-black",
    desc: "Steady state. Moderate decay buffer.",
  },
  WEAKENED: {
    label: "WEAKENED",
    badge: "0.50x XP",
    color: "text-[#ff3344] border-[#ff3344]/70 bg-black",
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
        <span className="font-sans text-xs text-neutral-400">Loading Character Sheet...</span>
      </div>
    );
  }

  if (error || !character) {
    return (
      <PixelCard variant="default" className="text-center p-6 my-8">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" strokeWidth={1.5} />
        <h3 className="font-pixel text-sm text-rose-400 mb-2">Failed to load character</h3>
        <p className="text-xs text-neutral-400 font-sans mb-4">{error?.message || "Character data missing"}</p>
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
    <div className="flex flex-col gap-3">
      {/* 1. CHARACTER HEADER & AVATAR BADGE */}
      <PixelCard variant="highlight" title="CHARACTER SHEET" padding="sm" className="relative overflow-hidden">
        <div className="flex items-center gap-3">
          {/* Avatar Frame */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 bg-[#0a0a0a] border border-[#333333] border-t-2 border-t-[#b026ff] flex items-center justify-center select-none">
              <User className="w-7 h-7 text-[#b026ff]" strokeWidth={1.5} />
            </div>
            {/* Level Tag badge on avatar */}
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#ffc600] text-black font-pixel text-[9px] font-bold">
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
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0a0a0a] border border-[#333333] font-sans text-xs text-[#b026ff]">
                <Sparkles className="w-3 h-3 text-[#b026ff]" strokeWidth={1.5} />
                <span className="font-bold tabular-nums">{character.auraPoints ?? 0}</span>
                <span className="text-[9px] text-neutral-400 font-semibold">AP</span>
              </div>
            </div>

            <div className="text-xs font-sans text-neutral-400 mt-0.5">
              Title: <span className="text-white font-medium">{character.titleKey ?? "Novice Nomad"}</span>
            </div>

            {/* Health Tier Badge */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`font-sans text-[10px] px-2 py-0.5 border ${tier.color} font-semibold uppercase tracking-wider`}
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
          <span className="font-sans text-[10px] text-neutral-400 font-medium">
            6 Core Pillars
          </span>
        }
        variant="default"
      >
        <RadarChart attributes={attributeMap} />

        {/* Grid Breakdown of Attributes */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-[#222222]">
          {[
            { key: "STR", name: "Strength", color: "text-[#ff3344] border-t-[#ff3344]" },
            { key: "DEX", name: "Dexterity", color: "text-[#ffc600] border-t-[#ffc600]" },
            { key: "INT", name: "Intellect", color: "text-[#00e5ff] border-t-[#00e5ff]" },
            { key: "WIS", name: "Wisdom", color: "text-[#b026ff] border-t-[#b026ff]" },
            { key: "CHA", name: "Charisma", color: "text-[#ff2a85] border-t-[#ff2a85]" },
            { key: "AGI", name: "Agility", color: "text-[#00ff66] border-t-[#00ff66]" },
          ].map((attr) => (
            <div
              key={attr.key}
              className={`p-1.5 bg-[#0a0a0a] border border-[#222222] border-t-2 ${attr.color} flex flex-col items-center justify-center`}
            >
              <span className="text-[10px] font-sans font-semibold text-neutral-400">
                {attr.key}
              </span>
              <span className="text-xs text-white font-pixel font-bold tabular-nums mt-0.5">
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
