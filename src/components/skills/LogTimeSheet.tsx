"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { useLogActivity } from "@/client/hooks/useLogActivity";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";

export interface LogTimeSheetProps {
  onSuccess?: () => void;
  className?: string;
}

const MINUTE_PRESETS = [15, 25, 45, 60, 90];

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const LogTimeSheet: React.FC<LogTimeSheetProps> = ({
  onSuccess,
  className = "",
}) => {
  const { data: skills, isLoading: isLoadingSkills } = trpc.skills.list.useQuery();
  const logMutation = useLogActivity();

  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [minutes, setMinutes] = useState<number>(45);
  const [note, setNote] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Set default selected skill once loaded
  React.useEffect(() => {
    if (skills && skills.length > 0 && !selectedSkillId) {
      setSelectedSkillId(skills[0].id);
    }
  }, [skills, selectedSkillId]);

  const selectedSkill = skills?.find((s) => s.id === selectedSkillId);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId || minutes <= 0) return;

    setStatusMessage(null);
    try {
      const result = await logMutation.mutateAsync({
        skillId: selectedSkillId,
        minutes: Number(minutes),
        idempotencyKey: generateUUID(),
        note: note.trim() || undefined,
      });

      setStatusMessage(`✨ Logged ${minutes}m! Gained +${result.xpAwarded} XP`);
      setNote("");
      if (onSuccess) onSuccess();

      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`❌ Error: ${err?.message || "Failed to log activity"}`);
    }
  };

  return (
    <PixelCard
      title="Log Life Action"
      variant="default"
      className={`w-full max-w-lg mx-auto ${className}`}
    >
      <form onSubmit={handleLog} className="flex flex-col gap-4">
        {/* 1. Skill Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs text-gray-300 uppercase tracking-wide">
            Select Practice / Skill:
          </label>

          {isLoadingSkills ? (
            <div className="text-xs text-gray-400 font-pixel py-2">Loading skills...</div>
          ) : !skills || skills.length === 0 ? (
            <div className="text-xs text-amber-400 font-pixel py-2">No skills available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {skills.map((skill) => {
                const isSelected = skill.id === selectedSkillId;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={`
                      text-left p-2.5 border-2 text-xs transition-all cursor-pointer select-none
                      ${
                        isSelected
                          ? "bg-purple-950/80 border-purple-500 shadow-[inset_0_0_10px_rgba(168,85,247,0.3)] text-white font-bold"
                          : "bg-[#0b0f19] border-black/80 hover:border-gray-600 text-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{skill.name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 border border-black font-pixel uppercase"
                        style={{ backgroundColor: skill.kingdom?.colorHex || "#3b82f6" }}
                      >
                        {skill.kingdom?.name || "Skill"}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-mono">
                      Rank: {skill.rank?.name || "Origin I"} • {skill.minutesLogged}m
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Quick Presets & Custom Duration */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="font-pixel text-xs text-gray-300 uppercase tracking-wide">
              Time Spent:
            </label>
            <span className="font-pixel text-xs text-purple-400 font-bold tabular-nums">
              {minutes} Minutes ({ (minutes / 60).toFixed(1) }h)
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {MINUTE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMinutes(preset)}
                className={`
                  py-2 text-xs font-pixel border-2 border-black cursor-pointer select-none
                  transition-all active:translate-y-0.5
                  ${
                    minutes === preset
                      ? "bg-purple-600 text-white font-bold shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]"
                      : "bg-[#0b0f19] text-gray-300 hover:bg-slate-800"
                  }
                `}
              >
                {preset}m
              </button>
            ))}
          </div>

          {/* Custom Slider / Input */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-[#0b0f19] rounded-none border border-black"
            />
            <input
              type="number"
              min="1"
              max="600"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
              className="w-16 p-1.5 bg-[#0b0f19] border-2 border-black text-center font-pixel text-xs text-white"
            />
          </div>
        </div>

        {/* Optional Note */}
        <div className="flex flex-col gap-1">
          <label className="font-pixel text-[11px] text-gray-400 uppercase">
            Quest / Activity Note (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g., Solved LeetCode tree problems"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            className="w-full p-2 bg-[#0b0f19] border-2 border-black text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 font-sans"
          />
        </div>

        {/* Reward Preview */}
        {selectedSkill && (
          <div className="p-2.5 bg-[#0b0f19]/80 border-2 border-black text-[11px] text-gray-300 flex justify-between items-center">
            <span className="font-pixel text-gray-400 text-[10px]">EST. REWARD:</span>
            <div className="flex items-center gap-3 font-pixel">
              <span className="text-purple-400 font-bold">+{minutes * 10} XP</span>
              <span className="text-amber-400 font-bold">+{((minutes / 60) * 60).toFixed(0)} ATTR PTS</span>
            </div>
          </div>
        )}

        {/* Status Toast / Feedback */}
        {statusMessage && (
          <div
            className={`p-2 border-2 text-xs font-pixel text-center ${
              statusMessage.startsWith("✨")
                ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                : "bg-rose-950/80 border-rose-600 text-rose-300"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Submit Button */}
        <PixelButton
          type="submit"
          variant="primary"
          size="lg"
          isLoading={logMutation.isPending}
          disabled={!selectedSkillId || minutes <= 0}
          className="w-full mt-1"
        >
          ⚔️ Log Activity ({minutes} min)
        </PixelButton>
      </form>
    </PixelCard>
  );
};

