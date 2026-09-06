-- NASSIB - Correction de l'erreur trigger wali_reference (Code 42703)
-- Exécutez ce script dans Supabase SQL Editor pour votre projet ttekelchyffxfaxrpory.

BEGIN;

-- 1. Réintégrer de manière sécurisée la colonne wali_reference sur public.profiles
-- Cela garantit qu'aucun trigger hérité ou persistant ne déclenchera d'erreur 42703 ("record new has no field wali_reference")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wali_reference text;

-- 2. Supprimer tous les déclencheurs obsolètes qui référençaient l'ancien schéma
DROP TRIGGER IF EXISTS trg_profiles_protect_privileges ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_wali ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_wali_to_private ON public.profiles;
DROP TRIGGER IF EXISTS trg_profile_private_sync ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_wali ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields_insert ON public.profiles;

-- 3. Recréer la fonction de protection des privilèges propre sans référence problématique
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin_user() THEN
    NEW.is_verified_nni := COALESCE(OLD.is_verified_nni, false);
    NEW.is_wali_approved := COALESCE(OLD.is_wali_approved, false);
    NEW.is_premium := COALESCE(OLD.is_premium, false);
    NEW.is_admin := COALESCE(OLD.is_admin, false);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_privileged_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_fields();

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE TRIGGER trg_protect_privileged_profile_fields_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_fields_insert();

-- 4. Maintenir la vue public_profiles sécurisée (sans exposer d'informations privées)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
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
