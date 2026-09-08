-- ==============================================================================
-- NASSIB - MIGRATION SUPABASE : RESTRICTIONS FREEMIUM & PRIVILÈGES PREMIUM
-- ==============================================================================

-- 1. AJOUT DES COLONNES PREMIUM ET QUOTAS DANS LA TABLE PROFILES
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS boosts_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS daily_contacts_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_contacts_date DATE DEFAULT CURRENT_DATE;

-- Index pour optimiser l'affichage prioritaire ("Sois vu(e) en premier")
CREATE INDEX IF NOT EXISTS idx_profiles_premium_boost 
  ON public.profiles (is_premium DESC, boosted_until DESC NULLS LAST);

-- 2. TABLE PRICING_PLANS : MISE À JOUR DES 4 FORMULES OFFICIELLES DU PAYWALL
INSERT INTO public.pricing_plans (id, name, price, period, description, features)
VALUES 
  (
    '15d', 
    'Premium 15 jours', 
    '2 900 FCFA', 
    '15 jours', 
    'Découverte des privilèges Nassib', 
    '["Vois qui t''a mis en favori", "Découvre qui te repère", "Contacte sans limite", "Priorité dans la Sélection", "Validation immédiate", "+1 Boost offert", "Jusqu''à 6 photos", "Badge de sérieux doré"]'::jsonb
  ),
  (
    '1m', 
    'Premium 1 mois', 
    '4 900 FCFA', 
    '1 mois', 
    'Formule la plus populaire (-16%)', 
    '["Vois qui t''a mis en favori", "Découvre qui te repère", "Contacte sans limite", "Priorité dans la Sélection", "Validation immédiate", "+3 Boosts offerts", "Messages vocaux", "Jusqu''à 6 photos", "Badge de sérieux doré"]'::jsonb
  ),
  (
    '3m', 
    'Premium 3 mois', 
    '8 900 FCFA', 
    '3 mois', 
    'Économie majeure de -49%', 
    '["Vois qui t''a mis en favori", "Découvre qui te repère", "Contacte sans limite", "Priorité dans la Sélection", "Validation immédiate", "+5 Boosts offerts", "Messages vocaux", "Jusqu''à 6 photos", "Badge de sérieux doré"]'::jsonb
  ),
  (
    '6m', 
    'Premium 6 mois', 
    '13 900 FCFA', 
    '6 mois', 
    'Meilleur tarif à long terme (-60%)', 
    '["Vois qui t''a mis en favori", "Découvre qui te repère", "Contacte sans limite", "Priorité dans la Sélection", "Validation immédiate", "+10 Boosts offerts", "Messages vocaux", "Jusqu''à 6 photos", "Badge de sérieux doré"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  period = EXCLUDED.period,
  description = EXCLUDED.description,
  features = EXCLUDED.features;

-- 3. RPC : OBTENIR CEUX QUI ONT MIS EN FAVORI (RÉSERVÉ PREMIUM)
-- Si l'utilisateur est Premium, renvoie les profils complets de ses fans.
-- Si Freemium, renvoie une liste vide pour respecter le paywall au niveau base de données.
CREATE OR REPLACE FUNCTION public.get_who_favorited_me()
RETURNS TABLE (
  profile_id uuid,
  name text,
  age integer,
  city text,
  photo_url text,
  is_verified_nni boolean,
  is_premium boolean,
  favorited_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  my_profile_id uuid;
  caller_is_premium boolean := false;
BEGIN
  IF caller_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id, is_premium INTO my_profile_id, caller_is_premium
  FROM public.profiles
  WHERE user_id = caller_user_id;

  IF my_profile_id IS NULL THEN
    RETURN;
  END IF;

  -- Restriction Paywall : Seuls les membres Premium voient l'identité de leurs admirateurs
  IF caller_is_premium IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    p.name,
    p.age,
    p.city,
    p.photo_url,
    p.is_verified_nni,
    p.is_premium,
    uf.created_at AS favorited_at
  FROM public.user_favorites uf
  JOIN public.profiles p ON p.user_id = uf.user_id
  WHERE uf.profile_id = my_profile_id
  ORDER BY uf.created_at DESC;
END;
$$;

-- 4. RPC : ACTIVER UN BOOST 24H
CREATE OR REPLACE FUNCTION public.activate_profile_boost()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  current_boosts integer := 0;
  new_until timestamp with time zone;
BEGIN
  IF caller_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT COALESCE(boosts_count, 0) INTO current_boosts
  FROM public.profiles
  WHERE user_id = caller_user_id;

  IF current_boosts <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucun boost disponible');
  END IF;

  new_until := timezone('utc'::text, now()) + interval '24 hours';

  UPDATE public.profiles
  SET 
    boosts_count = current_boosts - 1,
    boosted_until = new_until
  WHERE user_id = caller_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'remaining_boosts', current_boosts - 1, 
    'boosted_until', new_until
  );
END;
$$;

-- 5. RPC : VÉRIFICATION ET CONSOMMATION DU QUOTA DE CONTACT QUOTIDIEN (3/jour en gratuit)
CREATE OR REPLACE FUNCTION public.check_and_consume_contact_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  caller_is_premium boolean := false;
  current_count integer := 0;
  last_date date := CURRENT_DATE;
BEGIN
  IF caller_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Non authentifié');
  END IF;

  SELECT 
    COALESCE(is_premium, false),
    COALESCE(daily_contacts_count, 0),
    COALESCE(daily_contacts_date, CURRENT_DATE)
  INTO caller_is_premium, current_count, last_date
  FROM public.profiles
  WHERE user_id = caller_user_id;

  -- Les membres Premium n'ont aucune limite quotidienne
  IF caller_is_premium THEN
    RETURN jsonb_build_object('allowed', true, 'is_premium', true, 'remaining', -1);
  END IF;

  -- Réinitialisation du quota si changement de jour
  IF last_date < CURRENT_DATE THEN
    current_count := 0;
    UPDATE public.profiles
    SET daily_contacts_count = 1, daily_contacts_date = CURRENT_DATE
    WHERE user_id = caller_user_id;
    RETURN jsonb_build_object('allowed', true, 'is_premium', false, 'remaining', 2);
  END IF;

  -- Vérification du plafond gratuit (3 contacts par jour)
  IF current_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'is_premium', false, 
      'remaining', 0, 
      'error', 'Plafond gratuit atteint (3 contacts / jour). Passez à Premium pour contacter sans limite.'
    );
  END IF;

  -- Incrémentation
  UPDATE public.profiles
  SET daily_contacts_count = current_count + 1
  WHERE user_id = caller_user_id;

  RETURN jsonb_build_object(
    'allowed', true, 
    'is_premium', false, 
    'remaining', 3 - (current_count + 1)
  );
END;
$$;
