"use client";

import React from "react";

export type PixelCardVariant = "default" | "sunken" | "highlight" | "tier-thriving" | "tier-neutral" | "tier-weakened";

export interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerRight?: React.ReactNode;
  variant?: PixelCardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<PixelCardVariant, string> = {
  default: "pixel-box bg-[#121826] text-gray-100",
  sunken: "pixel-box-sunken bg-[#0b0f19] text-gray-200",
  highlight:
    "pixel-box bg-[#151c2d] text-gray-100 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
  "tier-thriving":
    "pixel-box bg-[#0d1a18] border-emerald-900 text-gray-100 ring-1 ring-emerald-500/40",
  "tier-neutral":
    "pixel-box bg-[#1c180e] border-amber-900 text-gray-100 ring-1 ring-amber-500/40",
  "tier-weakened":
    "pixel-box bg-[#1c0f0f] border-rose-900 text-gray-100 ring-1 ring-rose-500/40",
};

const paddingStyles = {
  none: "p-0",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6 sm:p-7",
};

export const PixelCard: React.FC<PixelCardProps> = ({
  children,
  title,
  headerRight,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}) => {
  return (
    <div
      className={`
        relative rounded-none
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {/* Optional decorative corner pixels */}
      <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-black pointer-events-none" />
      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-black pointer-events-none" />
      <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-black pointer-events-none" />
      <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-black pointer-events-none" />

      {(title || headerRight) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/60">
          {title && (
            <h3 className="font-pixel text-xs sm:text-sm tracking-wider uppercase text-purple-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-purple-500" />
              {title}
            </h3>
          )}
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}

      {children}
    </div>
  );
};

