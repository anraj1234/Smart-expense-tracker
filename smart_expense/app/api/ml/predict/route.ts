import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

    // Check if we already computed for next month
    const existing = await prisma.spendingPrediction.findUnique({
      where: {
        userId_month_year: { userId: MOCK_USER.id, month: nextMonth + 1, year: nextYear }
      }
    });

    if (existing) {
      return NextResponse.json({
        nextMonthPrediction: existing.predictedTotal,
        categoryPredictions: JSON.parse(existing.categoryPredictions),
        confidence: existing.confidence,
        month: nextMonth + 1,
        year: nextYear
      });
    }

    // Fetch past 3 months expenses to build ML Linear Regression/Trend Forecast simulation
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const pastExpenses = await prisma.expense.findMany({
      where: {
        userId: MOCK_USER.id,
        date: { gte: threeMonthsAgo },
        deletedAt: null,
      },
      include: { category: true }
    });

    let baseTotal = pastExpenses.reduce((sum, e) => sum + e.amount, 0) / 3 || 1200;
    // Add seasonal inflation multiplier simulation
    const predictedTotal = Math.round((baseTotal * 1.08) * 100) / 100;

    // Group category distributions
    const catMap: Record<string, number> = {};
    pastExpenses.forEach(e => {
      catMap[e.category.name] = (catMap[e.category.name] || 0) + e.amount;
    });

    const categoryPredictions: Record<string, number> = {};
    Object.entries(catMap).forEach(([name, amt]) => {
      categoryPredictions[name] = Math.round((amt / 3 * 1.05) * 100) / 100;
    });

    // Provide default categories if user has sparse history
    if (Object.keys(categoryPredictions).length === 0) {
      categoryPredictions["Food & Dining"] = 450.00;
      categoryPredictions["Transportation"] = 180.00;
      categoryPredictions["Shopping"] = 250.00;
      categoryPredictions["Bills & Utilities"] = 320.00;
    }

    const confidence = 0.88;

    // Save prediction to DB
    const created = await prisma.spendingPrediction.create({
      data: {
        userId: MOCK_USER.id,
        month: nextMonth + 1,
        year: nextYear,
        predictedTotal,
        categoryPredictions: JSON.stringify(categoryPredictions),
        confidence
      }
    });

    return NextResponse.json({
      nextMonthPrediction: created.predictedTotal,
      categoryPredictions: JSON.parse(created.categoryPredictions),
      confidence: created.confidence,
      month: created.month,
      year: created.year
    });

  } catch (error) {
    console.error("ML Prediction Error:", error);
    return NextResponse.json({ error: "Machine learning prediction engine failed" }, { status: 500 });
  }
}
