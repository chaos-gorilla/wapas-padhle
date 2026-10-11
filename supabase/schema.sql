-- Wapas Padhle (by Scale with Rai) Database Schema for Supabase
-- Zero-friction Spaced Repetition Platform using SuperMemo SM-2

-- 1. Profiles & Users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Spaced Repetition Reviews (SM-2 Algorithm data)
CREATE TABLE IF NOT EXISTS user_concept_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  repetition INTEGER NOT NULL DEFAULT 0,
  interval INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
  last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_date DATE NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_reviews_user_next_date 
  ON user_concept_reviews (user_id, next_review_date);

-- 3. User Concept Notes & Key Invariants
CREATE TABLE IF NOT EXISTS user_concept_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  url TEXT,
  notes TEXT,
  tags TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

-- 4. Telegram Subscribers for 8:00 AM Daily Digest
CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  chat_id TEXT UNIQUE NOT NULL,
  username TEXT,
  daily_reminder_enabled BOOLEAN DEFAULT TRUE,
  preferred_hour INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_active 
  ON telegram_subscribers (daily_reminder_enabled);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_concept_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_concept_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own records
CREATE POLICY "Users can manage their own reviews"
  ON user_concept_reviews FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notes"
  ON user_concept_notes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their telegram preferences"
  ON telegram_subscribers FOR ALL
  USING (auth.uid() = user_id);
