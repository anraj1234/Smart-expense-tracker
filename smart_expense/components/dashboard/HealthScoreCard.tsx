"use client";

import { useEffect, useState } from "react";
import { computeHealthScore } from "@/app/actions/healthScore";
import { Activity, Award, Zap } from "lucide-react";

type HealthScoreData = {
  score: number;
  savingsComp: number;
  budgetComp: number;
  balanceComp: number;
  consistency: number;
  badge: string;
};

export function HealthScoreCard() {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const result = await computeHealthScore(now.getMonth() + 1, now.getFullYear());
      setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="game-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-64 flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        <p className="text-slate-400 dark:text-emerald-800 text-sm">Calculating Health Score...</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10b981"; // emerald
    if (score >= 50) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "Good";
    return "Needs Work";
  };

  const scoreColor = getScoreColor(data.score);
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (circumference * data.score) / 100;

  return (
    <div className="game-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col h-full">
      {/* Background ring glow (dark only) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full opacity-0 dark:opacity-10 blur-3xl pointer-events-none"
        style={{ background: scoreColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 flex items-center justify-center text-blue-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-emerald-300 gradient-heading">Health Score</h3>
            <p className="text-xs text-slate-400 dark:text-emerald-900">Financial Performance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full stat-badge bg-slate-100 text-slate-600 text-xs font-bold">
          <Award className="w-3 h-3" />
          {data.badge}
        </div>
      </div>

      {/* Circular progress ring */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 128 128">
            {/* Track */}
            <circle
              cx="64" cy="64" r="58"
              stroke="currentColor" strokeWidth="10"
              fill="transparent"
              className="text-slate-100 dark:text-emerald-950"
            />
            {/* Glow effect (dark) */}
            <circle
              cx="64" cy="64" r="58"
              stroke={scoreColor} strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out opacity-20 dark:opacity-30"
              style={{ filter: `blur(4px)` }}
            />
            {/* Main arc */}
            <circle
              cx="64" cy="64" r="58"
              stroke={scoreColor} strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span 
              className="text-5xl font-black transition-all"
              style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}60` }}
            >
              {data.score}
            </span>
            <span className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-emerald-900 mt-0.5">/ 100</span>
            <span className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>{getScoreLabel(data.score)}</span>
          </div>
        </div>

        {/* Score breakdown bars */}
        <div className="w-full space-y-3">
          <ScoreBar label="Savings Ratio" value={data.savingsComp} max={30} color="#10b981" />
          <ScoreBar label="Budget Adherence" value={data.budgetComp} max={30} color="#3b82f6" />
          <ScoreBar label="Category Balance" value={data.balanceComp} max={20} color="#8b5cf6" />
          <ScoreBar label="Consistency" value={data.consistency} max={20} color="#f59e0b" />
        </div>

        {/* Boost hint */}
        <div className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-700">Log expenses daily to boost Consistency score!</p>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-500 dark:text-emerald-900">{label}</span>
        <span className="font-black text-slate-800 dark:text-emerald-400" style={{ color: percentage > 50 ? color : undefined }}>
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${percentage}%`, 
            background: color,
            boxShadow: `0 0 6px ${color}60`
          }}
        />
      </div>
    </div>
  );
}
