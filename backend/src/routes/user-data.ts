import { Router, Response } from "express";
import { Types } from "mongoose";
import { connectDB } from "../config/database";
import Task from "../models/Task";
import Habit from "../models/Habit";
import HabitCompletion from "../models/HabitCompletion";
import Expense from "../models/Expense";
import TimeEntry from "../models/TimeEntry";
import Goal from "../models/Goal";
import StudySession from "../models/StudySession";
import JournalEntry from "../models/JournalEntry";
import TimeBlock from "../models/TimeBlock";
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
      timeBlocksRaw,
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
      TimeBlock.find({ userId, deletedAt: null }).sort({ date: 1, startTime: 1 }).lean(),
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

    const timeBlocks = ((timeBlocksRaw as any) || []).map((r: any) => ({
      id: r._id.toString(),
      title: r.title,
      description: r.description,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      duration: r.duration,
      type: r.type,
      status: r.status,
      linkedTaskId: r.linkedTaskId,
      linkedHabitId: r.linkedHabitId,
      linkedGoalId: r.linkedGoalId,
      color: r.color,
      aiGenerated: r.aiGenerated,
      aiReason: r.aiReason,
      notes: r.notes,
      completed: r.completed,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    }));

    // Fix: settingsDoc was actually the last item in the array, userSettings is now at index 9
    // Wait, I messed up the destructuring order in the previous chunk.
    // Let me fix the destructuring first.
    // Actually, I can't check the array index easily here without seeing the whole file. 
    // The previous chunk added TimeBlock at index 8 (9th item), so UserSettings is at index 9 (10th item).
    // In the destructuring:
    // const [..., journalEntriesRaw, timeBlocksRaw, settingsDoc] ...
    // I need to be careful.
    // Let's rely on the variable names if possible, but it's array destructuring.


    const settings = (settingsDoc as any)?.settings || null;

    res.json({
      tasks,
      habits,
      transactions,
      timeEntries,
      goals,
      studySessions,
      journalEntries,
      timeBlocks,
      settings,
    });
  } catch (error) {
    console.error("GET user-data error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});


// ═══════════════════════════════════════════════════════════════
// IMPORT USER DATA (Bulk Insert with ID Remapping)
// ═══════════════════════════════════════════════════════════════

router.post("/import", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await connectDB();
    const data = req.body;

    // 1. Create a map of Old ID -> New ObjectId
    const idMap = new Map<string, Types.ObjectId>();

    const generateMap = (items: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (item.id) {
          idMap.set(item.id, new Types.ObjectId());
        }
      });
    };

    generateMap(data.tasks);
    generateMap(data.habits);
    generateMap(data.goals);
    generateMap(data.transactions);
    generateMap(data.timeEntries);
    generateMap(data.studySessions);
    generateMap(data.journalEntries);
    generateMap(data.timeBlocks);

    // Helper to get new ID or keep original if not found (though it should be found)
    const getNewId = (oldId?: string) =>
      oldId && idMap.has(oldId) ? idMap.get(oldId) : undefined;

    // Helper to remap IDs in an array of strings
    const remapIds = (ids?: string[]) =>
      ids?.map(id => getNewId(id)?.toString()).filter(Boolean) as string[] || [];

    // 2. Prepare data for insertion with new IDs and remapped references

    // TASKS
    const tasksToInsert = (data.tasks || []).map((t: any) => ({
      _id: getNewId(t.id),
      userId,
      title: t.title,
      description: t.description,
      domain: t.domain,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      scheduledFor: t.scheduledFor,
      timeEstimate: t.timeEstimate,
      timeSpent: t.timeSpent,
      completedAt: t.completedAt,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      subtasks: (t.subtasks || []).map((st: any) => ({
        id: st.id, // Subtask IDs can remain string-based or be regenerated if needed, but keeping them simple is fine
        title: st.title,
        completed: st.completed,
        completedAt: st.completedAt,
      })),
      tags: t.tags,
      linkedGoalId: getNewId(t.linkedGoalId)?.toString(),
      recurrence: t.recurrence,
    }));

    // HABITS
    const habitsToInsert = (data.habits || []).map((h: any) => ({
      _id: getNewId(h.id),
      userId,
      name: h.name,
      description: h.description,
      category: h.category,
      frequency: h.frequency,
      active: h.active,
      streak: h.streak,
      longestStreak: h.longestStreak,
      createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
      linkedGoalIds: remapIds(h.linkedGoalIds),
      targetTime: h.targetTime,
      duration: h.duration,
    }));

    // HABIT COMPLETIONS (Separate collection)
    const completionsToInsert: any[] = [];
    (data.habits || []).forEach((h: any) => {
      const newHabitId = getNewId(h.id);
      if (h.completions && Array.isArray(h.completions) && newHabitId) {
        h.completions.forEach((c: any) => {
          completionsToInsert.push({
            userId,
            habitId: newHabitId,
            date: c.date,
            completed: c.completed,
            note: c.note,
          });
        });
      }
    });

    // GOALS
    const goalsToInsert = (data.goals || []).map((g: any) => ({
      _id: getNewId(g.id),
      userId,
      title: g.title,
      description: g.description,
      category: g.category,
      priority: g.priority,
      targetDate: g.targetDate,
      progress: g.progress,
      status: g.status,
      level: g.level,
      createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
      completedAt: g.completedAt,
      milestones: (g.milestones || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        targetDate: m.targetDate,
        completed: m.completed,
        completedAt: m.completedAt,
      })),
      parentGoalId: getNewId(g.parentGoalId)?.toString(),
      childGoalIds: remapIds(g.childGoalIds),
      linkedHabitIds: remapIds(g.linkedHabitIds),
      linkedTaskIds: remapIds(g.linkedTaskIds),
    }));

    // TRANSACTIONS
    const transactionsToInsert = (data.transactions || []).map((t: any) => ({
      _id: getNewId(t.id),
      userId,
      category: t.category,
      amount: t.amount,
      description: t.description,
      date: t.date,
      type: t.type,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      linkedGoalId: getNewId(t.linkedGoalId)?.toString(),
      recurring: t.recurring,
      vendor: t.vendor,
    }));

    // TIME ENTRIES
    const timeEntriesToInsert = (data.timeEntries || []).map((t: any) => ({
      _id: getNewId(t.id),
      userId,
      task: t.task, // Keeping task name as string link for now, or could try to link by ID if strictly modeled
      category: t.category,
      duration: t.duration,
      date: t.date,
      focusQuality: t.focusQuality,
      interruptions: t.interruptions,
      notes: t.notes,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
    }));

    // STUDY SESSIONS
    const studySessionsToInsert = (data.studySessions || []).map((s: any) => ({
      _id: getNewId(s.id),
      userId,
      subject: s.subject,
      topic: s.topic,
      duration: s.duration,
      pomodoros: s.pomodoros,
      difficulty: s.difficulty,
      notes: s.notes,
      startTime: s.startTime,
      endTime: s.endTime,
      retention: s.retention,
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    }));

    // JOURNAL ENTRIES
    const journalEntriesToInsert = (data.journalEntries || []).map((j: any) => ({
      _id: getNewId(j.id),
      userId,
      date: j.date,
      title: j.title,
      content: j.content,
      mood: j.mood,
      energy: j.energy,
      focus: j.focus,
      stress: j.stress,
      tags: j.tags,
      aiSummary: j.aiSummary,
      createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
      linkedGoalIds: remapIds(j.linkedGoalIds),
      linkedHabitIds: remapIds(j.linkedHabitIds),
      linkedTaskIds: remapIds(j.linkedTaskIds),
    }));

    // SETTINGS
    // We update existing settings or create if not exists
    if (data.settings) {
      await UserSettings.findOneAndUpdate(
        { userId },
        {
          userId,
          settings: data.settings,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // 3. Execute Insertions
    if (tasksToInsert.length) await Task.insertMany(tasksToInsert);
    if (habitsToInsert.length) await Habit.insertMany(habitsToInsert);
    if (completionsToInsert.length) await HabitCompletion.insertMany(completionsToInsert);
    if (goalsToInsert.length) await Goal.insertMany(goalsToInsert);
    if (transactionsToInsert.length) await Expense.insertMany(transactionsToInsert);
    if (timeEntriesToInsert.length) await TimeEntry.insertMany(timeEntriesToInsert);
    if (studySessionsToInsert.length) await StudySession.insertMany(studySessionsToInsert);
    if (journalEntriesToInsert.length) await JournalEntry.insertMany(journalEntriesToInsert);

    // TIME BLOCKS
    const timeBlocksToInsert = (data.timeBlocks || []).map((b: any) => ({
      _id: getNewId(b.id),
      userId,
      title: b.title,
      description: b.description,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      type: b.type,
      status: b.status,
      linkedTaskId: getNewId(b.linkedTaskId)?.toString(), // Remap if linked to a task in this batch
      linkedHabitId: getNewId(b.linkedHabitId)?.toString(),
      linkedGoalId: getNewId(b.linkedGoalId)?.toString(),
      color: b.color,
      aiGenerated: b.aiGenerated,
      aiReason: b.aiReason,
      notes: b.notes,
      completed: b.completed,
      createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
    }));

    if (timeBlocksToInsert.length) await TimeBlock.insertMany(timeBlocksToInsert);

    res.json({ message: "Import successful", count: idMap.size });

  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import data" });
  }
});

export default router;
