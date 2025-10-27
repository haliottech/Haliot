-- Complete Database Schema for Haliothub Connect
-- Run this script in your Supabase SQL Editor to create all required tables

-- ==============================================
-- 1. CREATE ENUMS
-- ==============================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for researcher verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- ==============================================
-- 2. CREATE TABLES
-- ==============================================

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  affiliation TEXT,
  domain_expertise TEXT[],
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create research_posts table
CREATE TABLE public.research_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research_areas table
CREATE TABLE public.research_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research_area_follows table
CREATE TABLE public.research_area_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  research_area_id UUID REFERENCES research_areas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, research_area_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaborations table
CREATE TABLE public.collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active'
);

-- Create collaboration_members table
CREATE TABLE public.collaboration_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collaboration_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'message', 'comment')),
  content TEXT NOT NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES public.research_posts(id) ON DELETE CASCADE,
  related_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_area_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE FUNCTIONS
-- ==============================================

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.user_in_conversation(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, linkedin_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'linkedin_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==============================================
-- 5. CREATE TRIGGERS
-- ==============================================

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_research_posts_updated_at
  BEFORE UPDATE ON public.research_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_collaborations_updated_at
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================
-- 6. CREATE ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Research posts policies
CREATE POLICY "Research posts are viewable by everyone"
  ON public.research_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.research_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.research_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.research_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Research areas policies
CREATE POLICY "Research areas are viewable by everyone"
  ON public.research_areas FOR SELECT
  USING (true);

-- Research area follows policies
CREATE POLICY "Users can view all follows"
  ON public.research_area_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow research areas"
  ON public.research_area_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow research areas"
  ON public.research_area_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1
      FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Conversation participants policies
CREATE POLICY "Users can add participants to their conversations"
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (
    public.user_in_conversation(auth.uid(), conversation_id)
    OR NOT EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = conversation_participants.conversation_id
    )
  );

CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants
  FOR SELECT
  USING (public.user_in_conversation(auth.uid(), conversation_id));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Collaborations policies
CREATE POLICY "Users can view all collaborations"
  ON public.collaborations FOR SELECT
  USING (true);

CREATE POLICY "Users can create collaborations"
  ON public.collaborations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Collaboration creators can update"
  ON public.collaborations FOR UPDATE
  USING (auth.uid() = created_by);

-- Collaboration members policies
CREATE POLICY "Users can view collaboration members"
  ON public.collaboration_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join collaborations"
  ON public.collaboration_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==============================================
-- 7. CREATE INDEXES
-- ==============================================

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ==============================================
-- 8. ENABLE REALTIME
-- ==============================================

-- Enable realtime for research_posts
ALTER TABLE public.research_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_posts;

-- Enable realtime for profiles
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==============================================
-- 9. CREATE STORAGE BUCKET AND POLICIES
-- ==============================================

-- Create storage bucket for research documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('research-documents', 'research-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for research documents
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

-- ==============================================
-- 10. INSERT DEFAULT DATA
-- ==============================================

-- Insert some default research areas
INSERT INTO public.research_areas (title, description) VALUES
('Artificial Intelligence & Ethics', 'Exploring the intersection of AI development and ethical considerations, including bias, privacy, and societal impact.'),
('Climate Change & Sustainability', 'Research on climate science, renewable energy, carbon capture, and sustainable development strategies.'),
('Healthcare Innovation', 'Advances in medical technology, drug development, telemedicine, and healthcare delivery systems.'),
('Quantum Technologies', 'Quantum computing, cryptography, and sensing technologies that leverage quantum mechanical principles.')
ON CONFLICT DO NOTHING;

-- ==============================================
-- COMPLETE!
-- ==============================================

-- Your database is now ready! 
-- You can start using the application with all the required tables, policies, and functions.
