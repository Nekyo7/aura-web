"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CelebrationModal } from "@/components/pixel/CelebrationModal";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/character", label: "HERO", icon: "👤" },
  { href: "/skills", label: "SKILLS", icon: "⚔️" },
  { href: "/quests", label: "QUESTS", icon: "📜" },
  { href: "/kingdoms", label: "REALMS", icon: "🏰" },
  { href: "/shop", label: "SHOP", icon: "🛍️" },
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
    <div className="min-h-screen bg-[#070b12] text-gray-100 flex flex-col justify-between max-w-md mx-auto relative border-x border-slate-900 shadow-2xl">
      {/* 1. TOP HUD (Title, Tier beacon) */}
      <header className="sticky top-0 z-40 bg-[#0d131f]/95 backdrop-blur-xs border-b-2 border-black px-4 py-2.5 flex items-center justify-between">
        <Link href="/character" className="flex items-center gap-2 select-none group">
          <div className="w-7 h-7 bg-purple-950 border-2 border-purple-500 flex items-center justify-center text-sm shadow-[0_0_8px_rgba(168,85,247,0.4)]">
            ✨
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-sm font-bold tracking-wider text-purple-300 group-hover:text-purple-200">
              AURA
            </span>
            <span className="text-[9px] font-pixel text-gray-400 -mt-1 tracking-widest">
              LIFE OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/chronicle"
            className="flex items-center gap-1 px-2 py-1 bg-amber-950/70 border border-amber-600/80 text-[10px] font-pixel text-amber-300 hover:bg-amber-900/80 transition-colors shadow-xs"
            title="Read Weekly Chronicle"
          >
            <span>📖</span>
            <span className="hidden sm:inline">CHRONICLE</span>
          </Link>
          {/* Active Vitality pulse */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#121826] border border-black text-[10px] font-pixel">
            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 p-3 sm:p-4 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* 3. RETRO BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d131f] border-t-2 border-black max-w-md mx-auto">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 select-none transition-colors border-r border-black/40 last:border-r-0
                  ${
                    isActive
                      ? "bg-purple-950/80 text-purple-300 shadow-[inset_0_3px_0_#a855f7]"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#151c2d]"
                  }
                `}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="font-pixel text-[9px] tracking-wider font-bold">
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

