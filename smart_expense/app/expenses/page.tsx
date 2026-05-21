"use client";

import { useState } from "react";
import { Plus, Filter, Search, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import axios from "axios";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";

type Expense = {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  category: {
    name: string;
    color: string;
  };
};

export default function ExpensesPage() {
  const { expenses, loading, total, filters, setFilters, refetch } = useExpenses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditingExpense(null), 300); // clear after animation
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-emerald-400">Expenses</h1>
          <p className="text-slate-500 dark:text-emerald-600 text-sm">Manage and track your daily spending.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const now = new Date();
              window.open(`/api/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
            }}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 bg-white dark:bg-black border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">Report</span>
          </button>
          <button 
            onClick={() => {
              setEditingExpense(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-emerald-900/40 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-[#0a0a0a]/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-black"
            />
            {filters.search && (
              <button 
                onClick={() => setFilters({ ...filters, search: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-emerald-600">Month:</span>
            <input 
              type="month"
              value={filters.from ? filters.from.substring(0, 7) : ""}
              onChange={(e) => {
                if (!e.target.value) {
                  setFilters({ ...filters, from: undefined, to: undefined });
                  return;
                }
                const date = new Date(e.target.value);
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
                setFilters({ ...filters, from: firstDay, to: lastDay });
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white dark:bg-black focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-emerald-900/40 text-slate-500 dark:text-emerald-600">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:bg-black">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-emerald-600">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-emerald-600">
                    No expenses found. Click "Add Expense" to get started.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:bg-[#0a0a0a] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-emerald-600">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-emerald-400">
                      {exp.description}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        style={{ 
                          backgroundColor: `${exp.category.color}15`, 
                          color: exp.category.color,
                          borderColor: `${exp.category.color}30`
                        }}
                      >
                        {exp.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-emerald-400">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(exp)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0a0a0a]/50 flex items-center justify-between text-sm text-slate-500 dark:text-emerald-600">
          <span>Showing {expenses.length} of {total} results</span>
          <div className="flex items-center gap-2">
            <button 
              disabled={!filters.page || filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              className="px-3 py-1 border border-slate-300 rounded bg-white dark:bg-black hover:bg-slate-50 dark:bg-[#0a0a0a] disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={expenses.length < (filters.limit || 10)}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              className="px-3 py-1 border border-slate-300 rounded bg-white dark:bg-black hover:bg-slate-50 dark:bg-[#0a0a0a] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <ExpenseForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        onSuccess={refetch}
        expense={editingExpense}
      />
    </div>
  );
}
