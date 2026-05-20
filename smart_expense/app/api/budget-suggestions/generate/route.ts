import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const userId = MOCK_USER.id;

  try {
    // Get all categories to assign mock suggestions to real categories
    const categories = await prisma.category.findMany();
    
    if (categories.length === 0) {
      return NextResponse.json({ error: "No categories found to generate budgets for." }, { status: 400 });
    }

    const mockSuggestions = [
      {
        categoryId: categories[0]?.id,
        suggestedAmount: 500,
        reason: "Slight buffer above average — consistent spending",
      },
      {
        categoryId: categories[1]?.id || categories[0]?.id,
        suggestedAmount: 200,
        reason: "Slightly above average — recommend small reduction",
      },
      {
        categoryId: categories[2]?.id || categories[0]?.id,
        suggestedAmount: 150,
        reason: "High variance — AI flags as reducible",
      }
    ];

    // Upsert suggestions
    for (const s of mockSuggestions) {
      if (!s.categoryId) continue;
      
      await prisma.budgetSuggestion.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: s.categoryId,
            month,
            year
          }
        },
        update: {
          suggestedAmount: s.suggestedAmount,
          reason: s.reason,
          status: "PENDING"
        },
        create: {
          userId,
          categoryId: s.categoryId,
          suggestedAmount: s.suggestedAmount,
          reason: s.reason,
          month,
          year
        }
      });
    }

    const suggestions = await prisma.budgetSuggestion.findMany({
      where: { userId, month, year }
    });

    return NextResponse.json({ data: suggestions });
  } catch (error) {
    console.error("Failed to generate mock budget suggestions:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
