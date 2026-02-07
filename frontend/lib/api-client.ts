const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.fetch<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Type definitions for API responses
export interface ApiTask {
  id: string;
  title: string;
  description: string;
  domain: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done";
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  energyLevel?: string;
  aiScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiHabit {
  id: string;
  name: string;
  category: string;
  frequency: string;
  targetDays: number[];
  streak: number;
  bestStreak: number;
  createdAt: string;
}

export interface ApiHabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface ApiTimeLog {
  id: string;
  task: string;
  category: string;
  duration: number;
  date: string;
  startTime?: string;
  endTime?: string;
  isDeepWork: boolean;
  focusQuality: string;
  interruptions: number;
}

export interface ApiTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  isRecurring: boolean;
  tags: string[];
}

export interface ApiBudget {
  id: string;
  category: string;
  amount: number;
  period: string;
  spent: number;
}

export interface ApiStudySession {
  id: string;
  subject: string;
  topic?: string;
  duration: number;
  pomodoros: number;
  startTime: string;
  endTime: string;
  difficulty: string;
  retention?: number;
  notes?: string;
}

export interface ApiGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  targetDate: string;
  progress: number;
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  createdAt: string;
}

export interface ApiJournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  energy: number;
  focus: number;
  date: string;
  tags: string[];
  aiSummary?: string;
  createdAt: string;
}

export interface ApiLifeScore {
  overall: number;
  dimensions: {
    productivity: number;
    health: number;
    finances: number;
    learning: number;
    mindfulness: number;
  };
  trend: string;
  explanation?: string;
}

export interface ApiWeeklySynthesis {
  summary: string;
  highlights: string[];
  challenges: string[];
  recommendations: string[];
  focusAreas: string[];
}

// API endpoint functions
export const tasksApi = {
  list: (domain?: string) => api.get<ApiTask[]>("/api/tasks", { domain }),
  get: (id: string) => api.get<ApiTask>(`/api/tasks/${id}`),
  create: (task: Partial<ApiTask>) => api.post<ApiTask>("/api/tasks", task),
  update: (id: string, task: Partial<ApiTask>) =>
    api.patch<ApiTask>(`/api/tasks/${id}`, task),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
};

export const habitsApi = {
  list: () => api.get<ApiHabit[]>("/api/habits"),
  get: (id: string) => api.get<ApiHabit>(`/api/habits/${id}`),
  create: (habit: Partial<ApiHabit>) =>
    api.post<ApiHabit>("/api/habits", habit),
  update: (id: string, habit: Partial<ApiHabit>) =>
    api.patch<ApiHabit>(`/api/habits/${id}`, habit),
  delete: (id: string) => api.delete(`/api/habits/${id}`),
  log: (
    id: string,
    data: { date?: string; completed: boolean; notes?: string },
  ) => api.post<ApiHabitLog>(`/api/habits/${id}/log`, data),
  logs: (id: string, startDate?: string, endDate?: string) =>
    api.get<ApiHabitLog[]>(`/api/habits/${id}/logs`, { startDate, endDate }),
};

export const timeApi = {
  list: (startDate?: string, endDate?: string) =>
    api.get<ApiTimeLog[]>("/api/time", { startDate, endDate }),
  get: (id: string) => api.get<ApiTimeLog>(`/api/time/${id}`),
  create: (entry: Partial<ApiTimeLog>) =>
    api.post<ApiTimeLog>("/api/time", entry),
  update: (id: string, entry: Partial<ApiTimeLog>) =>
    api.patch<ApiTimeLog>(`/api/time/${id}`, entry),
  delete: (id: string) => api.delete(`/api/time/${id}`),
  stats: (startDate?: string, endDate?: string) =>
    api.get<{ totalMinutes: number; byCategory: Record<string, number> }>(
      "/api/time/stats",
      { startDate, endDate },
    ),
};

export const financeApi = {
  transactions: {
    list: (startDate?: string, endDate?: string, type?: string) =>
      api.get<ApiTransaction[]>("/api/finance/transactions", {
        startDate,
        endDate,
        type,
      }),
    get: (id: string) =>
      api.get<ApiTransaction>(`/api/finance/transactions/${id}`),
    create: (transaction: Partial<ApiTransaction>) =>
      api.post<ApiTransaction>("/api/finance/transactions", transaction),
    update: (id: string, transaction: Partial<ApiTransaction>) =>
      api.patch<ApiTransaction>(`/api/finance/transactions/${id}`, transaction),
    delete: (id: string) => api.delete(`/api/finance/transactions/${id}`),
  },
  budgets: {
    list: () => api.get<ApiBudget[]>("/api/finance/budgets"),
    create: (budget: Partial<ApiBudget>) =>
      api.post<ApiBudget>("/api/finance/budgets", budget),
    update: (id: string, budget: Partial<ApiBudget>) =>
      api.patch<ApiBudget>(`/api/finance/budgets/${id}`, budget),
    delete: (id: string) => api.delete(`/api/finance/budgets/${id}`),
  },
  summary: (month?: string) =>
    api.get<{
      income: number;
      expenses: number;
      savings: number;
      byCategory: Record<string, number>;
    }>("/api/finance/summary", { month }),
};

export const studyApi = {
  list: (subject?: string, startDate?: string, endDate?: string) =>
    api.get<ApiStudySession[]>("/api/study", { subject, startDate, endDate }),
  get: (id: string) => api.get<ApiStudySession>(`/api/study/${id}`),
  create: (session: Partial<ApiStudySession>) =>
    api.post<ApiStudySession>("/api/study", session),
  update: (id: string, session: Partial<ApiStudySession>) =>
    api.patch<ApiStudySession>(`/api/study/${id}`, session),
  delete: (id: string) => api.delete(`/api/study/${id}`),
  stats: (startDate?: string, endDate?: string) =>
    api.get<{
      totalMinutes: number;
      totalPomodoros: number;
      bySubject: Record<string, number>;
    }>("/api/study/stats", { startDate, endDate }),
};

export const goalsApi = {
  list: (status?: string) => api.get<ApiGoal[]>("/api/goals", { status }),
  get: (id: string) => api.get<ApiGoal>(`/api/goals/${id}`),
  create: (goal: Partial<ApiGoal>) => api.post<ApiGoal>("/api/goals", goal),
  update: (id: string, goal: Partial<ApiGoal>) =>
    api.patch<ApiGoal>(`/api/goals/${id}`, goal),
  delete: (id: string) => api.delete(`/api/goals/${id}`),
  addMilestone: (id: string, milestone: { title: string }) =>
    api.post<ApiGoal>(`/api/goals/${id}/milestones`, milestone),
  completeMilestone: (goalId: string, milestoneId: string) =>
    api.patch<ApiGoal>(`/api/goals/${goalId}/milestones/${milestoneId}`, {
      completed: true,
    }),
};

export const journalApi = {
  list: (startDate?: string, endDate?: string) =>
    api.get<ApiJournalEntry[]>("/api/journal", { startDate, endDate }),
  get: (id: string) => api.get<ApiJournalEntry>(`/api/journal/${id}`),
  create: (entry: Partial<ApiJournalEntry>) =>
    api.post<ApiJournalEntry>("/api/journal", entry),
  update: (id: string, entry: Partial<ApiJournalEntry>) =>
    api.patch<ApiJournalEntry>(`/api/journal/${id}`, entry),
  delete: (id: string) => api.delete(`/api/journal/${id}`),
};

export const insightsApi = {
  lifeScore: () => api.get<ApiLifeScore>("/api/insights/life-score"),
  weeklySynthesis: () =>
    api.get<ApiWeeklySynthesis>("/api/insights/weekly-synthesis"),
  morningBriefing: () =>
    api.get<{ briefing: string; tasks: ApiTask[]; habits: ApiHabit[] }>(
      "/api/insights/morning-briefing",
    ),
  patterns: () => api.get<{ patterns: string[] }>("/api/insights/patterns"),
  recommendations: () =>
    api.get<{ recommendations: string[] }>("/api/insights/recommendations"),
};

export const aiApi = {
  parse: (input: string) =>
    api.post<{ type: string; data: any; confidence: number }>("/api/ai/parse", {
      input,
    }),
  ask: (query: string, context?: Record<string, unknown>) =>
    api.post<{ response: string }>("/api/ai/ask", { query, context }),
  prioritize: (tasks: ApiTask[]) =>
    api.post<ApiTask[]>("/api/ai/prioritize", { tasks }),
  suggestions: () => api.get<{ suggestions: string[] }>("/api/ai/suggestions"),
};

export const usersApi = {
  profile: () =>
    api.get<{ id: string; name: string; email: string }>("/api/users/profile"),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch("/api/users/profile", data),
  preferences: () => api.get<Record<string, unknown>>("/api/users/preferences"),
  updatePreferences: (prefs: Record<string, unknown>) =>
    api.patch("/api/users/preferences", prefs),
};
