"use client";

import { useState } from "react";
import { Search, Mic } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { VoiceInputModal } from "@/components/expenses/VoiceInputModal";

export function Navbar() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-emerald-900/20 bg-white/80 dark:bg-[#050508]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 transition-all duration-500">
        {/* Neon bottom glow line (dark only) */}
        <div className="absolute bottom-0 left-0 right-0 h-px hidden dark:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />
        
        <div className="flex items-center flex-1 gap-3">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-emerald-800" />
            <input
              type="text"
              placeholder="Search expenses, categories..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30 border-transparent focus:bg-white dark:focus:bg-emerald-500/10 focus:border-blue-500 dark:focus:border-emerald-500/50 focus:ring-2 focus:ring-blue-200 dark:focus:ring-emerald-500/20 rounded-lg text-sm transition-all outline-none text-slate-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-emerald-900"
            />
          </div>

          {/* Voice Input Trigger Control */}
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all group"
            title="Log via Voice Command"
          >
            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Voice Entry</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      {/* Feature 4 Voice Entry Overlay Modal */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </>
  );
}
