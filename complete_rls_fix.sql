-- COMPLETE FIX - RLS Policies and User Profile Issues
-- Run this in Supabase SQL Editor to fix all remaining issues

-- 1. First, let's check what's in the profiles table
SELECT 'Current profiles:' as info;
SELECT id, email, full_name FROM public.profiles;

-- 2. Drop and recreate all tables with proper RLS
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.research_posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create profiles table with proper RLS
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  affiliation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create research_posts table
CREATE TABLE public.research_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_text_link TEXT,
  document_url TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'public',
  collaboration_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 7. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Research posts are viewable by everyone" ON public.research_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.research_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.research_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.research_posts;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- 9. Create comprehensive RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 10. Create RLS policies for research_posts
CREATE POLICY "Research posts are viewable by everyone"
  ON public.research_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.research_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.research_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.research_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 11. Create RLS policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- 12. Create RLS policies for likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- 13. Create function to handle new user registration
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

-- 14. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('research-documents', 'research-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view research documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload research documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own research documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own research documents" ON storage.objects;

CREATE POLICY "Anyone can view research documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'research-documents');

CREATE POLICY "Authenticated users can upload research documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'research-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own research documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'research-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own research documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'research-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 16. Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'research_posts', 'comments', 'likes');
