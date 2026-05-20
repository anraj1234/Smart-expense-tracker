import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations";
import { MOCK_USER } from "@/lib/constants";

// GET /api/expenses — list with filters
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const search = url.searchParams.get("search") || undefined;

  const where: Record<string, unknown> = {
    userId: MOCK_USER.id,
    deletedAt: null,
  };

  if (categoryId) where.categoryId = categoryId;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (search) {
    where.description = { contains: search };
  }

  const expenses = await prisma.expense.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { date: "desc" },
    include: { category: true },
  });

  const hasMore = expenses.length > limit;
  const data = hasMore ? expenses.slice(0, limit) : expenses;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  const total = await prisma.expense.count({ where });

  return NextResponse.json({ data, nextCursor, total });
}

// POST /api/expenses — create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createExpenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        amount: parsed.amount,
        currency: parsed.currency,
        description: parsed.description,
        date: parsed.date,
        categoryId: parsed.categoryId,
        userId: MOCK_USER.id,
        tags: JSON.stringify(parsed.tags),
        notes: parsed.notes,
      },
      include: { category: true },
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
