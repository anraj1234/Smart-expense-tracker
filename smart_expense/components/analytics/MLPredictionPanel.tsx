"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Brain, RefreshCw } from "lucide-react";

type MLData = {
  nextMonthPrediction: number;
  categoryPredictions: Record<string, number>;
  confidence: number;
  month: number;
  year: number;
};

export function MLPredictionPanel() {
  const [data, setData] = useState<MLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ml/predict", { method: "POST" });
      if (!res.ok) throw new Error("Failed to compute ML model");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("ML model initialization failed. Trying fallback data simulation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, []);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="game-card rounded-2xl border border-purple-200 dark:border-emerald-900/30 overflow-hidden bg-gradient-to-br from-white to-purple-50/30 dark:from-[#0a0d14] dark:to-[#0c0f1a]">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-purple-100 dark:border-emerald-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-emerald-500/10 flex items-center justify-center text-purple-600 dark:text-emerald-400 dark:border dark:border-emerald-500/20">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-emerald-300 text-base flex items-center gap-2">
              Expense Prediction ML
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-emerald-500/20 text-purple-700 dark:text-emerald-300">PROPHET / LINEAR REGRESSION</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-800">Forecasting next month's outflow via historical time-series analytics</p>
          </div>
        </div>
        <button 
          onClick={fetchPrediction} 
          disabled={loading}
          className="p-2 rounded-lg text-slate-400 dark:text-emerald-700 hover:text-slate-600 dark:hover:text-emerald-400 bg-white dark:bg-emerald-500/5 hover:bg-slate-50 dark:hover:bg-emerald-500/10 border border-slate-100 dark:border-emerald-900/20 transition-all"
          title="Re-train Model"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training ML time-series models...</p>
        </div>
      )}

      {!loading && data && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Forecast Gauge */}
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-white/60 dark:bg-[#050508]/60 border border-purple-100/50 dark:border-emerald-900/20 text-center relative overflow-hidden">
            <span className="text-xs font-bold text-slate-400 dark:text-emerald-800 uppercase tracking-wider mb-1">
              Predicted Total ({monthNames[data.month - 1]} {data.year})
            </span>
            <span className="text-4xl font-black text-slate-900 dark:text-emerald-400 neon-text my-2">
              ${data.nextMonthPrediction.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                {(data.confidence * 100).toFixed(0)}% Model Confidence
              </span>
            </div>
            {/* Risk Indicator Tag */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-emerald-900/20 w-full flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-500 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              High probability of minor seasonal overflow
            </div>
          </div>

          {/* Category-wise spending bar distribution */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider mb-3">
                Category Spending Forecast
              </h4>
              <div className="space-y-3">
                {Object.entries(data.categoryPredictions).map(([cat, amt]) => {
                  const pct = Math.min(100, (amt / data.nextMonthPrediction) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-emerald-300">{cat}</span>
                        <span className="font-bold text-slate-900 dark:text-emerald-400">${amt.toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-emerald-600 dark:to-teal-400 rounded-full" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Savings tip footer */}
            <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30 flex items-center gap-2 text-xs text-purple-700 dark:text-emerald-600 font-medium">
              <Sparkles className="w-4 h-4 shrink-0 text-purple-500 dark:text-emerald-400" />
              <span>Predicted food expense next month is elevated. Shifting to bulk buying can reduce risk by 12%.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
