-- Update the SELECT policy to allow creators to view their conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  -- Allow if user is the creator
  auth.uid() = created_by
  OR
  -- Allow if user is a participant
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
  )
);