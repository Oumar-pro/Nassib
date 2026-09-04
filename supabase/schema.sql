-- ==============================================================================
-- ZAWAJ NIGER - PRODUCTION SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Ce script initialise l'ensemble des tables, contraintes, fonctions de sécurité,
-- triggers anti-escalade de privilèges et politiques RLS strictes.
-- ==============================================================================

-- 1. EXTENSIONS REQUISES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE DES PROFILS (PROFILES)
-- Contient les données publiques et statutaires de chaque candidat ou tuteur
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
    profession TEXT,
    city TEXT NOT NULL,
    marital_status TEXT NOT NULL,
    religion TEXT DEFAULT 'Sunnite',
    education TEXT,
    match_percentage INTEGER DEFAULT 85 CHECK (match_percentage >= 0 AND match_percentage <= 100),
    is_verified_nni BOOLEAN DEFAULT FALSE,
    is_wali_approved BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    photo_private BOOLEAN DEFAULT FALSE,
    bio TEXT,
    wali_reference TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0
);

-- 3. TABLE DES FAVORIS (USER_FAVORITES)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_favorite UNIQUE (user_id, profile_id)
);

-- 4. TABLE DES CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    suitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_supervised BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_different_participants CHECK (candidate_id <> suitor_id)
);

-- 5. TABLE DES MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    is_supervised BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'))
);

-- 6. TABLE DES FORMULES D'ABONNEMENT (PRICING_PLANS)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT,
    features JSONB,
    popular BOOLEAN DEFAULT FALSE,
    cta_text TEXT
);

-- 7. TABLE DES TRANSACTIONS DE PAIEMENT (PAYMENT_TRANSACTIONS)
-- Supporte Mobile Money Niger : NITA, Al-Izza, Airtel Money, Moov Flooz, Amana
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.pricing_plans(id) ON DELETE RESTRICT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'XOF' NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('nita', 'al_izza', 'airtel_money', 'moov_money', 'amana', 'card')),
    phone_number TEXT NOT NULL,
    transaction_reference TEXT UNIQUE NOT NULL,
    operator_reference TEXT,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 8. TABLE DES SIGNALEMENTS ET MODÉRATION (USER_REPORTS)
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'dismissed'))
);

-- 9. TABLE DES BLOCAGES ÉTHIQUES (USER_BLOCKS)
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    blocker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_block UNIQUE (blocker_user_id, blocked_profile_id)
);

-- 10. TABLE DU JOURNAL D'AUDIT ADMIN (ADMIN_AUDIT_LOGS)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    target_type TEXT,
    details JSONB
);

-- ==============================================================================
-- 11. INDEX DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified_nni);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_profile ON public.user_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_candidate ON public.conversations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_conversations_suitor ON public.conversations(suitor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payment_transactions(transaction_reference);

-- ==============================================================================
-- 12. FONCTIONS DE SÉCURITÉ (ADMIN & ESCALATION CONTROL)
-- ==============================================================================

-- Vérifie si l'utilisateur appelant est administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    auth.role() = 'service_role' OR
    (auth.jwt() ->> 'email') IN (
      'moutarioumar7@gmail.com',
      'admin@zawaj.ne',
      'contact@zawaj.ne'
    ) OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
$$;

-- Trigger pour empêcher l'escalade de privilèges par un utilisateur standard
-- Un utilisateur ne peut JAMAIS modifier lui-même is_premium, is_verified_nni ou is_wali_approved !
CREATE OR REPLACE FUNCTION public.prevent_profile_status_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si l'appel vient de la clé service_role (backend admin) ou d'un admin authentifié, autoriser
  IF auth.role() = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Pour un utilisateur authentifié normal, interdire la modification unilatérale des statuts
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'Modification non autorisée : seul le service administratif peut activer le statut Premium.';
  END IF;

  IF NEW.is_verified_nni IS DISTINCT FROM OLD.is_verified_nni THEN
    RAISE EXCEPTION 'Modification non autorisée : la vérification NNI nécessite la validation administrative.';
  END IF;

  IF NEW.is_wali_approved IS DISTINCT FROM OLD.is_wali_approved THEN
    RAISE EXCEPTION 'Modification non autorisée : l approbation Wali nécessite la validation officielle.';
  END IF;

  -- Empêcher le vol d'identité
  NEW.user_id := OLD.user_id;
  NEW.updated_at := timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_status_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_status_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_status_escalation();

-- Trigger automatique pour insérer la date de mise à jour
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 13. ACTIVATION DU ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 14. POLITIQUES DE SÉCURITÉ RLS STRICTES (ZERO-TRUST)
-- ==============================================================================

-- 14.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

-- Lecture publique des profils (les visiteurs et membres peuvent parcourir les profils)
CREATE POLICY "Profiles select policy"
ON public.profiles FOR SELECT
USING (true);

-- Seul l'utilisateur propriétaire peut créer son propre profil
CREATE POLICY "Profiles insert policy"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Seul le propriétaire peut modifier son profil (avec garde-fous trigger contre l'escalade)
CREATE POLICY "Profiles update policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Seul le propriétaire ou l'admin peut supprimer un profil
CREATE POLICY "Profiles delete policy"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 14.2 USER_FAVORITES POLICIES
DROP POLICY IF EXISTS "Favorites select policy" ON public.user_favorites;
DROP POLICY IF EXISTS "Favorites insert policy" ON public.user_favorites;
DROP POLICY IF EXISTS "Favorites delete policy" ON public.user_favorites;

CREATE POLICY "Favorites select policy"
ON public.user_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Favorites insert policy"
ON public.user_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Favorites delete policy"
ON public.user_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 14.3 CONVERSATIONS POLICIES (Strictement réservées aux 2 participants ou à l'admin)
DROP POLICY IF EXISTS "Conversations viewable by participants" ON public.conversations;
DROP POLICY IF EXISTS "Conversations select policy" ON public.conversations;
DROP POLICY IF EXISTS "Conversations insert policy" ON public.conversations;
DROP POLICY IF EXISTS "Conversations update policy" ON public.conversations;
DROP POLICY IF EXISTS "Conversations delete policy" ON public.conversations;

CREATE POLICY "Conversations select policy"
ON public.conversations FOR SELECT
TO authenticated
USING (
  public.is_admin() OR
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Conversations insert policy"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Conversations update policy"
ON public.conversations FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Conversations delete policy"
ON public.conversations FOR DELETE
TO authenticated
USING (
  public.is_admin() OR
  candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  suitor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 14.4 MESSAGES POLICIES (Uniquement les participants à la conversation parente)
DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow message inserts" ON public.messages;
DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;

CREATE POLICY "Messages select policy"
ON public.messages FOR SELECT
TO authenticated
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.profiles p ON (p.id = c.candidate_id OR p.id = c.suitor_id)
    WHERE c.id = messages.conversation_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Messages insert policy"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.profiles p ON (p.id = c.candidate_id OR p.id = c.suitor_id)
    WHERE c.id = messages.conversation_id
      AND p.user_id = auth.uid()
  )
);

-- 14.5 PAYMENT TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Payments select policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "Payments insert policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "Payments update policy" ON public.payment_transactions;

CREATE POLICY "Payments select policy"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Payments insert policy"
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Seul le serveur / admin peut valider et mettre à jour le statut du paiement
CREATE POLICY "Payments update policy"
ON public.payment_transactions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.6 USER REPORTS POLICIES
DROP POLICY IF EXISTS "Reports insert policy" ON public.user_reports;
DROP POLICY IF EXISTS "Reports select policy" ON public.user_reports;

CREATE POLICY "Reports insert policy"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Reports select policy"
ON public.user_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id OR public.is_admin());

-- 14.7 USER BLOCKS POLICIES
DROP POLICY IF EXISTS "Blocks select policy" ON public.user_blocks;
DROP POLICY IF EXISTS "Blocks insert policy" ON public.user_blocks;
DROP POLICY IF EXISTS "Blocks delete policy" ON public.user_blocks;

CREATE POLICY "Blocks select policy"
ON public.user_blocks FOR SELECT
TO authenticated
USING (auth.uid() = blocker_user_id OR public.is_admin());

CREATE POLICY "Blocks insert policy"
ON public.user_blocks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_user_id);

CREATE POLICY "Blocks delete policy"
ON public.user_blocks FOR DELETE
TO authenticated
USING (auth.uid() = blocker_user_id);

-- 14.8 PRICING PLANS POLICIES (Lecture publique, modification admin)
DROP POLICY IF EXISTS "Public pricing plans viewable by everyone" ON public.pricing_plans;
DROP POLICY IF EXISTS "Plans select policy" ON public.pricing_plans;
DROP POLICY IF EXISTS "Plans admin write policy" ON public.pricing_plans;

CREATE POLICY "Plans select policy"
ON public.pricing_plans FOR SELECT
USING (true);

CREATE POLICY "Plans admin write policy"
ON public.pricing_plans FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14.9 ADMIN AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Audit logs admin policy" ON public.admin_audit_logs;
CREATE POLICY "Audit logs admin policy"
ON public.admin_audit_logs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 15. INSERTION DES FORMULES TARIFAIRES INITIALES (NIGER FCFA)
-- ==============================================================================
INSERT INTO public.pricing_plans (id, name, price, period, description, features, popular, cta_text)
VALUES 
  ('plan_sadaq', 'Sadaq', '0', 'FCFA / mois', 'Pour débuter votre démarche avec intention', '["Consultation de base des profils", "5 messages autorisés / semaine", "Filtres géographiques simples"]'::jsonb, FALSE, 'Formule Actuelle'),
  ('plan_baraka', 'Baraka', '5,000', 'FCFA / mois', 'Visibilité renforcée & crédibilité totale', '["Vérification NNI Incluse", "Messagerie illimitée et privée", "Filtres de recherche avancés", "Intégration & approbation du Wali"]'::jsonb, TRUE, 'Choisir Baraka'),
  ('plan_iman', 'Iman', '15,000', 'FCFA / 6 mois', 'L''expérience éthique complète sur le long terme', '["Tous les avantages de la formule Baraka", "Boost prioritaire du profil", "Accusés de lecture des messages", "Conseiller matrimonial dédié"]'::jsonb, FALSE, 'Choisir Iman')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  period = EXCLUDED.period,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  popular = EXCLUDED.popular,
  cta_text = EXCLUDED.cta_text;

-- ==============================================================================
-- FIN DU SCRIPT - SCHÉMA ZAWAJ NIGER PRÊT ET SÉCURISÉ
-- ==============================================================================
