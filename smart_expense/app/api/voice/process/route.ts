import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const lower = transcript.toLowerCase();

    // Enhanced heuristic/RegEx parser to intelligently extract financial metadata from natural voice strings
    // Matches numbers/currencies like "500", "500.50", "1200 dollars", "300 rupees"
    const amountMatch = lower.match(/(\d+(\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 25.00;

    // Fetch existing categories to map naturally
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId: MOCK_USER.id }, { userId: null }] }
    });

    let matchedCategory = categories.find(c => lower.includes(c.name.toLowerCase()));
    
    // Custom common synonyms parsing
    if (!matchedCategory) {
      if (lower.includes("grocery") || lower.includes("food") || lower.includes("pizza") || lower.includes("lunch") || lower.includes("dinner")) {
        matchedCategory = categories.find(c => c.name.toLowerCase().includes("food")) || categories[0];
      } else if (lower.includes("uber") || lower.includes("taxi") || lower.includes("bus") || lower.includes("train") || lower.includes("flight")) {
        matchedCategory = categories.find(c => c.name.toLowerCase().includes("transport")) || categories[0];
      } else if (lower.includes("bill") || lower.includes("electricity") || lower.includes("water") || lower.includes("rent")) {
        matchedCategory = categories.find(c => c.name.toLowerCase().includes("bill") || c.name.toLowerCase().includes("util")) || categories[0];
      } else if (lower.includes("movie") || lower.includes("netflix") || lower.includes("game") || lower.includes("concert")) {
        matchedCategory = categories.find(c => c.name.toLowerCase().includes("entertainment")) || categories[0];
      } else {
        matchedCategory = categories[0]; // fallback to first available
      }
    }

    // Ultimate fallback if database has zero categories
    if (!matchedCategory) {
      matchedCategory = await prisma.category.create({
        data: {
          name: "General",
          color: "#10B981",
          icon: "tag",
          userId: MOCK_USER.id
        }
      });
    }

    // Attempt merchant extraction from natural prepositions like "at [Merchant]" or "on [Merchant]"
    let merchant = "Voice Expense";
    const atMatch = transcript.match(/\bat\s+([A-Za-z0-9\s]+?)(?:\s+today|\s+yesterday|\s+on|\s+for|$)/i);
    if (atMatch && atMatch[1]) {
      merchant = atMatch[1].trim();
    } else {
      const onMatch = transcript.match(/\bon\s+([A-Za-z0-9\s]+?)(?:\s+today|\s+yesterday|\s+at|\s+for|$)/i);
      if (onMatch && onMatch[1] && !parseFloat(onMatch[1])) {
        merchant = onMatch[1].trim();
      }
    }

    // Determine date context
    let date = new Date();
    if (lower.includes("yesterday")) {
      date.setDate(date.getDate() - 1);
    }

    // Save expense automatically as specified by functional requirements
    const expense = await prisma.expense.create({
      data: {
        userId: MOCK_USER.id,
        amount,
        description: `${transcript.charAt(0).toUpperCase() + transcript.slice(1)}`,
        categoryId: matchedCategory.id,
        date,
        notes: `Extracted via Voice input. Merchant: ${merchant}`
      },
      include: { category: true }
    });

    return NextResponse.json({
      amount: expense.amount,
      category: expense.category.name,
      date: expense.date.toISOString().split("T")[0],
      merchant,
      expenseId: expense.id
    });

  } catch (error) {
    console.error("Voice Processing Error:", error);
    return NextResponse.json({ error: "Failed to process voice entry" }, { status: 500 });
  }
}
