import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, and, gte, desc } from "drizzle-orm";
import { subDays, startOfMonth, format } from "date-fns";

const financeRouter = new Hono();

const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  merchant: z.string().optional(),
  paymentMethod: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Mock data
let mockTransactions: any[] = [
  {
    id: 1,
    userId: 1,
    type: "expense",
    amount: 45.5,
    category: "food",
    description: "Grocery shopping",
    date: new Date().toISOString(),
    merchant: "Whole Foods",
    paymentMethod: "card",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    type: "expense",
    amount: 120.0,
    category: "transport",
    description: "Monthly bus pass",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "card",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    type: "income",
    amount: 5000.0,
    category: "salary",
    description: "Monthly salary",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    userId: 1,
    type: "expense",
    amount: 15.99,
    category: "entertainment",
    description: "Netflix subscription",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: "card",
    createdAt: new Date().toISOString(),
  },
];
let mockTransactionIdCounter = 5;

let mockBudgets: any[] = [
  { id: 1, userId: 1, category: "food", limit: 500, period: "monthly" },
  { id: 2, userId: 1, category: "transport", limit: 200, period: "monthly" },
  {
    id: 3,
    userId: 1,
    category: "entertainment",
    limit: 100,
    period: "monthly",
  },
];

// GET /api/finance/transactions - Get transactions
financeRouter.get("/transactions", async (c) => {
  try {
    const userId = 1;
    const days = parseInt(c.req.query("days") || "30");
    const type = c.req.query("type");
    const category = c.req.query("category");

    const startDate = subDays(new Date(), days);

    if (!db) {
      let filtered = mockTransactions.filter(
        (t) => new Date(t.date) >= startDate,
      );
      if (type) filtered = filtered.filter((t) => t.type === type);
      if (category) filtered = filtered.filter((t) => t.category === category);
      return c.json({ transactions: filtered });
    }

    let transactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          gte(schema.transactions.date, startDate),
        ),
      )
      .orderBy(desc(schema.transactions.date));

    if (type) transactions = transactions.filter((t) => t.type === type);
    if (category)
      transactions = transactions.filter((t) => t.category === category);

    return c.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return c.json({ error: "Failed to fetch transactions" }, 500);
  }
});

// POST /api/finance/transactions - Create transaction
financeRouter.post("/transactions", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();
    const validated = createTransactionSchema.parse(body);

    if (!db) {
      const newTransaction = {
        id: mockTransactionIdCounter++,
        userId,
        ...validated,
        createdAt: new Date().toISOString(),
      };
      mockTransactions.unshift(newTransaction);
      return c.json({ transaction: newTransaction }, 201);
    }

    const newTransaction = await db
      .insert(schema.transactions)
      .values({
        userId,
        ...validated,
        date: new Date(validated.date),
      })
      .returning();

    return c.json({ transaction: newTransaction[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating transaction:", error);
    return c.json({ error: "Failed to create transaction" }, 500);
  }
});

// DELETE /api/finance/transactions/:id - Delete transaction
financeRouter.delete("/transactions/:id", async (c) => {
  try {
    const transactionId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const index = mockTransactions.findIndex((t) => t.id === transactionId);
      if (index === -1) return c.json({ error: "Transaction not found" }, 404);
      mockTransactions.splice(index, 1);
      return c.json({ message: "Transaction deleted successfully" });
    }

    const deleted = await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, transactionId),
          eq(schema.transactions.userId, userId),
        ),
      )
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    return c.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return c.json({ error: "Failed to delete transaction" }, 500);
  }
});

// GET /api/finance/stats - Get finance statistics
financeRouter.get("/stats", async (c) => {
  try {
    const userId = 1;
    const period = c.req.query("period") || "month"; // month or week

    const startDate =
      period === "week" ? subDays(new Date(), 7) : startOfMonth(new Date());

    if (!db) {
      const periodTransactions = mockTransactions.filter(
        (t) => new Date(t.date) >= startDate,
      );

      const income = periodTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = periodTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const byCategory = periodTransactions
        .filter((t) => t.type === "expense")
        .reduce(
          (acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          },
          {} as Record<string, number>,
        );

      return c.json({
        income,
        expenses,
        balance: income - expenses,
        byCategory,
        transactionCount: periodTransactions.length,
      });
    }

    return c.json({
      income: 0,
      expenses: 0,
      balance: 0,
      byCategory: {},
      transactionCount: 0,
    });
  } catch (error) {
    console.error("Error fetching finance stats:", error);
    return c.json({ error: "Failed to fetch finance stats" }, 500);
  }
});

// GET /api/finance/budgets - Get budgets
financeRouter.get("/budgets", async (c) => {
  try {
    const userId = 1;

    if (!db) {
      // Calculate spent for each budget
      const monthStart = startOfMonth(new Date());
      const budgetsWithSpent = mockBudgets.map((budget) => {
        const spent = mockTransactions
          .filter(
            (t) =>
              t.type === "expense" &&
              t.category === budget.category &&
              new Date(t.date) >= monthStart,
          )
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          ...budget,
          spent,
          percentage: Math.round((spent / budget.limit) * 100),
        };
      });

      return c.json({ budgets: budgetsWithSpent });
    }

    return c.json({ budgets: [] });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return c.json({ error: "Failed to fetch budgets" }, 500);
  }
});

// POST /api/finance/budgets - Create/update budget
financeRouter.post("/budgets", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();

    if (!db) {
      const existing = mockBudgets.findIndex(
        (b) => b.category === body.category,
      );
      if (existing >= 0) {
        mockBudgets[existing] = { ...mockBudgets[existing], ...body };
        return c.json({ budget: mockBudgets[existing] });
      }
      const newBudget = {
        id: mockBudgets.length + 1,
        userId,
        ...body,
        createdAt: new Date().toISOString(),
      };
      mockBudgets.push(newBudget);
      return c.json({ budget: newBudget }, 201);
    }

    return c.json({ budget: null }, 201);
  } catch (error) {
    console.error("Error creating budget:", error);
    return c.json({ error: "Failed to create budget" }, 500);
  }
});

export default financeRouter;
