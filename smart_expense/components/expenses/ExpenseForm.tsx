"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Tag, FileText, Zap, Loader2 } from "lucide-react";
import axios from "axios";
import { ReceiptScannerModal } from "./ReceiptScannerModal";
import { Camera } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string;
};

type ExpenseFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense?: {
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    date: string;
  } | null;
};

export function ExpenseForm({ isOpen, onClose, onSuccess, expense }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isOpen) {
      axios.get("/api/categories").then(res => setCategories(res.data.data));
      if (expense) {
        setFormData({
          amount: expense.amount.toString(),
          description: expense.description,
          categoryId: expense.categoryId,
          date: new Date(expense.date).toISOString().split("T")[0],
        });
      } else {
        setFormData({
          amount: "",
          description: "",
          categoryId: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [isOpen, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId,
        date: new Date(formData.date).toISOString(),
        currency: "USD",
      };

      if (expense) {
        await axios.patch(`/api/expenses/${expense.id}`, payload);
      } else {
        await axios.post("/api/expenses", payload);
      }
      onSuccess();
      onClose();
      setFormData({ amount: "", description: "", categoryId: "", date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 bg-slate-50 dark:bg-emerald-500/5 border border-slate-200 dark:border-emerald-900/30 text-slate-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-emerald-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500/30 focus:border-blue-500 dark:focus:border-emerald-500/50";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Dark mode glow border on the left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-px hidden dark:block" style={{ background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
        
        <div className="flex flex-col h-full bg-white dark:bg-[#080b10] shadow-2xl dark:shadow-emerald-900/20">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 flex items-center justify-center text-blue-600 dark:text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-emerald-300">
                  {expense ? "Edit Expense" : "Log Expense"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-emerald-900">+10 XP on save</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-emerald-800 dark:hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Fast OCR Scan Action Bar */}
            {!expense && (
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all group"
              >
                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Scan Receipt (OCR Autofill)</span>
                <span className="ml-auto text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">AI</span>
              </button>
            )}

            <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-emerald-700" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={`${inputClass} text-2xl font-black py-4`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-emerald-700" />
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={inputClass}
                    placeholder="What did you spend on?"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider">Category</label>

                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-emerald-900 italic px-1">Loading categories…</p>
                ) : (
                  <>
                    {/* Hidden native select for form validation */}
                    <select
                      required
                      value={formData.categoryId}
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="sr-only"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>

                    {/* Visual pill picker — primary interaction */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {categories.map(cat => {
                        const isSelected = formData.categoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, categoryId: cat.id }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                              isSelected
                                ? "border-transparent text-white scale-105 shadow-lg"
                                : "border-slate-200 dark:border-emerald-900/20 text-slate-600 dark:text-emerald-700 bg-slate-50 dark:bg-transparent hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-500/5"
                            }`}
                            style={isSelected ? { backgroundColor: cat.color, boxShadow: `0 0 14px ${cat.color}70` } : {}}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>

                    {!formData.categoryId && (
                      <p className="text-xs text-red-400 dark:text-red-600 mt-1">Please select a category</p>
                    )}
                  </>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-emerald-800 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-emerald-700 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-emerald-900/20 bg-slate-50 dark:bg-[#050508]">
            <button
              form="expense-form"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-white transition-all duration-300 flex items-center justify-center gap-2
                bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20
                dark:glow-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {expense ? "Update Expense" : "Log Expense · +10 XP"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-2.5 text-sm font-medium text-slate-400 dark:text-emerald-900 hover:text-slate-600 dark:hover:text-emerald-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Embedded OCR Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onComplete={(scanned) => {
          // Find closest category match
          const matchedCat = categories.find(c => c.name.toLowerCase().includes(scanned.categoryName.toLowerCase())) || categories[0];
          setFormData(prev => ({
            ...prev,
            amount: scanned.amount,
            description: scanned.description,
            categoryId: matchedCat ? matchedCat.id : prev.categoryId
          }));
        }}
      />
    </>
  );
}
