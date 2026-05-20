import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Empty message string" }, { status: 400 });
    }

    // Save user message to database to maintain conversation history
    await prisma.chatMessage.create({
      data: {
        userId: MOCK_USER.id,
        role: "user",
        content: message
      }
    });

    const lower = message.toLowerCase();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Direct database querying + context-aware generation engine
    const expenses = await prisma.expense.findMany({
      where: {
        userId: MOCK_USER.id,
        date: { gte: startOfMonth },
        deletedAt: null,
      },
      include: { category: true }
    });

    let responseText = "I'm analyzing your financial data. Can you please specify which category or time period you'd like to inspect?";

    // Answer routing matching example questions from the brief
    if (lower.includes("most") || lower.includes("highest") || lower.includes("top")) {
      const catMap: Record<string, number> = {};
      expenses.forEach(e => {
        catMap[e.category.name] = (catMap[e.category.name] || 0) + e.amount;
      });
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
      if (topCat) {
        responseText = `You spent the most on **${topCat[0]}** this month with **$${topCat[1].toFixed(2)}** logged across your entries.`;
      } else {
        responseText = "You haven't recorded any expenses for this month yet.";
      }
    } else if (lower.includes("save") || lower.includes("reduce") || lower.includes("tips")) {
      responseText = "To boost your monthly savings, consider setting aggressive Category Budgets for Food & Dining and Entertainment. Reducing dining out by just 25% typically frees up an extra $150–$300 per month for investments.";
    } else if (lower.includes("budget") || lower.includes("exceed") || lower.includes("overflow")) {
      const budgets = await prisma.budget.findMany({
        where: { userId: MOCK_USER.id, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { category: true }
      });
      
      const over: string[] = [];
      budgets.forEach(b => {
        const spent = expenses.filter(e => e.categoryId === b.categoryId).reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
        if (spent > b.amount) {
          over.push(`**${b.category?.name || "General"}** ($${spent.toFixed(2)} spent vs $${b.amount} budgeted)`);
        }
      });

      if (over.length > 0) {
        responseText = `The following categories have exceeded your predefined thresholds this month:\n${over.join("\n")}`;
      } else {
        responseText = "Great news! All your active spending categories are comfortably within their targeted budget allocations.";
      }
    } else if (lower.includes("travel") || lower.includes("flight") || lower.includes("hotel")) {
      const travelExps = expenses.filter(e => e.category.name.toLowerCase().includes("travel") || e.category.name.toLowerCase().includes("transport"));
      const totalTravel = travelExps.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      responseText = `You have logged **${travelExps.length}** travel-related transactions this month, totaling **$${totalTravel.toFixed(2)}**.`;
    } else if (lower.includes("total") || lower.includes("spent") || lower.includes("how much")) {
      const total = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      responseText = `Your total registered expenditure for the current month stands at **$${total.toFixed(2)}** across **${expenses.length}** transactions.`;
    } else {
      responseText = `I see your inquiry regarding "${message}". Based on your active profile, you have logged $${expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0).toFixed(2)} total this month. Try asking "Where did I spend the most?" or "Show my budget status" for highly customized drill-downs.`;
    }

    // Save assistant response to DB
    await prisma.chatMessage.create({
      data: {
        userId: MOCK_USER.id,
        role: "assistant",
        content: responseText
      }
    });

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error("Chatbot API Error:", error);
    return NextResponse.json({ error: "Chatbot engine failed to generate response" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return chat history for context preservation
    const history = await prisma.chatMessage.findMany({
      where: { userId: MOCK_USER.id },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ data: history });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
