-- Create security definer function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.user_in_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
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

-- Drop existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- Create new policies using the security definer function
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