import React, { useState, useEffect, useMemo } from 'react';
import { Profile } from '../../types';
import { supabase, isSupabaseConfigured, isSupabasePermissionIssue } from '../../lib/supabase';
import { MOCK_PROFILES, INITIAL_USER } from '../../data/mockData';
import {
  getRegisteredAccounts,
  updateAccountPlanAndStatus,
  AuthAccount
} from '../../lib/auth';

const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- ZAWAJ NIGER - PRODUCTION DATABASE ARCHITECTURE & SECURITY SCRIPT
-- ==============================================================================
-- PostgreSQL / Supabase Schema avec RLS strict, Triggers, Cascades & Index
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES AVEC CLÉS ÉTRANGÈRES & CONTRAINTES STRICTES
-- ==============================================================================

-- 2.1 USER ROLES (Gestion des rôles Administrateur / Utilisateur)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'wali')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 PROFILES (Profils publics / visibles selon RLS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18),
    profession TEXT,
    city TEXT NOT NULL,
    marital_status TEXT NOT NULL,
    religion TEXT DEFAULT 'Musulman(e) Sunnite',
    education TEXT,
    match_percentage INTEGER DEFAULT 85 CHECK (match_percentage BETWEEN 0 AND 100),
    is_verified_nni BOOLEAN DEFAULT FALSE,
    is_wali_approved BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    photo_private BOOLEAN DEFAULT FALSE,
    bio TEXT,
    wali_reference TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    hobbies TEXT,
    interests TEXT,
    drinks_alcohol BOOLEAN DEFAULT FALSE,
    smokes BOOLEAN DEFAULT FALSE,
    presentation TEXT,
    personality TEXT,
    family_importance TEXT
);

-- 2.3 PROFILE PRIVATE (Données KYC, NNI, Notes admin hautement sensibles)
CREATE TABLE IF NOT EXISTS public.profile_private (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nni_number TEXT,
    wali_name TEXT,
    wali_phone TEXT,
    wali_relation TEXT,
    nni_status TEXT NOT NULL DEFAULT 'pending' CHECK (nni_status IN ('pending', 'submitted', 'verified', 'rejected')),
    wali_status TEXT NOT NULL DEFAULT 'pending' CHECK (wali_status IN ('pending', 'submitted', 'approved', 'rejected')),
    nni_verified_at TIMESTAMP WITH TIME ZONE,
    wali_approved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 PROFILE PHOTOS (Photos multiples par profil)
CREATE TABLE IF NOT EXISTS public.profile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 USER BLOCKS (Blocages mutuels d'utilisateurs)
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_block UNIQUE (blocker_user_id, blocked_user_id),
    CONSTRAINT prevent_self_block CHECK (blocker_user_id <> blocked_user_id)
);

-- 2.6 USER REPORTS (Signalements éthiques pour modération)
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_note TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 VERIFICATION REQUESTS (Demandes NNI / Wali avec pièces jointes)
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('nni', 'wali')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    document_path TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 USER FAVORITES (Favoris & Intérêts)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_favorite UNIQUE (user_id, profile_id)
);

-- 2.9 CONVERSATIONS (Salons de discussion entre deux profils)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    suitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_supervised BOOLEAN DEFAULT TRUE,
    CONSTRAINT prevent_self_conversation CHECK (candidate_id <> suitor_id),
    CONSTRAINT unique_conversation_pair UNIQUE (candidate_id, suitor_id)
);

-- 2.10 MESSAGES (Messages privés supervisés)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    is_supervised BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'))
);

-- 2.11 PRICING PLANS (Grille tarifaire publique)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    popular BOOLEAN DEFAULT FALSE,
    cta_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.12 ADMIN AUDIT LOGS (Traçabilité des actions sensibles de modération)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. FONCTIONS UTILITAIRES SÉCURISÉES (SECURITY DEFINER)
-- ==============================================================================

-- 3.1 Vérifier si l'utilisateur courant est Administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    );
END;
$$;

-- 3.2 Récupérer le profile_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid();
    RETURN v_profile_id;
END;
$$;

-- 3.3 Vérifier si deux utilisateurs se sont bloqués mutuellement
CREATE OR REPLACE FUNCTION public.is_blocked(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_blocks
        WHERE (blocker_user_id = auth.uid() AND blocked_user_id = target_user_id)
           OR (blocker_user_id = target_user_id AND blocked_user_id = auth.uid())
    );
END;
$$;

-- Permissions d'exécution
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked(UUID) TO authenticated, service_role;

-- ==============================================================================
-- 4. TRIGGERS AUTOMATISÉS
-- ==============================================================================

-- 4.1 Trigger universel de mise à jour timestamp updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_profile_private ON public.profile_private;
CREATE TRIGGER set_timestamp_profile_private BEFORE UPDATE ON public.profile_private FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_conversations ON public.conversations;
CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_reports ON public.user_reports;
CREATE TRIGGER set_timestamp_user_reports BEFORE UPDATE ON public.user_reports FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_verification_requests ON public.verification_requests;
CREATE TRIGGER set_timestamp_verification_requests BEFORE UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4.2 Synchronisation automatique de last_message & last_message_time dans conversations
CREATE OR REPLACE FUNCTION public.sync_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = NEW.text,
        last_message_time = NEW.created_at,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_new_message_sync_conversation ON public.messages;
CREATE TRIGGER on_new_message_sync_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_conversation_last_message();

-- 4.3 Synchronisation automatique du compteur likes_count dans profiles
CREATE OR REPLACE FUNCTION public.sync_profile_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET likes_count = likes_count + 1 WHERE id = NEW.profile_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.profile_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_favorite_change_sync_count ON public.user_favorites;
CREATE TRIGGER on_favorite_change_sync_count
AFTER INSERT OR DELETE ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_likes_count();

-- ==============================================================================
-- 5. INDEX DE HAUTE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_gender ON public.profiles(city, gender);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified_nni, is_wali_approved);

CREATE INDEX IF NOT EXISTS idx_profile_private_user_id ON public.profile_private(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON public.profile_photos(profile_id);

CREATE INDEX IF NOT EXISTS idx_conversations_candidate_id ON public.conversations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_conversations_suitor_id ON public.conversations(suitor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON public.conversations(last_message_time DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_profile ON public.user_favorites(user_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_blocked ON public.user_blocks(blocker_user_id, blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

-- ==============================================================================
-- 6. POLITIQUES ROW LEVEL SECURITY (RLS) ÉTANCHES
-- ==============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Roles viewable by owners and admins" ON public.user_roles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
DROP POLICY IF EXISTS "Profile private viewable by owner and admin" ON public.profile_private;
DROP POLICY IF EXISTS "Profile private insert by owner" ON public.profile_private;
DROP POLICY IF EXISTS "Profile private update by owner and admin" ON public.profile_private;
DROP POLICY IF EXISTS "Profile photos select policy" ON public.profile_photos;
DROP POLICY IF EXISTS "Profile photos insert by owner" ON public.profile_photos;
DROP POLICY IF EXISTS "Profile photos delete by owner" ON public.profile_photos;
DROP POLICY IF EXISTS "Conversations access for participants and admins" ON public.conversations;
DROP POLICY IF EXISTS "Conversations insert for authenticated members" ON public.conversations;
DROP POLICY IF EXISTS "Messages select for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Messages insert for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Pricing plans select for everyone" ON public.pricing_plans;
DROP POLICY IF EXISTS "User favorites select by owner" ON public.user_favorites;
DROP POLICY IF EXISTS "User favorites insert by owner" ON public.user_favorites;
DROP POLICY IF EXISTS "User favorites delete by owner" ON public.user_favorites;
DROP POLICY IF EXISTS "User blocks manage by owner" ON public.user_blocks;
DROP POLICY IF EXISTS "User reports insert by reporter" ON public.user_reports;
DROP POLICY IF EXISTS "User reports select for admins and reporters" ON public.user_reports;
DROP POLICY IF EXISTS "Verification requests access by owner and admins" ON public.verification_requests;
DROP POLICY IF EXISTS "Verification requests insert by owner" ON public.verification_requests;
DROP POLICY IF EXISTS "Audit logs select by admin only" ON public.admin_audit_logs;

-- 6.1 USER ROLES POLICIES
CREATE POLICY "Roles viewable by owners and admins"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- 6.2 PROFILES POLICIES (Exclusion automatique des utilisateurs bloqués et du profil admin)
CREATE POLICY "Profiles select policy"
ON public.profiles FOR SELECT
USING (
    public.is_admin()
    OR (
        auth.uid() = user_id 
        OR (
            NOT public.is_blocked(user_id)
            AND NOT EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = profiles.user_id AND ur.role IN ('admin', 'super_admin')
            )
        )
    )
);

CREATE POLICY "Profiles insert policy"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles update policy"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Profiles delete policy"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- 6.3 PROFILE PRIVATE POLICIES (Strictement propriétaire ou admin)
CREATE POLICY "Profile private viewable by owner and admin"
ON public.profile_private FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Profile private insert by owner"
ON public.profile_private FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profile private update by owner and admin"
ON public.profile_private FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 6.4 PROFILE PHOTOS POLICIES
CREATE POLICY "Profile photos select policy"
ON public.profile_photos FOR SELECT
USING (auth.uid() = user_id OR public.is_admin() OR NOT public.is_blocked(user_id));

CREATE POLICY "Profile photos insert by owner"
ON public.profile_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profile photos delete by owner"
ON public.profile_photos FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- 6.5 CONVERSATIONS POLICIES (Participants réels uniquement & anti-blocage)
CREATE POLICY "Conversations access for participants and admins"
ON public.conversations FOR SELECT
USING (
    public.is_admin()
    OR candidate_id = public.get_my_profile_id()
    OR suitor_id = public.get_my_profile_id()
);

CREATE POLICY "Conversations insert for authenticated members"
ON public.conversations FOR INSERT
WITH CHECK (
    (candidate_id = public.get_my_profile_id() OR suitor_id = public.get_my_profile_id())
    AND NOT EXISTS (
        SELECT 1 FROM public.profiles p1, public.profiles p2
        WHERE (p1.id = candidate_id AND p2.id = suitor_id)
          AND (
            EXISTS (SELECT 1 FROM public.user_blocks b WHERE (b.blocker_user_id = p1.user_id AND b.blocked_user_id = p2.user_id) OR (b.blocker_user_id = p2.user_id AND b.blocked_user_id = p1.user_id))
          )
    )
);

-- 6.6 MESSAGES POLICIES (Isolation stricte au sein de la conversation)
CREATE POLICY "Messages select for conversation participants"
ON public.messages FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.candidate_id = public.get_my_profile_id() OR c.suitor_id = public.get_my_profile_id())
    )
);

CREATE POLICY "Messages insert for conversation participants"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.candidate_id = public.get_my_profile_id() OR c.suitor_id = public.get_my_profile_id())
    )
);

-- 6.7 PRICING PLANS
CREATE POLICY "Pricing plans select for everyone"
ON public.pricing_plans FOR SELECT
USING (true);

-- 6.8 USER FAVORITES POLICIES
CREATE POLICY "User favorites select by owner"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "User favorites insert by owner"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User favorites delete by owner"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- 6.9 USER BLOCKS POLICIES
CREATE POLICY "User blocks manage by owner"
ON public.user_blocks FOR ALL
USING (auth.uid() = blocker_user_id OR public.is_admin())
WITH CHECK (auth.uid() = blocker_user_id OR public.is_admin());

-- 6.10 USER REPORTS POLICIES
CREATE POLICY "User reports insert by reporter"
ON public.user_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "User reports select for admins and reporters"
ON public.user_reports FOR SELECT
USING (auth.uid() = reporter_user_id OR public.is_admin());

-- 6.11 VERIFICATION REQUESTS POLICIES (KYC / NNI / Wali)
CREATE POLICY "Verification requests access by owner and admins"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Verification requests insert by owner"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Verification requests update by admins"
ON public.verification_requests FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.12 ADMIN AUDIT LOGS POLICIES
CREATE POLICY "Audit logs select by admin only"
ON public.admin_audit_logs FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
`;

interface AdminStats {
  configured: boolean;
  tableMissing?: boolean;
  totalProfiles: number;
  verifiedNNI: number;
  waliApproved: number;
  premiumMembers: number;
  totalConversations: number;
}

interface AdminDashboardProps {
  onShowToast: (msg: string) => void;
  onRefreshProfiles: () => void;
  allProfiles?: Profile[];
  onUpdateProfile?: (profileId: string, updates: Partial<Profile>) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onShowToast,
  onRefreshProfiles,
  allProfiles = [],
  onUpdateProfile,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getAdminHeaders = () => {
    const token = localStorage.getItem('zawaj_admin_token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem('zawaj_admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Authenticate via secure backend API endpoint
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: cleanPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem('zawaj_admin_token', data.token);
          setIsAuthenticated(true);
          onShowToast('Connexion administrateur réussie !');
          fetchAdminData();
          setLoading(false);
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setLoginError(errData.error || 'Identifiants administrateur incorrects.');
        setLoading(false);
        return;
      }
    } catch (apiErr) {
      console.warn('Backend /api/admin/login error:', apiErr);
    }

    // 2. Supabase Auth Admin Check if user has admin role in database
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbAuth, error: sbError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: cleanPassword,
        });
        if (sbAuth?.user && !sbError) {
          const role = sbAuth.user.user_metadata?.role;
          if (role === 'super_admin' || role === 'admin') {
            localStorage.setItem('zawaj_admin_token', `sb_admin_${sbAuth.user.id}`);
            setIsAuthenticated(true);
            onShowToast('Connexion administrateur validée via Supabase !');
            fetchAdminData();
            setLoading(false);
            return;
          }
        }
      } catch (sbErr) {
        console.warn('Supabase admin login exception:', sbErr);
      }
    }

    setLoginError('Identifiants administrateur incorrects ou accès non autorisé.');
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('zawaj_admin_token');
    setIsAuthenticated(false);
    onShowToast('Déconnexion de la session administrateur.');
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const fetchedMap = new Map<string, Profile>();

    // 1. Collect all base profiles (allProfiles + MOCK_PROFILES seed data)
    const baseSourceProfiles = (allProfiles && allProfiles.length > 0) ? allProfiles : MOCK_PROFILES;
    baseSourceProfiles.forEach((p) => {
      fetchedMap.set(p.id, { ...p });
    });

    // Also include MOCK_PROFILES if allProfiles only had a subset
    if (allProfiles && allProfiles.length > 0) {
      MOCK_PROFILES.forEach((p) => {
        if (!fetchedMap.has(p.id)) {
          fetchedMap.set(p.id, { ...p });
        }
      });
    }

    // Include INITIAL_USER (demonstration main user)
    const initialUserEmail = INITIAL_USER.email.toLowerCase();
    const hasInitialUser = Array.from(fetchedMap.values()).some(
      (p) => p.id === INITIAL_USER.id || p.userEmail?.toLowerCase() === initialUserEmail
    );
    if (!hasInitialUser) {
      fetchedMap.set(INITIAL_USER.id, {
        id: INITIAL_USER.id,
        userId: INITIAL_USER.id,
        userEmail: INITIAL_USER.email,
        name: INITIAL_USER.name,
        age: 28,
        profession: 'Cadre Bancaire',
        city: 'Niamey',
        maritalStatus: 'Jamais marié(e)',
        religion: 'Sunnite',
        education: 'Master / Bac+5',
        matchPercentage: 95,
        isVerifiedNNI: INITIAL_USER.isVerifiedNNI,
        isWaliApproved: INITIAL_USER.isWaliApproved,
        isPremium: INITIAL_USER.isPremium,
        photoUrl: INITIAL_USER.photoUrl,
        photoPrivate: false,
        bio: 'Compte principal',
        waliReference: INITIAL_USER.waliInfo?.name || 'Non renseigné',
        gender: INITIAL_USER.gender || 'male',
        viewsCount: 15,
        likesCount: 6,
      });
    }

    // 2. Fetch from backend API
    try {
      const profilesRes = await fetch('/api/admin/profiles', {
        headers: getAdminHeaders(),
      });
      if (profilesRes.ok) {
        const backendProfiles = await profilesRes.json();
        if (Array.isArray(backendProfiles)) {
          backendProfiles.forEach((item: any) => {
            const prof: Profile = {
              id: item.id,
              userId: item.user_id,
              userEmail: item.user_email || item.email,
              name: item.name,
              age: item.age || 25,
              profession: item.profession || 'Non renseigné',
              city: item.city || 'Niamey',
              maritalStatus: item.marital_status || 'Jamais marié(e)',
              religion: item.religion || 'Sunnite',
              education: item.education || '',
              matchPercentage: item.match_percentage || 85,
              isVerifiedNNI: Boolean(item.is_verified_nni),
              isWaliApproved: Boolean(item.is_wali_approved),
              isPremium: Boolean(item.is_premium),
              photoUrl: item.photo_url || '',
              photoPrivate: Boolean(item.photo_private),
              bio: item.bio || '',
              waliReference: item.wali_reference || 'Non renseigné',
              gender: item.gender || 'female',
              viewsCount: item.views_count || 0,
              likesCount: item.likes_count || 0,
            };
            fetchedMap.set(prof.id, prof);
          });
        }
      }
    } catch (err) {
      console.warn('Backend admin profiles endpoint notice:', err);
    }

    // 3. Fetch directly from Supabase client
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbProfiles, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!pErr && sbProfiles && Array.isArray(sbProfiles)) {
          sbProfiles.forEach((item: any) => {
            const prof: Profile = {
              id: item.id,
              userId: item.user_id,
              userEmail: item.user_email || item.email,
              name: item.name,
              age: item.age || 25,
              profession: item.profession || 'Non renseigné',
              city: item.city || 'Niamey',
              maritalStatus: item.marital_status || 'Jamais marié(e)',
              religion: item.religion || 'Sunnite',
              education: item.education || '',
              matchPercentage: item.match_percentage || 85,
              isVerifiedNNI: Boolean(item.is_verified_nni),
              isWaliApproved: Boolean(item.is_wali_approved),
              isPremium: Boolean(item.is_premium),
              photoUrl: item.photo_url || '',
              photoPrivate: Boolean(item.photo_private),
              bio: item.bio || '',
              waliReference: item.wali_reference || 'Non renseigné',
              gender: item.gender || 'female',
              viewsCount: item.views_count || 0,
              likesCount: item.likes_count || 0,
            };
            fetchedMap.set(prof.id, prof);
          });
        }
      } catch (sbErr) {
        console.warn('Supabase direct profiles fetch notice:', sbErr);
      }
    }

    // 4. Merge all registered accounts to display 100% of users
    const registeredAccounts: AuthAccount[] = getRegisteredAccounts();
    const ADMIN_EMAILS_LOWER = ['moutarioumar7@gmail.com', 'admin@zawaj.ne', 'contact@zawaj.ne'];
    const existingEmails = new Set<string>();
    const existingNames = new Set<string>();

    Array.from(fetchedMap.values()).forEach((p) => {
      if (p.userEmail) existingEmails.add(p.userEmail.toLowerCase());
      if (p.name) existingNames.add(p.name.trim().toLowerCase());
    });

    registeredAccounts.forEach((acc) => {
      const emailLower = acc.email.toLowerCase();
      const nameLower = acc.name.trim().toLowerCase();

      // Exclude platform administrator account itself from candidate/wali list
      if (ADMIN_EMAILS_LOWER.includes(emailLower)) return;

      if (!existingEmails.has(emailLower) && !existingNames.has(nameLower) && !fetchedMap.has(acc.id)) {
        const syntheticProfile: Profile = {
          id: acc.id,
          userId: acc.id,
          userEmail: acc.email,
          name: acc.name || acc.email.split('@')[0],
          age: 25,
          profession: acc.role === 'wali' ? 'Wali (Tuteur)' : 'Membre inscrit',
          city: 'Niamey',
          maritalStatus: 'Jamais marié(e)',
          religion: 'Sunnite',
          education: 'Licence / Bac+3',
          matchPercentage: 90,
          isVerifiedNNI: Boolean(acc.isVerifiedNNI),
          isWaliApproved: Boolean(acc.isWaliApproved),
          isPremium: Boolean(acc.isPremium),
          photoUrl: acc.photoUrl || '',
          photoPrivate: false,
          bio: `Compte inscrit le ${new Date(acc.createdAt).toLocaleDateString('fr-FR')}`,
          waliReference: acc.phone || 'Non renseigné',
          gender: acc.gender || 'female',
          viewsCount: 0,
          likesCount: 0,
        };

        fetchedMap.set(syntheticProfile.id, syntheticProfile);
        existingEmails.add(emailLower);
        existingNames.add(nameLower);
      }
    });

    const finalProfilesList = Array.from(fetchedMap.values());
    setProfiles(finalProfilesList);

    // Dynamic stats computation
    const totalCount = finalProfilesList.length;
    const verifiedNNICount = finalProfilesList.filter((p) => p.isVerifiedNNI).length;
    const waliApprovedCount = finalProfilesList.filter((p) => p.isWaliApproved).length;
    const premiumMembersCount = finalProfilesList.filter((p) => p.isPremium).length;

    setStats({
      configured: isSupabaseConfigured,
      totalProfiles: totalCount,
      verifiedNNI: verifiedNNICount,
      waliApproved: waliApprovedCount,
      premiumMembers: premiumMembersCount,
      totalConversations: 0,
    });

    setLoading(false);
  };

  const handleToggleNNI = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    const newStatus = !currentStatus;

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isVerifiedNNI: newStatus } : p))
    );

    const target = profiles.find((p) => p.id === id);
    if (target) {
      updateAccountPlanAndStatus(target.id, { isVerifiedNNI: newStatus });
      if (target.userId) updateAccountPlanAndStatus(target.userId, { isVerifiedNNI: newStatus });
      if (target.userEmail) updateAccountPlanAndStatus(target.userEmail, { isVerifiedNNI: newStatus });
      if (target.name) updateAccountPlanAndStatus(target.name, { isVerifiedNNI: newStatus });
    }

    onUpdateProfile?.(id, { isVerifiedNNI: newStatus });

    try {
      await fetch(`/api/admin/profiles/${id}/verify-nni`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('Backend verify-nni route warning:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ is_verified_nni: newStatus }).eq('id', id);
        if (target?.userId && target.userId !== id) {
          await supabase.from('profiles').update({ is_verified_nni: newStatus }).eq('user_id', target.userId);
        }
      } catch (err) {
        console.warn('Supabase NNI update warning:', err);
      }
    }

    onShowToast(`Statut NNI mis à jour (${newStatus ? 'Vérifié' : 'Non vérifié'})`);
    setActionLoading(null);
    onRefreshProfiles();
  };

  const handleToggleWali = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    const newStatus = !currentStatus;

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isWaliApproved: newStatus } : p))
    );

    const target = profiles.find((p) => p.id === id);
    if (target) {
      updateAccountPlanAndStatus(target.id, { isWaliApproved: newStatus });
      if (target.userId) updateAccountPlanAndStatus(target.userId, { isWaliApproved: newStatus });
      if (target.userEmail) updateAccountPlanAndStatus(target.userEmail, { isWaliApproved: newStatus });
      if (target.name) updateAccountPlanAndStatus(target.name, { isWaliApproved: newStatus });
    }

    onUpdateProfile?.(id, { isWaliApproved: newStatus });

    try {
      await fetch(`/api/admin/profiles/${id}/verify-wali`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('Backend verify-wali route warning:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ is_wali_approved: newStatus }).eq('id', id);
        if (target?.userId && target.userId !== id) {
          await supabase.from('profiles').update({ is_wali_approved: newStatus }).eq('user_id', target.userId);
        }
      } catch (err) {
        console.warn('Supabase Wali update warning:', err);
      }
    }

    onShowToast(`Approbation Wali mise à jour (${newStatus ? 'Approuvé' : 'Non approuvé'})`);
    setActionLoading(null);
    onRefreshProfiles();
  };

  const handleTogglePremium = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    const newStatus = !currentStatus;
    const planName = newStatus ? 'Baraka (Premium)' : 'Sadaq (Gratuit)';

    // Update local list in admin
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPremium: newStatus } : p))
    );

    const target = profiles.find((p) => p.id === id);
    if (target) {
      updateAccountPlanAndStatus(target.id, { isPremium: newStatus, planName });
      if (target.userId) updateAccountPlanAndStatus(target.userId, { isPremium: newStatus, planName });
      if (target.userEmail) updateAccountPlanAndStatus(target.userEmail, { isPremium: newStatus, planName });
      if (target.name) updateAccountPlanAndStatus(target.name, { isPremium: newStatus, planName });
    }

    // Propagate to App.tsx parent state
    onUpdateProfile?.(id, { isPremium: newStatus });

    try {
      await fetch(`/api/admin/profiles/${id}/toggle-premium`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('Backend toggle-premium route warning:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ is_premium: newStatus }).eq('id', id);
        if (target?.userId && target.userId !== id) {
          await supabase.from('profiles').update({ is_premium: newStatus }).eq('user_id', target.userId);
        }
      } catch (err) {
        console.warn('Supabase Premium update warning:', err);
      }
    }

    onShowToast(`Abonnement ${newStatus ? 'Premium (Formule Baraka)' : 'Gratuit (Formule Sadaq)'} activé avec succès.`);
    setActionLoading(null);
    onRefreshProfiles();
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le profil de ${name} ?`)) {
      return;
    }

    setActionLoading(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));

    try {
      await fetch(`/api/admin/profiles/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
    } catch (err) {
      console.warn('Backend delete profile warning:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deletion warning:', err);
      }
    }

    onShowToast(`Profil de ${name} supprimé avec succès.`);
    setActionLoading(null);
    onRefreshProfiles();
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.profession && p.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [profiles, searchTerm]);

  // If not authenticated, render Login Form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 shadow-md border border-[#bec9c2]/30 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#004532] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>

          <h2 className="font-serif-display text-2xl font-bold text-[#151c27] mb-1">
            Espace Administrateur Zawaj
          </h2>
          <p className="font-body text-xs text-[#3f4944] mb-6">
            Accès réservé uniquement aux gestionnaires autorisés de la plateforme.
          </p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-body text-left">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block font-display text-xs font-semibold text-[#151c27] mb-1">
                Identifiant / Email Admin
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#bec9c2]/60 focus:border-[#004532] focus:outline-none text-sm font-body"
              />
            </div>

            <div>
              <label className="block font-display text-xs font-semibold text-[#151c27] mb-1">
                Code Secret Administrateur
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#bec9c2]/60 focus:border-[#004532] focus:outline-none text-sm font-body"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#004532] text-white font-display text-sm font-bold rounded-2xl hover:bg-[#065f46] transition-all shadow-sm flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <span>Verification...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">lock_open</span>
                  Se Connecter à l'Admin
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#bec9c2]/20 text-[11px] text-[#3f4944] text-center">
            Accès sécurisé réservé à la direction de Zawaj Niger. Authentification par jeton HMAC chiffré.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Top Header Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#bec9c2]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#004532] text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-display text-xl font-bold text-[#151c27]">
                Panneau de Contrôle Administrateur
              </h1>
              <span className="bg-[#004532]/10 text-[#004532] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <p className="font-body text-xs text-[#3f4944]">
              Gestion administrative de la plateforme, vérification des membres et modération.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2 rounded-xl border border-[#bec9c2]/60 hover:bg-slate-50 font-display text-xs font-semibold text-[#151c27] flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Actualiser
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-display text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Table Missing or Permission Issue Notice Banner */}
      {(stats?.tableMissing || isSupabasePermissionIssue) && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 text-amber-950 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {isSupabasePermissionIssue ? 'shield_lock' : 'database'}
              </span>
            </div>
            <div>
              <h3 className="font-serif-display font-bold text-base text-amber-950">
                {isSupabasePermissionIssue
                  ? 'Correction des Permissions Supabase & RLS Requise'
                  : 'Initialisation Supabase Requise : Table "profiles" Non Trouvée'}
              </h3>
              <p className="font-body text-xs text-amber-900 leading-relaxed mt-1">
                {isSupabasePermissionIssue
                  ? 'Une fonction RLS ou un privilège (is_admin) nécessite une autorisation d\'exécution dans Supabase. Copiez le script SQL ci-dessous et exécutez-le dans votre éditeur SQL Supabase pour réparer immédiatement l\'accès.'
                  : 'Votre projet Supabase est bien connecté, mais les tables n\'ont pas encore été créées dans l\'éditeur SQL Supabase. Cliquez sur le bouton ci-dessous pour copier le script SQL prêt à l\'emploi et collez-le dans le SQL Editor de Supabase.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
                onShowToast('Script SQL copié ! Collez-le dans l\'éditeur SQL de Supabase.');
              }}
              className="px-4 py-2.5 bg-[#004532] text-white font-display text-xs font-bold rounded-xl shadow-sm hover:bg-[#065f46] flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              Copier le Script SQL de Correction &amp; Schéma
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white text-[#151c27] border border-amber-300 hover:bg-amber-100/60 font-display text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
            >
              Ouvrir Supabase SQL Editor
              <span className="material-symbols-outlined text-base">open_in_new</span>
            </a>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#bec9c2]/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004532] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="font-body text-xs text-[#3f4944]">Profils Inscrits</p>
            <h3 className="font-display text-2xl font-bold text-[#151c27]">
              {stats?.totalProfiles ?? 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bec9c2]/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <p className="font-body text-xs text-[#3f4944]">Cartes NNI Vérifiées</p>
            <h3 className="font-display text-2xl font-bold text-[#151c27]">
              {stats?.verifiedNNI ?? 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bec9c2]/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">shield_person</span>
          </div>
          <div>
            <p className="font-body text-xs text-[#3f4944]">Waliss Approuvés</p>
            <h3 className="font-display text-2xl font-bold text-[#151c27]">
              {stats?.waliApproved ?? 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bec9c2]/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/60 text-[#574500] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
          </div>
          <div>
            <p className="font-body text-xs text-[#3f4944]">Membres Premium</p>
            <h3 className="font-display text-2xl font-bold text-[#151c27]">
              {stats?.premiumMembers ?? 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Profile Management Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#bec9c2]/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-display text-lg font-bold text-[#151c27]">
              Gestion des Membres ({filteredProfiles.length})
            </h3>
            <p className="font-body text-xs text-[#3f4944]">
              Validez les pièces d'identité NNI, approuvez les Walis et modérez les comptes.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Rechercher nom, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#bec9c2]/60 focus:border-[#004532] focus:outline-none text-xs font-body"
            />
          </div>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#3f4944] bg-slate-50 rounded-2xl">
            Aucun profil enregistré pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#bec9c2]/30 text-[11px] font-display text-[#3f4944] uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3 px-4 rounded-l-xl">Membre</th>
                  <th className="py-3 px-4">Ville & Profession</th>
                  <th className="py-3 px-4">Statut NNI</th>
                  <th className="py-3 px-4">Validation Wali</th>
                  <th className="py-3 px-4">Abonnement</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Actions Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bec9c2]/20 text-xs font-body">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#151c27] flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#bec9c2]/40"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#004532]/10 text-[#004532] border border-[#004532]/20 flex items-center justify-center font-display font-bold text-xs shrink-0">
                          {p.name ? p.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                      )}
                      <div>
                        <div className="font-display font-bold text-sm text-[#151c27]">
                          {p.name}, {p.age} ans
                        </div>
                        <div className="text-[10px] text-[#3f4944] font-normal">{p.maritalStatus}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#3f4944]">
                      <div className="font-semibold text-[#151c27]">{p.city}</div>
                      <div className="text-[11px] text-[#3f4944]">{p.profession}</div>
                    </td>

                    <td className="py-3 px-4">
                      {p.isVerifiedNNI ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          NNI Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-medium">
                          Non Vérifié
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.isWaliApproved ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <span className="material-symbols-outlined text-xs">shield_person</span>
                          Wali Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-medium">
                          {p.waliReference && p.waliReference !== 'Non renseigné' ? 'En attente Wali' : 'Sans Wali'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.isPremium ? (
                        <span className="inline-flex items-center gap-1 gold-gradient text-[#574500] px-2.5 py-1 rounded-full text-[10px] font-bold">
                          PREMIUM
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Gratuit (Sadaq)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleNNI(p.id, p.isVerifiedNNI)}
                          disabled={actionLoading === p.id}
                          title={p.isVerifiedNNI ? 'Annuler la vérification NNI' : 'Valider la carte NNI'}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            p.isVerifiedNNI
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {p.isVerifiedNNI ? 'Retirer NNI' : 'Valider NNI'}
                        </button>

                        <button
                          onClick={() => handleToggleWali(p.id, p.isWaliApproved)}
                          disabled={actionLoading === p.id}
                          title={p.isWaliApproved ? 'Annuler validation Wali' : 'Approuver le Wali'}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            p.isWaliApproved
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {p.isWaliApproved ? 'Retirer Wali' : 'Valider Wali'}
                        </button>

                        <button
                          onClick={() => handleTogglePremium(p.id, p.isPremium)}
                          disabled={actionLoading === p.id}
                          title="Modifier statut Premium"
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                        >
                          {p.isPremium ? 'Rétrograder' : 'Passer Premium'}
                        </button>

                        <button
                          onClick={() => handleDeleteProfile(p.id, p.name)}
                          disabled={actionLoading === p.id}
                          title="Supprimer le profil"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
