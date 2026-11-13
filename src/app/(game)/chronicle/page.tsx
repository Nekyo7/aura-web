"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelButton } from "@/components/pixel/PixelButton";
import { Scroll, BookOpen, Globe, ArrowLeft } from "lucide-react";

export default function ChroniclePage() {
  const { data: currentWeek, isLoading } = trpc.chronicle.getCurrentWeek.useQuery();
  const { data: history } = trpc.chronicle.listHistory.useQuery();
  const [selectedHistoryPayload, setSelectedHistoryPayload] = useState<any>(null);

  const activePayload = selectedHistoryPayload || currentWeek?.payload;

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-2xl mx-auto">
      {/* Ancient Book Spine Header */}
      <div className="bg-[#141210] border border-[#333333] border-t-2 border-t-[#ffc600] p-4 text-center shadow-none relative">
        <span className="font-sans text-[10px] uppercase tracking-widest text-[#d4b996] block mb-1 font-semibold">
          Sacred Archive of Life OS
        </span>
        <h1 className="font-pixel text-sm sm:text-base font-bold text-[#fef08a] tracking-wide">
          The Weekly Chronicle
        </h1>
        <p className="font-sans text-xs text-[#d4b996] mt-0.5 italic">
          Recorded in immutable ink from the crucible of daily deeds
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-[#0e0c0a] border border-[#262626] p-8 text-center animate-pulse">
          <Scroll className="w-8 h-8 text-[#d4b996] mx-auto mb-2 opacity-60" strokeWidth={1.5} />
          <span className="font-sans text-xs text-[#d4b996]">
            Unfurling the parchment scrolls...
          </span>
        </div>
      )}

      {/* The Dusty Fantasy Book / Tome */}
      {!isLoading && activePayload && (
        <div className="relative bg-[#100d0a] border border-[#3d2c1d] border-t-2 border-t-[#a16207] text-[#f5e6c8] p-5 sm:p-6 shadow-none">
          {/* Chapter Title & Date Range */}
          <div className="text-center border-b border-[#3d2c1d] pb-4 mb-5">
            <span className="font-sans text-xs text-[#fbbf24] uppercase tracking-wider block font-medium">
              {activePayload.weekTitle}
            </span>
            <h2 className="font-pixel text-xs sm:text-sm font-bold text-[#fde047] mt-1">
              Cycle of {activePayload.weekRangeText}
            </h2>
          </div>

          {/* Stat Runes - Clean Borderless Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-5 border-b border-[#3d2c1d] text-center">
            <div>
              <span className="font-sans text-[10px] text-[#d4b996] uppercase block font-medium">
                Logged Effort
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a] mt-0.5 block">
                {activePayload.stats.totalHours} Hours
              </span>
            </div>

            <div>
              <span className="font-sans text-[10px] text-[#d4b996] uppercase block font-medium">
                Sessions
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a] mt-0.5 block">
                {activePayload.stats.sessionsCount} Feats
              </span>
            </div>

            <div>
              <span className="font-sans text-[10px] text-[#d4b996] uppercase block font-medium">
                Dominant Realm
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a] truncate block mt-0.5">
                {activePayload.stats.dominantKingdomName}
              </span>
            </div>

            <div>
              <span className="font-sans text-[10px] text-[#d4b996] uppercase block font-medium">
                Vitality Tier
              </span>
              <span className="font-pixel text-xs font-bold text-[#fef08a] mt-0.5 block">
                {activePayload.stats.vitalityTier}
              </span>
            </div>
          </div>

          {/* The Narrative Manuscript */}
          <div className="space-y-4 font-sans text-xs sm:text-sm leading-relaxed text-[#f0dfc8] border-b border-[#3d2c1d] pb-5">
            <p className="first-letter:font-pixel first-letter:text-2xl first-letter:float-left first-letter:mr-2 first-letter:text-[#fbbf24] first-letter:leading-none">
              {activePayload.prologue}
            </p>

            <p className="bg-[#0a0806] p-3 border-l-2 border-[#a16207] italic text-[#e6d0b3]">
              {activePayload.dominantKingdomText}
            </p>

            <p>{activePayload.accomplishmentsText}</p>

            <p className="bg-[#0a0806] p-3 border-l-2 border-emerald-700/60 text-[#e6d0b3]">
              {activePayload.vitalityText}
            </p>

            <p className="text-center italic text-xs text-[#d4b996] pt-1">
              &ldquo;{activePayload.epilogue}&rdquo;
            </p>
          </div>

          {/* Key Achievements List */}
          {activePayload.highlights && activePayload.highlights.length > 0 && (
            <div className="mt-5">
              <span className="font-sans text-xs uppercase text-[#fbbf24] block mb-3 tracking-wide font-medium">
                Significant Accomplishments
              </span>
              <div className="space-y-2">
                {activePayload.highlights.map((h: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 py-1 text-xs font-sans text-[#e6d0b3]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset button if viewing history */}
          {selectedHistoryPayload && (
            <div className="mt-5">
              <PixelButton
                variant="neutral"
                size="sm"
                onClick={() => setSelectedHistoryPayload(null)}
                className="w-full"
                icon={<ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={2} />}
              >
                Return to Current Week Chronicle
              </PixelButton>
            </div>
          )}
        </div>
      )}

      {/* Historical Chronicles Drawer */}
      {history && history.length > 1 && (
        <div className="bg-[#0e0c0a] border border-[#2a1e14] p-3 text-[#d4b996]">
          <h3 className="font-sans text-xs font-bold text-[#fbbf24] mb-2 uppercase">
            Past Tome Chapters ({history.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedHistoryPayload(entry.payload)}
                className="flex items-center justify-between p-2 bg-[#080605] border border-[#221810] text-left hover:border-amber-500 transition-colors cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-pixel text-[10px] font-bold text-[#fef08a]">
                    {entry.payload.weekTitle}
                  </span>
                  <span className="font-sans text-[10px] text-neutral-400">
                    {entry.payload.weekRangeText}
                  </span>
                </div>
                <span className="font-sans text-[10px] text-[#fbbf24] flex items-center gap-1 font-medium">
                  <span>{entry.payload.stats.totalHours}h</span>
                  <BookOpen className="w-3 h-3 ml-1 text-[#fbbf24]" strokeWidth={1.5} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex gap-2">
        <Link href="/kingdoms" className="flex-1">
          <PixelButton variant="primary" size="sm" className="w-full" icon={<Globe className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />}>
            View Kingdoms
          </PixelButton>
        </Link>
        <Link href="/character" className="flex-1">
          <PixelButton variant="neutral" size="sm" className="w-full" icon={<ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={2} />}>
            Character Sheet
          </PixelButton>
        </Link>
      </div>
    </div>
  );
}
