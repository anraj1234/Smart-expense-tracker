import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

// GET /api/expenses/summary — aggregated totals by category
export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: MOCK_USER.id,
      deletedAt: null,
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
  });

  // Group by category
  const categoryMap = new Map<string, { category: string; color: string; icon: string; total: number; count: number }>();
  let grandTotal = 0;

  for (const exp of expenses) {
    grandTotal += exp.amount;
    const existing = categoryMap.get(exp.categoryId);
    if (existing) {
      existing.total += exp.amount;
      existing.count += 1;
    } else {
      categoryMap.set(exp.categoryId, {
        category: exp.category.name,
        color: exp.category.color,
        icon: exp.category.icon,
        total: exp.amount,
        count: 1,
      });
    }
  }

  return NextResponse.json({
    data: Array.from(categoryMap.values()),
    total: grandTotal,
    month,
    year,
  });
}
