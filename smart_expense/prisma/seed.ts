import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Food & Dining", icon: "utensils", color: "#EF4444" },
  { name: "Transportation", icon: "car", color: "#F59E0B" },
  { name: "Shopping", icon: "shopping-bag", color: "#8B5CF6" },
  { name: "Entertainment", icon: "film", color: "#EC4899" },
  { name: "Bills & Utilities", icon: "zap", color: "#3B82F6" },
  { name: "Healthcare", icon: "heart", color: "#10B981" },
  { name: "Education", icon: "book-open", color: "#06B6D4" },
  { name: "Travel", icon: "plane", color: "#6366F1" },
  { name: "Groceries", icon: "apple", color: "#22C55E" },
  { name: "Other", icon: "tag", color: "#6B7280" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create mock user
  const user = await prisma.user.upsert({
    where: { id: "user_dev_001" },
    update: {},
    create: {
      id: "user_dev_001",
      email: "dev@smartexpense.app",
      name: "Dev User",
      currency: "USD",
    },
  });

  // Create categories
  const cats = [];
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { id: `cat_${c.name.toLowerCase().replace(/[^a-z]/g, "_")}` },
      update: {},
      create: {
        id: `cat_${c.name.toLowerCase().replace(/[^a-z]/g, "_")}`,
        name: c.name,
        icon: c.icon,
        color: c.color,
      },
    });
    cats.push(cat);
  }

  // Create sample expenses for last 3 months
  const now = new Date();
  const sampleExpenses = [
    { desc: "Starbucks Coffee", amount: 5.75, catIdx: 0 },
    { desc: "Uber to Office", amount: 12.50, catIdx: 1 },
    { desc: "Amazon Headphones", amount: 79.99, catIdx: 2 },
    { desc: "Netflix Subscription", amount: 15.99, catIdx: 3 },
    { desc: "Electricity Bill", amount: 120.00, catIdx: 4 },
    { desc: "Gym Membership", amount: 45.00, catIdx: 5 },
    { desc: "Udemy Course", amount: 12.99, catIdx: 6 },
    { desc: "Weekend Trip Gas", amount: 55.00, catIdx: 7 },
    { desc: "Weekly Groceries", amount: 89.50, catIdx: 8 },
    { desc: "Pizza Night", amount: 32.00, catIdx: 0 },
    { desc: "Bus Pass Monthly", amount: 65.00, catIdx: 1 },
    { desc: "New Shoes", amount: 129.99, catIdx: 2 },
    { desc: "Spotify Premium", amount: 9.99, catIdx: 3 },
    { desc: "Water Bill", amount: 45.00, catIdx: 4 },
    { desc: "Pharmacy", amount: 23.50, catIdx: 5 },
    { desc: "Online Workshop", amount: 49.99, catIdx: 6 },
    { desc: "Flight Tickets", amount: 320.00, catIdx: 7 },
    { desc: "Organic Market", amount: 67.30, catIdx: 8 },
    { desc: "Lunch Meeting", amount: 48.00, catIdx: 0 },
    { desc: "Misc Supplies", amount: 15.00, catIdx: 9 },
  ];

  // Delete existing expenses
  await prisma.expense.deleteMany({ where: { userId: user.id } });

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    for (const exp of sampleExpenses) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
      await prisma.expense.create({
        data: {
          amount: exp.amount * (0.8 + Math.random() * 0.4),
          currency: "USD",
          description: exp.desc,
          date,
          categoryId: cats[exp.catIdx].id,
          userId: user.id,
          tags: JSON.stringify([]),
        },
      });
    }
  }

  // Create sample budgets
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  const budgets = [
    { catIdx: 0, amount: 200 },
    { catIdx: 1, amount: 150 },
    { catIdx: 2, amount: 300 },
    { catIdx: 8, amount: 400 },
    { catIdx: 4, amount: 250 },
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: {
        amount: b.amount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        categoryId: cats[b.catIdx].id,
        userId: user.id,
      },
    });
  }

  console.log("✅ Seeded: 1 user, 10 categories, 60 expenses, 5 budgets");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
