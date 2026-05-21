"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X,
  LayoutDashboard,
  Receipt,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Target,
  Zap,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-emerald-600 hover:bg-slate-100 dark:hover:bg-emerald-500/10 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 dark:bg-[#080b10] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden border-r border-slate-800 dark:border-emerald-900/20 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 dark:border-emerald-900/20">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-transparent dark:border dark:border-emerald-500/50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white dark:text-emerald-400" />
            </div>
            <span className="text-white dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-emerald-200">
              SmartExpense
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 dark:text-emerald-900 uppercase tracking-widest mb-4 px-3">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? "bg-slate-800 text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30"
                    : "hover:bg-slate-800 hover:text-white dark:hover:bg-emerald-500/5 dark:hover:text-emerald-400 dark:text-slate-500"
                  }`}
              >
                {isActive && (
                  <span className="hidden dark:block absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full" />
                )}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-400 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600 group-hover:text-blue-400"}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-800 dark:border-emerald-900/20">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white dark:text-slate-500 transition-all group mb-1"
          >
            <Settings className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="font-medium text-sm">Preferences</span>
          </Link>
          <button
            onClick={() => {
              if (window.confirm("This is a demo app. Go back to dashboard?")) {
                window.location.href = "/";
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 dark:text-slate-500 transition-all group"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
            <span className="font-medium text-sm">Log out</span>
          </button>

          {/* User card */}
          <div className="mt-3 p-3 rounded-xl bg-slate-900 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                DU
              </div>
              <div>
                <p className="text-sm font-bold text-white dark:text-emerald-300">Dev User</p>
                <p className="text-xs text-slate-500 dark:text-emerald-800">Level 12 Saver</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 xp-bar-fill" style={{ width: "74%" }} />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500 dark:text-emerald-800">XP</span>
              <span className="text-slate-400 dark:text-emerald-600 font-bold">740 / 1000</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
