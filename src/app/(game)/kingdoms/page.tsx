"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";

const KINGDOM_EMOJIS: Record<string, string> = {
  academy: "📖",
  career: "💼",
  alliance: "🤝",
  camp: "⛺",
  creativity: "🎨",
  tavern: "🍺",
  treasury: "🪙",
};

export default function KingdomsPage() {
  const { data: kingdoms, isLoading } = trpc.kingdoms.getProgression.useQuery();

  const totalRealmXp = kingdoms?.reduce((acc, k) => acc + k.xp, 0) ?? 0;
  const dominantKingdom = kingdoms && kingdoms.length > 0
    ? [...kingdoms].sort((a, b) => b.xp - a.xp)[0]
    : null;

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header Banner */}
      <PixelCard variant="default" padding="md">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-purple-950 border-2 border-purple-500 flex items-center justify-center text-2xl select-none shadow-[2px_2px_0px_0px_#000]">
            🏰
          </div>
          <div>
            <h1 className="font-pixel text-base font-bold text-purple-300">
              The Seven Realms
            </h1>
            <p className="font-pixel text-[10px] text-gray-400">
              Life OS Territory & Sphere Progression
            </p>
          </div>
        </div>

        {/* Global Sphere Stats */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-[#0b0f19] border border-black text-center">
          <div>
            <span className="font-pixel text-[9px] text-gray-400 block uppercase">
              Total Realm XP
            </span>
            <span className="font-pixel text-xs font-bold text-yellow-400">
              {totalRealmXp.toLocaleString()} XP
            </span>
          </div>
          <div>
            <span className="font-pixel text-[9px] text-gray-400 block uppercase">
              Dominant Sphere
            </span>
            <span
              className="font-pixel text-xs font-bold truncate block"
              style={{ color: dominantKingdom?.colorHex ?? "#a855f7" }}
            >
              {dominantKingdom ? `${dominantKingdom.name}` : "None"}
            </span>
          </div>
        </div>
      </PixelCard>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <PixelCard key={i} variant="default" padding="md" className="animate-pulse">
              <div className="h-6 bg-slate-800 w-1/3 mb-2" />
              <div className="h-4 bg-slate-900 w-2/3" />
            </PixelCard>
          ))}
        </div>
      )}

      {/* 7 Realms Cards */}
      {!isLoading && kingdoms && (
        <div className="flex flex-col gap-3">
          {kingdoms.map((k) => {
            const emoji = KINGDOM_EMOJIS[k.slug] || "⚔️";
            const hasSkills = k.topSkills && k.topSkills.length > 0;
            const isSurge =
              !!k.surgeUntil &&
              new Date(k.surgeUntil).getTime() > Date.now() &&
              (k.surgeMultiplier ?? 1.0) > 1.0;
            const remainingHours = k.surgeUntil
              ? Math.max(1, Math.round((new Date(k.surgeUntil).getTime() - Date.now()) / (1000 * 60 * 60)))
              : 0;

            return (
              <div
                key={k.id}
                className={`bg-[#121826] border-2 p-3 text-white transition-all relative ${
                  isSurge
                    ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35),3px_3px_0px_0px_#000]"
                    : "shadow-[3px_3px_0px_0px_#000]"
                }`}
                style={{ borderColor: isSurge ? "#f59e0b" : k.colorHex }}
              >
                {/* Active Surge Glowing Top Ribbon */}
                {isSurge && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-amber-400 border border-black text-black font-pixel text-[9px] font-bold shadow-xs animate-pulse">
                    ⚡ MOMENTUM SURGE ACTIVE
                  </div>
                )}

                {/* Realm Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 border border-black flex items-center justify-center text-xl bg-[#090d16] ${
                        isSurge ? "animate-bounce" : ""
                      }`}
                      style={{ boxShadow: `inset 0 0 12px ${k.colorHex}33` }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <h2
                        className="font-pixel text-xs font-bold uppercase tracking-wider"
                        style={{ color: k.colorHex }}
                      >
                        {k.name}
                      </h2>
                      <p className="font-sans text-[11px] text-gray-400">
                        {k.tagline || k.slug}
                      </p>
                    </div>
                  </div>

                  {/* XP Badge */}
                  <div className="flex flex-col items-end">
                    <span className="font-pixel text-[9px] text-gray-400 uppercase">
                      Influence
                    </span>
                    <span className="font-pixel text-xs font-bold text-yellow-300">
                      {k.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Surge or Baseline Banner */}
                {isSurge ? (
                  <div className="mb-2.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-950/80 to-purple-950/80 border border-amber-500 text-amber-200 font-pixel text-[10px] flex items-center justify-between shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400">⚡</span>
                      <span className="font-bold text-amber-300">
                        {k.surgeMultiplier}x Realm XP Multiplier
                      </span>
                    </div>
                    <span className="text-gray-400 text-[9px]">
                      {remainingHours}h remaining
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 px-2 py-0.5 bg-[#090d16] border border-black/60 text-gray-400 font-pixel text-[9px] flex items-center justify-between">
                    <span>Weekly Baseline:</span>
                    <span className="text-gray-300">
                      {Math.round(k.baselineMinutesPerWeek / 60)}h / week
                    </span>
                  </div>
                )}

                {/* Dominant Skills Section */}
                <div className="mt-2 pt-2 border-t border-black/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-pixel text-[9px] text-gray-400 uppercase tracking-wide">
                      Dominant Skills
                    </span>
                    {hasSkills && (
                      <span className="font-pixel text-[9px] text-gray-500">
                        {k.topSkills.length} active
                      </span>
                    )}
                  </div>

                  {hasSkills ? (
                    <div className="flex flex-col gap-1.5">
                      {k.topSkills.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-1.5 bg-[#0b0f19] border border-black text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-pixel text-[10px] text-purple-300 font-bold">
                              {s.name}
                            </span>
                            <span className="font-pixel text-[9px] px-1 py-0.2 bg-slate-800 text-amber-300 border border-slate-700">
                              {s.rankName}
                            </span>
                          </div>
                          <span className="font-pixel text-[10px] text-gray-400">
                            {Math.floor(s.minutesLogged / 60)}h {s.minutesLogged % 60}m
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-[#090d16] border border-black text-center">
                      <p className="font-sans text-[11px] text-gray-500">
                        No skills trained in this realm yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex flex-col gap-2 mt-2">
        <Link href="/chronicle">
          <PixelButton variant="primary" size="sm" className="w-full" icon={<span>📖</span>}>
            Open Weekly Chronicle
          </PixelButton>
        </Link>
        <div className="flex gap-2">
          <Link href="/skills" className="flex-1">
            <PixelButton variant="neutral" size="sm" className="w-full">
              + New Skill
            </PixelButton>
          </Link>
          <Link href="/character" className="flex-1">
            <PixelButton variant="neutral" size="sm" className="w-full">
              ◀ Character Sheet
            </PixelButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
