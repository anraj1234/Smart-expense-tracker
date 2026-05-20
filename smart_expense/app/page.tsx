import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { 
  Wallet, 
  PiggyBank, 
  TrendingUp,
  CreditCard,
  Star,
  Shield
} from "lucide-react";
import { AddExpenseButton } from "@/components/dashboard/AddExpenseButton";
import { AIInsightPanel } from "@/components/ai/AIInsightPanel";
import { ExpensesChart } from "@/components/dashboard/ExpensesChart";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: MOCK_USER.id,
      date: { gte: startOfMonth, lte: endOfMonth },
      deletedAt: null,
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const totalSpent = expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0);
  const recentExpenses = expenses.slice(0, 5);

  const categoryTotals: Record<string, number> = {};
  const categoryColors: Record<string, string> = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category.name] = (categoryTotals[exp.category.name] || 0) + exp.amount;
    categoryColors[exp.category.name] = exp.category.color;
  });

  const topCategoryName = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  const topCategoryAmount = categoryTotals[topCategoryName] || 0;

  const budgets = await prisma.budget.findMany({
    where: { userId: MOCK_USER.id, month: now.getMonth() + 1, year: now.getFullYear() }
  });
  const totalBudget = budgets.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0);
  
  return {
    totalSpent,
    totalBudget,
    topCategory: { name: topCategoryName, amount: topCategoryAmount },
    recentExpenses,
    monthName: now.toLocaleString('default', { month: 'long' }),
    categoryTotals,
    categoryColors,
    expenses
  };
}

function StatCard({ 
  title, 
  value, 
  sub, 
  icon: Icon, 
  iconBg, 
  iconColor,
  accent,
  progress
}: { 
  title: string; 
  value: string; 
  sub?: string; 
  icon: any; 
  iconBg: string;
  iconColor: string;
  accent: string;
  progress?: number;
}) {
  return (
    <div className={`game-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
      {/* Light mode gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${iconBg} blur-xl`} />
      
      {/* Dark mode corner accent */}
      <div className={`hidden dark:block absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full blur-2xl`} style={{ background: accent }} />
      
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} dark:bg-transparent dark:border dark:border-current/30`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-500 uppercase tracking-wider">{title}</h3>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-black text-slate-900 dark:text-emerald-400 neon-text">{value}</span>
      </div>
      
      {sub && <p className="text-sm text-slate-400 dark:text-emerald-900">{sub}</p>}
      
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-slate-100 xp-bar-track overflow-hidden">
            <div 
              className={`h-full rounded-full xp-bar-fill transition-all duration-700 ${progress > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }} 
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-emerald-900 mt-1">{progress.toFixed(1)}% used</p>
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const budgetPercentage = data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400 gradient-heading">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-emerald-900 mt-1 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 dark:text-emerald-700" />
            {data.monthName} Overview · Level 12 Saver
          </p>
        </div>
        <AddExpenseButton />
      </div>

      {/* Achievement banner (dark only) */}
      <div className="hidden dark:flex items-center gap-4 game-card rounded-xl px-5 py-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm">Budget Guardian</span>
        </div>
        <div className="w-px h-5 bg-emerald-900" />
        <span className="text-emerald-700 text-sm">Track 5 more expenses this week to earn the <span className="text-emerald-400 font-bold">Consistent Tracker</span> badge</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-1.5 w-32 rounded-full bg-emerald-900/40 overflow-hidden">
            <div className="h-full w-3/5 rounded-full xp-bar-fill" />
          </div>
          <span className="text-xs text-emerald-600 font-bold">3/5</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Spent" 
          value={`$${data.totalSpent.toFixed(2)}`}
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          accent="#3b82f6"
        />
        <StatCard 
          title="Monthly Budget" 
          value={`$${data.totalBudget.toFixed(2)}`}
          icon={PiggyBank}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          accent="#10b981"
          progress={budgetPercentage}
        />
        <StatCard 
          title="Top Category" 
          value={data.topCategory.name}
          sub={`$${data.topCategory.amount.toFixed(2)} spent`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          accent="#8b5cf6"
        />
        <StatCard 
          title="Expenses Logged" 
          value={String(data.recentExpenses.length)}
          sub="this month"
          icon={CreditCard}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accent="#f59e0b"
        />
      </div>

      {/* Charts section */}
      <ExpensesChart 
        expenses={data.expenses} 
        categoryTotals={data.categoryTotals} 
        categoryColors={data.categoryColors} 
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AIInsightPanel />

          {/* Recent Transactions */}
          <div className="game-card bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 dark:text-emerald-300 text-lg gradient-heading">Recent Transactions</h3>
              <button className="text-sm font-semibold text-blue-600 dark:text-emerald-600 hover:text-blue-700 dark:hover:text-emerald-400 transition-colors">View All →</button>
            </div>
            
            <div className="space-y-2">
              {data.recentExpenses.length === 0 ? (
                <p className="text-slate-400 dark:text-emerald-900 text-center py-8 italic">No transactions this month</p>
              ) : (
                data.recentExpenses.map((exp, i) => (
                  <div key={exp.id} className="table-row-hover flex items-center justify-between p-3 rounded-xl border border-transparent transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold shadow-sm"
                        style={{ backgroundColor: exp.category.color, boxShadow: `0 0 12px ${exp.category.color}40` }}
                      >
                        {exp.category.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-emerald-300 truncate max-w-[180px]">{exp.description}</p>
                        <p className="text-xs text-slate-400 dark:text-emerald-800">{exp.date.toLocaleDateString()} · {exp.category.name}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 dark:text-emerald-400 neon-text">-${exp.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <HealthScoreCard />
        </div>
      </div>
    </div>
  );
}
