"use client";

import { useState } from "react";
import { Check, X, Sparkles, Loader2 } from "lucide-react";

export function BudgetSuggestionsReview({ suggestions }: { suggestions: any[] }) {
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const [loading, setLoading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/budget-suggestions/generate", { method: "POST" });
      const data = await res.json();
      if (data.data) {
        window.location.reload(); // Quick refresh to get names and state sync
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    setLoading(id);
    try {
      await fetch(`/api/budget-suggestions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      // Remove from list
      setLocalSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-indigo-100/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-emerald-400 text-lg">AI Budget Recommendations</h3>
            <p className="text-sm text-slate-600">Based on your past spending patterns</p>
          </div>
        </div>
        
        {localSuggestions.length === 0 && (
          <button 
            onClick={generateSuggestions}
            disabled={generating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        )}
      </div>

      <div className="p-6">
        {localSuggestions.length === 0 ? (
          <p className="text-slate-500 dark:text-emerald-600 italic text-center py-4">No pending suggestions. You're all set!</p>
        ) : (
          <div className="space-y-4">
            {localSuggestions.map(s => (
              <div key={s.id} className="bg-white dark:bg-black rounded-xl p-4 border border-indigo-50 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-emerald-400">{s.categoryName}</h4>
                  <p className="text-sm text-slate-600 mt-1">{s.reason}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-emerald-600 font-semibold uppercase tracking-wider mb-1">Suggested</p>
                    <p className="font-bold text-lg text-indigo-600">${s.suggestedAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction(s.id, "ACCEPTED")}
                      disabled={loading === s.id}
                      className="w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Accept"
                    >
                      {loading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => handleAction(s.id, "REJECTED")}
                      disabled={loading === s.id}
                      className="w-10 h-10 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
