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
    bg: "bg-black",
    fill: "bg-gradient-to-r from-[#ff3344] to-[#ff2a85]",
    border: "border-[#ff3344]",
  },
  xp: {
    bg: "bg-black",
    fill: "bg-gradient-to-r from-[#b026ff] to-[#00e5ff]",
    border: "border-[#b026ff]",
  },
  "tier-thriving": {
    bg: "bg-black",
    fill: "bg-gradient-to-r from-[#00ff66] to-[#00e5ff]",
    border: "border-[#00ff66]",
  },
  "tier-neutral": {
    bg: "bg-black",
    fill: "bg-gradient-to-r from-[#ffc600] to-[#ff9900]",
    border: "border-[#ffc600]",
  },
  "tier-weakened": {
    bg: "bg-black",
    fill: "bg-gradient-to-r from-[#ff3344] to-[#cc0022]",
    border: "border-[#ff3344]",
  },
  ap: {
    bg: "bg-black",
    fill: "bg-gradient-to-r from-[#b026ff] to-[#9900ff]",
    border: "border-[#b026ff]",
  },
  custom: {
    bg: "bg-black",
    fill: "bg-[#b026ff]",
    border: "border-neutral-700",
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

      {/* Bar Frame with Sleek Noctra Bevel */}
      <div
        className={`
          relative w-full overflow-hidden border border-[#333333]
          bg-[#050505] rounded-none shadow-none
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

