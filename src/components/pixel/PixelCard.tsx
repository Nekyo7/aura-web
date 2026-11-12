"use client";

import React from "react";

export type PixelCardVariant =
  | "default"
  | "highlight"
  | "sunken"
  | "tier-thriving"
  | "tier-neutral"
  | "tier-weakened";

export type PixelCardTitleBarColor =
  | "purple"
  | "white"
  | "gold"
  | "green"
  | "red"
  | "neutral";

export interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  titleBar?: boolean | string;
  titleBarColor?: PixelCardTitleBarColor;
  headerRight?: React.ReactNode;
  variant?: PixelCardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<
  PixelCardVariant,
  { container: string; accentColor: string; dotColor: string }
> = {
  default: {
    container: "border border-[#333333] border-t-2 border-t-[#b026ff] bg-[#0A0A0A] text-white",
    accentColor: "text-[#b026ff]",
    dotColor: "bg-[#b026ff]",
  },
  highlight: {
    container: "border border-[#333333] border-t-2 border-t-white bg-[#0A0A0A] text-white",
    accentColor: "text-white",
    dotColor: "bg-white",
  },
  sunken: {
    container: "border border-[#262626] border-t-2 border-t-neutral-600 bg-[#060606] text-neutral-300",
    accentColor: "text-neutral-400",
    dotColor: "bg-neutral-500",
  },
  "tier-thriving": {
    container: "border border-[#333333] border-t-2 border-t-[#00ff66] bg-[#0A0A0A] text-white",
    accentColor: "text-[#00ff66]",
    dotColor: "bg-[#00ff66]",
  },
  "tier-neutral": {
    container: "border border-[#333333] border-t-2 border-t-[#ffc600] bg-[#0A0A0A] text-white",
    accentColor: "text-[#ffc600]",
    dotColor: "bg-[#ffc600]",
  },
  "tier-weakened": {
    container: "border border-[#333333] border-t-2 border-t-[#ff3344] bg-[#0A0A0A] text-white",
    accentColor: "text-[#ff3344]",
    dotColor: "bg-[#ff3344]",
  },
};

const titleBarColorMap: Record<PixelCardTitleBarColor, { text: string; dot: string }> = {
  purple: { text: "text-[#b026ff]", dot: "bg-[#b026ff]" },
  white: { text: "text-white", dot: "bg-white" },
  gold: { text: "text-[#ffc600]", dot: "bg-[#ffc600]" },
  green: { text: "text-[#00ff66]", dot: "bg-[#00ff66]" },
  red: { text: "text-[#ff3344]", dot: "bg-[#ff3344]" },
  neutral: { text: "text-neutral-300", dot: "bg-neutral-400" },
};

const paddingStyles = {
  none: "p-0",
  sm: "p-2 sm:p-2.5",
  md: "p-3 sm:p-4",
  lg: "p-4 sm:p-5",
};

export const PixelCard: React.FC<PixelCardProps> = ({
  children,
  title,
  titleBar,
  titleBarColor,
  headerRight,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}) => {
  const currentVariant = variantStyles[variant] ?? variantStyles.default;
  const titleText = typeof titleBar === "string" ? titleBar : title;
  const showTitleBar = Boolean(titleBar || title);

  const colors = titleBarColor
    ? titleBarColorMap[titleBarColor]
    : { text: currentVariant.accentColor, dot: currentVariant.dotColor };

  return (
    <div
      className={`
        relative rounded-none shadow-none overflow-hidden
        ${currentVariant.container}
        ${className}
      `}
      {...props}
    >
      {/* Sleek Noctra Terminal Title Bar */}
      {showTitleBar && (
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-[#222222] bg-[#0e0e0e] select-none">
          <div className="flex items-center gap-2 font-pixel text-xs font-bold uppercase tracking-wider truncate">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
            <span className="text-neutral-200 truncate">{titleText}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {headerRight ? (
              <div>{headerRight}</div>
            ) : (
              <div className="flex items-center gap-1 opacity-50">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body content with refined Noctra mobile padding */}
      <div className={paddingStyles[padding]}>
        {children}
      </div>
    </div>
  );
};
