-- NASSIB: align persisted profile data with the fields actually collected by onboarding.
-- This migration is additive and removes the only business-profile default that could
-- silently invent a user answer.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS profession_category text,
  ADD COLUMN IF NOT EXISTS body_type text,
  ADD COLUMN IF NOT EXISTS preferred_age_range text,
  ADD COLUMN IF NOT EXISTS marriage_horizon text;

ALTER TABLE public.profile_private
  ADD COLUMN IF NOT EXISTS birth_date date;

ALTER TABLE public.profiles
  ALTER COLUMN religion DROP DEFAULT;

COMMENT ON COLUMN public.profiles.country IS 'Country of residence explicitly collected by onboarding.';
COMMENT ON COLUMN public.profiles.neighborhood IS 'Neighborhood/commune explicitly collected by onboarding.';
COMMENT ON COLUMN public.profiles.profession_category IS 'Professional sector explicitly collected by onboarding.';
COMMENT ON COLUMN public.profiles.body_type IS 'Body type explicitly collected by onboarding.';
COMMENT ON COLUMN public.profiles.preferred_age_range IS 'Preferred partner age range explicitly collected by onboarding.';
COMMENT ON COLUMN public.profiles.marriage_horizon IS 'Desired marriage timeline explicitly collected by onboarding.';
COMMENT ON COLUMN public.profile_private.birth_date IS 'Exact date of birth collected by onboarding; kept private and never exposed in public profile queries.';

CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON public.profiles(neighborhood);

-- Existing rows are intentionally not backfilled: the old application did not persist
-- these fields separately, so guessing them would violate data integrity.
