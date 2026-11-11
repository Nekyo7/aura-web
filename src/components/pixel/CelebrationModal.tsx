"use client";

import React from "react";
import { useCelebrationStore } from "@/client/stores/celebration.store";
import { PixelButton } from "./PixelButton";
import { motion, AnimatePresence } from "framer-motion";

export const CelebrationModal: React.FC = () => {
  const current = useCelebrationStore((state) => state.current);
  const next = useCelebrationStore((state) => state.next);

  if (!current) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full max-w-sm pixel-box bg-[#151a28] p-6 text-center border-4 border-amber-400 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.4)]"
        >
          {/* Top banner / icon */}
          <div className="text-4xl sm:text-5xl mb-3 animate-bounce select-none">
            {current.type === "LEVEL_UP" && "👑"}
            {current.type === "RANK_UP" && "⚔️"}
            {current.type === "QUEST_COMPLETE" && "📜"}
            {current.type === "ACHIEVEMENT" && "🏆"}
          </div>

          <h2 className="font-pixel text-base sm:text-lg text-amber-300 font-bold tracking-wider uppercase mb-2 pixel-text-shadow">
            {current.title}
          </h2>

          {current.description && (
            <p className="font-pixel text-xs text-gray-200 mb-6 leading-relaxed">
              {current.description}
            </p>
          )}

          {/* AP Reward Callout if any */}
          {typeof current.data?.apGained === "number" && (
            <div className="mb-6 p-2 bg-purple-950/80 border-2 border-purple-500/80 flex items-center justify-center gap-2">
              <span className="text-sm">🔮</span>
              <span className="font-pixel text-xs text-purple-300 font-bold">
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
            CLAIM & CONTINUE ▶
          </PixelButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
