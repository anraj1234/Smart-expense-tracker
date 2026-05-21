"use client";

import { useState } from "react";
import { Plus, Loader2, X, PiggyBank } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string;
};

type AddBudgetFormProps = {
  categories: Category[];
};

export function AddBudgetForm({ categories }: AddBudgetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;
    setLoading(true);
    setError(null);

    const now = new Date();
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: parseFloat(amount),
          period: "monthly",
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save budget");
        return;
      }

      // Refresh page to show updated budget list
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Add Budget Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20"
      >
        <Plus className="w-4 h-4" />
        Add Budget
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#080b10] w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-emerald-900/30 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-emerald-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-emerald-500/10 flex items-center justify-center text-blue-600 dark:text-emerald-400">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-emerald-300">Set Budget</h2>
                    <p className="text-xs text-slate-400 dark:text-emerald-900">For current month</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Category picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                            isSelected
                              ? "border-transparent text-white scale-105 shadow-lg"
                              : "border-slate-200 dark:border-emerald-900/20 text-slate-600 dark:text-emerald-700 bg-slate-50 dark:bg-transparent hover:border-slate-300 hover:bg-slate-100"
                          }`}
                          style={isSelected ? { backgroundColor: cat.color, boxShadow: `0 0 14px ${cat.color}70` } : {}}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                  {!categoryId && (
                    <p className="text-xs text-red-400 mt-1">Please select a category</p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider">
                    Monthly Limit ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 300.00"
                    className="w-full px-4 py-3 rounded-xl text-2xl font-black outline-none transition-all bg-slate-50 dark:bg-emerald-500/5 border border-slate-200 dark:border-emerald-900/30 text-slate-900 dark:text-emerald-300 placeholder:text-slate-300 dark:placeholder:text-emerald-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500/30"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-slate-500 dark:text-emerald-700 bg-slate-100 dark:bg-emerald-500/5 hover:bg-slate-200 dark:hover:bg-emerald-500/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !categoryId || !amount}
                    className="flex-1 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <PiggyBank className="w-4 h-4" />
                        Save Budget
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
