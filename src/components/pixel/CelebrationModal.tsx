"use client";

import React from "react";
import { useCelebrationStore } from "@/client/stores/celebration.store";
import { PixelButton } from "./PixelButton";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Award, Scroll, Trophy, Sparkles } from "lucide-react";

export const CelebrationModal: React.FC = () => {
  const current = useCelebrationStore((state) => state.current);
  const next = useCelebrationStore((state) => state.next);

  if (!current) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-sm bg-[#0a0a0a] p-6 text-center border border-[#333333] border-t-2 border-t-[#ffc600] relative overflow-hidden shadow-none"
        >
          {/* Top banner monochrome icon */}
          <div className="flex justify-center mb-3 select-none">
            {current.type === "LEVEL_UP" && (
              <Crown className="w-12 h-12 text-[#ffc600]" strokeWidth={1.5} />
            )}
            {current.type === "RANK_UP" && (
              <Award className="w-12 h-12 text-[#00ff66]" strokeWidth={1.5} />
            )}
            {current.type === "QUEST_COMPLETE" && (
              <Scroll className="w-12 h-12 text-[#00e5ff]" strokeWidth={1.5} />
            )}
            {current.type === "ACHIEVEMENT" && (
              <Trophy className="w-12 h-12 text-[#b026ff]" strokeWidth={1.5} />
            )}
          </div>

          <h2 className="font-pixel text-base sm:text-lg text-yellow-300 font-bold tracking-wider uppercase mb-2">
            {current.title}
          </h2>

          {current.description && (
            <p className="font-sans text-xs text-neutral-300 mb-5 leading-relaxed">
              {current.description}
            </p>
          )}

          {/* AP Reward Callout if any */}
          {typeof current.data?.apGained === "number" && (
            <div className="mb-5 p-2 bg-[#0e0e0e] border border-[#b026ff]/60 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b026ff]" strokeWidth={1.5} />
              <span className="font-sans text-xs text-[#b026ff] font-semibold">
                +{current.data.apGained} Aura Points
              </span>
            </div>
          )}

          <PixelButton
            variant="warning"
            size="md"
            onClick={() => next()}
            className="w-full"
          >
            CLAIM & CONTINUE
          </PixelButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
