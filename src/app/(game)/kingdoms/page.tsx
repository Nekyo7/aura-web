"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import {
  Globe,
  Zap,
  BookOpen,
  Briefcase,
  Users,
  Tent,
  Palette,
  Coffee,
  Coins,
  ArrowLeft,
  Plus,
} from "lucide-react";

const KINGDOM_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  academy: BookOpen,
  career: Briefcase,
  alliance: Users,
  camp: Tent,
  creativity: Palette,
  tavern: Coffee,
  treasury: Coins,
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
          <div className="w-11 h-11 bg-[#0a0a0a] border border-[#333333] border-t-2 border-t-[#b026ff] flex items-center justify-center select-none">
            <Globe className="w-5 h-5 text-[#b026ff]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-pixel text-sm sm:text-base font-bold text-purple-300">
              The Seven Realms
            </h1>
            <p className="font-sans text-[11px] text-neutral-400">
              Life OS Territory & Sphere Progression
            </p>
          </div>
        </div>

        {/* Global Sphere Stats */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0a0a0a] border border-[#222222] text-center">
          <div>
            <span className="font-sans text-[10px] text-neutral-400 block uppercase font-medium">
              Total Realm XP
            </span>
            <span className="font-pixel text-xs font-bold text-[#ffc600]">
              {totalRealmXp.toLocaleString()} XP
            </span>
          </div>
          <div>
            <span className="font-sans text-[10px] text-neutral-400 block uppercase font-medium">
              Dominant Sphere
            </span>
            <span
              className="font-pixel text-xs font-bold truncate block"
              style={{ color: dominantKingdom?.colorHex ?? "#b026ff" }}
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
              <div className="h-6 bg-neutral-900 w-1/3 mb-2" />
              <div className="h-4 bg-neutral-900 w-2/3" />
            </PixelCard>
          ))}
        </div>
      )}

      {/* 7 Realms Cards */}
      {!isLoading && kingdoms && (
        <div className="flex flex-col gap-3">
          {kingdoms.map((k) => {
            const IconComponent = KINGDOM_ICONS[k.slug] || Globe;
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
                className={`bg-[#0a0a0a] border border-[#222222] border-t-2 p-3 text-white transition-colors relative rounded-none shadow-none ${
                  isSurge ? "border-t-[#ffc600]" : ""
                }`}
                style={{ borderTopColor: isSurge ? "#ffc600" : k.colorHex }}
              >
                {/* Active Surge Glowing Top Ribbon */}
                {isSurge && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[#ffc600] text-black font-sans text-[9px] font-bold flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" strokeWidth={2.5} /> MOMENTUM SURGE ACTIVE
                  </div>
                )}

                {/* Realm Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 border border-[#333333] flex items-center justify-center bg-[#0e0e0e]"
                      style={{ color: k.colorHex }}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2
                        className="font-pixel text-xs font-bold uppercase tracking-wider"
                        style={{ color: k.colorHex }}
                      >
                        {k.name}
                      </h2>
                      <p className="font-sans text-xs text-neutral-400">
                        {k.tagline || k.slug}
                      </p>
                    </div>
                  </div>

                  {/* XP Badge */}
                  <div className="flex flex-col items-end">
                    <span className="font-sans text-[10px] text-neutral-400 uppercase font-medium">
                      Influence
                    </span>
                    <span className="font-pixel text-xs font-bold text-[#ffc600]">
                      {k.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Surge or Baseline Banner */}
                {isSurge ? (
                  <div className="mb-2 px-2.5 py-1.5 bg-[#0e0e0e] border border-[#ffc600]/60 text-[#ffc600] font-sans text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-[#ffc600]" strokeWidth={2} />
                      <span>{k.surgeMultiplier}x Realm XP Multiplier</span>
                    </div>
                    <span className="text-neutral-400 text-[10px]">
                      {remainingHours}h remaining
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 px-2.5 py-1 bg-[#0e0e0e] border border-[#1a1a1a] text-neutral-400 font-sans text-[11px] flex items-center justify-between">
                    <span>Weekly Baseline:</span>
                    <span className="text-neutral-300 font-medium">
                      {Math.round(k.baselineMinutesPerWeek / 60)}h / week
                    </span>
                  </div>
                )}

                {/* Dominant Skills Section */}
                <div className="mt-2.5 pt-2 border-t border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans text-[10px] text-neutral-400 uppercase tracking-wide font-semibold">
                      Dominant Skills
                    </span>
                    {hasSkills && (
                      <span className="font-sans text-[10px] text-neutral-500">
                        {k.topSkills.length} active
                      </span>
                    )}
                  </div>

                  {hasSkills ? (
                    <div className="flex flex-col gap-1.5">
                      {k.topSkills.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 bg-[#0e0e0e] border border-[#1f1f1f] text-xs font-sans"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#b026ff] font-semibold">
                              {s.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-[#171717] text-amber-300 border border-[#2a2a2a] font-medium">
                              {s.rankName}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-medium">
                            {Math.floor(s.minutesLogged / 60)}h {s.minutesLogged % 60}m
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-[#0e0e0e] border border-[#1a1a1a] text-center">
                      <p className="font-sans text-xs text-neutral-500">
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
          <PixelButton variant="primary" size="sm" className="w-full" icon={<BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />}>
            Open Weekly Chronicle
          </PixelButton>
        </Link>
        <div className="flex gap-2">
          <Link href="/skills" className="flex-1">
            <PixelButton variant="neutral" size="sm" className="w-full" icon={<Plus className="w-3.5 h-3.5" strokeWidth={2} />}>
              New Skill
            </PixelButton>
          </Link>
          <Link href="/character" className="flex-1">
            <PixelButton variant="neutral" size="sm" className="w-full" icon={<ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />}>
              Character Sheet
            </PixelButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
