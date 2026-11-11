"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";

interface CreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ATTRIBUTES = [
  { key: "STR", name: "Strength", icon: "⚔️", color: "text-rose-400", desc: "Physical power & lifts" },
  { key: "AGI", name: "Agility", icon: "⚡", color: "text-amber-400", desc: "Speed, cardio & reflex" },
  { key: "INT", name: "Intelligence", icon: "🧠", color: "text-blue-400", desc: "Logic, code & theory" },
  { key: "WIS", name: "Wisdom", icon: "📜", color: "text-emerald-400", desc: "Insight, reading & depth" },
  { key: "CHA", name: "Charisma", icon: "✨", color: "text-purple-400", desc: "Social, speech & art" },
  { key: "DEX", name: "Dexterity", icon: "🎯", color: "text-teal-400", desc: "Precision, music & craft" },
] as const;

export const CreateSkillModal: React.FC<CreateSkillModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [kingdomId, setKingdomId] = useState("");
  const [countsAsBody, setCountsAsBody] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Attribute weights: key -> number (0 to 5)
  const [weights, setWeights] = useState<Record<string, number>>({
    STR: 0,
    AGI: 0,
    INT: 1,
    WIS: 0,
    CHA: 0,
    DEX: 0,
  });

  const utils = trpc.useUtils();
  const { data: kingdoms, isLoading: loadingKingdoms } = trpc.skills.listKingdoms.useQuery(undefined, {
    enabled: isOpen,
  });

  // Auto-select first kingdom if available
  React.useEffect(() => {
    if (kingdoms && kingdoms.length > 0 && !kingdomId) {
      setKingdomId(kingdoms[0].id);
    }
  }, [kingdoms, kingdomId]);

  const createSkillMutation = trpc.skills.create.useMutation({
    onSuccess: async () => {
      await utils.skills.list.invalidate();
      setName("");
      setCountsAsBody(false);
      setWeights({ STR: 0, AGI: 0, INT: 1, WIS: 0, CHA: 0, DEX: 0 });
      setErrorMsg(null);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  if (!isOpen) return null;

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  const handleWeightChange = (key: string, delta: number) => {
    setWeights((prev) => {
      const current = prev[key] ?? 0;
      const next = Math.max(0, Math.min(5, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter a skill name.");
      return;
    }
    if (!kingdomId) {
      setErrorMsg("Please select a Kingdom.");
      return;
    }
    if (totalWeight <= 0) {
      setErrorMsg("Allocate at least 1 point to an attribute.");
      return;
    }

    const attributeWeights = Object.entries(weights)
      .filter(([_, w]) => w > 0)
      .map(([key, w]) => ({
        key: key as (typeof ATTRIBUTES)[number]["key"],
        weight: w,
      }));

    createSkillMutation.mutate({
      name: name.trim(),
      kingdomId,
      countsAsBody,
      attributeWeights,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <PixelCard
          title="Create New Skill"
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

            {/* Skill Name */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Skill Name
              </label>
              <input
                type="text"
                placeholder="e.g. Pixel Art, Rust Programming, Kettlebell..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="w-full bg-[#0b0f19] border-2 border-black p-2.5 font-pixel text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Kingdom Realm */}
            <div>
              <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider mb-1.5">
                Primary Kingdom Sphere
              </label>
              {loadingKingdoms ? (
                <div className="font-pixel text-xs text-gray-400">Loading kingdoms...</div>
              ) : (
                <select
                  value={kingdomId}
                  onChange={(e) => setKingdomId(e.target.value)}
                  className="w-full bg-[#0b0f19] border-2 border-black p-2.5 font-pixel text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {kingdoms?.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.tagline ?? "Sphere"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Physical Activity (Body Component) Toggle */}
            <div className="p-3 bg-[#0b0f19] border-2 border-black flex items-center justify-between cursor-pointer"
                 onClick={() => setCountsAsBody(!countsAsBody)}>
              <div className="flex flex-col pr-2">
                <span className="font-pixel text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <span>🏃</span> Physical Activity (Body)
                </span>
                <span className="text-[10px] text-gray-400 font-sans leading-tight mt-0.5">
                  Feeds the 7-day Vitality &quot;Body&quot; health bar automatically when logged.
                </span>
              </div>
              <div
                className={`w-6 h-6 border-2 border-black flex items-center justify-center font-pixel text-xs shrink-0 select-none ${
                  countsAsBody ? "bg-emerald-600 text-white" : "bg-slate-900 text-transparent"
                }`}
              >
                ✓
              </div>
            </div>

            {/* Attribute Distribution */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-pixel text-[11px] text-gray-300 uppercase tracking-wider">
                  Attribute Allocation
                </label>
                <span className="font-pixel text-[10px] text-purple-300">
                  Total Weight: {totalWeight}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans mb-3">
                Tap (+) or (-) to set which RPG attributes grow when practicing this skill.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {ATTRIBUTES.map((attr) => {
                  const val = weights[attr.key] ?? 0;
                  const pct = totalWeight > 0 ? Math.round((val / totalWeight) * 100) : 0;

                  return (
                    <div
                      key={attr.key}
                      className={`p-2 border-2 border-black flex flex-col justify-between transition-colors ${
                        val > 0 ? "bg-[#151a28] border-purple-900" : "bg-[#0b0f19]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-pixel text-xs font-bold ${attr.color} flex items-center gap-1`}>
                          <span>{attr.icon}</span> {attr.key}
                        </span>
                        {val > 0 && (
                          <span className="font-pixel text-[9px] px-1 bg-purple-950 border border-purple-800 text-purple-300">
                            {pct}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          onClick={() => handleWeightChange(attr.key, -1)}
                          disabled={val <= 0}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-black font-pixel text-xs text-white"
                        >
                          -
                        </button>
                        <span className="font-pixel text-xs font-bold text-white px-2">
                          {val}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleWeightChange(attr.key, 1)}
                          disabled={val >= 5}
                          className="w-7 h-7 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 border border-black font-pixel text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                isLoading={createSkillMutation.isPending}
              >
                + Forge Skill
              </PixelButton>
            </div>
          </form>
        </PixelCard>
      </div>
    </div>
  );
};

