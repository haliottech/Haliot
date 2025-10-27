-- COMPLETE RLS DISABLE FIX - Temporary Solution
-- Run this in Supabase SQL Editor to disable RLS and fix the immediate issue

-- 1. Disable RLS on all tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;

-- 2. Create the missing profile for the existing user
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  '4c793835-583e-4020-a898-a058a0a3de90',
  'user@example.com',
  'Test User'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- 3. Verify everything works
SELECT 'RLS disabled and profile created!' as status;
SELECT 'Current profiles:' as info;
SELECT id, email, full_name FROM public.profiles;

-- 4. Test table access
SELECT 'Table access test:' as test;
SELECT COUNT(*) as profiles_count FROM public.profiles;
SELECT COUNT(*) as posts_count FROM public.research_posts;
SELECT COUNT(*) as comments_count FROM public.comments;
SELECT COUNT(*) as likes_count FROM public.likes;
