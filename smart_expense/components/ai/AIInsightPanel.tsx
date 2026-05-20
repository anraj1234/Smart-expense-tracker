"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2,
  TrendingUp, Zap, RefreshCw, Bell
} from "lucide-react";

type Recommendation = {
  advice: string;
  priority: "high" | "medium" | "low";
};

const PRIORITY_CONFIG = {
  high: {
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-500/5",
    border: "border-red-100 dark:border-red-500/20",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    dot: "bg-red-500",
  },
  medium: {
    icon: TrendingUp,
    bg: "bg-amber-50 dark:bg-amber-500/5",
    border: "border-amber-100 dark:border-amber-500/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  low: {
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-500/5",
    border: "border-emerald-100 dark:border-emerald-500/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

export function AIInsightPanel() {
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, adviceRes] = await Promise.all([
        fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "summary" }),
        }),
        fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "advice" }),
        }),
      ]);

      if (!summaryRes.ok || !adviceRes.ok) throw new Error("Server error");

      const summaryData = await summaryRes.json();
      const adviceData = await adviceRes.json();

      setSummary(summaryData.data?.summary || null);
      setRecommendations(adviceData.data?.recommendations || []);
      setHasGenerated(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = async () => {
    setAlertLoading(true);
    try {
      await fetch("/api/alerts/trigger", { method: "POST" });
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 3000);
    } catch {
      // silent
    } finally {
      setAlertLoading(false);
    }
  };

  return (
    <div className="game-card rounded-2xl border border-indigo-100 dark:border-emerald-900/20 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
      }}
    >
      {/* Dark mode override */}
      <style>{`.dark .ai-panel-bg { background: linear-gradient(135deg, #0a0d14 0%, #0c0f1a 100%) !important; }`}</style>
      <div className="ai-panel-bg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 shadow-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-emerald-300 text-base">AI Expense Insights</h3>
              <p className="text-xs text-slate-500 dark:text-emerald-800">
                {hasGenerated ? "✓ Analysis complete" : "Powered by intelligent analysis"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Smart Alert button */}
            <button
              onClick={triggerAlert}
              disabled={alertLoading}
              title="Trigger a smart alert"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                ${alertSent
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-white/60 dark:bg-emerald-500/5 dark:border dark:border-emerald-900/30 text-slate-600 dark:text-emerald-700 hover:bg-white dark:hover:bg-emerald-500/10"
                }`}
            >
              {alertLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
              {alertSent ? "Sent!" : "Test Alert"}
            </button>

            {/* Generate / Regenerate button */}
            <button
              onClick={generateInsights}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:border dark:border-emerald-500/30 disabled:opacity-50 text-white dark:text-emerald-300 rounded-xl font-bold transition-all duration-300 text-sm shadow-sm shadow-purple-500/20 dark:shadow-none"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : hasGenerated ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {loading ? "Analyzing..." : hasGenerated ? "Refresh" : "Generate"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="px-6 pb-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white/40 dark:bg-emerald-500/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        )}

        {/* Empty / pre-generate state */}
        {!hasGenerated && !loading && !error && (
          <div className="px-6 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 dark:border dark:border-emerald-500/20">
              <Sparkles className="w-8 h-8 text-purple-400 dark:text-emerald-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-emerald-800 max-w-xs mx-auto">
              Click <strong className="text-slate-700 dark:text-emerald-600">Generate</strong> to get personalized insights based on your real spending data.
            </p>
          </div>
        )}

        {/* Results */}
        {hasGenerated && !loading && (
          <div className="px-6 pb-6 space-y-4">
            {/* Summary */}
            {summary && (
              <div className="bg-white/70 dark:bg-emerald-500/5 rounded-xl p-4 border border-white/60 dark:border-emerald-900/30">
                <h4 className="font-black text-slate-800 dark:text-emerald-300 text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500 dark:text-emerald-500" />
                  Monthly Summary
                </h4>
                <p className="text-sm text-slate-600 dark:text-emerald-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 dark:text-emerald-400 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Actionable Advice
                </h4>
                {recommendations.map((rec, idx) => {
                  const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 items-start p-3 rounded-xl border ${cfg.bg} ${cfg.border} transition-all`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${cfg.dot}`} style={{ boxShadow: `0 0 6px currentColor` }} />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-emerald-200 leading-relaxed">{rec.advice}</p>
                        <span className={`mt-1.5 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
