"use server";

import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export type InsightType = "savings" | "warning" | "neutral";

export type MockInsight = {
  id: string;
  type: InsightType;
  message: string;
};

export async function generateMockInsights(month: number, year: number) {
  const userId = MOCK_USER.id;

  // Mock Gemini Response
  const mockInsights: MockInsight[] = [
    {
      id: "1",
      type: "warning",
      message: "You spent 42% more on Food this month compared to last month.",
    },
    {
      id: "2",
      type: "neutral",
      message: "Weekend spending is unusually high — $420 vs $180 on weekdays.",
    },
    {
      id: "3",
      type: "savings",
      message: "You can save $300/month by reducing dining expenses by 30%.",
    },
  ];

  const stringified = JSON.stringify(mockInsights);

  const insight = await prisma.aIInsight.upsert({
    where: {
      userId_month_year: { userId, month, year }
    },
    update: {
      insights: stringified
    },
    create: {
      userId,
      month,
      year,
      insights: stringified
    }
  });

  return JSON.parse(insight.insights) as MockInsight[];
}

export async function getInsights(month: number, year: number) {
  const userId = MOCK_USER.id;
  
  const insight = await prisma.aIInsight.findUnique({
    where: {
      userId_month_year: { userId, month, year }
    }
  });

  if (!insight) {
    return null;
  }

  return JSON.parse(insight.insights) as MockInsight[];
}
