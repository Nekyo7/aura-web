"use client";

import React from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";
import {
  Sparkles,
  Terminal,
  Activity,
  Award,
  Globe,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/character" });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between max-w-md mx-auto p-4 sm:p-5 relative overflow-hidden border-x border-[#222222] shadow-none">
      {/* Background Decorative Ambient Points */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-16 left-8 w-1 h-1 bg-white animate-pulse" />
        <div className="absolute top-28 right-12 w-1.5 h-1.5 bg-[#b026ff] animate-ping" />
        <div className="absolute top-64 left-1/4 w-1 h-1 bg-[#ffc600] animate-pulse" />
        <div className="absolute bottom-40 right-1/3 w-1.5 h-1.5 bg-[#00e5ff] animate-pulse" />
        <div className="absolute bottom-16 left-12 w-1 h-1 bg-[#00ff66] animate-ping" />
      </div>

      {/* 1. TOP STATUS BADGE */}
      <header className="flex justify-between items-center py-2 select-none relative z-10 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0a0a0a] border border-[#333333] flex items-center justify-center text-[#b026ff]">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          </div>
          <span className="font-pixel text-xs tracking-wider text-[#b026ff] font-bold">
            AURA OS
          </span>
        </div>
        <div className="px-2 py-0.5 bg-[#0a0a0a] border border-[#222222] font-sans text-[10px] text-[#00ff66] flex items-center gap-1.5 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
          <span>REAL-TIME ENGINE</span>
        </div>
      </header>

      {/* 2. HERO LOGO & TITLE SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-6 relative z-10">
        {/* Sleek Noctra Icon Box */}
        <div className="w-14 h-14 bg-[#0a0a0a] border border-[#333333] border-t-2 border-t-[#b026ff] flex items-center justify-center mb-3 select-none">
          <Terminal className="w-7 h-7 text-[#b026ff]" strokeWidth={1.5} />
        </div>

        <h1 className="font-pixel text-3xl sm:text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#b026ff] via-white to-[#ffc600] mb-1">
          A U R A
        </h1>

        <div className="font-sans text-xs uppercase tracking-widest text-[#b026ff] font-semibold mb-4">
          Life Operating System
        </div>

        <PixelCard variant="default" title="TERMINAL PROMPT" padding="md" className="max-w-xs mb-6 text-center">
          <p className="font-sans text-xs text-zinc-400 leading-relaxed">
            &ldquo;You don&apos;t just play the character, you become the character through what you do in real life.&rdquo;
          </p>
        </PixelCard>

        {/* 4 Feature Pillars Grid - Clean Borderless Rows */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6 text-left">
          <div className="p-2.5 bg-zinc-950/70 border-b border-zinc-800 flex flex-col">
            <span className="text-xs text-emerald-400 font-medium font-sans uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} /> VITALITY
            </span>
            <span className="text-[11px] text-zinc-500 font-sans mt-0.5">Automated HP, zero chores</span>
          </div>
          <div className="p-2.5 bg-zinc-950/70 border-b border-zinc-800 flex flex-col">
            <span className="text-xs text-amber-400 font-medium font-sans uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} /> 19 RANKS
            </span>
            <span className="text-[11px] text-zinc-500 font-sans mt-0.5">Origin I to 10k hr Kanye</span>
          </div>
          <div className="p-2.5 bg-zinc-950/70 border-b border-zinc-800 flex flex-col">
            <span className="text-xs text-[#b026ff] font-medium font-sans uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#b026ff]" strokeWidth={1.5} /> 7 REALMS
            </span>
            <span className="text-[11px] text-zinc-500 font-sans mt-0.5">Deep life domain mapping</span>
          </div>
          <div className="p-2.5 bg-zinc-950/70 border-b border-zinc-800 flex flex-col">
            <span className="text-xs text-cyan-400 font-medium font-sans uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.5} /> ZERO GUILT
            </span>
            <span className="text-[11px] text-zinc-500 font-sans mt-0.5">Hours & ranks never decay</span>
          </div>
        </div>

        {/* 3. CALL TO ACTION / LOGIN */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          {status === "authenticated" && session?.user ? (
            <div className="flex flex-col gap-2">
              <div className="font-sans text-xs text-[#b026ff] mb-1">
                Active Session: <span className="text-white font-bold">{session.user.name || session.user.email}</span>
              </div>
              <Link href="/character" className="w-full">
                <PixelButton variant="primary" size="lg" className="w-full" icon={<ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />}>
                  CONTINUE JOURNEY
                </PixelButton>
              </Link>
            </div>
          ) : (
            <PixelButton
              variant="warning"
              size="lg"
              onClick={handleGoogleSignIn}
              isLoading={status === "loading"}
              className="w-full"
              icon={<Zap className="w-4 h-4 text-black" strokeWidth={2} />}
            >
              ENTER WITH GOOGLE
            </PixelButton>
          )}

          <div className="text-[10px] font-sans text-neutral-500 mt-1">
            Free to play • PWA Offline Ready • Instant ACID Ledger
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="text-center py-2.5 border-t border-[#222222] text-[10px] font-sans text-neutral-600 select-none relative z-10">
        AURA Life OS • Noctra Terminal v2.0
      </footer>
    </div>
  );
}
