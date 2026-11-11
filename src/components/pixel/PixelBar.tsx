"use client";

import React from "react";
import { motion } from "framer-motion";

export type PixelBarVariant =
  | "hp"
  | "xp"
  | "tier-thriving"
  | "tier-neutral"
  | "tier-weakened"
  | "ap"
  | "custom";

export interface PixelBarProps {
  value: number;
  max: number;
  label?: string;
  sublabel?: string;
  showValueText?: boolean;
  variant?: PixelBarVariant;
  customColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorVariants: Record<PixelBarVariant, { bg: string; fill: string; border: string }> = {
  hp: {
    bg: "bg-red-950/60",
    fill: "bg-gradient-to-r from-red-600 to-rose-500",
    border: "border-red-900/60",
  },
  xp: {
    bg: "bg-purple-950/60",
    fill: "bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400",
    border: "border-purple-900/60",
  },
  "tier-thriving": {
    bg: "bg-emerald-950/60",
    fill: "bg-gradient-to-r from-emerald-600 to-teal-400",
    border: "border-emerald-900/60",
  },
  "tier-neutral": {
    bg: "bg-amber-950/60",
    fill: "bg-gradient-to-r from-amber-600 to-yellow-400",
    border: "border-amber-900/60",
  },
  "tier-weakened": {
    bg: "bg-rose-950/60",
    fill: "bg-gradient-to-r from-rose-700 to-red-500",
    border: "border-rose-900/60",
  },
  ap: {
    bg: "bg-indigo-950/60",
    fill: "bg-gradient-to-r from-indigo-500 to-purple-400",
    border: "border-indigo-900/60",
  },
  custom: {
    bg: "bg-slate-950/60",
    fill: "bg-purple-500",
    border: "border-slate-800",
  },
};

const sizeStyles = {
  sm: "h-3 text-[10px]",
  md: "h-5 text-xs",
  lg: "h-7 text-xs sm:text-sm",
};

export const PixelBar: React.FC<PixelBarProps> = ({
  value,
  max,
  label,
  sublabel,
  showValueText = true,
  variant = "xp",
  customColor,
  size = "md",
  className = "",
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  const colors = colorVariants[variant];

  // Auto-adapt HP color to tier if variant is 'hp'
  let activeFill = colors.fill;
  if (variant === "hp") {
    if (percentage >= 80) {
      activeFill = colorVariants["tier-thriving"].fill;
    } else if (percentage >= 40) {
      activeFill = colorVariants["tier-neutral"].fill;
    } else {
      activeFill = colorVariants["tier-weakened"].fill;
    }
  } else if (customColor) {
    activeFill = customColor;
  }

  return (
    <div className={`w-full flex flex-col gap-1 font-pixel ${className}`}>
      {(label || showValueText) && (
        <div className="flex justify-between items-baseline text-xs text-gray-300">
          <div className="flex items-center gap-1.5">
            {label && <span className="uppercase tracking-wider font-bold">{label}</span>}
            {sublabel && <span className="text-[10px] text-gray-400 font-sans">({sublabel})</span>}
          </div>
          {showValueText && (
            <span className="text-[11px] text-gray-200 tabular-nums">
              {Math.round(value)} / {max}
            </span>
          )}
        </div>
      )}

      {/* Bar Frame with Sunken Pixel Bevel */}
      <div
        className={`
          relative w-full overflow-hidden border-2 border-black
          bg-[#070b12] shadow-[inset_2px_2px_0_0_#000,inset_-1px_-1px_0_0_rgba(255,255,255,0.1)]
          ${sizeStyles[size]}
        `}
      >
        {/* Animated Stepped Bar Fill */}
        <motion.div
          className={`h-full ${activeFill} relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 120,
          }}
        >
          {/* Stepped Pixel Segment Lines Pattern */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 6px, #000 6px, #000 8px)",
            }}
          />
          {/* Top highlight line for 3D glassy retro arcade look */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/40 pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
};

