"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelBar } from "@/components/pixel/PixelBar";
import { PixelButton } from "@/components/pixel/PixelButton";

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
    color: "text-emerald-400 border-emerald-500 bg-emerald-950/80",
    desc: "Peak vitality. Full reward gains.",
  },
  NEUTRAL: {
    label: "NEUTRAL",
    badge: "0.85x XP",
    color: "text-amber-400 border-amber-500 bg-amber-950/80",
    desc: "Steady state. Gentle decay buffer.",
  },
  WEAKENED: {
    label: "WEAKENED",
    badge: "0.50x XP",
    color: "text-rose-400 border-rose-500 bg-rose-950/80",
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
        <span className={`font-pixel text-[10px] px-2 py-0.5 border ${tier.color} font-bold`}>
          {tier.label} ({tier.badge})
        </span>
      }
    >
      {/* Main HP Bar */}
      <div className="mb-4">
        <PixelBar
          label="Overall Vitality (HP)"
          sublabel={tier.desc}
          value={vitality.hp}
          max={100}
          variant="hp"
          size="md"
        />
      </div>

      {/* 4 Rolling Sub-components */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/40">
        {/* 1. Rhythm */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-pixel">
            <span className="text-gray-300 flex items-center gap-1">
              <span>🥁</span> Rhythm
            </span>
            <span className="text-blue-300 font-bold">{vitality.rhythm.toFixed(0)}%</span>
          </div>
          <PixelBar
            value={vitality.rhythm}
            max={100}
            size="sm"
            variant="custom"
            customColor="#3B82F6"
            showValueText={false}
          />
          <span className="text-[9px] text-gray-400 font-sans">
            Showing up (Target: 4/7 days)
          </span>
        </div>

        {/* 2. Body */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-pixel">
            <span className="text-gray-300 flex items-center gap-1">
              <span>🏃</span> Body
            </span>
            <span className="text-emerald-300 font-bold">{vitality.body.toFixed(0)}%</span>
          </div>
          <PixelBar
            value={vitality.body}
            max={100}
            size="sm"
            variant="custom"
            customColor="#10B981"
            showValueText={false}
          />
          <span className="text-[9px] text-gray-400 font-sans">
            Physical activity (Camp skills)
          </span>
        </div>

        {/* 3. Balance */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-pixel">
            <span className="text-gray-300 flex items-center gap-1">
              <span>⚖️</span> Balance
            </span>
            <span className="text-purple-300 font-bold">{vitality.balance.toFixed(0)}%</span>
          </div>
          <PixelBar
            value={vitality.balance}
            max={100}
            size="sm"
            variant="custom"
            customColor="#8B5CF6"
            showValueText={false}
          />
          <span className="text-[9px] text-gray-400 font-sans">
            Domain breadth (3+ Realms)
          </span>
        </div>

        {/* 4. Spirit */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-pixel">
            <span className="text-gray-300 flex items-center gap-1">
              <span>🧘</span> Spirit
            </span>
            <span className="text-amber-300 font-bold">
              {vitality.spirit !== null ? `${vitality.spirit.toFixed(0)}%` : "Excluded"}
            </span>
          </div>
          <PixelBar
            value={vitality.spirit ?? 0}
            max={100}
            size="sm"
            variant="custom"
            customColor="#F59E0B"
            showValueText={false}
          />
          <span className="text-[9px] text-gray-400 font-sans">
            Daily check-in (Mood & Energy)
          </span>
        </div>
      </div>

      {/* 2-Tap Daily Check-in Area */}
      <div className="mt-4 pt-3 border-t border-black/40">
        {checkedInToday ? (
          <div className="flex items-center justify-between p-2 bg-[#0b0f19] border border-black font-pixel text-xs text-emerald-300">
            <span className="flex items-center gap-1.5">
              <span>✨</span> Today&apos;s Spirit Check-In Logged
            </span>
            <span className="text-[10px] text-gray-400 font-sans">Thanks for reflecting!</span>
          </div>
        ) : showCheckInForm ? (
          <form onSubmit={handleCheckInSubmit} className="p-3 bg-[#0b0f19] border border-black flex flex-col gap-3 font-pixel">
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
              <span>🧘 Daily 2-Tap Spirit Check-In</span>
              <button
                type="button"
                onClick={() => setShowCheckInForm(false)}
                className="text-gray-400 hover:text-white text-[10px]"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Energy (1..5) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1">
                <span>Energy Level:</span>
                <span className="text-amber-400 font-bold">{energy} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergy(lvl)}
                    className={`py-1 text-xs border border-black ${
                      energy === lvl ? "bg-amber-600 text-black font-bold" : "bg-slate-900 text-gray-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood (1..5) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1">
                <span>Mood / State:</span>
                <span className="text-purple-400 font-bold">{mood} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMood(lvl)}
                    className={`py-1 text-xs border border-black ${
                      mood === lvl ? "bg-purple-600 text-white font-bold" : "bg-slate-900 text-gray-300"
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
          <div className="flex items-center justify-between p-2 bg-[#0b0f19] border border-black">
            <div className="flex flex-col">
              <span className="font-pixel text-xs text-amber-300 font-bold">
                Optional Daily Reflection
              </span>
              <span className="text-[10px] text-gray-400 font-sans">
                Takes 2 taps. Never mandatory, never penalized.
              </span>
            </div>
            <PixelButton
              variant="neutral"
              size="sm"
              onClick={() => setShowCheckInForm(true)}
            >
              🧘 Check In
            </PixelButton>
          </div>
        )}
      </div>
    </PixelCard>
  );
};

