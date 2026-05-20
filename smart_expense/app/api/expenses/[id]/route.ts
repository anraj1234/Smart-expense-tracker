import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validations";
import { MOCK_USER } from "@/lib/constants";

// GET /api/expenses/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, userId: MOCK_USER.id, deletedAt: null },
    include: { category: true },
  });

  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: expense });
}

// PATCH /api/expenses/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateExpenseSchema.parse(body);

    const existing = await prisma.expense.findFirst({
      where: { id, userId: MOCK_USER.id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: any = { ...parsed };
    if (parsed.tags) updateData.tags = JSON.stringify(parsed.tags);
    if (parsed.date) updateData.date = new Date(parsed.date as unknown as string);
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({ data: expense });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.expense.findFirst({
    where: { id, userId: MOCK_USER.id, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ data: { id } });
}
