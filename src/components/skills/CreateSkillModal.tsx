"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelButton } from "@/components/pixel/PixelButton";
import {
  Activity,
  Dumbbell,
  Zap,
  Brain,
  BookOpen,
  Sparkles,
  Target,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

interface CreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ATTRIBUTES = [
  { key: "STR", name: "Strength", icon: Dumbbell, color: "text-[#ff3344]", desc: "Physical power & lifts" },
  { key: "AGI", name: "Agility", icon: Zap, color: "text-[#ffc600]", desc: "Speed, cardio & reflex" },
  { key: "INT", name: "Intelligence", icon: Brain, color: "text-[#00e5ff]", desc: "Logic, code & theory" },
  { key: "WIS", name: "Wisdom", icon: BookOpen, color: "text-[#00ff66]", desc: "Insight, reading & depth" },
  { key: "CHA", name: "Charisma", icon: Sparkles, color: "text-[#ff2a85]", desc: "Social, speech & art" },
  { key: "DEX", name: "Dexterity", icon: Target, color: "text-[#b026ff]", desc: "Precision, music & craft" },
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

            {/* Skill Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Skill Name
              </label>
              <input
                type="text"
                placeholder="e.g. TypeScript Mastery, Running 5k, Oil Painting..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="w-full bg-[#0a0a0a] border border-[#333333] p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#b026ff]"
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
                  className="w-full bg-[#0a0a0a] border border-[#333333] p-2.5 text-xs text-white focus:outline-none focus:border-[#b026ff]"
                >
                  {kingdoms?.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.tagline ?? "Realm"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Physical Activity (Body Component) Toggle */}
            <div
              className="p-3 bg-[#0a0a0a] border border-[#333333] flex items-center justify-between cursor-pointer hover:border-neutral-500 transition-colors"
              onClick={() => setCountsAsBody(!countsAsBody)}
            >
              <div className="flex flex-col pr-2">
                <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  <span>Physical Activity (Body)</span>
                </span>
                <span className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                  Feeds the 7-day Vitality &quot;Body&quot; health bar automatically when logged.
                </span>
              </div>
              <div
                className={`w-5 h-5 border border-[#333333] flex items-center justify-center shrink-0 select-none ${
                  countsAsBody ? "bg-emerald-600 text-white" : "bg-[#141414] text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
            </div>

            {/* Attribute Distribution */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Attribute Allocation
                </label>
                <span className="font-pixel text-[10px] text-purple-300">
                  Total Weight: {totalWeight}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                Tap (+) or (-) to set which RPG attributes grow when practicing this skill.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {ATTRIBUTES.map((attr) => {
                  const val = weights[attr.key] ?? 0;
                  const pct = totalWeight > 0 ? Math.round((val / totalWeight) * 100) : 0;
                  const Icon = attr.icon;

                  return (
                    <div
                      key={attr.key}
                      className={`p-2.5 border flex flex-col justify-between transition-colors ${
                        val > 0
                          ? "bg-[#0a0a0a] border-purple-900 border-t-2 border-t-[#b026ff]"
                          : "bg-[#0a0a0a] border-[#222222]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold ${attr.color} flex items-center gap-1.5`}>
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>{attr.key}</span>
                        </span>
                        {val > 0 && (
                          <span className="font-pixel text-[9px] px-1 bg-[#141414] border border-purple-800 text-purple-300">
                            {pct}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          onClick={() => handleWeightChange(attr.key, -1)}
                          disabled={val <= 0}
                          className="w-7 h-7 bg-[#141414] hover:bg-[#222222] disabled:opacity-30 border border-[#333333] text-xs text-white flex items-center justify-center font-bold"
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
                          className="w-7 h-7 bg-[#b026ff] hover:bg-[#c24bf8] disabled:opacity-30 border border-[#b026ff] text-xs text-black flex items-center justify-center font-bold"
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
            <div className="flex gap-2 pt-2 border-t border-[#222222]">
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
                Forge Skill
              </PixelButton>
            </div>
          </form>
        </PixelCard>
      </div>
    </div>
  );
};
