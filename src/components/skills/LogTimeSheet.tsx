"use client";

import React, { useState } from "react";
import { trpc } from "@/client/trpc";
import { useLogActivity } from "@/client/hooks/useLogActivity";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";
import { Clock, Check, AlertTriangle } from "lucide-react";

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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

    setFeedback(null);
    try {
      const result = await logMutation.mutateAsync({
        skillId: selectedSkillId,
        minutes: Number(minutes),
        idempotencyKey: generateUUID(),
        note: note.trim() || undefined,
      });

      setFeedback({
        type: "success",
        text: `Logged ${minutes}m! Gained +${result.xpAwarded} XP`,
      });
      setNote("");
      if (onSuccess) onSuccess();

      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to log activity",
      });
    }
  };

  return (
    <PixelCard
      title="Log Life Action"
      variant="default"
      className={`w-full max-w-lg mx-auto ${className}`}
    >
      <form onSubmit={handleLog} className="flex flex-col gap-4 font-sans">
        {/* 1. Skill Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
            Select Practice / Skill:
          </label>

          {isLoadingSkills ? (
            <div className="text-xs text-neutral-400 py-2">Loading skills...</div>
          ) : !skills || skills.length === 0 ? (
            <div className="text-xs text-amber-400 py-2">No skills available.</div>
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
                      text-left p-2.5 border text-xs transition-colors cursor-pointer select-none
                      ${
                        isSelected
                          ? "bg-[#0e0e0e] border-[#b026ff] border-t-2 border-t-[#b026ff] text-white font-bold"
                          : "bg-[#0a0a0a] border-[#222222] hover:border-neutral-500 text-neutral-300"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold">{skill.name}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 border border-[#222222] uppercase font-semibold text-white"
                        style={{ backgroundColor: `${skill.kingdom?.colorHex}30` || "#3b82f630" }}
                      >
                        {skill.kingdom?.name || "Skill"}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-sans">
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
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
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
                  py-2 text-xs border cursor-pointer select-none font-semibold transition-colors
                  ${
                    minutes === preset
                      ? "bg-[#141414] border-white text-white font-bold"
                      : "bg-[#0a0a0a] border-[#222222] text-neutral-400 hover:border-neutral-500"
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
              className="w-full accent-[#b026ff] cursor-pointer h-2 bg-[#141414] rounded-none border border-[#222222]"
            />
            <input
              type="number"
              min="1"
              max="600"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
              className="w-16 p-1.5 bg-[#0a0a0a] border border-[#333333] text-center font-pixel text-xs text-white"
            />
          </div>
        </div>

        {/* Optional Note */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
            Quest / Activity Note (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g., Solved LeetCode tree problems"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            className="w-full p-2 bg-[#0a0a0a] border border-[#333333] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#b026ff] font-sans"
          />
        </div>

        {/* Reward Preview */}
        {selectedSkill && (
          <div className="p-2.5 bg-[#0e0e0e] border border-[#222222] text-xs text-neutral-300 flex justify-between items-center">
            <span className="font-semibold text-neutral-400 text-[10px] uppercase">EST. REWARD:</span>
            <div className="flex items-center gap-3 font-pixel text-xs">
              <span className="text-purple-400 font-bold">+{minutes * 10} XP</span>
              <span className="text-amber-400 font-bold">+{((minutes / 60) * 60).toFixed(0)} ATTR PTS</span>
            </div>
          </div>
        )}

        {/* Status Toast / Feedback */}
        {feedback && (
          <div
            className={`p-2.5 border text-xs font-sans text-center flex items-center justify-center gap-2 ${
              feedback.type === "success"
                ? "bg-[#0a0a0a] border-[#00ff66]/70 text-[#00ff66]"
                : "bg-[#0a0a0a] border-[#ff3344]/70 text-[#ff3344]"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-3.5 h-3.5 text-[#00ff66]" strokeWidth={2} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff3344]" strokeWidth={2} />
            )}
            <span>{feedback.text}</span>
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
          icon={<Clock className="w-4 h-4 text-black mr-1" strokeWidth={2} />}
        >
          Log Activity ({minutes} min)
        </PixelButton>
      </form>
    </PixelCard>
  );
};
