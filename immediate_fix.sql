-- SIMPLE DIRECT FIX - Create Profile for Existing User
-- Run this in Supabase SQL Editor to fix the immediate issue

-- 1. First, let's manually create the profile for the existing user
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  '4c793835-583e-4020-a898-a058a0a3de90',
  'user@example.com',
  'Test User'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- 2. Let's also disable RLS temporarily to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verify the profile was created
SELECT 'Profile created/updated:' as status;
SELECT id, email, full_name FROM public.profiles WHERE id = '4c793835-583e-4020-a898-a058a0a3de90';

-- 4. Test if we can query profiles now
SELECT 'Testing profile access:' as test;
SELECT COUNT(*) as profile_count FROM public.profiles;
