"use client";

import { useState } from "react";
import { Search, Mic, Zap } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { VoiceInputModal } from "@/components/expenses/VoiceInputModal";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export function Navbar() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-emerald-900/20 bg-white/80 dark:bg-[#050508]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 transition-all duration-500 gap-3">
        {/* Neon bottom glow line (dark only) */}
        <div className="absolute bottom-0 left-0 right-0 h-px hidden dark:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />

        {/* Left: Hamburger (mobile) + Logo (mobile) + Search (desktop) */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Mobile hamburger */}
          <MobileSidebar />

          {/* Mobile logo (only shown on mobile, hidden on desktop where sidebar shows it) */}
          <div className="flex items-center gap-1.5 font-bold lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-transparent dark:border dark:border-emerald-500/50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white dark:text-emerald-400" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-emerald-300">SmartExpense</span>
          </div>

          {/* Desktop search bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-emerald-800" />
            <input
              type="text"
              placeholder="Search expenses, categories..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30 border-transparent focus:bg-white dark:focus:bg-emerald-500/10 focus:border-blue-500 dark:focus:border-emerald-500/50 focus:ring-2 focus:ring-blue-200 dark:focus:ring-emerald-500/20 rounded-lg text-sm transition-all outline-none text-slate-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-emerald-900"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden p-2 rounded-lg text-slate-500 dark:text-emerald-600 hover:bg-slate-100 dark:hover:bg-emerald-500/10 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Voice Entry */}
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all group"
            title="Log via Voice Command"
          >
            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Voice Entry</span>
          </button>

          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      {/* Mobile Search Dropdown */}
      {searchOpen && (
        <div className="sm:hidden px-4 py-3 bg-white dark:bg-[#050508] border-b border-slate-200 dark:border-emerald-900/20 sticky top-16 z-20">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search expenses, categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-emerald-500/5 border border-slate-200 dark:border-emerald-900/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm outline-none transition-all text-slate-900 dark:text-emerald-300 placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </>
  );
}
