-- Create discussion_rooms table for group discussions
CREATE TABLE IF NOT EXISTS public.discussion_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.discussion_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member',
  UNIQUE(room_id, user_id)
);

-- Create room_messages table for group chat
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.discussion_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.room_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create room_polls table
CREATE TABLE IF NOT EXISTS public.room_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.discussion_rooms(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.room_polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.discussion_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussion_rooms
CREATE POLICY "Discussion rooms are viewable by everyone"
  ON public.discussion_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON public.discussion_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update rooms"
  ON public.discussion_rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for room_members
CREATE POLICY "Room members are viewable by everyone"
  ON public.room_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON public.room_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for room_messages
CREATE POLICY "Room messages are viewable by room members"
  ON public.room_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = room_messages.room_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages"
  ON public.room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = room_messages.room_id
      AND room_members.user_id = auth.uid()
    )
  );

-- RLS Policies for message_reactions
CREATE POLICY "Message reactions are viewable by room members"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_messages
      JOIN public.room_members ON room_members.room_id = room_messages.room_id
      WHERE room_messages.id = message_reactions.message_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can react to messages"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.room_messages
      JOIN public.room_members ON room_members.room_id = room_messages.room_id
      WHERE room_messages.id = message_reactions.message_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for room_polls
CREATE POLICY "Room polls are viewable by room members"
  ON public.room_polls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = room_polls.room_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can create polls"
  ON public.room_polls FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = room_polls.room_id
      AND room_members.user_id = auth.uid()
    )
  );

-- RLS Policies for poll_votes
CREATE POLICY "Poll votes are viewable by room members"
  ON public.poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_polls
      JOIN public.room_members ON room_members.room_id = room_polls.room_id
      WHERE room_polls.id = poll_votes.poll_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can vote on polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.room_polls
      JOIN public.room_members ON room_members.room_id = room_polls.room_id
      WHERE room_polls.id = poll_votes.poll_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their poll votes"
  ON public.poll_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their poll votes"
  ON public.poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_room_polls_room ON public.room_polls(room_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);

-- Function to update room member count
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussion_rooms
    SET member_count = (
      SELECT COUNT(*) FROM public.room_members
      WHERE room_id = NEW.room_id
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussion_rooms
    SET member_count = (
      SELECT COUNT(*) FROM public.room_members
      WHERE room_id = OLD.room_id
    )
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update room message count
CREATE OR REPLACE FUNCTION update_room_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussion_rooms
    SET message_count = (
      SELECT COUNT(*) FROM public.room_messages
      WHERE room_id = NEW.room_id
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussion_rooms
    SET message_count = (
      SELECT COUNT(*) FROM public.room_messages
      WHERE room_id = OLD.room_id
    )
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to automatically update counts
CREATE TRIGGER update_member_count_on_join
  AFTER INSERT ON public.room_members
  FOR EACH ROW EXECUTE FUNCTION update_room_member_count();

CREATE TRIGGER update_member_count_on_leave
  AFTER DELETE ON public.room_members
  FOR EACH ROW EXECUTE FUNCTION update_room_member_count();

CREATE TRIGGER update_message_count_on_send
  AFTER INSERT ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION update_room_message_count();

-- Add updated_at trigger for discussion_rooms
CREATE TRIGGER update_discussion_rooms_updated_at
  BEFORE UPDATE ON public.discussion_rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_room_messages_updated_at
  BEFORE UPDATE ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER TABLE public.discussion_rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_rooms;

ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

ALTER TABLE public.room_polls REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_polls;

ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

