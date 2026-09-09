-- NASSIB Migration: Assurer la présence immédiate de chaque inscrit dans public.profiles
-- 1. Ajout de la colonne phone si elle n'existe pas encore dans public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. Backfill automatique : Insérer tous les utilisateurs auth.users qui n'ont pas encore de profil public
INSERT INTO public.profiles (
  user_id,
  name,
  gender,
  age,
  city,
  country,
  marital_status,
  religion,
  phone,
  is_verified_nni,
  is_wali_approved,
  is_premium,
  photo_private,
  created_at,
  updated_at
)
SELECT 
  u.id AS user_id,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''), 'Membre Nassib') AS name,
  CASE 
    WHEN LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'gender', '')))::text IN ('female', 'femme', 'fille', 'f') THEN 'female'
    ELSE 'male'
  END AS gender,
  25 AS age,
  'Niamey' AS city,
  'Niger' AS country,
  'Célibataire' AS marital_status,
  'Sunnite' AS religion,
  COALESCE(u.raw_user_meta_data->>'phone', u.phone) AS phone,
  false AS is_verified_nni,
  false AS is_wali_approved,
  false AS is_premium,
  false AS photo_private,
  COALESCE(u.created_at, now()) AS created_at,
  now() AS updated_at
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Trigger automatique : à chaque nouvel enregistrement dans auth.users, créer son profil public immédiatement
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    name,
    gender,
    age,
    city,
    country,
    marital_status,
    religion,
    phone,
    is_verified_nni,
    is_wali_approved,
    is_premium,
    photo_private,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), 'Membre Nassib'),
    CASE 
      WHEN LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'gender', '')))::text IN ('female', 'femme', 'fille', 'f') THEN 'female'
      ELSE 'male'
    END,
    25,
    'Niamey',
    'Niger',
    'Célibataire',
    'Sunnite',
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    false,
    false,
    false,
    false,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
