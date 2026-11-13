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
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Banner */}
      <PixelCard variant="default" padding="md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0a0a0a] border border-zinc-800 border-t-2 border-t-[#b026ff] flex items-center justify-center select-none shrink-0">
            <Globe className="w-6 h-6 text-[#b026ff]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-pixel text-sm sm:text-base font-bold text-purple-300">
              The Seven Realms
            </h1>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              Life OS Territory & Sphere Progression
            </p>
          </div>
        </div>

        {/* Global Sphere Stats */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-zinc-800/80 text-center">
          <div>
            <span className="font-sans text-xs text-zinc-500 block uppercase font-medium">
              Total Realm XP
            </span>
            <span className="font-pixel text-sm font-bold text-[#ffc600] mt-0.5 block">
              {totalRealmXp.toLocaleString()} XP
            </span>
          </div>
          <div>
            <span className="font-sans text-xs text-zinc-500 block uppercase font-medium">
              Dominant Sphere
            </span>
            <span
              className="font-pixel text-sm font-bold truncate block mt-0.5"
              style={{ color: dominantKingdom?.colorHex ?? "#b026ff" }}
            >
              {dominantKingdom ? `${dominantKingdom.name}` : "None"}
            </span>
          </div>
        </div>
      </PixelCard>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <PixelCard key={i} variant="default" padding="md" className="animate-pulse">
              <div className="h-6 bg-zinc-900 w-1/3 mb-2" />
              <div className="h-4 bg-zinc-900 w-2/3" />
            </PixelCard>
          ))}
        </div>
      )}

      {/* 7 Realms Cards */}
      {!isLoading && kingdoms && (
        <div className="flex flex-col gap-6">
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
                className={`bg-[#0a0a0a] border border-zinc-800 border-t-2 p-5 sm:p-6 text-white transition-colors relative rounded-none shadow-none ${
                  isSurge ? "border-t-[#ffc600]" : ""
                }`}
                style={{ borderTopColor: isSurge ? "#ffc600" : k.colorHex }}
              >
                {/* Active Surge Glowing Top Ribbon */}
                {isSurge && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-[#ffc600] text-black font-sans text-[9px] font-bold flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" strokeWidth={2.5} /> MOMENTUM SURGE ACTIVE
                  </div>
                )}

                {/* Realm Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 border border-zinc-800 flex items-center justify-center bg-zinc-950"
                      style={{ color: k.colorHex }}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2
                        className="font-pixel text-xs sm:text-sm font-bold uppercase tracking-wider"
                        style={{ color: k.colorHex }}
                      >
                        {k.name}
                      </h2>
                      <p className="font-sans text-xs text-zinc-500 mt-0.5">
                        {k.tagline || k.slug}
                      </p>
                    </div>
                  </div>

                  {/* XP Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-sans text-[10px] text-zinc-500 uppercase font-medium">
                      Influence
                    </span>
                    <span className="font-pixel text-xs font-bold text-[#ffc600] mt-0.5">
                      {k.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Surge or Baseline Banner */}
                {isSurge ? (
                  <div className="mb-3 px-3 py-2 bg-zinc-950 border-l-2 border-amber-400 text-amber-300 font-sans text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
                      <span>{k.surgeMultiplier}x Realm XP Multiplier</span>
                    </div>
                    <span className="text-zinc-500 text-xs">
                      {remainingHours}h remaining
                    </span>
                  </div>
                ) : (
                  <div className="mb-3 py-1.5 text-zinc-500 font-sans text-xs flex items-center justify-between border-b border-zinc-800/60">
                    <span>Weekly Baseline:</span>
                    <span className="text-zinc-300 font-medium">
                      {Math.round(k.baselineMinutesPerWeek / 60)}h / week
                    </span>
                  </div>
                )}

                {/* Dominant Skills Section */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-xs text-zinc-500 uppercase tracking-wide font-medium">
                      Dominant Skills
                    </span>
                    {hasSkills && (
                      <span className="font-sans text-xs text-zinc-600">
                        {k.topSkills.length} active
                      </span>
                    )}
                  </div>

                  {hasSkills ? (
                    <div className="space-y-2">
                      {k.topSkills.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between py-1 text-xs font-sans"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-200 font-medium">
                              {s.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium">
                              {s.rankName}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500">
                            {Math.floor(s.minutesLogged / 60)}h {s.minutesLogged % 60}m
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-sans text-xs text-zinc-600 py-1">
                      No skills trained in this realm yet.
                    </p>
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
