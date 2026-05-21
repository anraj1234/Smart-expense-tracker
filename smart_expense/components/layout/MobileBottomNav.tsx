"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Target, BarChart3, FileText } from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-[#080b10]/95 backdrop-blur-md border-t border-slate-200 dark:border-emerald-900/30 flex items-stretch h-16 safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              isActive
                ? "text-blue-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-emerald-600"
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-all duration-200 ${
              isActive ? "bg-blue-50 dark:bg-emerald-500/10" : ""
            }`}>
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-emerald-400" />
              )}
            </div>
            <span className={`text-[10px] font-semibold transition-all ${isActive ? "opacity-100" : "opacity-60"}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
