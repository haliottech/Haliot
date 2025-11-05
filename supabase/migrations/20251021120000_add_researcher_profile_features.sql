-- Add profile_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Add publication_history field (JSONB to store publication details)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS publication_history JSONB DEFAULT '[]'::jsonb;

-- Create user_follows table for following other users
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_follows
CREATE POLICY "User follows are viewable by everyone"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow other users"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow other users"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Create endorsements table for peer endorsements
CREATE TABLE IF NOT EXISTS public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endorsee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endorser_id, endorsee_id, skill),
  CHECK (endorser_id != endorsee_id)
);

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

-- RLS policies for endorsements
CREATE POLICY "Endorsements are viewable by everyone"
  ON public.endorsements FOR SELECT
  USING (true);

CREATE POLICY "Users can create endorsements"
  ON public.endorsements FOR INSERT
  WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "Users can update own endorsements"
  ON public.endorsements FOR UPDATE
  USING (auth.uid() = endorser_id);

CREATE POLICY "Users can delete own endorsements"
  ON public.endorsements FOR DELETE
  USING (auth.uid() = endorser_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsee ON public.endorsements(endorsee_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON public.endorsements(endorser_id);

-- Add updated_at trigger for endorsements
CREATE TRIGGER update_endorsements_updated_at
  BEFORE UPDATE ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for new tables
ALTER TABLE public.user_follows REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;

ALTER TABLE public.endorsements REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.endorsements;

