-- NASSIB production hardening 002
-- Apply after the existing security migration.
-- This migration is idempotent.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Admin check must come from user_roles, not from client-controlled profiles.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Prevent normal users from self-granting premium, verification or admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin_user() THEN
    NEW.is_verified_nni := OLD.is_verified_nni;
    NEW.is_wali_approved := OLD.is_wali_approved;
    NEW.is_premium := OLD.is_premium;
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_privileged_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_privileged_profile_fields();

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin_user() THEN
    NEW.is_verified_nni := false;
    NEW.is_wali_approved := false;
    NEW.is_premium := false;
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields_insert ON public.profiles;
CREATE TRIGGER trg_protect_privileged_profile_fields_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_privileged_profile_fields_insert();

-- ---------------------------------------------------------------------------
-- 3. Protect private verification statuses as well.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_private_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin_user() THEN
    NEW.nni_status := OLD.nni_status;
    NEW.wali_status := OLD.wali_status;
    NEW.nni_verified_at := OLD.nni_verified_at;
    NEW.wali_approved_at := OLD.wali_approved_at;
    NEW.admin_notes := OLD.admin_notes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_private_status ON public.profile_private;
CREATE TRIGGER trg_protect_profile_private_status
BEFORE UPDATE ON public.profile_private
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_private_status();

-- ---------------------------------------------------------------------------
-- 4. Admin RLS for moderation/private data.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can view verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view verification requests"
ON public.verification_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can view profile_private" ON public.profile_private;
CREATE POLICY "Admins can view profile_private"
ON public.profile_private FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update profile_private" ON public.profile_private;
CREATE POLICY "Admins can update profile_private"
ON public.profile_private FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports"
ON public.reports FOR SELECT TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can view user_reports" ON public.user_reports;
CREATE POLICY "Admins can view user_reports"
ON public.user_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_user_id OR public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update user_reports" ON public.user_reports;
CREATE POLICY "Admins can update user_reports"
ON public.user_reports FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- 5. A report can only claim the authenticated user as reporter.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reports insert policy" ON public.reports;
CREATE POLICY "Reports insert policy"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (reporter_user_id IS NULL OR reporter_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Public profile view: only public profile data, never Wali/private fields.
--    user_id is included because the client needs to exclude the current user.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.created_at,
  p.updated_at,
  p.user_id,
  p.name,
  p.age,
  p.profession,
  p.city,
  p.marital_status,
  p.religion,
  p.education,
  p.match_percentage,
  p.is_verified_nni,
  p.is_wali_approved,
  p.is_premium,
  CASE
    WHEN COALESCE(p.photo_private, false) THEN NULL::text
    ELSE p.photo_url
  END AS photo_url,
  COALESCE(p.photo_private, false) AS photo_private,
  p.bio,
  p.gender,
  p.views_count,
  p.likes_count,
  p.hobbies,
  p.interests,
  p.drinks_alcohol,
  p.smokes,
  p.presentation,
  p.personality,
  p.family_importance
FROM public.profiles p
WHERE COALESCE(p.is_admin, false) = false;

REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Conversations need UPDATE permission for last_message synchronization.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Conversations update policy" ON public.conversations;
CREATE POLICY "Conversations update policy"
ON public.conversations FOR UPDATE TO authenticated
USING (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- 8. Fans count without exposing the identities of people who liked a profile.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_profile_fans_count(target_profile_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)
  FROM public.user_favorites
  WHERE profile_id = target_profile_id;
$$;

REVOKE ALL ON FUNCTION public.get_profile_fans_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_profile_fans_count(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. Keep profiles.likes_count synchronized automatically.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET likes_count = COALESCE(likes_count, 0) + 1,
        updated_at = now()
    WHERE id = NEW.profile_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1),
        updated_at = now()
    WHERE id = OLD.profile_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_likes_count ON public.user_favorites;
CREATE TRIGGER trg_sync_likes_count
AFTER INSERT OR DELETE ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_likes_count();

-- Repair counters once, then keep them synchronized by the trigger above.
UPDATE public.profiles p
SET likes_count = (
  SELECT COUNT(*)
  FROM public.user_favorites f
  WHERE f.profile_id = p.id
);

COMMIT;
