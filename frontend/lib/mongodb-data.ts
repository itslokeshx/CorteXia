/**
 * ═══════════════════════════════════════════════════════════════
 * CORTEXIA — MONGODB DATA LAYER (Client → Backend API)
 *
 * Provides CRUD functions that sync AppContext state with MongoDB
 * via the Express backend API.
 *
 * Strategy:
 *  • On login: Pull all user data from backend → hydrate AppContext
 *  • On mutations: Write to AppContext (instant) + async write to backend
 *  • All requests include JWT Bearer token from localStorage
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  Task,
  Habit,
  Transaction,
  TimeEntry,
  Goal,
  StudySession,
  JournalEntry,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("cortexia_token")
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════
// FETCH ALL USER DATA (on login)
// ═══════════════════════════════════════════════════════════════

export interface MongoUserData {
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  timeEntries: TimeEntry[];
  goals: Goal[];
  studySessions: StudySession[];
  journalEntries: JournalEntry[];
  settings: Record<string, any> | null;
}

export async function fetchAllUserData(): Promise<MongoUserData> {
  const res = await fetch(`${API_URL}/api/user-data`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch user data");
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// SYNC FUNCTIONS — Write individual records to backend
// ═══════════════════════════════════════════════════════════════

// Tasks
export async function syncTask(task: Task): Promise<void> {
  try {
    if (task.id.startsWith("demo-") || task.id.includes("-")) {
      await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
      });
    } else {
      await fetch(`${API_URL}/api/tasks`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
      });
    }
  } catch (err) {
    console.error("syncTask error:", err);
  }
}

export async function deleteTaskSync(taskId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/tasks?id=${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteTaskSync error:", err);
  }
}

// Habits
export async function syncHabit(
  habit: Omit<Habit, "completions">,
): Promise<void> {
  try {
    if (habit.id.startsWith("demo-") || habit.id.includes("-")) {
      await fetch(`${API_URL}/api/habits`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(habit),
      });
    } else {
      await fetch(`${API_URL}/api/habits`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(habit),
      });
    }
  } catch (err) {
    console.error("syncHabit error:", err);
  }
}

export async function syncHabitCompletion(
  habitId: string,
  date: string,
  completed: boolean,
  note?: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/habit-completions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ habitId, date, completed, note }),
    });
  } catch (err) {
    console.error("syncHabitCompletion error:", err);
  }
}

export async function deleteHabitSync(habitId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/habits?id=${habitId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteHabitSync error:", err);
  }
}

// Transactions (Expenses)
export async function syncTransaction(transaction: Transaction): Promise<void> {
  try {
    if (transaction.id.startsWith("demo-") || transaction.id.includes("-")) {
      await fetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
      });
    } else {
      await fetch(`${API_URL}/api/expenses`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
      });
    }
  } catch (err) {
    console.error("syncTransaction error:", err);
  }
}

export async function deleteTransactionSync(
  transactionId: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/expenses?id=${transactionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteTransactionSync error:", err);
  }
}

// Time Entries
export async function syncTimeEntry(entry: TimeEntry): Promise<void> {
  try {
    if (entry.id.startsWith("demo-") || entry.id.includes("-")) {
      await fetch(`${API_URL}/api/time-entries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(entry),
      });
    } else {
      await fetch(`${API_URL}/api/time-entries`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(entry),
      });
    }
  } catch (err) {
    console.error("syncTimeEntry error:", err);
  }
}

export async function deleteTimeEntrySync(entryId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/time-entries?id=${entryId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteTimeEntrySync error:", err);
  }
}

// Goals
export async function syncGoal(goal: Goal): Promise<void> {
  try {
    if (goal.id.startsWith("demo-") || goal.id.includes("-")) {
      await fetch(`${API_URL}/api/goals`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(goal),
      });
    } else {
      await fetch(`${API_URL}/api/goals`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(goal),
      });
    }
  } catch (err) {
    console.error("syncGoal error:", err);
  }
}

export async function deleteGoalSync(goalId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/goals?id=${goalId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteGoalSync error:", err);
  }
}

// Study Sessions
export async function syncStudySession(session: StudySession): Promise<void> {
  try {
    if (session.id.startsWith("demo-") || session.id.includes("-")) {
      await fetch(`${API_URL}/api/study-sessions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(session),
      });
    } else {
      await fetch(`${API_URL}/api/study-sessions`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(session),
      });
    }
  } catch (err) {
    console.error("syncStudySession error:", err);
  }
}

export async function deleteStudySessionSync(sessionId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/study-sessions?id=${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteStudySessionSync error:", err);
  }
}

// Journal Entries
export async function syncJournalEntry(entry: JournalEntry): Promise<void> {
  try {
    if (entry.id.startsWith("demo-") || entry.id.includes("-")) {
      await fetch(`${API_URL}/api/journal`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(entry),
      });
    } else {
      await fetch(`${API_URL}/api/journal`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(entry),
      });
    }
  } catch (err) {
    console.error("syncJournalEntry error:", err);
  }
}

export async function deleteJournalEntrySync(entryId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/journal?id=${entryId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error("deleteJournalEntrySync error:", err);
  }
}

// Settings
export async function syncSettings(
  settings: Record<string, any>,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
  } catch (err) {
    console.error("syncSettings error:", err);
  }
}
