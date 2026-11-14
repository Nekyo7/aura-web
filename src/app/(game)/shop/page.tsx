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

function getInrString(costMb: number): string {
  const inr = costMb / 10;
  return Number.isInteger(inr)
    ? inr.toString()
    : inr.toFixed(2).replace(/\.?0+$/, "");
}

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<"MEW_BUCKS" | "CHRONO">("MEW_BUCKS");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTreatName, setNewTreatName] = useState("");
  const [currencyMode, setCurrencyMode] = useState<"INR" | "MB">("INR");
  const [treatCostInput, setTreatCostInput] = useState<string>("150");
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
      setTreatCostInput(currencyMode === "INR" ? "150" : "1500");
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
    const rawCost = Number(treatCostInput);
    if (isNaN(rawCost) || rawCost <= 0) return;

    // Conversion Logic: If user selects ₹ INR and types 150, multiply by 10 to save 1500 MB.
    // If they select MB, save the exact number typed.
    const finalCostMb = currencyMode === "INR"
      ? Math.round(rawCost * 10)
      : Math.round(rawCost);

    createRewardMutation.mutate({
      name: newTreatName.trim(),
      costMb: Math.max(1, finalCostMb),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Wallet Balance Strip */}
      <PixelCard variant="highlight" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-[#ffc600]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm font-bold text-amber-300">
                Reward Sanctuary
              </h2>
              <p className="font-sans text-xs text-zinc-500 mt-0.5">
                Discipline Into Guilt-Free Fun
              </p>
              {/* Exchange Rate Badge */}
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-sans text-zinc-400">
                <span>
                  Exchange Rate: <span className="text-emerald-400 font-medium">₹1</span> = <span className="text-amber-400 font-medium">10 MB</span>
                </span>
              </div>
            </div>
          </div>

          {/* Wallets Pill Container */}
          <div className="flex items-center gap-2">
            {/* Mew Bucks */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 font-sans text-xs text-amber-400">
              <Coins className="w-3.5 h-3.5 text-[#ffc600]" strokeWidth={1.5} />
              <span className="font-bold tabular-nums font-pixel text-xs">
                {loadingBalances ? "..." : (balances?.mb ?? 0)}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">MB</span>
            </div>

            {/* Chrono Chirals */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 font-sans text-xs text-cyan-400">
              <Hourglass className="w-3.5 h-3.5 text-[#00e5ff]" strokeWidth={1.5} />
              <span className="font-bold tabular-nums font-pixel text-xs">
                {loadingBalances ? "..." : (balances?.cc ?? 0)}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">CC</span>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 font-sans text-xs border flex items-center gap-2 ${
            feedbackMsg.type === "success"
              ? "border-emerald-500/50 bg-zinc-950 text-emerald-400"
              : "border-rose-500/50 bg-zinc-950 text-rose-400"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.5} />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("MEW_BUCKS")}
          className={`py-2 px-3 border font-sans text-xs rounded-none transition-colors uppercase flex items-center justify-center gap-2 font-medium cursor-pointer ${
            activeTab === "MEW_BUCKS"
              ? "bg-[#ffc600] border-[#ffc600] text-black font-bold"
              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
        >
          <Coins className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Mew Bucks Treats</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CHRONO")}
          className={`py-2 px-3 border font-sans text-xs rounded-none transition-colors uppercase flex items-center justify-center gap-2 font-medium cursor-pointer ${
            activeTab === "CHRONO"
              ? "bg-[#00e5ff] border-[#00e5ff] text-black font-bold"
              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
        >
          <Hourglass className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Chrono Sanctuary</span>
        </button>
      </div>

      {/* TAB 1: MEW BUCKS (PERSONAL REWARD SHOP) */}
      {activeTab === "MEW_BUCKS" && (
        <div className="flex flex-col gap-6">
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
            <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-4">
              Earn Mew Bucks by completing quests, then cash them in for real-life pleasures completely guilt-free.
            </p>

            {/* Quick Add Treat Form */}
            {showAddModal && (
              <form onSubmit={handleAddTreat} className="p-3.5 mb-5 bg-zinc-950 border border-zinc-800 flex flex-col gap-3.5 font-sans">
                <span className="text-xs text-amber-300 font-bold block uppercase tracking-wide">
                  Define a Real-Life Reward
                </span>
                <input
                  type="text"
                  placeholder="e.g. 1 Episode of Anime, Coffee & Pastry..."
                  value={newTreatName}
                  onChange={(e) => setNewTreatName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffc600]"
                />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-400 font-medium">Cost / Price:</label>

                    {/* Dynamic Currency Toggle */}
                    <div className="flex items-center bg-[#0a0a0a] border border-zinc-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (currencyMode !== "INR") {
                            setCurrencyMode("INR");
                            const num = Number(treatCostInput);
                            if (!isNaN(num) && num > 0) {
                              setTreatCostInput(String(num / 10));
                            }
                          }
                        }}
                        className={`px-2.5 py-0.5 text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                          currencyMode === "INR"
                            ? "bg-emerald-400 text-black font-bold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        ₹ INR
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currencyMode !== "MB") {
                            setCurrencyMode("MB");
                            const num = Number(treatCostInput);
                            if (!isNaN(num) && num > 0) {
                              setTreatCostInput(String(Math.round(num * 10)));
                            }
                          }
                        }}
                        className={`px-2.5 py-0.5 text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                          currencyMode === "MB"
                            ? "bg-amber-400 text-black font-bold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        MB
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-400 select-none">
                        {currencyMode === "INR" ? "₹" : "MB"}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={currencyMode === "INR" ? 100000 : 1000000}
                        step={currencyMode === "INR" ? "any" : "1"}
                        value={treatCostInput}
                        onChange={(e) => setTreatCostInput(e.target.value)}
                        placeholder={currencyMode === "INR" ? "e.g. 150" : "e.g. 1500"}
                        className={`w-full bg-[#0a0a0a] border border-zinc-800 ${
                          currencyMode === "INR"
                            ? "pl-7 text-emerald-400 focus:border-emerald-400"
                            : "pl-11 text-amber-300 focus:border-amber-400"
                        } pr-3 py-1.5 text-xs font-bold focus:outline-none`}
                      />
                    </div>

                    <PixelButton
                      type="submit"
                      variant="warning"
                      size="sm"
                      isLoading={createRewardMutation.isPending}
                    >
                      Save Treat
                    </PixelButton>
                  </div>

                  {/* Calculated Conversion Hint */}
                  <div className="mt-2 text-[11px] font-sans text-zinc-500">
                    {currencyMode === "INR" ? (
                      <span>
                        Rate: <span className="text-emerald-400">₹1</span> = <span className="text-amber-400">10 MB</span> &bull; Converts to:{" "}
                        <strong className="text-amber-400 font-pixel">
                          {isNaN(Number(treatCostInput)) || Number(treatCostInput) <= 0
                            ? "0"
                            : Math.round(Number(treatCostInput) * 10).toLocaleString()}{" "}
                          MB
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Rate: <span className="text-amber-400">10 MB</span> = <span className="text-emerald-400">₹1</span> &bull; Real cost:{" "}
                        <strong className="text-emerald-400 font-pixel">
                          ₹
                          {isNaN(Number(treatCostInput)) || Number(treatCostInput) <= 0
                            ? "0"
                            : (Number(treatCostInput) / 10).toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* Rewards List - Subtle Dividers, No Nested Border Boxes */}
            <div>
              {loadingRewards ? (
                <div className="py-8 text-center font-sans text-xs text-zinc-500 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-zinc-500" strokeWidth={2} />
                  <span>Opening the Vault...</span>
                </div>
              ) : rewards && rewards.length > 0 ? (
                rewards.map((reward) => {
                  const canAfford = (balances?.mb ?? 0) >= reward.costMb;

                  return (
                    <div
                      key={reward.id}
                      className="py-3.5 border-b border-zinc-800/80 first:pt-0 last:border-b-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-xs sm:text-sm font-medium text-white truncate">
                            {reward.name}
                          </span>
                          <span className="font-pixel text-xs font-bold mt-0.5">
                            <span className="text-amber-400">{reward.costMb} MB</span>{" "}
                            <span className="text-emerald-400">(₹{getInrString(reward.costMb)})</span>
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
                          className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center font-sans text-xs text-zinc-500">
                  No treats defined yet. Add your favorite treat above!
                </div>
              )}
            </div>
          </PixelCard>
        </div>
      )}

      {/* TAB 2: CHRONO CHIRALS (RECOVERY TOOLS) */}
      {activeTab === "CHRONO" && (
        <div className="flex flex-col gap-6">
          <PixelCard variant="default" title="Chrono Sanctuary" padding="md">
            <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6">
              Rare, recovery-oriented items for life interruptions. Chrono Chirals are earned at major milestone rank tier-ups (every III→I boundary).
            </p>

            <div className="space-y-6">
              {/* Item 1: Second Wind */}
              <div className="pb-6 border-b border-zinc-800/80 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <Wind className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs sm:text-sm font-bold text-cyan-300">
                        Second Wind
                      </h4>
                      <span className="font-sans text-xs text-zinc-500">
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
                <p className="text-xs text-zinc-400 font-sans leading-relaxed pl-13">
                  Shields your character for 24 hours: Vitality is treated as at least <strong className="text-amber-400 font-medium">Neutral (0.85x)</strong> even if HP drops into Weakened tier.
                </p>
              </div>

              {/* Item 2: Rust Ward */}
              <div className="pb-6 border-b border-zinc-800/80 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs sm:text-sm font-bold text-cyan-300">
                        Rust Ward
                      </h4>
                      <span className="font-sans text-xs text-zinc-500">
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
                <p className="text-xs text-zinc-400 font-sans leading-relaxed pl-13">
                  Freezes skill rust and decay for 7 continuous days. Ideal for guilt-free holidays, travel, or sick leave.
                </p>
              </div>

              {/* Item 3: Chrono Rewind */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-5 h-5 text-[#00e5ff]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-pixel text-xs sm:text-sm font-bold text-cyan-300">
                        Chrono Rewind
                      </h4>
                      <span className="font-sans text-xs text-zinc-500">
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
                <p className="text-xs text-zinc-400 font-sans leading-relaxed pl-13">
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
