"use server";

import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const notifications = await prisma.notification.findMany({
    where: { userId: MOCK_USER.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return notifications;
}

export async function markAsRead(id: string) {
  await prisma.notification.update({
    where: { id, userId: MOCK_USER.id },
    data: { read: true },
  });
  revalidatePath("/");
}

export async function markAllAsRead() {
  await prisma.notification.updateMany({
    where: { userId: MOCK_USER.id, read: false },
    data: { read: true },
  });
  revalidatePath("/");
}

// Helper to seed some initial notifications if none exist
export async function seedInitialNotifications() {
  const count = await prisma.notification.count({
    where: { userId: MOCK_USER.id }
  });

  if (count === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: MOCK_USER.id,
          title: "Welcome to SmartExpense!",
          message: "Start tracking your expenses to get personalized AI insights.",
          type: "info",
        },
        {
          userId: MOCK_USER.id,
          title: "Budget Alert",
          message: "You've used 80% of your budget for Groceries this month.",
          type: "warning",
        },
        {
          userId: MOCK_USER.id,
          title: "Monthly Report Ready",
          message: "Your expense report for last month is ready to download.",
          type: "success",
        }
      ]
    });
  }
}
