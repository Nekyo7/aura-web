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
import {
  Zap,
  Shield,
  Activity,
  Globe,
  AlertTriangle,
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";

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
    <div className="flex flex-col gap-6">
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
            icon={<Plus className="w-3.5 h-3.5" strokeWidth={2} />}
          >
            New Skill
          </PixelButton>
        }
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0a0a0a] border border-zinc-800 border-t-2 border-t-[#ffc600] flex items-center justify-center select-none shrink-0">
            <Zap className="w-6 h-6 text-[#ffc600]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm font-bold text-amber-300">
              Active Skill Crucible
            </h2>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              19 Rank Tiers • 0 to 10,000 Hours to Kanye Rank
            </p>
          </div>
        </div>
      </PixelCard>

      {/* Embedded One-Tap Activity Logger */}
      <LogTimeSheet />

      {/* Rust Ward Active Banner */}
      {skills && skills.length > 0 && skills[0].isRustWardActive && (
        <div className="p-3 bg-zinc-950 border border-cyan-500/40 text-cyan-200 font-sans text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-300 shrink-0" strokeWidth={1.5} />
            <div>
              <span className="font-bold block text-cyan-300">Rust Ward Barrier Active</span>
              <span className="text-xs text-zinc-400">All disciplines shielded from rust accumulation</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold font-pixel">
            {skills[0].rustWardRemainingDays}d Left
          </span>
        </div>
      )}

      {/* Skills List Container - Single Parent Card, Subtle Dividers */}
      <PixelCard
        variant="default"
        title={`Trained Disciplines (${skills?.length ?? 0})`}
        padding="md"
        headerRight={
          <span className="font-sans text-xs text-zinc-500 font-medium">
            Permanent Mastery
          </span>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8 font-sans text-xs text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-zinc-500" strokeWidth={2} />
            <span>Consulting the Codex...</span>
          </div>
        ) : skills && skills.length > 0 ? (
          <div className="space-y-6">
            {skills.map((skill, index) => {
              const hours = (skill.minutesLogged / 60).toFixed(1);
              const rankInfo = skill.rank;
              const rankProgress = minutesToNextRank(skill.minutesLogged);
              const totalWeights = skill.attributeWeights.reduce((acc, w) => acc + w.weight, 0);
              const isRusty = skill.rustLevel > 0;

              return (
                <div
                  key={skill.id}
                  className={`${index > 0 ? "pt-6 border-t border-zinc-800/80" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-pixel text-xs sm:text-sm font-bold text-white">
                          {skill.name}
                        </h4>
                        {skill.countsAsBody && (
                          <span className="font-sans text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center gap-0.5 font-medium">
                            <Activity className="w-2.5 h-2.5" strokeWidth={1.5} /> BODY
                          </span>
                        )}
                        {/* Rust Indicator Badge */}
                        {isRusty && (
                          <span className="font-sans text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-amber-400 flex items-center gap-0.5 font-medium">
                            <AlertTriangle className="w-2.5 h-2.5" strokeWidth={1.5} /> RUST {Math.round(skill.rustLevel * 100)}%
                          </span>
                        )}
                        {skill.isRustWardActive && (
                          <span className="font-sans text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-cyan-400 flex items-center gap-0.5 font-medium">
                            <Shield className="w-2.5 h-2.5" strokeWidth={1.5} /> FROZEN
                          </span>
                        )}
                      </div>
                      {/* Kingdom Tag */}
                      <span
                        className="font-sans text-xs mt-1 flex items-center gap-1.5 font-medium"
                        style={{ color: skill.kingdom.colorHex }}
                      >
                        <Globe className="w-3 h-3" strokeWidth={1.5} />
                        {skill.kingdom.name} Realm
                      </span>
                    </div>

                    {/* Rank Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-sans text-xs text-zinc-400 font-medium">
                        Rank {skill.rankIndex}: {rankInfo.name}
                      </span>
                      <span className="font-sans text-xs text-zinc-500 mt-0.5">
                        {hours}h Logged
                      </span>
                    </div>
                  </div>

                  {/* Rust Warning Banner */}
                  {isRusty && (
                    <div className="mb-3 p-2.5 bg-amber-950/20 border-l-2 border-amber-500 text-xs text-zinc-300 font-sans flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1">
                        <span className="font-medium text-amber-300 block text-xs">
                          Skill Rusting from Inactivity ({skill.rustStatus?.daysInactive}d inactive)
                        </span>
                        <p className="font-sans text-xs text-zinc-400 mt-0.5 leading-relaxed">
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
                      label={`Next: ${rankProgress.nextRankName}`}
                      sublabel={`${Math.round(rankProgress.remainingMinutes / 60)}h remaining`}
                    />
                  </div>

                  {/* Attribute Split Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {skill.attributeWeights.map((w) => {
                        const pct = totalWeights > 0 ? Math.round((w.weight / totalWeights) * 100) : 0;
                        return (
                          <span
                            key={w.id}
                            className="font-sans text-[10px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium"
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
                      className="font-sans text-xs text-zinc-600 hover:text-rose-400 underline cursor-pointer"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="font-sans text-xs text-zinc-500 mb-3">
              No active skills yet. Create your first discipline!
            </p>
            <PixelButton
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={2} />}
            >
              Forge First Skill
            </PixelButton>
          </div>
        )}
      </PixelCard>

      {/* Return to Character Sheet */}
      <Link href="/character">
        <PixelButton variant="neutral" size="sm" className="w-full" icon={<ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={2} />}>
          Back to Character Sheet
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
