-- ═══════════════════════════════════════════════════════════════════════
-- CORTEXIA — SUPABASE DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER PROFILES (extends Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "daily_summary": true,
    "goal_reminders": true,
    "habit_streaks": true
  }'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- ============================================================================
-- 2. GOALS (created before tasks so tasks can reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'personal',
  level TEXT DEFAULT 'yearly' CHECK (level IN ('life', 'yearly', 'quarterly', 'monthly', 'weekly')),
  parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  start_date DATE,
  target_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned', 'at_risk', 'failing')),
  milestones JSONB DEFAULT '[]'::jsonb,
  linked_habit_ids TEXT[] DEFAULT '{}',
  linked_task_ids TEXT[] DEFAULT '{}',
  ai_roadmap JSONB,
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_parent ON public.goals(parent_goal_id);

-- ============================================================================
-- 3. TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT DEFAULT 'personal' CHECK (domain IN ('work', 'health', 'study', 'personal', 'finance', 'focus', 'leisure')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked')),
  due_date DATE,
  due_time TIME,
  scheduled_for TEXT CHECK (scheduled_for IN ('today', 'tomorrow', 'week', 'month', 'year')),
  time_estimate INTEGER, -- minutes
  time_spent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  subtasks JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  recurrence JSONB,
  order_index INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON public.tasks(linked_goal_id);

-- ============================================================================
-- 4. HABITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'productivity' CHECK (category IN ('health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social')),
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  custom_days JSONB DEFAULT '{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":true,"sunday":true}'::jsonb,
  color TEXT,
  streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  target_days_per_week INTEGER,
  linked_goal_ids TEXT[] DEFAULT '{}',
  target_time TEXT, -- HH:mm
  duration INTEGER, -- minutes
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 5. HABIT COMPLETIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_comp_habit ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_comp_user ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_comp_date ON public.habit_completions(date DESC);

-- ============================================================================
-- 6. TRANSACTIONS (Finance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'other',
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  recurring BOOLEAN DEFAULT FALSE,
  vendor TEXT,
  tags TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type, user_id);

-- ============================================================================
-- 7. TIME ENTRIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  category TEXT DEFAULT 'work' CHECK (category IN ('work', 'study', 'health', 'personal')),
  duration INTEGER NOT NULL, -- minutes
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  focus_quality TEXT DEFAULT 'moderate' CHECK (focus_quality IN ('deep', 'moderate', 'shallow')),
  interruptions INTEGER DEFAULT 0,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user ON public.time_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(date DESC);

-- ============================================================================
-- 8. STUDY SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration INTEGER NOT NULL,
  pomodoros INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic TEXT,
  notes TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_user ON public.study_sessions(user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 9. JOURNAL ENTRIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  content TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  focus INTEGER CHECK (focus >= 1 AND focus <= 10),
  stress INTEGER CHECK (stress >= 1 AND stress <= 10),
  tags TEXT[] DEFAULT '{}',
  gratitude_list TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_themes TEXT[] DEFAULT '{}',
  ai_insights TEXT,
  linked_goal_ids TEXT[] DEFAULT '{}',
  linked_habit_ids TEXT[] DEFAULT '{}',
  linked_task_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_date ON public.journal_entries(date DESC);

-- ============================================================================
-- 10. AI CONVERSATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_snapshot JSONB,
  conversation_type TEXT DEFAULT 'general' CHECK (conversation_type IN ('general', 'mental_health', 'planning', 'reflection')),
  title TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_updated ON public.ai_conversations(updated_at DESC);

-- ============================================================================
-- 11. AI CONTEXT CACHE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  context_data JSONB NOT NULL,
  context_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ctx_cache_user ON public.ai_context_cache(user_id);

-- ============================================================================
-- 12. TIME BLOCKS (Day Planner)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL,
  duration INTEGER,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'task' CHECK (type IN ('task', 'habit', 'meeting', 'break', 'deep_work', 'shallow_work', 'personal', 'blocked')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
  linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  linked_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  color TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user ON public.time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON public.time_blocks(date DESC);

-- ============================================================================
-- 13. USER SETTINGS (separate from profile for flexibility)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings ON public.user_settings(user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'user_profiles', 'tasks', 'habits', 'habit_completions',
      'goals', 'transactions', 'time_entries', 'study_sessions',
      'journal_entries', 'ai_conversations', 'time_blocks', 'user_settings'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
       CREATE TRIGGER update_%s_updated_at
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'user_profiles', 'tasks', 'habits', 'habit_completions',
      'goals', 'transactions', 'time_entries', 'study_sessions',
      'journal_entries', 'ai_conversations', 'ai_context_cache',
      'time_blocks', 'user_settings'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END;
$$;

-- user_profiles: users see/edit only their own
CREATE POLICY "Users manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Generic policy for user_id-scoped tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'tasks', 'habits', 'habit_completions', 'goals',
      'transactions', 'time_entries', 'study_sessions',
      'journal_entries', 'ai_conversations', 'ai_context_cache',
      'time_blocks', 'user_settings'
    ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Users manage own %s" ON public.%s;
       CREATE POLICY "Users manage own %s" ON public.%s
       FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;
