BEGIN;

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles WITH (security_invoker=true) AS
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
  CASE WHEN COALESCE(p.photo_private,false) THEN NULL::text ELSE p.photo_url END AS photo_url,
  COALESCE(p.photo_private,false) AS photo_private,
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
