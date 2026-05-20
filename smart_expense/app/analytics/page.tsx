import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { MLPredictionPanel } from "@/components/analytics/MLPredictionPanel";
import { subMonths, startOfMonth, format } from "date-fns";
import { 
  BarChart3, 
  TrendingDown, 
  Calendar,
  Wallet
} from "lucide-react";

async function getAnalyticsData() {
  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5)); // Include current month, so go back 5 months

  const expenses = await prisma.expense.findMany({
    where: {
      userId: MOCK_USER.id,
      date: { gte: sixMonthsAgo },
      deletedAt: null,
    },
    include: { category: true },
    orderBy: { date: 'asc' },
  });

  // Calculate Monthly Data
  const monthlyTotals: Record<string, number> = {};
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    monthlyTotals[format(monthDate, 'MMM yyyy')] = 0;
  }

  expenses.forEach(exp => {
    const monthKey = format(exp.date, 'MMM yyyy');
    if (monthlyTotals[monthKey] !== undefined) {
      monthlyTotals[monthKey] += exp.amount;
    }
  });

  const monthlyData = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount
  }));

  // Calculate Category Data for the same period
  const categoryTotals: Record<string, { value: number; color: string }> = {};
  
  expenses.forEach(exp => {
    if (!categoryTotals[exp.category.name]) {
      categoryTotals[exp.category.name] = { value: 0, color: exp.category.color };
    }
    categoryTotals[exp.category.name].value += exp.amount;
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color
    }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = expenses.reduce((sum: number, exp) => sum + exp.amount, 0);
  const avgMonthly = totalSpent / 6;
  const topCategory = categoryData[0]?.name || "None";

  return {
    monthlyData,
    categoryData,
    totalSpent,
    avgMonthly,
    topCategory
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-emerald-400">Analytics</h1>
          <p className="text-slate-500 dark:text-emerald-600">Dive deep into your spending habits over the last 6 months.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-black rounded-2xl p-6 border border-slate-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="w-16 h-16 text-blue-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-500 dark:text-emerald-600">Total Spent (6mo)</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-emerald-400">${data.totalSpent.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl p-6 border border-slate-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <TrendingDown className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-500 dark:text-emerald-600">Avg. Monthly</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-emerald-400">${data.avgMonthly.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl p-6 border border-slate-100 dark:border-emerald-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <BarChart3 className="w-16 h-16 text-purple-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-500 dark:text-emerald-600">Top Category</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-emerald-400 truncate">{data.topCategory}</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts */}
      <AnalyticsCharts 
        monthlyData={data.monthlyData} 
        categoryData={data.categoryData} 
      />

      {/* ML Spending Prediction System */}
      <div className="pt-4">
        <MLPredictionPanel />
      </div>
    </div>
  );
}

