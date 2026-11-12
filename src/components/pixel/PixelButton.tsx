"use client";

import React from "react";
import { Loader2 } from "lucide-react";

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
    "bg-[#b026ff] text-black border border-[#b026ff] hover:bg-black hover:text-[#b026ff] active:bg-black active:text-[#b026ff]",
  neutral:
    "bg-white text-black border border-white hover:bg-black hover:text-white active:bg-black active:text-white",
  warning:
    "bg-[#ffc600] text-black border border-[#ffc600] hover:bg-black hover:text-[#ffc600] active:bg-black active:text-[#ffc600]",
  success:
    "bg-[#00ff66] text-black border border-[#00ff66] hover:bg-black hover:text-[#00ff66] active:bg-black active:text-[#00ff66]",
  danger:
    "bg-[#ff3344] text-black border border-[#ff3344] hover:bg-black hover:text-[#ff3344] active:bg-black active:text-[#ff3344]",
};

const sizeClasses: Record<PixelButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs min-h-[34px]",
  md: "px-3.5 py-2 text-xs sm:text-sm min-h-[40px]",
  lg: "px-4.5 py-2.5 text-sm min-h-[44px]",
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
        rounded-none shadow-none
        inline-flex items-center justify-center gap-1.5
        cursor-pointer font-sans font-bold tracking-wider
        select-none uppercase text-center
        transition-colors duration-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || isLoading ? "opacity-35 cursor-not-allowed pointer-events-none" : ""}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 shrink-0" strokeWidth={2} />
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
