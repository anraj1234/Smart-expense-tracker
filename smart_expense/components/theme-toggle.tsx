"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="relative p-2 rounded-lg opacity-0">
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title="Toggle theme"
      className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 overflow-hidden
        ${isDark 
          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50" 
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
        }`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-5 w-5 transition-transform duration-300" />
      )}
      {isDark && (
        <span className="absolute inset-0 rounded-xl" style={{ boxShadow: 'inset 0 0 12px rgba(16,185,129,0.1)' }} />
      )}
    </button>
  );
}
