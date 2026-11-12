"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { useCelebrationStore } from "@/client/stores/celebration.store";
import {
  Coins,
  Hourglass,
  Gift,
  Wind,
  Shield,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Plus,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<"MEW_BUCKS" | "CHRONO">("MEW_BUCKS");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTreatName, setNewTreatName] = useState("");
  const [newTreatCost, setNewTreatCost] = useState(50);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const utils = trpc.useUtils();
  const enqueueCelebration = useCelebrationStore((state) => state.enqueue);

  const { data: balances, isLoading: loadingBalances } = trpc.wallet.getBalances.useQuery();
  const { data: rewards, isLoading: loadingRewards } = trpc.wallet.listRewards.useQuery();

  const createRewardMutation = trpc.wallet.createCustomReward.useMutation({
    onSuccess: async () => {
      await utils.wallet.listRewards.invalidate();
      setShowAddModal(false);
      setNewTreatName("");
      setNewTreatCost(50);
      setFeedbackMsg({ type: "success", text: "New personal treat added to your Sanctuary!" });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err) => {
      setFeedbackMsg({ type: "error", text: err.message });
    },
  });

  const purchaseRewardMutation = trpc.wallet.purchaseReward.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        utils.wallet.getBalances.invalidate(),
        utils.character.get.invalidate(),
      ]);

      enqueueCelebration({
        type: "ACHIEVEMENT",
        title: `Treat Redeemed: ${data.reward.name}!`,
        description: `Enjoy your guilt-free reward! Spent ${data.amountSpent} Mew Bucks.`,
        data: { rewardName: data.reward.name, cost: data.amountSpent },
      });

      setFeedbackMsg({
        type: "success",
        text: `Enjoy your treat: "${data.reward.name}"! (-${data.amountSpent} MB)`,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    },
    onError: (err) => {
      setFeedbackMsg({ type: "error", text: err.message });
    },
  });

  const purchaseRecoveryMutation = trpc.wallet.purchaseRecoveryItem.useMutation({
    onSuccess: async (data) => {
      await Promise.all([
        utils.wallet.getBalances.invalidate(),
        utils.character.get.invalidate(),
      ]);

      const itemLabels: Record<string, string> = {
        SECOND_WIND: "Second Wind (Vitality Treated as Neutral)",
        RUST_WARD: "Rust Ward (7-Day Decay Freeze)",
        REWIND: "Chrono Rewind (48h Activity Backfill)",
      };

      enqueueCelebration({
        type: "ACHIEVEMENT",
        title: `Recovery Tool Activated: ${itemLabels[data.itemKey] ?? data.itemKey}!`,
        description: `Your recovery shield is now active. Spent ${data.cost} CC.`,
        data: { itemKey: data.itemKey, cost: data.cost },
      });

      setFeedbackMsg({
        type: "success",
        text: `Activated ${itemLabels[data.itemKey] ?? data.itemKey}! (-${data.cost} CC)`,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    },
    onError: (err) => {
      setFeedbackMsg({ type: "error", text: err.message });
    },
  });

  const archiveRewardMutation = trpc.wallet.archiveReward.useMutation({
    onSuccess: async () => {
      await utils.wallet.listRewards.invalidate();
    },
  });

  const handleAddTreat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreatName.trim()) return;
    createRewardMutation.mutate({
      name: newTreatName.trim(),
      costMb: Number(newTreatCost),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Wallet Balance Strip */}
      <PixelCard variant="highlight" padding="sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0e0e0e] border border-[#333333] flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#ffc600]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm font-bold text-amber-300">
                Reward Sanctuary
              </h2>
              <p className="font-sans text-[11px] text-neutral-400">
                Discipline Into Guilt-Free Fun
              </p>
            </div>
          </div>

          {/* Wallets Pill Container */}
          <div className="flex items-center gap-2">
            {/* Mew Bucks */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0a0a0a] border border-[#ffc600]/60 font-sans text-xs text-[#ffc600]">
              <Coins className="w-3.5 h-3.5 text-[#ffc600]" strokeWidth={1.5} />
              <span className="font-bold tabular-nums font-pixel text-xs">
                {loadingBalances ? "..." : (balances?.mb ?? 0)}
              </span>
              <span className="text-[9px] text-neutral-400 font-semibold">MB</span>
            </div>

            {/* Chrono Chirals */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0a0a0a] border border-[#00e5ff]/60 font-sans text-xs text-[#00e5ff]">
              <Hourglass className="w-3.5 h-3.5 text-[#00e5ff]" strokeWidth={1.5} />
              <span className="font-bold tabular-nums font-pixel text-xs">
                {loadingBalances ? "..." : (balances?.cc ?? 0)}
              </span>
              <span className="text-[9px] text-neutral-400 font-semibold">CC</span>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-2.5 font-sans text-xs border flex items-center gap-2 ${
            feedbackMsg.type === "success"
              ? "border-[#00ff66]/60 bg-[#0a0a0a] text-[#00ff66]"
              : "border-[#ff3344]/60 bg-[#0a0a0a] text-[#ff3344]"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <Sparkles className="w-4 h-4 text-[#00ff66] shrink-0" strokeWidth={1.5} />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#ff3344] shrink-0" strokeWidth={1.5} />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("MEW_BUCKS")}
          className={`py-2 px-3 border font-sans text-xs rounded-none transition-colors uppercase flex items-center justify-center gap-1.5 font-semibold ${
            activeTab === "MEW_BUCKS"
              ? "bg-[#ffc600] border-[#ffc600] text-black font-bold"
              : "bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:text-white hover:border-neutral-500"
          }`}
        >
          <Coins className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Mew Bucks Treats</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CHRONO")}
          className={`py-2 px-3 border font-sans text-xs rounded-none transition-colors uppercase flex items-center justify-center gap-1.5 font-semibold ${
            activeTab === "CHRONO"
              ? "bg-[#00e5ff] border-[#00e5ff] text-black font-bold"
              : "bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:text-white hover:border-neutral-500"
          }`}
        >
          <Hourglass className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Chrono Sanctuary</span>
        </button>
      </div>

      {/* TAB 1: MEW BUCKS (PERSONAL REWARD SHOP) */}
      {activeTab === "MEW_BUCKS" && (
        <div className="flex flex-col gap-3">
          <PixelCard
            variant="default"
            title="Personal Treats"
            padding="md"
            headerRight={
              <PixelButton
                variant="primary"
                size="sm"
                onClick={() => setShowAddModal(!showAddModal)}
                icon={showAddModal ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              >
                {showAddModal ? "Close" : "Add Treat"}
              </PixelButton>
            }
          >
            <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-3">
              Earn Mew Bucks by completing quests, then cash them in for real-life pleasures completely guilt-free.
            </p>

            {/* Quick Add Treat Form */}
            {showAddModal && (
              <form onSubmit={handleAddTreat} className="p-3 mb-4 bg-[#0e0e0e] border border-[#222222] flex flex-col gap-3 font-sans">
                <span className="text-xs text-amber-300 font-bold block uppercase tracking-wide">
                  Define a Real-Life Reward
                </span>
                <input
                  type="text"
                  placeholder="e.g. 1 Episode of Anime, Coffee & Pastry..."
                  value={newTreatName}
                  onChange={(e) => setNewTreatName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-[#0a0a0a] border border-[#333333] p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ffc600]"
                />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Cost:</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newTreatCost}
                    onChange={(e) => setNewTreatCost(Number(e.target.value))}
                    className="w-20 bg-[#0a0a0a] border border-[#333333] p-1.5 text-xs text-amber-300 text-center font-bold"
                  />
                  <span className="text-xs text-neutral-400">Mew Bucks</span>

                  <PixelButton
                    type="submit"
                    variant="warning"
                    size="sm"
                    className="ml-auto"
                    isLoading={createRewardMutation.isPending}
                  >
                    Save Treat
                  </PixelButton>
                </div>
              </form>
            )}

            {/* Rewards List */}
            <div className="flex flex-col gap-2">
              {loadingRewards ? (
                <div className="py-6 text-center font-sans text-xs text-neutral-400 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-neutral-400" strokeWidth={2} />
                  <span>Opening the Vault...</span>
                </div>
              ) : rewards && rewards.length > 0 ? (
                rewards.map((reward) => {
                  const canAfford = (balances?.mb ?? 0) >= reward.costMb;

                  return (
                    <div
                      key={reward.id}
                      className="p-3 bg-[#0a0a0a] border border-[#222222] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-[#0e0e0e] border border-[#333333] flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4 text-[#ffc600]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-xs font-semibold text-white truncate">
                            {reward.name}
                          </span>
                          <span className="font-pixel text-[10px] text-amber-400 font-bold">
                            {reward.costMb} Mew Bucks
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <PixelButton
                          variant={canAfford ? "warning" : "neutral"}
                          size="sm"
                          disabled={!canAfford || purchaseRewardMutation.isPending}
                          onClick={() => purchaseRewardMutation.mutate({ rewardId: reward.id })}
                        >
                          {canAfford ? "Redeem" : "Locked"}
                        </PixelButton>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove treat "${reward.name}"?`)) {
                              archiveRewardMutation.mutate({ rewardId: reward.id });
                            }
                          }}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center font-sans text-xs text-neutral-400">
                  No treats defined yet. Add your favorite treat above!
                </div>
              )}
            </div>
          </PixelCard>
        </div>
      )}

      {/* TAB 2: CHRONO CHIRALS (RECOVERY TOOLS) */}
      {activeTab === "CHRONO" && (
        <div className="flex flex-col gap-3">
          <PixelCard variant="default" title="Chrono Sanctuary" padding="md">
            <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-4">
              Rare, recovery-oriented items for life interruptions. Chrono Chirals are earned at major milestone rank tier-ups (every III→I boundary).
            </p>

            <div className="flex flex-col gap-3">
              {/* Item 1: Second Wind */}
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] border-t-2 border-t-[#00e5ff] flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#0e0e0e] border border-[#333333] flex items-center justify-center">
                      <Wind className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs font-bold text-cyan-300">
                        Second Wind
                      </h4>
                      <span className="font-sans text-[10px] text-cyan-400 font-semibold">
                        Cost: 1 Chrono Chiral
                      </span>
                    </div>
                  </div>

                  <PixelButton
                    variant="neutral"
                    size="sm"
                    disabled={(balances?.cc ?? 0) < 1 || purchaseRecoveryMutation.isPending}
                    onClick={() => purchaseRecoveryMutation.mutate({ itemKey: "SECOND_WIND" })}
                  >
                    Activate
                  </PixelButton>
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Shields your character for 24 hours: Vitality is treated as at least <strong className="text-amber-400">Neutral (0.85x)</strong> even if HP drops into Weakened tier.
                </p>
              </div>

              {/* Item 2: Rust Ward */}
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] border-t-2 border-t-[#00e5ff] flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#0e0e0e] border border-[#333333] flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs font-bold text-cyan-300">
                        Rust Ward
                      </h4>
                      <span className="font-sans text-[10px] text-cyan-400 font-semibold">
                        Cost: 2 Chrono Chirals
                      </span>
                    </div>
                  </div>

                  <PixelButton
                    variant="neutral"
                    size="sm"
                    disabled={(balances?.cc ?? 0) < 2 || purchaseRecoveryMutation.isPending}
                    onClick={() => purchaseRecoveryMutation.mutate({ itemKey: "RUST_WARD" })}
                  >
                    Activate
                  </PixelButton>
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Freezes skill rust and decay for 7 continuous days. Ideal for guilt-free holidays, travel, or sick leave.
                </p>
              </div>

              {/* Item 3: Chrono Rewind */}
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] border-t-2 border-t-[#00e5ff] flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#0e0e0e] border border-[#333333] flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs font-bold text-cyan-300">
                        Chrono Rewind
                      </h4>
                      <span className="font-sans text-[10px] text-cyan-400 font-semibold">
                        Cost: 1 Chrono Chiral
                      </span>
                    </div>
                  </div>

                  <PixelButton
                    variant="neutral"
                    size="sm"
                    disabled={(balances?.cc ?? 0) < 1 || purchaseRecoveryMutation.isPending}
                    onClick={() => purchaseRecoveryMutation.mutate({ itemKey: "REWIND" })}
                  >
                    Activate
                  </PixelButton>
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Backfill missed logged activity within a 48-hour window without penalty.
                </p>
              </div>
            </div>
          </PixelCard>
        </div>
      )}

      {/* Return Button */}
      <Link href="/character">
        <PixelButton variant="neutral" size="sm" className="w-full" icon={<ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={2} />}>
          Back to Character Sheet
        </PixelButton>
      </Link>
    </div>
  );
}
