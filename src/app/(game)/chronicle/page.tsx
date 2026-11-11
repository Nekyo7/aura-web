"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelButton } from "@/components/pixel/PixelButton";

export default function ChroniclePage() {
  const { data: currentWeek, isLoading } = trpc.chronicle.getCurrentWeek.useQuery();
  const { data: history } = trpc.chronicle.listHistory.useQuery();
  const [selectedHistoryPayload, setSelectedHistoryPayload] = useState<any>(null);

  const activePayload = selectedHistoryPayload || currentWeek?.payload;

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-2xl mx-auto">
      {/* Ancient Book Spine Header */}
      <div className="bg-[#241a12] border-4 border-[#785127] p-3 text-center shadow-[4px_4px_0px_0px_#000] relative">
        <div className="absolute top-0 inset-x-8 h-1 bg-[#a16207] opacity-60" />
        <span className="font-pixel text-[9px] uppercase tracking-widest text-[#d4b996] block mb-1">
          ✦ Sacred Archive of Life OS ✦
        </span>
        <h1 className="font-pixel text-base font-bold text-[#fef08a] tracking-wide">
          The Weekly Chronicle
        </h1>
        <p className="font-sans text-xs text-[#d4b996] mt-0.5 italic">
          Recorded in immutable ink from the crucible of daily deeds
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-[#1c140e] border-2 border-[#785127] p-6 text-center animate-pulse">
          <div className="text-2xl mb-2">📜</div>
          <span className="font-pixel text-xs text-[#d4b996]">
            Unfurling the parchment scrolls...
          </span>
        </div>
      )}

      {/* The Dusty Fantasy Book / Tome */}
      {!isLoading && activePayload && (
        <div className="relative bg-[#1c140e] border-4 border-[#8c5a2b] shadow-[6px_6px_0px_0px_#000,inset_0_0_20px_rgba(0,0,0,0.8)] text-[#f5e6c8] p-5 sm:p-7">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 text-[#a16207] text-xs select-none">╔</div>
          <div className="absolute top-2 right-2 text-[#a16207] text-xs select-none">╗</div>
          <div className="absolute bottom-2 left-2 text-[#a16207] text-xs select-none">╚</div>
          <div className="absolute bottom-2 right-2 text-[#a16207] text-xs select-none">╝</div>

          {/* Book Bookmark Ribbon */}
          <div className="absolute -top-3 right-6 w-5 h-8 bg-rose-800 border-x border-b border-black shadow-md flex items-end justify-center pb-0.5">
            <span className="text-[8px] text-yellow-300">★</span>
          </div>

          {/* Chapter Title & Date Range */}
          <div className="text-center border-b-2 border-[#785127]/60 pb-3 mb-5">
            <span className="font-pixel text-[10px] text-[#fbbf24] uppercase tracking-wider block">
              {activePayload.weekTitle}
            </span>
            <h2 className="font-pixel text-sm font-bold text-[#fde047] mt-0.5">
              Cycle of {activePayload.weekRangeText}
            </h2>
          </div>

          {/* Wax Seals / Stat Runes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <div className="bg-[#120c08] border border-[#785127] p-2 text-center">
              <span className="font-pixel text-[8px] text-[#d4b996] uppercase block">
                Logged Effort
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a]">
                {activePayload.stats.totalHours} Hours
              </span>
            </div>

            <div className="bg-[#120c08] border border-[#785127] p-2 text-center">
              <span className="font-pixel text-[8px] text-[#d4b996] uppercase block">
                Sessions
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a]">
                {activePayload.stats.sessionsCount} Feats
              </span>
            </div>

            <div className="bg-[#120c08] border border-[#785127] p-2 text-center">
              <span className="font-pixel text-[8px] text-[#d4b996] uppercase block">
                Dominant Realm
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a] truncate block">
                {activePayload.stats.dominantKingdomName}
              </span>
            </div>

            <div className="bg-[#120c08] border border-[#785127] p-2 text-center">
              <span className="font-pixel text-[8px] text-[#d4b996] uppercase block">
                Vitality Tier
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a]">
                {activePayload.stats.vitalityTier}
              </span>
            </div>
          </div>

          {/* The Narrative Manuscript (Old Font / Book Styling) */}
          <div className="space-y-4 font-serif text-sm sm:text-base leading-relaxed text-[#f0dfc8] border-y border-[#785127]/40 py-5">
            {/* Illuminated First Letter on Prologue */}
            <p className="first-letter:font-pixel first-letter:text-3xl first-letter:float-left first-letter:mr-2 first-letter:text-[#fbbf24] first-letter:leading-none">
              {activePayload.prologue}
            </p>

            <p className="bg-[#150d09]/60 p-3 border-l-2 border-[#a16207] italic text-[#e6d0b3]">
              {activePayload.dominantKingdomText}
            </p>

            <p>{activePayload.accomplishmentsText}</p>

            <p className="bg-[#150d09]/60 p-3 border-l-2 border-emerald-700/60 text-[#e6d0b3]">
              {activePayload.vitalityText}
            </p>

            <p className="text-center italic text-xs font-pixel text-[#d4b996] pt-2">
              "{activePayload.epilogue}"
            </p>
          </div>

          {/* Key Achievements List */}
          {activePayload.highlights && activePayload.highlights.length > 0 && (
            <div className="mt-5 pt-3">
              <span className="font-pixel text-[9px] uppercase text-[#fbbf24] block mb-2 tracking-wide">
                ✦ Significant Accomplishments ✦
              </span>
              <div className="flex flex-col gap-1.5">
                {activePayload.highlights.map((h: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 bg-[#120c08] border border-[#785127]/60 text-xs text-[#e6d0b3]"
                  >
                    <span className="text-amber-400">❖</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset button if viewing history */}
          {selectedHistoryPayload && (
            <div className="mt-4">
              <PixelButton
                variant="neutral"
                size="sm"
                onClick={() => setSelectedHistoryPayload(null)}
                className="w-full"
              >
                ◀ Return to Current Week Chronicle
              </PixelButton>
            </div>
          )}
        </div>
      )}

      {/* Historical Chronicles Drawer */}
      {history && history.length > 1 && (
        <div className="bg-[#16100b] border-2 border-[#785127] p-3 text-[#d4b996]">
          <h3 className="font-pixel text-xs font-bold text-[#fbbf24] mb-2 uppercase">
            Past Tome Chapters ({history.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedHistoryPayload(entry.payload)}
                className="flex items-center justify-between p-2 bg-[#0e0805] border border-[#785127]/60 text-left hover:border-amber-500 transition-colors cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-pixel text-[10px] font-bold text-[#fef08a]">
                    {entry.payload.weekTitle}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {entry.payload.weekRangeText}
                  </span>
                </div>
                <span className="font-pixel text-[9px] text-[#fbbf24]">
                  {entry.payload.stats.totalHours}h • Read 📖
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex gap-2">
        <Link href="/kingdoms" className="flex-1">
          <PixelButton variant="primary" size="sm" className="w-full">
            🏰 View Kingdoms
          </PixelButton>
        </Link>
        <Link href="/character" className="flex-1">
          <PixelButton variant="neutral" size="sm" className="w-full">
            ◀ Character Sheet
          </PixelButton>
        </Link>
      </div>
    </div>
  );
}

