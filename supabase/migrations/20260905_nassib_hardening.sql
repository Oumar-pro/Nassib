BEGIN;

-- Never trust client-controlled privilege/status fields.
-- Service-role operations remain allowed; normal authenticated users can only
-- maintain ordinary profile information for their own account.
CREATE OR REPLACE FUNCTION public.prevent_client_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_admin := false;
      NEW.is_premium := false;
      NEW.is_verified_nni := false;
      NEW.is_wali_approved := false;
      NEW.likes_count := 0;
      NEW.views_count := 0;
    ELSE
      NEW.is_admin := OLD.is_admin;
      NEW.is_premium := OLD.is_premium;
      NEW.is_verified_nni := OLD.is_verified_nni;
      NEW.is_wali_approved := OLD.is_wali_approved;
      NEW.likes_count := OLD.likes_count;
      NEW.views_count := OLD.views_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_privileges ON public.profiles;
CREATE TRIGGER trg_profiles_protect_privileges
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_client_privilege_escalation();

-- A normal client must never be able to insert/update admin roles.
DROP POLICY IF EXISTS "User roles insert policy" ON public.user_roles;
DROP POLICY IF EXISTS "User roles update policy" ON public.user_roles;
DROP POLICY IF EXISTS "User roles delete policy" ON public.user_roles;
CREATE POLICY "User roles service only" ON public.user_roles
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- Keep fan counts authoritative in the database instead of letting clients
-- write another user's profile row.
CREATE OR REPLACE FUNCTION public.sync_profile_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile uuid;
BEGIN
  target_profile := CASE WHEN TG_OP = 'DELETE' THEN OLD.profile_id ELSE NEW.profile_id END;
  UPDATE public.profiles
  SET likes_count = (
    SELECT count(*)::integer FROM public.user_favorites WHERE profile_id = target_profile
  ), updated_at = now()
  WHERE id = target_profile;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_favorites_sync_likes ON public.user_favorites;
CREATE TRIGGER trg_user_favorites_sync_likes
AFTER INSERT OR DELETE ON public.user_favorites
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_likes_count();

-- Users may create/read/delete their own favorites only.
DROP POLICY IF EXISTS "Favorites select policy" ON public.user_favorites;
DROP POLICY IF EXISTS "Favorites insert policy" ON public.user_favorites;
DROP POLICY IF EXISTS "Favorites delete policy" ON public.user_favorites;
CREATE POLICY "Favorites select policy" ON public.user_favorites
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Favorites insert policy" ON public.user_favorites
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_id <> profile_id);
CREATE POLICY "Favorites delete policy" ON public.user_favorites
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversations need UPDATE permission so last-message metadata can remain
-- synchronized after a message is sent.
DROP POLICY IF EXISTS "Conversations update policy" ON public.conversations;
CREATE POLICY "Conversations update policy" ON public.conversations
FOR UPDATE TO authenticated
USING (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Expose only the fields required by the discovery UI. user_id is needed to
-- exclude the current account; private Wali information is intentionally absent.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.user_id,
  p.created_at,
  p.updated_at,
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
  CASE WHEN COALESCE(p.photo_private, false) THEN NULL::text ELSE p.photo_url END AS photo_url,
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
FROM public.profiles p;

REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;

COMMIT;
