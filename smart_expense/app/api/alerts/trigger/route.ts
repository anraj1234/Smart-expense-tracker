import { NextResponse } from "next/server";
import { triggerMockAlerts } from "@/app/actions/alerts";

export async function POST() {
  try {
    const res = await triggerMockAlerts();
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: "Failed to trigger alert" }, { status: 500 });
  }
}
