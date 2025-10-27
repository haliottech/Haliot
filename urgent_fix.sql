-- URGENT: Run this in Supabase SQL Editor to fix the "Failed to load posts" error
-- This creates the essential tables that the app needs immediately

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  affiliation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create research_posts table
CREATE TABLE IF NOT EXISTS public.research_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  document_url TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'public',
  collaboration_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;

-- 4. Create basic policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Research posts are viewable by everyone"
  ON public.research_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.research_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.research_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Insert a test post (this will make the feed show something)
INSERT INTO public.research_posts (user_id, title, summary) 
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'Welcome to Haliothub Connect!', 
  'This is a test post to verify your database connection is working properly. You can now create your own research posts!'
) ON CONFLICT DO NOTHING;

-- 6. Insert a test profile
INSERT INTO public.profiles (id, email, full_name, affiliation) 
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'test@example.com', 
  'Test User', 
  'Test University'
) ON CONFLICT (id) DO NOTHING;
