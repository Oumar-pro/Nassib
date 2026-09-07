-- ==============================================================================
-- NASSIB - MIGRATION 2026-09-06: CONTACT REQUESTS & PHOTO ACCESS CONTROL
-- ==============================================================================

-- 1. CONVERSATIONS STATUS & REQUESTER COLUMNS
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'accepted', 'rejected'));

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS requester_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_requester ON public.conversations(requester_id);

-- Conversations UPDATE Policy (Allow participants to accept/reject)
DROP POLICY IF EXISTS "Conversations update policy" ON public.conversations;
CREATE POLICY "Conversations update policy" ON public.conversations FOR UPDATE TO authenticated
USING (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 2. PHOTO ACCESS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.photo_access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'approved', 'rejected')),
  note text,
  CONSTRAINT photo_access_requests_pkey PRIMARY KEY (id),
  CONSTRAINT unique_photo_access_request UNIQUE (requester_profile_id, target_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_requests_requester ON public.photo_access_requests(requester_profile_id);
CREATE INDEX IF NOT EXISTS idx_photo_requests_target ON public.photo_access_requests(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_photo_requests_status ON public.photo_access_requests(status);

ALTER TABLE public.photo_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photo access requests select policy" ON public.photo_access_requests;
CREATE POLICY "Photo access requests select policy" ON public.photo_access_requests FOR SELECT TO authenticated
USING (
  requester_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  target_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  requester_user_id = auth.uid() OR
  target_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Photo access requests insert policy" ON public.photo_access_requests;
CREATE POLICY "Photo access requests insert policy" ON public.photo_access_requests FOR INSERT TO authenticated
WITH CHECK (
  requester_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  requester_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Photo access requests update policy" ON public.photo_access_requests;
CREATE POLICY "Photo access requests update policy" ON public.photo_access_requests FOR UPDATE TO authenticated
USING (
  target_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  target_user_id = auth.uid()
)
WITH CHECK (
  target_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  target_user_id = auth.uid()
);

-- 3. SERVER-SIDE ENFORCEMENT: CANNOT SEND SECOND MESSAGE UNTIL ACCEPTED
CREATE OR REPLACE FUNCTION public.can_insert_message(p_conv_id uuid, p_sender_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status text;
  v_count integer;
  v_candidate_id uuid;
  v_suitor_id uuid;
BEGIN
  SELECT status, candidate_id, suitor_id INTO v_status, v_candidate_id, v_suitor_id
  FROM public.conversations WHERE id = p_conv_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Sender must be candidate or suitor
  IF p_sender_id != v_candidate_id AND p_sender_id != v_suitor_id THEN
    RETURN false;
  END IF;

  -- If conversation is accepted, messaging is open
  IF v_status = 'accepted' THEN
    RETURN true;
  END IF;

  -- If rejected, no message is allowed
  IF v_status = 'rejected' THEN
    RETURN false;
  END IF;

  -- If pending: only 1 message allowed total in this conversation (the initial request)
  SELECT count(*) INTO v_count FROM public.messages WHERE conversation_id = p_conv_id;
  IF v_count = 0 THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;
CREATE POLICY "Messages insert policy" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND (
    conversation_id IS NULL
    OR public.can_insert_message(conversation_id, sender_id) = true
  )
);
