"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CelebrationModal } from "@/components/pixel/CelebrationModal";
import {
  User,
  Zap,
  Scroll,
  Globe,
  ShoppingBag,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/character", label: "HERO", icon: User },
  { href: "/skills", label: "SKILLS", icon: Zap },
  { href: "/quests", label: "QUESTS", icon: Scroll },
  { href: "/kingdoms", label: "REALMS", icon: Globe },
  { href: "/shop", label: "SHOP", icon: ShoppingBag },
];

export interface GameShellProps {
  children: React.ReactNode;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const GameShell: React.FC<GameShellProps> = ({ children, user }) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between max-w-md mx-auto relative border-x border-[#222222] shadow-none">
      {/* 1. TOP HUD (Title, Tier beacon) */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#222222] border-t-2 border-t-[#b026ff] px-3.5 py-2.5 flex items-center justify-between">
        <Link href="/character" className="flex items-center gap-2 select-none group">
          <div className="w-7 h-7 bg-[#0a0a0a] border border-[#333333] flex items-center justify-center text-[#b026ff]">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-sm font-bold tracking-wider text-white group-hover:text-[#b026ff]">
              AURA
            </span>
            <span className="text-[9px] font-sans text-neutral-400 -mt-0.5 tracking-widest uppercase font-semibold">
              Life OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/chronicle"
            className="flex items-center gap-1.5 px-2 py-1 bg-[#0a0a0a] border border-[#333333] text-[10px] font-sans font-semibold text-neutral-300 hover:text-white hover:border-[#ffc600] transition-colors"
            title="Read Weekly Chronicle"
          >
            <BookOpen className="w-3 h-3 text-[#ffc600]" strokeWidth={1.5} />
            <span className="hidden sm:inline">CHRONICLE</span>
          </Link>
          {/* Active Vitality pulse */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0a0a0a] border border-[#222222] text-[10px] font-sans font-medium text-[#00ff66]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
            <span className="font-semibold tracking-wider">ONLINE</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 p-4 sm:p-5 pb-28 overflow-y-auto">
        {children}
      </main>

      {/* 3. RETRO TERMINAL BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#222222] max-w-md mx-auto">
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 select-none transition-colors border-r border-[#1a1a1a] last:border-r-0
                  ${
                    isActive
                      ? "bg-[#b026ff] text-black font-bold"
                      : "text-neutral-400 hover:text-white hover:bg-[#121212]"
                  }
                `}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-sans text-[10px] tracking-wider uppercase font-semibold">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 4. CELEBRATION OVERLAY */}
      <CelebrationModal />
    </div>
  );
};
