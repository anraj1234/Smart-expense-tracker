"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  FileText, 
  Settings,
  LogOut,
  Target,
  Zap
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 dark:bg-[#080b10] text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 dark:border-emerald-900/20 transition-colors duration-500">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 dark:border-emerald-900/20">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-transparent dark:border dark:border-emerald-500/50 flex items-center justify-center relative dark:pulse-glow">
            <Zap className="w-4 h-4 text-white dark:text-emerald-400" />
            <span className="hidden dark:block absolute inset-0 rounded-lg bg-emerald-500/10"></span>
          </div>
          <span className="text-white dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-emerald-200">
            SmartExpense
          </span>
        </div>
      </div>

      {/* Nav */}
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
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden
                ${isActive
                  ? "bg-slate-800 text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30"
                  : "hover:bg-slate-800 hover:text-white dark:hover:bg-emerald-500/5 dark:hover:text-emerald-400 dark:text-slate-500"
                }`}
            >
              {/* Active glow line */}
              {isActive && (
                <span className="hidden dark:block absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full" style={{boxShadow: '0 0 8px rgba(16,185,129,0.8)'}} />
              )}
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-blue-400 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-emerald-500"}`} />
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && (
                <span className="hidden dark:flex ml-auto text-xs font-bold text-emerald-500 stat-badge px-1.5 py-0.5 rounded">
                  ●
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-slate-800 dark:border-emerald-900/20">
        <div className="text-xs font-semibold text-slate-500 dark:text-emerald-900 uppercase tracking-widest mb-3 px-2">
          Account
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-500/5 hover:text-white dark:hover:text-emerald-400 dark:text-slate-500 transition-all group"
        >
          <Settings className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-emerald-500 transition-colors" />
          <span className="font-medium text-sm">Preferences</span>
        </Link>
        <button className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 dark:hover:bg-red-500/5 dark:text-slate-500 transition-all group">
          <LogOut className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-red-400 transition-colors" />
          <span className="font-medium text-sm">Log out</span>
        </button>

        {/* User profile with XP bar */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm border-2 border-emerald-500/30 dark:pulse-glow">
              DU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white dark:text-emerald-300 truncate">Dev User</p>
              <p className="text-xs text-slate-500 dark:text-emerald-800 truncate">Level 12 Saver</p>
            </div>
          </div>
          {/* XP Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-emerald-800">XP</span>
              <span className="text-slate-400 dark:text-emerald-600 font-bold">740 / 1000</span>
            </div>
            <div className="h-1.5 rounded-full xp-bar-track bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full xp-bar-fill bg-emerald-500" style={{ width: "74%" }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
