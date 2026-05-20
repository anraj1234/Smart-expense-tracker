import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { BudgetSuggestionsReview } from "@/components/budgets/BudgetSuggestionsReview";

export default async function BudgetsPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get current budgets
  const budgets = await prisma.budget.findMany({
    where: { userId: MOCK_USER.id, month, year },
    include: { category: true }
  });

  // Get budget suggestions that are still pending
  const pendingSuggestions = await prisma.budgetSuggestion.findMany({
    where: { userId: MOCK_USER.id, month, year, status: "PENDING" }
  });

  // Map category names
  const categories = await prisma.category.findMany();
  const categoryMap = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  const suggestionsWithNames = pendingSuggestions.map(s => ({
    ...s,
    categoryName: categoryMap[s.categoryId] || "Unknown"
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-emerald-400">Budgets</h1>
          <p className="text-slate-500 dark:text-emerald-600">Manage your monthly budgets and review AI recommendations.</p>
        </div>
      </div>

      <BudgetSuggestionsReview suggestions={suggestionsWithNames} />

      <div className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-emerald-900/40 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0a0a0a]/50">
          <h3 className="font-bold text-slate-900 dark:text-emerald-400 text-lg">Current Budgets</h3>
        </div>
        <div className="p-6">
          {budgets.length === 0 ? (
            <p className="text-slate-500 dark:text-emerald-600 italic">No budgets set for this month yet. Review the suggestions above!</p>
          ) : (
            <div className="space-y-4">
              {budgets.map(b => (
                <div key={b.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0a0a0a]">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: b.category.color }}
                    >
                      <span className="font-bold text-sm">{b.category.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-emerald-400">{b.category.name}</p>
                      <p className="text-sm text-slate-500 dark:text-emerald-600">Monthly Limit</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-emerald-400">${b.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
