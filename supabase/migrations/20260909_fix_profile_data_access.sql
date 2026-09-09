-- NASSIB profile-data hardening
-- Keep discovery public only through the intentionally curated view and
-- allow photo rows to be returned when the owning profile is not private.

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profile_photos TO authenticated;
GRANT SELECT ON public.profile_private TO authenticated;

DROP POLICY IF EXISTS "Photos select policy" ON public.profile_photos;
DROP POLICY IF EXISTS "nassib_profile_photos_select" ON public.profile_photos;
CREATE POLICY "nassib_profile_photos_select"
ON public.profile_photos
FOR SELECT TO authenticated
USING (
  is_admin()
  OR user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = profile_photos.profile_id
      AND COALESCE(p.photo_private, false) = false
  )
);

-- The profile itself is visible to authenticated users unless the owner has
-- explicitly blocked the viewer. Ownership remains required for writes.
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "nassib_profiles_select" ON public.profiles;
CREATE POLICY "nassib_profiles_select"
ON public.profiles
FOR SELECT TO authenticated
USING (
  is_admin()
  OR NOT is_blocked(user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON public.profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);

-- Keep the discovery view explicit and free of private Wali/contact fields.
GRANT SELECT ON public.public_profiles TO authenticated;
