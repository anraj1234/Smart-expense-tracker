"use server";

import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function triggerMockAlerts() {
  const userId = MOCK_USER.id;

  const mockAlerts = [
    {
      title: "Budget Limit Warning",
      message: "You have spent 80% of your Food & Dining budget.",
      type: "warning"
    },
    {
      title: "Unusual Expense Detected",
      message: "A single expense of $450 was flagged. This is 2x your average.",
      type: "alert"
    },
    {
      title: "Subscription Renewal Due",
      message: "Your Netflix subscription ($15.99) will renew in 3 days.",
      type: "info"
    }
  ];

  // Insert randomly one of the mock alerts
  const randomAlert = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];

  await prisma.notification.create({
    data: {
      userId,
      title: randomAlert.title,
      message: randomAlert.message,
      type: randomAlert.type,
      isRead: false
    }
  });

  revalidatePath("/");
  
  return { success: true };
}
