"use client";

import React from "react";

export type PixelButtonVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "neutral";

export type PixelButtonSize = "sm" | "md" | "lg";

export interface PixelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<PixelButtonVariant, string> = {
  primary:
    "bg-purple-600 hover:bg-purple-500 text-white border-black active:bg-purple-700",
  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white border-black active:bg-emerald-700",
  danger:
    "bg-rose-600 hover:bg-rose-500 text-white border-black active:bg-rose-700",
  warning:
    "bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold border-black active:bg-amber-600",
  neutral:
    "bg-slate-800 hover:bg-slate-700 text-slate-200 border-black active:bg-slate-900",
};

const sizeClasses: Record<PixelButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs min-h-[36px]",
  md: "px-5 py-2.5 text-sm min-h-[44px]",
  lg: "px-6 py-3.5 text-base min-h-[52px]",
};

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon,
  className = "",
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        pixel-btn
        inline-flex items-center justify-center gap-2
        cursor-pointer font-pixel tracking-wide
        select-none uppercase text-center
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin mr-1">⌛</span>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

