import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations";
import { MOCK_USER } from "@/lib/constants";

// GET /api/categories
export async function GET() {
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId: null }, { userId: MOCK_USER.id }],
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories });
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: { ...parsed, userId: MOCK_USER.id },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
