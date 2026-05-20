import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { FileText, Download, CalendarDays } from "lucide-react";

async function getAvailableReports() {
  // Fetch only dates to find unique months with expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId: MOCK_USER.id,
      deletedAt: null,
    },
    select: {
      date: true,
      amount: true,
    },
    orderBy: {
      date: 'desc'
    }
  });

  const reportsMap = new Map<string, { month: number; year: number; total: number; count: number }>();

  expenses.forEach(exp => {
    const d = new Date(exp.date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const key = `${year}-${month}`;

    if (!reportsMap.has(key)) {
      reportsMap.set(key, { month, year, total: 0, count: 0 });
    }
    
    const report = reportsMap.get(key)!;
    report.total += exp.amount;
    report.count += 1;
  });

  // Convert map to array and sort by year desc, month desc
  return Array.from(reportsMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export default async function ReportsPage() {
  const reports = await getAvailableReports();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-emerald-400">Reports</h1>
          <p className="text-slate-500 dark:text-emerald-600">Download your monthly expense summaries as PDF reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-emerald-900/40 shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-emerald-400 mb-1">No reports available</h3>
            <p className="text-slate-500 dark:text-emerald-600">Log some expenses to generate your first monthly report.</p>
          </div>
        ) : (
          reports.map((report) => {
            const date = new Date(report.year, report.month - 1);
            const monthName = date.toLocaleString('default', { month: 'long' });
            
            return (
              <div 
                key={`${report.year}-${report.month}`} 
                className="bg-white dark:bg-black rounded-2xl p-6 border border-slate-100 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-emerald-400 text-lg">{monthName} {report.year}</h3>
                      <p className="text-sm text-slate-500 dark:text-emerald-600 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {report.count} expenses logged
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-emerald-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-emerald-600 uppercase font-semibold tracking-wider mb-1">Total Spent</p>
                    <p className="font-bold text-slate-900 dark:text-emerald-400">${report.total.toFixed(2)}</p>
                  </div>
                  
                  <a 
                    href={`/api/reports/monthly?month=${report.month}&year=${report.year}`}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
