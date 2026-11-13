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
      padding="md"
      className={`w-full max-w-lg mx-auto ${className}`}
    >
      <form onSubmit={handleLog} className="flex flex-col gap-5 font-sans">
        {/* 1. Skill Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Select Practice / Skill:
          </label>

          {isLoadingSkills ? (
            <div className="text-xs text-zinc-500 py-2">Loading skills...</div>
          ) : !skills || skills.length === 0 ? (
            <div className="text-xs text-amber-400 py-2">No skills available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {skills.map((skill) => {
                const isSelected = skill.id === selectedSkillId;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={`
                      text-left p-3 text-xs transition-colors cursor-pointer select-none border-b
                      ${
                        isSelected
                          ? "bg-zinc-900 border-b-2 border-b-[#b026ff] text-white font-medium"
                          : "bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 text-zinc-400"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-white">{skill.name}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 uppercase font-medium text-zinc-400"
                      >
                        {skill.kingdom?.name || "Skill"}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 font-sans">
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
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
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
                  py-1.5 text-xs border cursor-pointer select-none font-medium transition-colors
                  ${
                    minutes === preset
                      ? "bg-zinc-900 border-white text-white font-bold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
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
              className="w-full accent-[#b026ff] cursor-pointer h-1.5 bg-zinc-900 rounded-none border-none"
            />
            <input
              type="number"
              min="1"
              max="600"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
              className="w-16 p-1.5 bg-zinc-950 border border-zinc-800 text-center font-pixel text-xs text-white"
            />
          </div>
        </div>

        {/* Optional Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Quest / Activity Note (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g., Solved LeetCode tree problems"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            className="w-full p-2 bg-[#0a0a0a] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#b026ff] font-sans"
          />
        </div>

        {/* Reward Preview */}
        {selectedSkill && (
          <div className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 flex justify-between items-center">
            <span className="font-medium text-zinc-500 text-[10px] uppercase">EST. REWARD:</span>
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
                ? "bg-zinc-950 border-emerald-500/50 text-emerald-400"
                : "bg-zinc-950 border-rose-500/50 text-rose-400"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" strokeWidth={2} />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Submit Button */}
        <PixelButton
          type="submit"
          variant="primary"
          size="md"
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
