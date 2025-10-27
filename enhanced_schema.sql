-- Enhanced Database Schema for Advanced Features
-- Run this in Supabase SQL Editor to add new features

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0;

-- 2. Create post_analytics table
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id)
);

-- 3. Create post_views table for tracking individual views
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, ip_address)
);

-- 4. Create post_shares table
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_platform TEXT, -- 'twitter', 'linkedin', 'facebook', 'copy_link'
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, share_platform)
);

-- 5. Enable RLS on new tables
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for post_analytics
CREATE POLICY "Post authors can view their analytics"
  ON public.post_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_posts 
      WHERE research_posts.id = post_analytics.post_id 
      AND research_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update analytics"
  ON public.post_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON public.post_analytics FOR UPDATE
  USING (true);

-- 7. Create policies for post_views
CREATE POLICY "Anyone can create view records"
  ON public.post_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Post authors can view their post views"
  ON public.post_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_posts 
      WHERE research_posts.id = post_views.post_id 
      AND research_posts.user_id = auth.uid()
    )
  );

-- 8. Create policies for post_shares
CREATE POLICY "Anyone can create share records"
  ON public.post_shares FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Post authors can view their post shares"
  ON public.post_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_posts 
      WHERE research_posts.id = post_shares.post_id 
      AND research_posts.user_id = auth.uid()
    )
  );

-- 9. Create function to calculate profile completion score
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;
  
  IF profile_record.email IS NOT NULL THEN score := score + 20; END IF;
  IF profile_record.full_name IS NOT NULL THEN score := score + 20; END IF;
  IF profile_record.affiliation IS NOT NULL THEN score := score + 15; END IF;
  IF profile_record.profession IS NOT NULL THEN score := score + 15; END IF;
  IF profile_record.bio IS NOT NULL THEN score := score + 15; END IF;
  IF profile_record.linkedin_url IS NOT NULL THEN score := score + 10; END IF;
  IF profile_record.avatar_url IS NOT NULL THEN score := score + 5; END IF;
  
  RETURN score;
END;
$$;

-- 10. Create function to update post analytics
CREATE OR REPLACE FUNCTION public.update_post_analytics(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.post_analytics (post_id, likes_count, comments_count)
  SELECT 
    post_id,
    (SELECT COUNT(*) FROM public.likes WHERE likes.post_id = update_post_analytics.post_id),
    (SELECT COUNT(*) FROM public.comments WHERE comments.post_id = update_post_analytics.post_id)
  ON CONFLICT (post_id) DO UPDATE SET
    likes_count = EXCLUDED.likes_count,
    comments_count = EXCLUDED.comments_count,
    updated_at = NOW();
END;
$$;

-- 11. Create triggers to automatically update analytics
CREATE OR REPLACE FUNCTION public.trigger_update_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_post_analytics(COALESCE(NEW.post_id, OLD.post_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS update_analytics_on_like ON public.likes;
DROP TRIGGER IF EXISTS update_analytics_on_comment ON public.comments;

CREATE TRIGGER update_analytics_on_like
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_analytics();

CREATE TRIGGER update_analytics_on_comment
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_analytics();

-- 12. Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Create storage policies for profile images
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 14. Update profile completion scores for existing users
UPDATE public.profiles 
SET profile_completion_score = public.calculate_profile_completion(id);

-- 15. Verify setup
SELECT 'Enhanced database schema created successfully!' as status;
SELECT 'New tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('post_analytics', 'post_views', 'post_shares');
