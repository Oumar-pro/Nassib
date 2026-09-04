-- ==============================================================================
-- NASIBA (NIGER) - PRODUCTION SUPABASE DATABASE SCHEMA
-- Exactly aligned with the database structure:
-- 1. profiles
-- 2. conversations
-- 3. messages
-- 4. pricing_plans
-- 5. user_favorites
-- 6. user_roles
-- 7. profile_private
-- 8. verification_requests
-- 9. admin_audit_logs
-- 10. user_blocks
-- 11. user_reports
-- 12. profile_photos
-- 13. reports
-- ==============================================================================

-- 0. EXTENSIONS REQUISES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 18 AND age <= 100),
  profession text,
  city text NOT NULL,
  marital_status text NOT NULL,
  religion text DEFAULT 'Sunnite'::text,
  education text,
  match_percentage integer DEFAULT 85,
  is_verified_nni boolean DEFAULT false,
  is_wali_approved boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  photo_url text,
  photo_private boolean DEFAULT false,
  bio text,
  wali_reference text,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text])),
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  hobbies text,
  interests text,
  drinks_alcohol boolean,
  smokes boolean,
  presentation text,
  personality text,
  family_importance text,
  is_admin boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  candidate_id uuid NOT NULL,
  suitor_id uuid NOT NULL,
  last_message text,
  last_message_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_supervised boolean DEFAULT true,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT conversations_suitor_id_fkey FOREIGN KEY (suitor_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  conversation_id uuid,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  sender_avatar text,
  text text NOT NULL,
  is_supervised boolean DEFAULT true,
  status text DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'read'::text])),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 4. PRICING_PLANS
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id text NOT NULL,
  name text NOT NULL,
  price text NOT NULL,
  period text NOT NULL,
  description text,
  features jsonb,
  popular boolean DEFAULT false,
  cta_text text,
  CONSTRAINT pricing_plans_pkey PRIMARY KEY (id)
);

-- 5. USER_FAVORITES
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_favorites_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_favorite UNIQUE (user_id, profile_id)
);

-- 6. USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. PROFILE_PRIVATE
CREATE TABLE IF NOT EXISTS public.profile_private (
  profile_id uuid NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  wali_reference text,
  nni_status text NOT NULL DEFAULT 'pending'::text CHECK (nni_status = ANY (ARRAY['pending'::text, 'submitted'::text, 'verified'::text, 'rejected'::text])),
  wali_status text NOT NULL DEFAULT 'pending'::text CHECK (wali_status = ANY (ARRAY['pending'::text, 'submitted'::text, 'approved'::text, 'rejected'::text])),
  nni_verified_at timestamp with time zone,
  wali_approved_at timestamp with time zone,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profile_private_pkey PRIMARY KEY (profile_id),
  CONSTRAINT profile_private_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT profile_private_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 8. VERIFICATION_REQUESTS
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  verification_type text NOT NULL CHECK (verification_type = ANY (ARRAY['nni'::text, 'wali'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'rejected'::text])),
  document_path text,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT verification_requests_pkey PRIMARY KEY (id),
  CONSTRAINT verification_requests_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT verification_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 9. ADMIN_AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_user_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 10. USER_BLOCKS
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  blocker_user_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT user_blocks_blocker_user_id_fkey FOREIGN KEY (blocker_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 11. USER_REPORTS
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reporter_user_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_reports_pkey PRIMARY KEY (id),
  CONSTRAINT user_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 12. PROFILE_PHOTOS
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_photos_pkey PRIMARY KEY (id),
  CONSTRAINT profile_photos_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT profile_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 13. REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  reporter_user_id uuid,
  reported_profile_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'dismissed'::text])),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT reports_reported_profile_id_fkey FOREIGN KEY (reported_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified_nni);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_profile ON public.user_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_candidate ON public.conversations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_conversations_suitor ON public.conversations(suitor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile ON public.profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Conversations Policies
DROP POLICY IF EXISTS "Conversations select policy" ON public.conversations;
CREATE POLICY "Conversations select policy" ON public.conversations FOR SELECT TO authenticated
USING (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Conversations insert policy" ON public.conversations;
CREATE POLICY "Conversations insert policy" ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. Messages Policies
DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
CREATE POLICY "Messages select policy" ON public.messages FOR SELECT TO authenticated
USING (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
       OR suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;
CREATE POLICY "Messages insert policy" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. User Favorites Policies
DROP POLICY IF EXISTS "Favorites select policy" ON public.user_favorites;
CREATE POLICY "Favorites select policy" ON public.user_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Favorites insert policy" ON public.user_favorites;
CREATE POLICY "Favorites insert policy" ON public.user_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Favorites delete policy" ON public.user_favorites;
CREATE POLICY "Favorites delete policy" ON public.user_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Profile Photos Policies
DROP POLICY IF EXISTS "Photos select policy" ON public.profile_photos;
CREATE POLICY "Photos select policy" ON public.profile_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Photos insert policy" ON public.profile_photos;
CREATE POLICY "Photos insert policy" ON public.profile_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Photos delete policy" ON public.profile_photos;
CREATE POLICY "Photos delete policy" ON public.profile_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Verification Requests Policies
DROP POLICY IF EXISTS "Verification requests select policy" ON public.verification_requests;
CREATE POLICY "Verification requests select policy" ON public.verification_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Verification requests insert policy" ON public.verification_requests;
CREATE POLICY "Verification requests insert policy" ON public.verification_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. Pricing Plans Policies
DROP POLICY IF EXISTS "Plans select policy" ON public.pricing_plans;
CREATE POLICY "Plans select policy" ON public.pricing_plans FOR SELECT USING (true);

-- 8. User Roles Policies
DROP POLICY IF EXISTS "User roles select policy" ON public.user_roles;
CREATE POLICY "User roles select policy" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 9. Profile Private Policies
DROP POLICY IF EXISTS "Profile private select policy" ON public.profile_private;
CREATE POLICY "Profile private select policy" ON public.profile_private FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Profile private insert policy" ON public.profile_private;
CREATE POLICY "Profile private insert policy" ON public.profile_private FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Profile private update policy" ON public.profile_private;
CREATE POLICY "Profile private update policy" ON public.profile_private FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 10. Reports & User Reports Policies
DROP POLICY IF EXISTS "Reports insert policy" ON public.reports;
CREATE POLICY "Reports insert policy" ON public.reports FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "User reports insert policy" ON public.user_reports;
CREATE POLICY "User reports insert policy" ON public.user_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);

-- 11. User Blocks Policies
DROP POLICY IF EXISTS "User blocks select policy" ON public.user_blocks;
CREATE POLICY "User blocks select policy" ON public.user_blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_user_id);

DROP POLICY IF EXISTS "User blocks insert policy" ON public.user_blocks;
CREATE POLICY "User blocks insert policy" ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_user_id);

DROP POLICY IF EXISTS "User blocks delete policy" ON public.user_blocks;
CREATE POLICY "User blocks delete policy" ON public.user_blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_user_id);
