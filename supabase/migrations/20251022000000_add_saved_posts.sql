-- Create saved_posts table for users to save/bookmark posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_posts
CREATE POLICY "Users can view their own saved posts"
  ON public.saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON public.saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON public.saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON public.saved_posts(post_id);

-- Enable realtime for saved_posts table
ALTER TABLE public.saved_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_posts;

