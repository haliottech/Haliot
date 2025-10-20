-- Make created_by NOT NULL and add proper constraints
ALTER TABLE public.conversations
ALTER COLUMN created_by SET NOT NULL;

-- Recreate the policy to be more explicit
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());