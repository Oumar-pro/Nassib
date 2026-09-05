-- NASSIB production security hardening migration
-- Apply this migration to Supabase project ttekelchyffxfaxrpory.
BEGIN;

-- Move duplicated Wali contact data into the already protected table.
INSERT INTO public.profile_private (profile_id, user_id, wali_reference, nni_status, wali_status)
SELECT p.id, p.user_id, p.wali_reference,
       CASE WHEN COALESCE(p.is_verified_nni,false) THEN 'verified' ELSE 'pending' END,
       CASE WHEN COALESCE(p.is_wali_approved,false) THEN 'approved' ELSE 'pending' END
FROM public.profiles p
WHERE p.wali_reference IS NOT NULL
ON CONFLICT (profile_id) DO UPDATE SET
  wali_reference=EXCLUDED.wali_reference,
  nni_status=EXCLUDED.nni_status,
  wali_status=EXCLUDED.wali_status,
  updated_at=now();

ALTER TABLE public.profiles DROP COLUMN IF EXISTS wali_reference;

DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles
FOR SELECT TO authenticated USING (true);

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker=true) AS
SELECT p.id,p.created_at,p.updated_at,p.name,p.age,p.profession,p.city,
       p.marital_status,p.religion,p.education,p.match_percentage,
       p.is_verified_nni,p.is_wali_approved,p.is_premium,
       CASE WHEN COALESCE(p.photo_private,false) THEN NULL::text ELSE p.photo_url END AS photo_url,
       COALESCE(p.photo_private,false) AS photo_private,p.bio,p.gender,
       p.views_count,p.likes_count,p.hobbies,p.interests,p.drinks_alcohol,
       p.smokes,p.presentation,p.personality,p.family_importance
FROM public.profiles p;
REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;

DROP POLICY IF EXISTS "Photos select policy" ON public.profile_photos;
CREATE POLICY "Photos select policy" ON public.profile_photos
FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.profile_photos FROM anon;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

UPDATE storage.buckets SET public=false WHERE id='profiles-private';

REVOKE EXECUTE ON FUNCTION public.admin_set_premium(uuid,boolean) FROM anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_profile_verification(uuid,text,boolean) FROM anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_verification(uuid,text,text) FROM anon,authenticated;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path=public;

COMMIT;
