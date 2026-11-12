"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import { getTierDefaultRewards } from "@/server/services/quest.service";
import { X, AlertTriangle } from "lucide-react";

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIERS = [
  { tier: 1, label: "T1: Novice", color: "border-neutral-600 text-neutral-300" },
  { tier: 2, label: "T2: Adept", color: "border-emerald-500/70 text-emerald-300" },
  { tier: 3, label: "T3: Veteran", color: "border-blue-500/70 text-blue-300" },
  { tier: 4, label: "T4: Master", color: "border-purple-500/70 text-purple-300" },
  { tier: 5, label: "T5: Legendary", color: "border-amber-500/70 text-amber-300" },
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
              className="text-neutral-400 hover:text-white text-xs p-1 border border-[#333333] bg-[#0a0a0a]"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
            {errorMsg && (
              <div className="p-2.5 border border-rose-600/70 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.5} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quest Title */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Bounty Title
              </label>
              <input
                type="text"
                placeholder="e.g. Read 15 Pages, 30m Deep Work, Cook Healthy Meal..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="w-full bg-[#0a0a0a] border border-[#333333] p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00e5ff]"
              />
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Description / Checklist (Optional)
              </label>
              <textarea
                placeholder="Brief objective notes or details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={140}
                className="w-full bg-[#0a0a0a] border border-[#333333] p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00e5ff] resize-none"
              />
            </div>

            {/* Kingdom Realm */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Kingdom Sphere
              </label>
              {loadingKingdoms ? (
                <div className="text-xs text-neutral-400">Loading kingdoms...</div>
              ) : (
                <select
                  value={kingdomId}
                  onChange={(e) => setKingdomId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333333] p-2.5 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
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
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Link to Skill (Optional)
              </label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333333] p-2.5 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
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
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Difficulty Tier
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {TIERS.map((t) => (
                  <button
                    key={t.tier}
                    type="button"
                    onClick={() => setTier(t.tier)}
                    className={`py-2 px-1 border font-sans text-[10px] font-semibold text-center transition-colors ${
                      tier === t.tier
                        ? "bg-[#141414] border-white text-white font-bold"
                        : "bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Reward Preview Banner */}
              <div className="p-2.5 bg-[#0e0e0e] border border-[#222222] flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-semibold">Tier Rewards:</span>
                <div className="flex items-center gap-2 font-pixel text-[10px]">
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

            {/* Recurrence Cadence */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Repeat Cadence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "DAILY", label: "Daily" },
                  { key: "WEEKLY", label: "Weekly" },
                  { key: "ONCE", label: "One-Off" },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setRepeat(c.key as any)}
                    className={`py-2 text-xs font-semibold text-center border transition-colors ${
                      repeat === c.key
                        ? "bg-[#141414] border-white text-white font-bold"
                        : "bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2 border-t border-[#222222]">
              <PixelButton
                type="button"
                variant="neutral"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </PixelButton>
              <PixelButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={createQuestMutation.isPending}
                className="flex-1"
              >
                Post Bounty
              </PixelButton>
            </div>
          </form>
        </PixelCard>
      </div>
    </div>
  );
};
