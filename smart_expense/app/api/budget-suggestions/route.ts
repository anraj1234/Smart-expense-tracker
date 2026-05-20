import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const suggestions = await prisma.budgetSuggestion.findMany({
      where: { userId: MOCK_USER.id, month, year }
    });
    
    return NextResponse.json({ data: suggestions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
