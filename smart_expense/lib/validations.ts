import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1).max(5).default("USD"),
  description: z.string().min(1, "Description is required").max(500),
  date: z.string().transform((s) => new Date(s)),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().default("tag"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").default("#6B7280"),
});

export const createBudgetSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  categoryId: z.string().optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
