-- FINAL SAFE Database Setup - No Foreign Key Violations
-- Run this in Supabase SQL Editor to fix the "Failed to load posts" error

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  affiliation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create research_posts table (if not exists)
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

-- 3. Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Research posts are viewable by everyone" ON public.research_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.research_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.research_posts;

-- 5. Create policies
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

-- 6. Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
END;
$function$;

-- 7. Create trigger for new users (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Verify tables exist
SELECT 'Database setup completed successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'research_posts');

-- 9. Show current table counts
SELECT 'Current data:' as info;
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'research_posts' as table_name, count(*) as row_count FROM public.research_posts;
