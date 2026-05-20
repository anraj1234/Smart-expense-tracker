import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { generateMonthlyReport } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const monthStr = url.searchParams.get("month");
  const yearStr = url.searchParams.get("year");

  if (!monthStr || !yearStr) {
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  const month = parseInt(monthStr);
  const year = parseInt(yearStr);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        userId: MOCK_USER.id,
        date: { gte: startOfMonth, lte: endOfMonth },
        deletedAt: null,
      },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    const total = expenses.reduce((sum: number, exp) => sum + exp.amount, 0);
    const monthName = startOfMonth.toLocaleString('default', { month: 'long' });

    const pdfBuffer = await generateMonthlyReport(expenses, monthName, yearStr, total);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="expenses-${year}-${month}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Gen error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
