"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { getTierDefaultRewards } from "@/server/services/quest.service";

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIERS = [
  { tier: 1, label: "T1: Novice", color: "border-gray-500 text-gray-300" },
  { tier: 2, label: "T2: Adept", color: "border-emerald-500 text-emerald-300" },
  { tier: 3, label: "T3: Veteran", color: "border-blue-500 text-blue-300" },
  { tier: 4, label: "T4: Master", color: "border-purple-500 text-purple-300" },
  { tier: 5, label: "T5: Legendary", color: "border-amber-500 text-amber-300" },
];

export const CreateQuestModal: React.FC<CreateQuestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kingdomId, setKingdomId] = useState("");
  const [skillId, setSkillId] = useState<string>("");
  const [tier, setTier] = useState<number>(1);
  const [repeat, setRepeat] = useState<"ONCE" | "DAILY" | "WEEKLY">("DAILY");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: kingdoms, isLoading: loadingKingdoms } = trpc.skills.listKingdoms.useQuery(undefined, {
    enabled: isOpen,
  });

  const { data: skills } = trpc.skills.list.useQuery(undefined, {
    enabled: isOpen,
  });

  // Auto-select first kingdom if available
  React.useEffect(() => {
    if (kingdoms && kingdoms.length > 0 && !kingdomId) {
      setKingdomId(kingdoms[0].id);
    }
  }, [kingdoms, kingdomId]);

  const createQuestMutation = trpc.quests.create.useMutation({
    onSuccess: async () => {
      await utils.quests.list.invalidate();
      setTitle("");
      setDescription("");
      setSkillId("");
      setTier(1);
      setRepeat("DAILY");
      setErrorMsg(null);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  if (!isOpen) return null;

  const currentRewards = getTierDefaultRewards(tier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please enter a quest title.");
      return;
    }
    if (!kingdomId) {
      setErrorMsg("Please select a Kingdom.");
      return;
    }

    createQuestMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      kingdomId,
      skillId: skillId || null,
      tier,
      repeat,
      criteriaType: "MANUAL",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <PixelCard
          title="Create New Bounty"
          variant="highlight"
          padding="md"
          headerRight={
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white font-pixel text-xs px-2 py-0.5 border border-black bg-slate-900"
            >
              ✕
            </button>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-2 border-2 border-rose-600 bg-rose-950/70 text-rose-200 text-xs font-pixel">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Quest Title */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Bounty Title
              </label>
              <input
                type="text"
                placeholder="e.g. Read 15 Pages, 30m Deep Work, Cook Healthy Meal..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="w-full bg-[#0b0f19] border-2 border-black p-2.5 font-pixel text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Description / Checklist (Optional)
              </label>
              <textarea
                placeholder="Brief objective notes or details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={140}
                className="w-full bg-[#0b0f19] border-2 border-black p-2 font-pixel text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Kingdom Realm */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Kingdom Sphere
              </label>
              {loadingKingdoms ? (
                <div className="font-pixel text-xs text-gray-400">Loading kingdoms...</div>
              ) : (
                <select
                  value={kingdomId}
                  onChange={(e) => setKingdomId(e.target.value)}
                  className="w-full bg-[#0b0f19] border-2 border-black p-2.5 font-pixel text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {kingdoms?.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.tagline ?? "Realm"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Linked Skill (Optional) */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Link to Skill (Optional)
              </label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full bg-[#0b0f19] border-2 border-black p-2.5 font-pixel text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- None (Standalone Bounty) --</option>
                {skills?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Rank {s.rankIndex})
                  </option>
                ))}
              </select>
            </div>

            {/* Tier Selector */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Difficulty Tier
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {TIERS.map((t) => (
                  <button
                    key={t.tier}
                    type="button"
                    onClick={() => setTier(t.tier)}
                    className={`py-2 px-1 border-2 font-pixel text-[10px] text-center transition-all ${
                      tier === t.tier
                        ? "bg-blue-900/60 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        : "bg-[#0b0f19] border-black text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    T{t.tier}
                  </button>
                ))}
              </div>

              {/* Reward Preview based on Tier */}
              <div className="p-2.5 bg-[#0b0f19] border border-black flex items-center justify-between text-xs font-pixel">
                <span className="text-gray-400 text-[10px]">REWARDS:</span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-blue-400">+{currentRewards.baseXp} XP</span>
                  <span className="text-amber-400">+{currentRewards.mbReward} MB</span>
                  {currentRewards.apReward > 0 && (
                    <span className="text-purple-400">+{currentRewards.apReward} AP</span>
                  )}
                  {currentRewards.ccReward > 0 && (
                    <span className="text-cyan-400">+{currentRewards.ccReward} CC</span>
                  )}
                </div>
              </div>
            </div>

            {/* Repeat Cadence */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Repeat Cadence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["ONCE", "DAILY", "WEEKLY"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRepeat(r)}
                    className={`py-2 px-2 border-2 font-pixel text-xs text-center transition-all ${
                      repeat === r
                        ? "bg-purple-900/60 border-purple-400 text-white"
                        : "bg-[#0b0f19] border-black text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <PixelButton
                type="button"
                variant="neutral"
                size="sm"
                className="w-1/3"
                onClick={onClose}
              >
                Cancel
              </PixelButton>
              <PixelButton
                type="submit"
                variant="primary"
                size="sm"
                className="w-2/3"
                isLoading={createQuestMutation.isPending}
              >
                + Post Bounty
              </PixelButton>
            </div>
          </form>
        </PixelCard>
      </div>
    </div>
  );
};

