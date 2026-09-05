import { supabase, isSupabaseConfigured } from './supabase';

export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'wali';
  phone: string;
  gender?: 'male' | 'female';
  createdAt: string;
  isPremium?: boolean;
  planName?: string;
  isVerifiedNNI?: boolean;
  isWaliApproved?: boolean;
  photoUrl?: string;
}

let currentAccount: AuthAccount | null = null;

async function accountFromAuthUser(authUser: any): Promise<AuthAccount> {
  const metadata = authUser?.user_metadata || {};
  let profile: any = null;

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('name,gender,is_premium,is_verified_nni,is_wali_approved,photo_url')
      .eq('user_id', authUser.id)
      .maybeSingle();
    profile = data;
  }

  return {
    id: authUser.id,
    email: authUser.email || '',
    name: profile?.name || metadata.name || '',
    role: metadata.role === 'wali' ? 'wali' : 'candidate',
    phone: metadata.phone || '',
    gender: profile?.gender || metadata.gender,
    createdAt: authUser.created_at || '',
    isPremium: Boolean(profile?.is_premium),
    planName: profile?.is_premium ? 'Premium' : '',
    isVerifiedNNI: Boolean(profile?.is_verified_nni),
    isWaliApproved: Boolean(profile?.is_wali_approved),
    photoUrl: profile?.photo_url || undefined,
  };
}

function configurationError() {
  return "Le service d'authentification n'est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans les variables d'environnement Vercel, puis redéployez l'application.";
}

export async function registerAccount(data: {
  email: string;
  password?: string;
  name: string;
  role?: 'candidate' | 'wali';
  phone: string;
  gender?: 'male' | 'female';
}): Promise<{ user: AuthAccount | null; error: string | null }> {
  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();
  const phone = data.phone.trim();

  if (!email || !data.password) {
    return { user: null, error: 'Veuillez saisir une adresse email et un mot de passe valides.' };
  }
  if (!name || !phone) {
    return { user: null, error: 'Veuillez renseigner votre nom et votre numéro de téléphone.' };
  }
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: configurationError() };
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: {
      data: {
        name,
        phone,
        role: data.role || 'candidate',
        gender: data.gender,
      },
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }
  if (!signUpData.user) {
    return { user: null, error: 'Impossible de créer le compte.' };
  }

  // When Supabase email confirmation is enabled, signUp intentionally returns no session.
  // The account exists in auth.users and the user must confirm the email before logging in.
  if (!signUpData.session) {
    return { user: null, error: 'Compte créé. Vérifiez votre adresse email puis connectez-vous.' };
  }

  currentAccount = await accountFromAuthUser(signUpData.user);
  return { user: currentAccount, error: null };
}

export async function loginAccount(data: { email: string; password?: string }): Promise<{ user: AuthAccount | null; error: string | null }> {
  const email = data.email.trim().toLowerCase();

  if (!email || !data.password) {
    return { user: null, error: 'Veuillez saisir votre adresse email et mot de passe.' };
  }
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: configurationError() };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  });

  if (error || !signInData.user) {
    return { user: null, error: error?.message || 'Adresse email ou mot de passe incorrect.' };
  }

  currentAccount = await accountFromAuthUser(signInData.user);
  return { user: currentAccount, error: null };
}

export function getCurrentUserSession(): AuthAccount | null {
  return currentAccount;
}

export async function restoreCurrentUserSession(): Promise<AuthAccount | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    currentAccount = null;
    return null;
  }

  currentAccount = await accountFromAuthUser(data.session.user);
  return currentAccount;
}

export async function refreshCurrentSessionFromDB(): Promise<AuthAccount | null> {
  return restoreCurrentUserSession();
}

export function saveCurrentUserSession(updates: Partial<AuthAccount>) {
  if (!currentAccount) return null;
  currentAccount = { ...currentAccount, ...updates };
  return currentAccount;
}

export function updateAccountPlanAndStatus(_identifier: string, _updates: Partial<Pick<AuthAccount, 'isPremium' | 'planName' | 'isVerifiedNNI' | 'isWaliApproved'>>) {
  // Privileged account changes must be made by the admin/server layer, never locally.
}

export async function logoutUserSession() {
  currentAccount = null;
  if (supabase) await supabase.auth.signOut();
}
