-- FIX Foreign Key Relationship Issue
-- Run this in Supabase SQL Editor to fix the relationship error

-- 1. First, let's check what tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'research_posts');

-- 2. Drop and recreate research_posts table with proper foreign key
DROP TABLE IF EXISTS public.research_posts CASCADE;

CREATE TABLE public.research_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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
ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Research posts are viewable by everyone"
  ON public.research_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.research_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.research_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Insert a test post with a valid user_id (using the profile that exists)
INSERT INTO public.research_posts (user_id, title, summary) 
SELECT 
  id,
  'Welcome to Haliothub Connect!',
  'This is a test post to verify your database connection is working properly. You can now create your own research posts!'
FROM public.profiles 
LIMIT 1;

-- 6. Verify the relationship works
SELECT 
  rp.id,
  rp.title,
  rp.summary,
  p.full_name,
  p.email,
  p.affiliation
FROM public.research_posts rp
JOIN public.profiles p ON rp.user_id = p.id;

-- 7. Show final status
SELECT 'Foreign key relationship fixed successfully!' as status;
