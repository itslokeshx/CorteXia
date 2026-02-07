// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// AI API endpoints
export const aiApi = {
  // Ask AI a question
  ask: async (question: string, context?: any) => {
    return apiRequest<{ response: string }>("/api/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question, context }),
    });
  },

  // Parse natural language input
  parse: async (input: string) => {
    return apiRequest<{ type: string; data: any }>("/api/ai/parse", {
      method: "POST",
      body: JSON.stringify({ input }),
    });
  },

  // Get AI task prioritization
  prioritize: async (tasks: any[]) => {
    return apiRequest<{ tasks: any[] }>("/api/ai/prioritize", {
      method: "POST",
      body: JSON.stringify({ tasks }),
    });
  },

  // Get AI suggestions
  getSuggestions: async (context?: string) => {
    return apiRequest<{ suggestions: string[] }>(
      `/api/ai/suggestions${context ? `?context=${context}` : ""}`,
    );
  },
};

// Insights API endpoints
export const insightsApi = {
  // Get life score
  getLifeScore: async () => {
    return apiRequest<{
      score: number;
      state: string;
      explanation: string;
      breakdown: Record<string, number>;
    }>("/api/insights/life-score");
  },

  // Get weekly synthesis
  getWeeklySynthesis: async () => {
    return apiRequest<{
      synthesis: string;
      period: { start: string; end: string };
    }>("/api/insights/weekly-synthesis");
  },

  // Get morning briefing
  getMorningBriefing: async () => {
    return apiRequest<{ briefing: string }>("/api/insights/morning-briefing");
  },

  // Get patterns
  getPatterns: async () => {
    return apiRequest<{ patterns: any[] }>("/api/insights/patterns");
  },

  // Get recommendations
  getRecommendations: async () => {
    return apiRequest<{ recommendations: any[] }>(
      "/api/insights/recommendations",
    );
  },
};

// Tasks API endpoints
export const tasksApi = {
  getAll: async () => apiRequest<any[]>("/api/tasks"),
  create: async (task: any) =>
    apiRequest<any>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),
  update: async (id: string, updates: any) =>
    apiRequest<any>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  delete: async (id: string) =>
    apiRequest<void>(`/api/tasks/${id}`, {
      method: "DELETE",
    }),
  complete: async (id: string) =>
    apiRequest<any>(`/api/tasks/${id}/complete`, {
      method: "POST",
    }),
};

// Habits API endpoints
export const habitsApi = {
  getAll: async () => apiRequest<any[]>("/api/habits"),
  create: async (habit: any) =>
    apiRequest<any>("/api/habits", {
      method: "POST",
      body: JSON.stringify(habit),
    }),
  update: async (id: string, updates: any) =>
    apiRequest<any>(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  delete: async (id: string) =>
    apiRequest<void>(`/api/habits/${id}`, {
      method: "DELETE",
    }),
  check: async (id: string, date: string) =>
    apiRequest<any>(`/api/habits/${id}/check`, {
      method: "POST",
      body: JSON.stringify({ date }),
    }),
};

// Goals API endpoints
export const goalsApi = {
  getAll: async () => apiRequest<any[]>("/api/goals"),
  create: async (goal: any) =>
    apiRequest<any>("/api/goals", {
      method: "POST",
      body: JSON.stringify(goal),
    }),
  update: async (id: string, updates: any) =>
    apiRequest<any>(`/api/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  delete: async (id: string) =>
    apiRequest<void>(`/api/goals/${id}`, {
      method: "DELETE",
    }),
};

// Journal API endpoints
export const journalApi = {
  getAll: async () => apiRequest<any[]>("/api/journal"),
  create: async (entry: any) =>
    apiRequest<any>("/api/journal", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  update: async (id: string, updates: any) =>
    apiRequest<any>(`/api/journal/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  delete: async (id: string) =>
    apiRequest<void>(`/api/journal/${id}`, {
      method: "DELETE",
    }),
  summarize: async (id: string) =>
    apiRequest<{ summary: string }>(`/api/journal/${id}/summarize`, {
      method: "POST",
    }),
};

// Finance API endpoints
export const financeApi = {
  getTransactions: async () => apiRequest<any[]>("/api/finance/transactions"),
  createTransaction: async (transaction: any) =>
    apiRequest<any>("/api/finance/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    }),
  getBudgets: async () => apiRequest<any[]>("/api/finance/budgets"),
  getSummary: async () => apiRequest<any>("/api/finance/summary"),
};
