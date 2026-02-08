import { Router, Response } from "express";
import { connectDB } from "../config/database";
import Task from "../models/Task";
import Habit from "../models/Habit";
import HabitCompletion from "../models/HabitCompletion";
import Expense from "../models/Expense";
import TimeEntry from "../models/TimeEntry";
import Goal from "../models/Goal";
import StudySession from "../models/StudySession";
import JournalEntry from "../models/JournalEntry";
import UserSettings from "../models/UserSettings";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    await connectDB();

    const [
      tasksRaw,
      habitsRaw,
      completionsRaw,
      transactionsRaw,
      timeEntriesRaw,
      goalsRaw,
      studySessionsRaw,
      journalEntriesRaw,
      settingsDoc,
    ] = await Promise.all([
      Task.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      Habit.find({ userId, deletedAt: null }).lean(),
      HabitCompletion.find({ userId }).sort({ date: -1 }).lean(),
      Expense.find({ userId, deletedAt: null }).sort({ date: -1 }).lean(),
      TimeEntry.find({ userId, deletedAt: null }).sort({ date: -1 }).lean(),
      Goal.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      StudySession.find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .lean(),
      JournalEntry.find({ userId }).sort({ date: -1 }).lean(),
      UserSettings.findOne({ userId }).lean(),
    ]);

    const completionsByHabit = new Map<
      string,
      Array<{ date: string; completed: boolean; note?: string }>
    >();
    for (const c of completionsRaw as any[]) {
      const hid = c.habitId.toString();
      if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
      completionsByHabit
        .get(hid)!
        .push({ date: c.date, completed: c.completed, note: c.note });
    }

    const tasks = (tasksRaw as any[]).map((r) => ({
      id: r._id.toString(),
      title: r.title,
      description: r.description,
      domain: r.domain,
      priority: r.priority,
      status: r.status,
      dueDate: r.dueDate,
      dueTime: r.dueTime,
      scheduledFor: r.scheduledFor,
      timeEstimate: r.timeEstimate,
      timeSpent: r.timeSpent,
      completedAt: r.completedAt,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      subtasks: r.subtasks || [],
      tags: r.tags || [],
      linkedGoalId: r.linkedGoalId,
      recurrence: r.recurrence,
    }));

    const habits = (habitsRaw as any[]).map((r) => ({
      id: r._id.toString(),
      name: r.name,
      description: r.description,
      category: r.category,
      frequency: r.frequency,
      customDays: r.customDays,
      color: r.color,
      streak: r.streak || 0,
      longestStreak: r.longestStreak || 0,
      active: r.active,
      targetDaysPerWeek: r.targetDaysPerWeek,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      completions: completionsByHabit.get(r._id.toString()) || [],
      linkedGoalIds: r.linkedGoalIds || [],
      targetTime: r.targetTime,
      duration: r.duration,
    }));

    const transactions = (transactionsRaw as any[]).map((r) => ({
      id: r._id.toString(),
      category: r.category,
      amount: Number(r.amount),
      description: r.description || "",
      date: r.date,
      type: r.type,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      linkedGoalId: r.linkedGoalId,
      recurring: r.recurring,
      vendor: r.vendor,
    }));

    const timeEntries = (timeEntriesRaw as any[]).map((r) => ({
      id: r._id.toString(),
      task: r.task,
      category: r.category,
      duration: r.duration,
      date: r.date,
      focusQuality: r.focusQuality,
      interruptions: r.interruptions,
      notes: r.notes,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    }));

    const goals = (goalsRaw as any[]).map((r) => ({
      id: r._id.toString(),
      title: r.title,
      description: r.description || "",
      category: r.category || "personal",
      priority: r.priority || "medium",
      targetDate: r.targetDate || "",
      progress: r.progress || 0,
      status: r.status,
      milestones: r.milestones || [],
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      completedAt: r.completedAt,
      level: r.level || "yearly",
      parentGoalId: r.parentGoalId,
      childGoalIds: r.childGoalIds || [],
      linkedHabitIds: r.linkedHabitIds || [],
      linkedTaskIds: r.linkedTaskIds || [],
      aiRoadmap: r.aiRoadmap,
    }));

    const studySessions = (studySessionsRaw as any[]).map((r) => ({
      id: r._id.toString(),
      subject: r.subject,
      topic: r.topic,
      duration: r.duration,
      pomodoros: r.pomodoros,
      difficulty: r.difficulty,
      notes: r.notes,
      startTime: r.startTime,
      endTime: r.endTime,
      retention: r.retention,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    }));

    const journalEntries = (journalEntriesRaw as any[]).map((r) => ({
      id: r._id.toString(),
      date: r.date,
      title: r.title,
      content: r.content,
      mood: r.mood,
      energy: r.energy,
      focus: r.focus,
      stress: r.stress,
      tags: r.tags || [],
      aiSummary: r.aiSummary,
      aiSentiment: r.aiSentiment,
      aiThemes: r.aiThemes || [],
      aiInsights: r.aiInsights,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      linkedGoalIds: r.linkedGoalIds || [],
      linkedHabitIds: r.linkedHabitIds || [],
      linkedTaskIds: r.linkedTaskIds || [],
      gratitudeList: r.gratitudeList || [],
    }));

    const settings = (settingsDoc as any)?.settings || null;

    res.json({
      tasks,
      habits,
      transactions,
      timeEntries,
      goals,
      studySessions,
      journalEntries,
      settings,
    });
  } catch (error) {
    console.error("GET user-data error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

export default router;
