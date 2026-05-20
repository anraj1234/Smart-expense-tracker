import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { generateSpendingSummary, generateBudgetAdvice } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body; // "summary" or "advice"

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
      orderBy: { amount: 'desc' },
    });

    const categoryBreakdown: Record<string, number> = {};
    let totalSpent = 0;
    expenses.forEach(exp => {
      totalSpent += exp.amount;
      categoryBreakdown[exp.category.name] = (categoryBreakdown[exp.category.name] || 0) + exp.amount;
    });

    if (type === "summary") {
      const monthName = now.toLocaleString('default', { month: 'long' });
      const summary = await generateSpendingSummary(expenses, monthName, totalSpent, categoryBreakdown);
      
      // Store in DB
      await prisma.aIInsight.upsert({
        where: { userId_month_year: { userId: MOCK_USER.id, month: now.getMonth() + 1, year: now.getFullYear() } },
        update: { insights: JSON.stringify({ type: "summary", data: summary }) },
        create: { userId: MOCK_USER.id, month: now.getMonth() + 1, year: now.getFullYear(), insights: JSON.stringify({ type: "summary", data: summary }) }
      });

      return NextResponse.json({ data: { summary } });
    }

    if (type === "advice") {
      const budgets = await prisma.budget.findMany({
        where: { userId: MOCK_USER.id, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { category: true },
      });
      const advice = await generateBudgetAdvice(budgets, categoryBreakdown);
      return NextResponse.json({ data: advice });
    }

    return NextResponse.json({ error: "Invalid insight type" }, { status: 400 });

  } catch (error) {
    console.error("AI Insight Error:", error);
    return NextResponse.json({ error: "Failed to generate AI insight" }, { status: 500 });
  }
}
