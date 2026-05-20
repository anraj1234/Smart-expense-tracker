"use server";

import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { startOfMonth, endOfMonth } from "date-fns";

export async function computeHealthScore(month: number, year: number) {
  const userId = MOCK_USER.id;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get total expenses for the month
  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: startDate, lte: endDate }, deletedAt: null },
    include: { category: true }
  });

  const totalSpend = expenses.reduce((sum: number, exp) => sum + exp.amount, 0);

  // Assumed income for savings ratio (could be fetched from User model if added)
  // For now, we will assume income is 1.5x of total spend + some buffer to simulate savings
  const assumedIncome = 5000; 
  
  // 1. Savings Ratio (30%)
  // savings = income - spend. 0% savings = 0, 30%+ savings = 30 pts
  let savingsRatio = assumedIncome > 0 ? (assumedIncome - totalSpend) / assumedIncome : 0;
  if (savingsRatio < 0) savingsRatio = 0;
  const savingsComp = Math.min(30, Math.round((savingsRatio / 0.3) * 30));

  // 2. Budget Adherence (30%)
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year }
  });
  
  let budgetComp = 30; // default to perfect if no budgets
  if (budgets.length > 0) {
    let totalBudget = 0;
    let totalBudgetedSpend = 0;
    
    // Quick approximation
    budgets.forEach(b => totalBudget += b.amount);
    // Let's just compare total budget vs total spend for simplicity, or we can do per category
    const adherenceRatio = totalBudget > 0 ? totalSpend / totalBudget : 1;
    if (adherenceRatio > 1) {
      budgetComp = Math.max(0, 30 - Math.round((adherenceRatio - 1) * 30));
    }
  }

  // 3. Category Balance (20%)
  // No single category should exceed 40% of total spend
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
  });
  
  let maxCategoryRatio = 0;
  if (totalSpend > 0) {
    const maxCatSpend = Math.max(...Object.values(categoryTotals));
    maxCategoryRatio = maxCatSpend / totalSpend;
  }
  
  let balanceComp = 20;
  if (maxCategoryRatio > 0.4) {
    balanceComp = Math.max(0, 20 - Math.round((maxCategoryRatio - 0.4) * 40));
  }

  // 4. Spending Consistency (20%)
  // Simplified: 20 pts minus penalty for huge single expenses (e.g. > 20% of total)
  let consistency = 20;
  if (totalSpend > 0) {
    const hasHugeExpense = expenses.some(e => e.amount > totalSpend * 0.3);
    if (hasHugeExpense) consistency -= 10;
  }

  const score = savingsComp + budgetComp + balanceComp + consistency;
  
  let badge = "On Track";
  if (score >= 90) badge = "Financial Champion";
  else if (score >= 75) badge = "Smart Spender";
  else if (score >= 60) badge = "On Track";
  else if (score >= 40) badge = "Needs Work";
  else badge = "At Risk";

  // Upsert the score
  const healthScore = await prisma.healthScore.upsert({
    where: {
      userId_month_year: { userId, month, year }
    },
    update: {
      score, savingsComp, budgetComp, balanceComp, consistency, badge
    },
    create: {
      userId, month, year, score, savingsComp, budgetComp, balanceComp, consistency, badge
    }
  });

  return healthScore;
}
