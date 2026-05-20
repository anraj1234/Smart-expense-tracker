"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(userId: string, data: { name: string; currency: string }) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        currency: data.currency,
      }
    });

    revalidatePath("/");
    revalidatePath("/settings");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
