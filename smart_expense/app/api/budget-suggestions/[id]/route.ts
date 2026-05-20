import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { status } = await req.json(); // ACCEPTED or REJECTED
    
    if (status !== "ACCEPTED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const suggestion = await prisma.budgetSuggestion.update({
      where: { id: resolvedParams.id, userId: MOCK_USER.id },
      data: { status }
    });

    // If accepted, we should actually create/update the budget
    if (status === "ACCEPTED") {
      await prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId: MOCK_USER.id,
            categoryId: suggestion.categoryId,
            month: suggestion.month,
            year: suggestion.year
          }
        },
        update: {
          amount: suggestion.suggestedAmount
        },
        create: {
          userId: MOCK_USER.id,
          categoryId: suggestion.categoryId,
          amount: suggestion.suggestedAmount,
          month: suggestion.month,
          year: suggestion.year
        }
      });
    }

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    console.error("Failed to update suggestion:", error);
    return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
  }
}
