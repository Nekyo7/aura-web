"use client";

import React from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";

export default function HomePage() {
  const { data: session, status } = useSession();

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/character" });
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 flex flex-col justify-between max-w-md mx-auto p-4 sm:p-6 relative overflow-hidden border-x border-slate-900 shadow-2xl">
      {/* Background Decorative Pixel Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-12 left-8 w-1 h-1 bg-white animate-pulse" />
        <div className="absolute top-28 right-12 w-1.5 h-1.5 bg-purple-400 animate-ping" />
        <div className="absolute top-64 left-1/4 w-1 h-1 bg-amber-300 animate-pulse" />
        <div className="absolute bottom-40 right-1/3 w-1.5 h-1.5 bg-cyan-300 animate-pulse" />
        <div className="absolute bottom-16 left-12 w-1 h-1 bg-emerald-400 animate-ping" />
      </div>

      {/* 1. TOP STATUS BADGE */}
      <header className="flex justify-between items-center py-2 select-none relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-950 border border-purple-500 flex items-center justify-center text-xs">
            ✨
          </div>
          <span className="font-pixel text-xs tracking-wider text-purple-300 font-bold">
            AURA OS
          </span>
        </div>
        <div className="px-2 py-0.5 bg-[#121826] border border-black font-pixel text-[10px] text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
          <span>REAL-TIME ENGINE</span>
        </div>
      </header>

      {/* 2. HERO LOGO & TITLE SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-6 relative z-10">
        {/* Glowing Pixel Icon Box */}
        <div className="w-20 h-20 bg-purple-950/90 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.3),inset_-2px_-2px_0_rgba(0,0,0,0.6),0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center text-4xl mb-4 select-none">
          🧙‍♂️
        </div>

        <h1 className="font-pixel text-3xl sm:text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-amber-200 pixel-text-shadow mb-2">
          A U R A
        </h1>

        <div className="font-pixel text-xs uppercase tracking-widest text-purple-400 font-bold mb-4">
          LIFE OPERATING SYSTEM
        </div>

        <PixelCard variant="sunken" padding="sm" className="max-w-xs mb-6 text-center">
          <p className="font-pixel text-[11px] text-gray-300 leading-relaxed">
            &ldquo;You don&apos;t just play the character, you become the character through what you do in real life.&rdquo;
          </p>
        </PixelCard>

        {/* 4 Feature Pillars Grid */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-6 text-left">
          <div className="p-2 bg-[#0e1422] border border-black flex flex-col font-pixel">
            <span className="text-[10px] text-emerald-400 font-bold">🩸 VITALITY</span>
            <span className="text-[9px] text-gray-400 font-sans mt-0.5">Automated HP, zero chores</span>
          </div>
          <div className="p-2 bg-[#0e1422] border border-black flex flex-col font-pixel">
            <span className="text-[10px] text-amber-400 font-bold">⚔️ 19 RANKS</span>
            <span className="text-[9px] text-gray-400 font-sans mt-0.5">Origin I to 10k hr Kanye</span>
          </div>
          <div className="p-2 bg-[#0e1422] border border-black flex flex-col font-pixel">
            <span className="text-[10px] text-purple-400 font-bold">🏰 7 REALMS</span>
            <span className="text-[9px] text-gray-400 font-sans mt-0.5">Deep life domain mapping</span>
          </div>
          <div className="p-2 bg-[#0e1422] border border-black flex flex-col font-pixel">
            <span className="text-[10px] text-cyan-400 font-bold">🛡️ ZERO GUILT</span>
            <span className="text-[9px] text-gray-400 font-sans mt-0.5">Hours & ranks never decay</span>
          </div>
        </div>

        {/* 3. CALL TO ACTION / LOGIN */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          {status === "authenticated" && session?.user ? (
            <div className="flex flex-col gap-2">
              <div className="font-pixel text-xs text-purple-300 mb-1">
                Active Session: <span className="text-white font-bold">{session.user.name || session.user.email}</span>
              </div>
              <Link href="/character" className="w-full">
                <PixelButton variant="primary" size="lg" className="w-full">
                  CONTINUE JOURNEY ▶
                </PixelButton>
              </Link>
            </div>
          ) : (
            <PixelButton
              variant="warning"
              size="lg"
              onClick={handleGoogleSignIn}
              isLoading={status === "loading"}
              className="w-full shadow-[0_4px_0_#000,0_0_15px_rgba(245,158,11,0.3)]"
            >
              <span className="text-base mr-1">⚡</span>
              <span>ENTER WITH GOOGLE</span>
            </PixelButton>
          )}

          <div className="text-[10px] font-pixel text-gray-500 mt-1">
            Free to play • PWA Offline Ready • Instant ACID Ledger
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="text-center py-2 border-t border-black/40 text-[10px] font-pixel text-gray-600 select-none relative z-10">
        AURA Life OS • Alpha Build v0.1.0
      </footer>
    </div>
  );
}
