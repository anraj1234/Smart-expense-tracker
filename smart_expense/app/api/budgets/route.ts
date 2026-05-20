import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBudgetSchema } from "@/lib/validations";
import { MOCK_USER } from "@/lib/constants";

// GET /api/budgets
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

  const budgets = await prisma.budget.findMany({
    where: {
      userId: MOCK_USER.id,
      month,
      year
    },
    include: {
      category: true
    }
  });

  return NextResponse.json({ data: budgets });
}

// POST /api/budgets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createBudgetSchema.parse(body);

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: MOCK_USER.id,
          categoryId: parsed.categoryId || "", // Prisma optional relation needs handling if null
          month: parsed.month,
          year: parsed.year,
        }
      },
      update: { amount: parsed.amount },
      create: {
        amount: parsed.amount,
        month: parsed.month,
        year: parsed.year,
        userId: MOCK_USER.id,
        ...(parsed.categoryId ? { categoryId: parsed.categoryId } : {})
      }
    });

    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
