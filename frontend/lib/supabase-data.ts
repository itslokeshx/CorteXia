/**
 * ═══════════════════════════════════════════════════════════════
 * CORTEXIA — SUPABASE DATA LAYER
 *
 * Provides CRUD functions that sync AppContext state with Supabase.
 *
 * Strategy:
 *  • On login: Pull all user data from Supabase → hydrate AppContext
 *  • On mutations: Write to AppContext (instant) + async write to Supabase
 *  • Supabase is REQUIRED — no localStorage fallback
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from "@/lib/supabase";
import type {
  Task,
  Habit,
  HabitCompletion,
  Transaction,
  TimeEntry,
  Goal,
  StudySession,
  JournalEntry,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════
// FETCH ALL USER DATA (on login)
// ═══════════════════════════════════════════════════════════════

export interface SupabaseUserData {
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  timeEntries: TimeEntry[];
  goals: Goal[];
  studySessions: StudySession[];
  journalEntries: JournalEntry[];
  settings: Record<string, any> | null;
}

export async function fetchAllUserData(
  userId: string,
): Promise<SupabaseUserData> {
  const [
    tasksRes,
    habitsRes,
    habCompRes,
    transRes,
    timeRes,
    goalsRes,
    studyRes,
    journalRes,
    settingsRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("user_settings")
      .select("settings")
      .eq("user_id", userId)
      .single(),
  ]);

  // Group habit completions by habit
  const completionsByHabit = new Map<string, HabitCompletion[]>();
  if (habCompRes.data) {
    for (const c of habCompRes.data) {
      const hid = c.habit_id;
      if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
      completionsByHabit.get(hid)!.push({
        date: c.date,
        completed: c.completed,
        note: c.note,
      });
    }
  }

  // Map DB rows → frontend types
  const tasks: Task[] = (tasksRes.data || []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    domain: r.domain,
    priority: r.priority,
    status: r.status,
    dueDate: r.due_date,
    dueTime: r.due_time,
    scheduledFor: r.scheduled_for,
    timeEstimate: r.time_estimate,
    timeSpent: r.time_spent,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    subtasks: r.subtasks || [],
    tags: r.tags || [],
    linkedGoalId: r.linked_goal_id,
    recurrence: r.recurrence,
  }));

  const habits: Habit[] = (habitsRes.data || []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    frequency: r.frequency,
    customDays: r.custom_days,
    color: r.color,
    streak: r.streak || 0,
    longestStreak: r.longest_streak || 0,
    active: r.active,
    targetDaysPerWeek: r.target_days_per_week,
    createdAt: r.created_at,
    completions: completionsByHabit.get(r.id) || [],
    linkedGoalIds: r.linked_goal_ids || [],
    targetTime: r.target_time,
    duration: r.duration,
  }));

  const transactions: Transaction[] = (transRes.data || []).map((r) => ({
    id: r.id,
    category: r.category,
    amount: Number(r.amount),
    description: r.description || "",
    date: r.date,
    type: r.type,
    createdAt: r.created_at,
    linkedGoalId: r.linked_goal_id,
    recurring: r.recurring,
    vendor: r.vendor,
  }));

  const timeEntries: TimeEntry[] = (timeRes.data || []).map((r) => ({
    id: r.id,
    task: r.task,
    category: r.category,
    duration: r.duration,
    date: r.date,
    focusQuality: r.focus_quality,
    interruptions: r.interruptions,
    notes: r.notes,
    createdAt: r.created_at,
  }));

  const goals: Goal[] = (goalsRes.data || []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || "",
    category: r.category || "personal",
    priority: r.priority || "medium",
    targetDate: r.target_date || "",
    progress: r.progress || 0,
    status: r.status,
    milestones: r.milestones || [],
    createdAt: r.created_at,
    completedAt: r.completed_at,
    level: r.level || "yearly",
    parentGoalId: r.parent_goal_id,
    childGoalIds: [],
    linkedHabitIds: r.linked_habit_ids || [],
    linkedTaskIds: r.linked_task_ids || [],
    aiRoadmap: r.ai_roadmap,
  }));

  const studySessions: StudySession[] = (studyRes.data || []).map((r) => ({
    id: r.id,
    subject: r.subject,
    duration: r.duration,
    pomodoros: r.pomodoros,
    difficulty: r.difficulty,
    topic: r.topic,
    notes: r.notes,
    startTime: r.start_time || r.created_at,
    endTime: r.end_time || r.created_at,
    createdAt: r.created_at,
  }));

  const journalEntries: JournalEntry[] = (journalRes.data || []).map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title || "",
    content: r.content || "",
    mood: r.mood || 5,
    energy: r.energy || 5,
    focus: r.focus || 5,
    stress: r.stress,
    tags: r.tags || [],
    aiSummary: r.ai_summary,
    createdAt: r.created_at,
    linkedGoalIds: r.linked_goal_ids || [],
    linkedHabitIds: r.linked_habit_ids || [],
    linkedTaskIds: r.linked_task_ids || [],
    gratitudeList: r.gratitude_list || [],
    aiSentiment: r.ai_sentiment,
    aiThemes: r.ai_themes || [],
    aiInsights: r.ai_insights,
  }));

  return {
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
    settings: settingsRes.data?.settings || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// SYNC HELPERS — async write to Supabase after AppContext update
// ═══════════════════════════════════════════════════════════════

async function safeUpsert(table: string, data: Record<string, any>) {
  try {
    const { error } = await supabase.from(table).upsert(data);
    if (error) console.error(`Supabase upsert ${table}:`, error);
  } catch (err) {
    console.error(`Supabase upsert ${table} failed:`, err);
  }
}

async function safeDelete(table: string, id: string, userId: string) {
  try {
    // Soft delete
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) console.error(`Supabase delete ${table}:`, error);
  } catch (err) {
    console.error(`Supabase delete ${table} failed:`, err);
  }
}

// ─── TASKS ───
export async function syncTask(task: Task, userId: string) {
  await safeUpsert("tasks", {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description,
    domain: task.domain,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate || null,
    due_time: task.dueTime || null,
    scheduled_for: task.scheduledFor || null,
    time_estimate: task.timeEstimate,
    time_spent: task.timeSpent,
    completed_at: task.completedAt || null,
    subtasks: task.subtasks || [],
    tags: task.tags || [],
    linked_goal_id: task.linkedGoalId || null,
    recurrence: task.recurrence || null,
  });
}

export async function deleteTaskSync(taskId: string, userId: string) {
  await safeDelete("tasks", taskId, userId);
}

// ─── HABITS ───
export async function syncHabit(habit: Habit, userId: string) {
  await safeUpsert("habits", {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    description: habit.description,
    category: habit.category,
    frequency: habit.frequency,
    custom_days: habit.customDays,
    color: habit.color,
    streak: habit.streak,
    longest_streak: habit.longestStreak,
    active: habit.active,
    target_days_per_week: habit.targetDaysPerWeek,
    linked_goal_ids: habit.linkedGoalIds || [],
    target_time: habit.targetTime,
    duration: habit.duration,
  });
}

export async function syncHabitCompletion(
  habitId: string,
  userId: string,
  date: string,
  completed: boolean,
  note?: string,
) {
  try {
    const { error } = await supabase.from("habit_completions").upsert(
      {
        habit_id: habitId,
        user_id: userId,
        date,
        completed,
        note,
      },
      { onConflict: "habit_id,date" },
    );
    if (error) console.error("Sync habit completion:", error);
  } catch (err) {
    console.error("Sync habit completion failed:", err);
  }
}

export async function deleteHabitSync(habitId: string, userId: string) {
  await safeDelete("habits", habitId, userId);
}

// ─── TRANSACTIONS ───
export async function syncTransaction(tx: Transaction, userId: string) {
  await safeUpsert("transactions", {
    id: tx.id,
    user_id: userId,
    category: tx.category,
    amount: tx.amount,
    description: tx.description,
    date: tx.date,
    type: tx.type,
    linked_goal_id: tx.linkedGoalId || null,
    recurring: tx.recurring,
    vendor: tx.vendor,
  });
}

export async function deleteTransactionSync(txId: string, userId: string) {
  await safeDelete("transactions", txId, userId);
}

// ─── TIME ENTRIES ───
export async function syncTimeEntry(entry: TimeEntry, userId: string) {
  await safeUpsert("time_entries", {
    id: entry.id,
    user_id: userId,
    task: entry.task,
    category: entry.category,
    duration: entry.duration,
    date: entry.date,
    focus_quality: entry.focusQuality,
    interruptions: entry.interruptions,
    notes: entry.notes,
  });
}

export async function deleteTimeEntrySync(entryId: string, userId: string) {
  await safeDelete("time_entries", entryId, userId);
}

// ─── GOALS ───
export async function syncGoal(goal: Goal, userId: string) {
  await safeUpsert("goals", {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    level: goal.level,
    parent_goal_id: goal.parentGoalId || null,
    priority: goal.priority,
    target_date: goal.targetDate || null,
    progress: goal.progress,
    status: goal.status,
    milestones: goal.milestones || [],
    linked_habit_ids: goal.linkedHabitIds || [],
    linked_task_ids: goal.linkedTaskIds || [],
    ai_roadmap: goal.aiRoadmap || null,
    completed_at: goal.completedAt || null,
  });
}

export async function deleteGoalSync(goalId: string, userId: string) {
  await safeDelete("goals", goalId, userId);
}

// ─── STUDY SESSIONS ───
export async function syncStudySession(session: StudySession, userId: string) {
  await safeUpsert("study_sessions", {
    id: session.id,
    user_id: userId,
    subject: session.subject,
    duration: session.duration,
    pomodoros: session.pomodoros,
    difficulty: session.difficulty,
    topic: session.topic,
    notes: session.notes,
    start_time: session.startTime,
    end_time: session.endTime,
  });
}

export async function deleteStudySessionSync(
  sessionId: string,
  userId: string,
) {
  await safeDelete("study_sessions", sessionId, userId);
}

// ─── JOURNAL ───
export async function syncJournalEntry(entry: JournalEntry, userId: string) {
  try {
    const { error } = await supabase.from("journal_entries").upsert(
      {
        id: entry.id,
        user_id: userId,
        date: entry.date,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        energy: entry.energy,
        focus: entry.focus,
        stress: entry.stress,
        tags: entry.tags || [],
        gratitude_list: entry.gratitudeList || [],
        ai_summary: entry.aiSummary,
        ai_sentiment: entry.aiSentiment,
        ai_themes: entry.aiThemes || [],
        ai_insights: entry.aiInsights,
        linked_goal_ids: entry.linkedGoalIds || [],
        linked_habit_ids: entry.linkedHabitIds || [],
        linked_task_ids: entry.linkedTaskIds || [],
      },
      { onConflict: "user_id,date" },
    );
    if (error) console.error("Sync journal:", error);
  } catch (err) {
    console.error("Sync journal failed:", err);
  }
}

export async function deleteJournalEntrySync(entryId: string, userId: string) {
  try {
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);
    if (error) console.error("Delete journal:", error);
  } catch (err) {
    console.error("Delete journal failed:", err);
  }
}

// ─── SETTINGS ───
export async function syncSettings(
  settings: Record<string, any>,
  userId: string,
) {
  try {
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        settings,
      },
      { onConflict: "user_id" },
    );
    if (error) console.error("Sync settings:", error);
  } catch (err) {
    console.error("Sync settings failed:", err);
  }
}
