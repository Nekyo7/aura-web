"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import {
  Activity,
  Flame,
  Scale,
  Sparkles,
  Check,
  X,
} from "lucide-react";

interface VitalityData {
  hp: number;
  tier: "THRIVING" | "NEUTRAL" | "WEAKENED";
  rhythm: number;
  body: number;
  balance: number;
  spirit: number | null;
}

interface VitalityHUDProps {
  vitality: VitalityData;
  checkedInToday?: boolean;
  onRefresh?: () => void;
}

const TIER_CONFIG = {
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
    desc: "Steady state. Gentle decay buffer.",
  },
  WEAKENED: {
    label: "WEAKENED",
    badge: "0.50x XP",
    color: "text-rose-400 border-zinc-800 bg-zinc-900/90",
    desc: "Low vitality. Log Camp physical activity to recover.",
  },
};

export const VitalityHUD: React.FC<VitalityHUDProps> = ({
  vitality,
  checkedInToday = false,
  onRefresh,
}) => {
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [energy, setEnergy] = useState(4);
  const [mood, setMood] = useState(4);

  const utils = trpc.useUtils();
  const checkInMutation = trpc.character.checkIn.useMutation({
    onSuccess: async () => {
      setShowCheckInForm(false);
      await utils.character.get.invalidate();
      onRefresh?.();
    },
  });

  const tier = TIER_CONFIG[vitality.tier] ?? TIER_CONFIG.THRIVING;

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkInMutation.mutate({ energy, mood });
  };

  return (
    <PixelCard
      variant="default"
      title="Vitality Matrix (7-Day Rolling)"
      padding="md"
      headerRight={
        <span className={`font-sans text-[10px] px-2 py-0.5 border ${tier.color} font-medium uppercase tracking-wider`}>
          {tier.label} ({tier.badge})
        </span>
      }
    >
      {/* Main HP Bar - Retro 10-Block Segmented Indicator */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-xs font-bold text-white uppercase tracking-wider">
            Overall Vitality (HP)
          </span>
          <span className="font-pixel text-xs sm:text-sm font-bold text-white tabular-nums">
            {vitality.hp} / 100
          </span>
        </div>
        <p className="font-sans text-xs text-zinc-500">{tier.desc}</p>

        {/* 10 Discrete Segmented Blocks */}
        <div className="grid grid-cols-10 gap-1.5 h-3.5 pt-1">
          {Array.from({ length: 10 }).map((_, index) => {
            const isFilled = index < Math.min(10, Math.max(0, Math.round(vitality.hp / 10)));
            let blockStyle = "bg-[#141414] border border-zinc-800";
            if (isFilled) {
              if (vitality.tier === "THRIVING") {
                blockStyle = "bg-[#00ff66] border border-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.7)]";
              } else if (vitality.tier === "NEUTRAL") {
                blockStyle = "bg-[#ffc600] border border-[#ffc600] shadow-[0_0_8px_rgba(255,198,0,0.7)]";
              } else {
                blockStyle = "bg-[#ff3344] border border-[#ff3344] shadow-[0_0_8px_rgba(255,51,68,0.7)]";
              }
            }
            return (
              <div
                key={index}
                className={`h-full transition-all duration-300 ${blockStyle}`}
              />
            );
          })}
        </div>
      </div>

      {/* 4 Rolling Sub-components - Sleek Minimalist Neon Line Indicators */}
      <div className="space-y-4 pt-5 border-t border-zinc-800/80">
        {/* 1. Rhythm */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white flex items-center gap-2 font-sans font-medium">
              <Activity className="w-3.5 h-3.5 text-[#00e5ff]" strokeWidth={1.5} /> Rhythm
            </span>
            <div className="flex items-center gap-2 font-sans">
              <span className="text-[11px] text-zinc-500">Target: 4/7d</span>
              <span className="text-[#00e5ff] font-pixel text-xs font-bold tabular-nums">
                {vitality.rhythm.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-[#141414] overflow-hidden">
            <div
              className="h-full bg-[#00e5ff] transition-all duration-300 shadow-[0_0_6px_rgba(0,229,255,0.7)]"
              style={{ width: `${Math.min(100, Math.max(0, vitality.rhythm))}%` }}
            />
          </div>
        </div>

        {/* 2. Body */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white flex items-center gap-2 font-sans font-medium">
              <Flame className="w-3.5 h-3.5 text-[#00ff66]" strokeWidth={1.5} /> Body
            </span>
            <div className="flex items-center gap-2 font-sans">
              <span className="text-[11px] text-zinc-500">Physical activity (Camp)</span>
              <span className="text-[#00ff66] font-pixel text-xs font-bold tabular-nums">
                {vitality.body.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-[#141414] overflow-hidden">
            <div
              className="h-full bg-[#00ff66] transition-all duration-300 shadow-[0_0_6px_rgba(0,255,102,0.7)]"
              style={{ width: `${Math.min(100, Math.max(0, vitality.body))}%` }}
            />
          </div>
        </div>

        {/* 3. Balance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white flex items-center gap-2 font-sans font-medium">
              <Scale className="w-3.5 h-3.5 text-[#b026ff]" strokeWidth={1.5} /> Balance
            </span>
            <div className="flex items-center gap-2 font-sans">
              <span className="text-[11px] text-zinc-500">Domain breadth (3+ Realms)</span>
              <span className="text-[#b026ff] font-pixel text-xs font-bold tabular-nums">
                {vitality.balance.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-[#141414] overflow-hidden">
            <div
              className="h-full bg-[#b026ff] transition-all duration-300 shadow-[0_0_6px_rgba(176,38,255,0.7)]"
              style={{ width: `${Math.min(100, Math.max(0, vitality.balance))}%` }}
            />
          </div>
        </div>

        {/* 4. Spirit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white flex items-center gap-2 font-sans font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#ffc600]" strokeWidth={1.5} /> Spirit
            </span>
            <div className="flex items-center gap-2 font-sans">
              <span className="text-[11px] text-zinc-500">Check-in (Mood & Energy)</span>
              <span className="text-[#ffc600] font-pixel text-xs font-bold tabular-nums">
                {vitality.spirit !== null ? `${vitality.spirit.toFixed(0)}%` : "N/A"}
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-[#141414] overflow-hidden">
            <div
              className="h-full bg-[#ffc600] transition-all duration-300 shadow-[0_0_6px_rgba(255,198,0,0.7)]"
              style={{ width: `${Math.min(100, Math.max(0, vitality.spirit ?? 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2-Tap Daily Check-in Area */}
      <div className="mt-5 pt-5 border-t border-zinc-800/80">
        {checkedInToday ? (
          <div className="flex items-center justify-between py-1 font-sans text-xs text-[#00ff66]">
            <span className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#00ff66]" strokeWidth={2} /> Today&apos;s Spirit Check-In Logged
            </span>
            <span className="text-[11px] text-zinc-500">Recorded</span>
          </div>
        ) : showCheckInForm ? (
          <form onSubmit={handleCheckInSubmit} className="flex flex-col gap-3 font-sans">
            <div className="flex items-center justify-between text-xs text-[#ffc600] font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} /> Daily 2-Tap Spirit Check-In
              </span>
              <button
                type="button"
                onClick={() => setShowCheckInForm(false)}
                className="text-zinc-500 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <X className="w-3 h-3" strokeWidth={2} /> Cancel
              </button>
            </div>

            {/* Energy (1..5) */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-sans">
                <span>Energy Level:</span>
                <span className="text-[#ffc600] font-bold font-pixel">{energy} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergy(lvl)}
                    className={`py-1.5 text-xs font-pixel ${
                      energy === lvl
                        ? "bg-[#ffc600] text-black font-bold"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood (1..5) */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-sans">
                <span>Mood / State:</span>
                <span className="text-[#b026ff] font-bold font-pixel">{mood} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMood(lvl)}
                    className={`py-1.5 text-xs font-pixel ${
                      mood === lvl
                        ? "bg-[#b026ff] text-black font-bold"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <PixelButton
              type="submit"
              variant="warning"
              size="sm"
              isLoading={checkInMutation.isPending}
            >
              Log Reflection (+Spirit Boost)
            </PixelButton>
          </form>
        ) : (
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="font-sans text-xs text-white font-medium">
                Optional Daily Reflection
              </span>
              <span className="text-[11px] text-zinc-500 font-sans">
                Takes 2 taps. Never mandatory, never penalized.
              </span>
            </div>
            <PixelButton
              variant="neutral"
              size="sm"
              onClick={() => setShowCheckInForm(true)}
              icon={<Check className="w-3.5 h-3.5 mr-0.5" strokeWidth={2} />}
            >
              Check In
            </PixelButton>
          </div>
        )}
      </div>
    </PixelCard>
  );
};
