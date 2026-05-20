// lib/ai.ts
// All AI functions degrade gracefully to mock data when GROQ_API_KEY is missing.

function getGroqClient() {
  try {
    // Dynamic import to avoid crashing if key is missing
    const Groq = require("groq-sdk");
    if (!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY");
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch {
    return null;
  }
}

export async function generateSpendingSummary(
  expenses: any[],
  monthName: string,
  totalSpent: number,
  categoryBreakdown: Record<string, number>
) {
  const groq = getGroqClient();

  if (groq) {
    try {
      const topCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
        .join(", ");

      const prompt = `You are a friendly financial advisor AI.
The user's spending summary for ${monthName}:
- Total Spent: $${totalSpent.toFixed(2)}
- Top Categories: ${topCategories}
- Number of transactions: ${expenses.length}

Write a friendly 3-paragraph summary of their spending habits. Be encouraging, specific, and mention the top category.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful and concise financial advisor." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_completion_tokens: 500,
      });
      return completion.choices[0]?.message?.content || buildMockSummary(monthName, totalSpent, categoryBreakdown);
    } catch {
      // fall through to mock
    }
  }

  return buildMockSummary(monthName, totalSpent, categoryBreakdown);
}

export async function generateBudgetAdvice(
  budgets: any[],
  categoryBreakdown: Record<string, number>
) {
  const groq = getGroqClient();

  if (groq) {
    try {
      const budgetLines = budgets.map(b => {
        const actual = categoryBreakdown[b.category?.name || ""] || 0;
        return `${b.category?.name || "General"}: Budget $${b.amount}, Spent $${actual.toFixed(2)}`;
      }).join("\n");

      const prompt = `You are a financial advisor. Analyze these budgets vs actual spending:
${budgetLines || "No budgets set yet."}

Output ONLY valid JSON in this format, nothing else:
{"recommendations":[{"advice":"string","priority":"high"|"medium"|"low"}]}`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You output strict JSON only." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      if (parsed.recommendations?.length) return parsed;
    } catch {
      // fall through to mock
    }
  }

  return buildMockAdvice(categoryBreakdown);
}

// ===== Mock builders using real data =====

function buildMockSummary(
  monthName: string,
  totalSpent: number,
  categoryBreakdown: Record<string, number>
) {
  const sorted = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const topName = top ? top[0] : "General";
  const topAmt = top ? top[1].toFixed(2) : "0.00";
  const topPct = top && totalSpent > 0 ? ((top[1] / totalSpent) * 100).toFixed(0) : 0;

  return `In ${monthName}, you spent a total of $${totalSpent.toFixed(2)} across ${sorted.length} categories. Your biggest area was ${topName}, which made up ${topPct}% of your total spend at $${topAmt}.

${sorted.length > 1 ? `Your remaining spending was distributed across ${sorted.slice(1).map(([c]) => c).join(", ")} — a healthy spread across multiple categories.` : "Keeping expenses focused can help you track spending more accurately."}

Keep up the momentum! Logging every expense consistently is the #1 habit of financially healthy people. You're on your way to becoming a top saver this month! 🎯`;
}

function buildMockAdvice(categoryBreakdown: Record<string, number>) {
  const sorted = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];

  const recommendations = [];

  if (top) {
    recommendations.push({
      advice: `Your top spending category is "${top[0]}" at $${top[1].toFixed(2)}. Consider setting a monthly budget cap to keep this in check.`,
      priority: "high"
    });
  }

  if (sorted.length > 1) {
    recommendations.push({
      advice: `You have ${sorted.length} active spending categories. Consolidating similar expenses can reduce your total outflow by 10-15%.`,
      priority: "medium"
    });
  }

  recommendations.push({
    advice: "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Reviewing your categories against this split can unlock significant savings.",
    priority: "low"
  });

  return { recommendations };
}
