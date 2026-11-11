"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelBar } from "@/components/pixel/PixelBar";
import { LogTimeSheet } from "@/components/skills/LogTimeSheet";
import { CreateSkillModal } from "@/components/skills/CreateSkillModal";
import { minutesToNextRank } from "@/rules/level";

export default function SkillsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: skills, isLoading } = trpc.skills.list.useQuery();

  const archiveMutation = trpc.skills.archive.useMutation({
    onSuccess: async () => {
      await utils.skills.list.invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <PixelCard
        variant="default"
        title="Skills & Mastery"
        padding="md"
        headerRight={
          <PixelButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<span>+</span>}
          >
            New Skill
          </PixelButton>
        }
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-amber-950 border-2 border-amber-500 flex items-center justify-center text-2xl select-none">
            ⚔️
          </div>
          <div>
            <h2 className="font-pixel text-sm font-bold text-amber-300">
              Active Skill Crucible
            </h2>
            <p className="font-pixel text-[10px] text-gray-400">
              19 Rank Tiers • 0 to 10,000 Hours to Kanye Rank
            </p>
          </div>
        </div>
      </PixelCard>

      {/* Embedded One-Tap Activity Logger */}
      <LogTimeSheet />

      {/* Rust Ward Active Banner */}
      {skills && skills.length > 0 && skills[0].isRustWardActive && (
        <div className="p-2.5 bg-cyan-950/80 border-2 border-cyan-400 text-cyan-200 font-pixel text-xs flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <span className="font-bold block text-cyan-300">Rust Ward Barrier Active</span>
              <span className="text-[10px] text-cyan-400">All disciplines shielded from rust accumulation</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-cyan-900 border border-cyan-500 font-bold">
            {skills[0].rustWardRemainingDays}d Left
          </span>
        </div>
      )}

      {/* Skills List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-pixel text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>📜</span> Your Trained Disciplines ({skills?.length ?? 0})
          </h3>
          <span className="font-pixel text-[10px] text-gray-500">
            Never Loses Progress
          </span>
        </div>

        {isLoading ? (
          <PixelCard variant="default" padding="md">
            <div className="flex items-center justify-center py-6 font-pixel text-xs text-gray-400">
              <span className="animate-spin mr-2">⌛</span> Consulting the Codex...
            </div>
          </PixelCard>
        ) : skills && skills.length > 0 ? (
          skills.map((skill) => {
            const hours = (skill.minutesLogged / 60).toFixed(1);
            const rankInfo = skill.rank;
            const rankProgress = minutesToNextRank(skill.minutesLogged);
            const totalWeights = skill.attributeWeights.reduce((acc, w) => acc + w.weight, 0);
            const isRusty = skill.rustLevel > 0;

            return (
              <PixelCard
                key={skill.id}
                variant="default"
                padding="md"
                className={
                  isRusty
                    ? "border-amber-600 bg-[#16120e] shadow-[0_0_10px_rgba(217,119,6,0.3)] transition-colors"
                    : ""
                }
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-pixel text-sm font-bold text-white">
                        {skill.name}
                      </h4>
                      {skill.countsAsBody && (
                        <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-300">
                          🏃 BODY
                        </span>
                      )}
                      {/* Rust Indicator Badge */}
                      {isRusty && (
                        <span className={`font-pixel text-[9px] px-1.5 py-0.5 border ${skill.rustStatus?.badgeColor}`}>
                          🍂 RUST {Math.round(skill.rustLevel * 100)}%
                        </span>
                      )}
                      {skill.isRustWardActive && (
                        <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-cyan-950 border border-cyan-500 text-cyan-300">
                          🛡️ FROZEN
                        </span>
                      )}
                    </div>
                    {/* Kingdom Tag */}
                    <span
                      className="font-pixel text-[10px] mt-0.5 flex items-center gap-1"
                      style={{ color: skill.kingdom.colorHex }}
                    >
                      <span>🏰</span> {skill.kingdom.name} Realm
                    </span>
                  </div>

                  {/* Rank Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className="font-pixel text-xs font-bold px-2 py-0.5 border border-black"
                      style={{
                        backgroundColor: `${rankInfo.colorHex}25`,
                        color: rankInfo.colorHex,
                        borderColor: rankInfo.colorHex,
                      }}
                    >
                      Rank {skill.rankIndex}: {rankInfo.name}
                    </span>
                    <span className="font-pixel text-[10px] text-gray-400 mt-0.5">
                      {hours}h Logged
                    </span>
                  </div>
                </div>

                {/* Rust Warning Banner */}
                {isRusty && (
                  <div className="mb-2.5 p-2 bg-amber-950/60 border border-amber-600/70 text-[10px] text-amber-200 font-pixel flex items-start gap-2">
                    <span className="text-base select-none">⚠️</span>
                    <div className="flex-1">
                      <span className="font-bold text-amber-300 block">
                        Skill Rusting from Inactivity ({skill.rustStatus?.daysInactive}d inactive)
                      </span>
                      <p className="font-sans text-[11px] text-gray-300 mt-0.5 leading-tight">
                        {skill.rustStatus?.description} Ranks and accumulated hours are permanently preserved. Log a practice session to instantly restore polish!
                      </p>
                    </div>
                  </div>
                )}

                {/* Rank Progress Bar */}
                <div className="mb-3">
                  <PixelBar
                    value={rankProgress.progressInRankMinutes}
                    max={rankProgress.spanMinutes}
                    size="sm"
                    variant="custom"
                    customColor={rankInfo.colorHex}
                    label={`Next Rank: ${rankProgress.nextRankName}`}
                    sublabel={`${Math.round(rankProgress.remainingMinutes / 60)}h remaining`}
                  />
                </div>

                {/* Attribute Split Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/40">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {skill.attributeWeights.map((w) => {
                      const pct = totalWeights > 0 ? Math.round((w.weight / totalWeights) * 100) : 0;
                      return (
                        <span
                          key={w.id}
                          className="font-pixel text-[9px] px-1.5 py-0.5 bg-[#0b0f19] border border-black text-gray-300"
                        >
                          {w.key} {pct}%
                        </span>
                      );
                    })}
                  </div>

                  {/* Quick Archive Action */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Archive skill "${skill.name}"? It can be restored later.`)) {
                        archiveMutation.mutate({ skillId: skill.id });
                      }
                    }}
                    disabled={archiveMutation.isPending}
                    className="font-pixel text-[9px] text-gray-500 hover:text-rose-400 underline cursor-pointer"
                  >
                    Archive
                  </button>
                </div>
              </PixelCard>
            );
          })
        ) : (
          <PixelCard variant="default" padding="md">
            <div className="text-center py-4">
              <p className="font-pixel text-xs text-gray-400 mb-3">
                No active skills yet. Create your first discipline!
              </p>
              <PixelButton
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + Forge First Skill
              </PixelButton>
            </div>
          </PixelCard>
        )}
      </div>

      {/* Return to Character Sheet */}
      <Link href="/character">
        <PixelButton variant="neutral" size="sm" className="w-full">
          ◀ Back to Character Sheet
        </PixelButton>
      </Link>

      {/* Creation Modal */}
      <CreateSkillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
