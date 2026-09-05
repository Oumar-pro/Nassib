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

function accountFromAuthUser(authUser: any, profile?: any): AuthAccount {
  const metadata = authUser?.user_metadata || {};
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: profile?.name || metadata.name || 'Membre NASSIB',
    role: metadata.role === 'wali' ? 'wali' : 'candidate',
    phone: metadata.phone || '',
    gender: profile?.gender || metadata.gender,
    createdAt: authUser.created_at || new Date().toISOString(),
    isPremium: Boolean(profile?.is_premium),
    planName: profile?.is_premium ? 'Accès Gratuit & Illimité' : 'Sadaq (Gratuit)',
    isVerifiedNNI: Boolean(profile?.is_verified_nni),
    isWaliApproved: Boolean(profile?.is_wali_approved),
    photoUrl: profile?.photo_url || undefined,
  };
}

export async function fetchProfileStatusFromDB(userId: string) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium,is_verified_nni,is_wali_approved,gender,name,photo_url')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      isPremium: Boolean(data.is_premium),
      isVerifiedNNI: Boolean(data.is_verified_nni),
      isWaliApproved: Boolean(data.is_wali_approved),
      planName: data.is_premium ? 'Accès Gratuit & Illimité' : 'Sadaq (Gratuit)',
      gender: data.gender,
      name: data.name,
      photoUrl: data.photo_url || undefined,
    };
  } catch {
    return null;
  }
}

export async function registerAccount(data: {email:string;password?:string;name:string;role?:'candidate'|'wali';phone:string;gender?:'male'|'female'}): Promise<{user:AuthAccount|null;error:string|null}> {
  const email = data.email.trim().toLowerCase();
  if (!email || !data.password) return { user: null, error: 'Veuillez saisir une adresse email et un mot de passe valides.' };
  if (!isSupabaseConfigured || !supabase) return { user: null, error: "Le service d'authentification n'est pas configuré." };

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, email, role: data.role || 'candidate', gender: data.gender }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.user) {
      return { user: null, error: json.error || 'Impossible de créer le compte. Réessayez.' };
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: data.password });
    if (signInError || !signInData.user) {
      return { user: null, error: 'Compte créé mais impossible d’établir la session. Veuillez vous reconnecter.' };
    }

    const profileStatus = await fetchProfileStatusFromDB(signInData.user.id);
    currentAccount = accountFromAuthUser(signInData.user, profileStatus);
    return { user: currentAccount, error: null };
  } catch {
    return { user: null, error: 'Serveur indisponible. Réessayez dans quelques instants.' };
  }
}

export async function loginAccount(data:{email:string;password?:string}):Promise<{user:AuthAccount|null;error:string|null}> {
  const email = data.email.trim().toLowerCase();
  if (!email || !data.password) return { user: null, error: 'Veuillez saisir votre adresse email et mot de passe.' };
  if (!isSupabaseConfigured || !supabase) return { user: null, error: "Le service d'authentification n'est pas configuré." };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: data.password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.user) {
      return { user: null, error: json.error || 'Adresse email ou mot de passe incorrect.' };
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: data.password });
    if (signInError || !signInData.user) {
      return { user: null, error: 'Connexion réussie côté serveur, mais la session n’a pas pu être établie.' };
    }

    const profileStatus = await fetchProfileStatusFromDB(signInData.user.id);
    currentAccount = accountFromAuthUser(signInData.user, profileStatus);
    return { user: currentAccount, error: null };
  } catch {
    return { user: null, error: 'Serveur indisponible. Réessayez dans quelques instants.' };
  }
}

export function getCurrentUserSession(): AuthAccount | null {
  return currentAccount;
}

export async function restoreCurrentUserSession(): Promise<AuthAccount | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    const authUser = data.session?.user;
    if (!authUser) {
      currentAccount = null;
      return null;
    }
    const profileStatus = await fetchProfileStatusFromDB(authUser.id);
    currentAccount = accountFromAuthUser(authUser, profileStatus);
    return currentAccount;
  } catch {
    currentAccount = null;
    return null;
  }
}

export async function refreshCurrentSessionFromDB(): Promise<AuthAccount | null> {
  return restoreCurrentUserSession();
}

export function saveCurrentUserSession(updates: Partial<AuthAccount>) {
  if (!currentAccount) return null;
  currentAccount = { ...currentAccount, ...updates };
  return currentAccount;
}

export function updateAccountPlanAndStatus(_identifier: string, _updates: Partial<Pick<AuthAccount,'isPremium'|'planName'|'isVerifiedNNI'|'isWaliApproved'>>) {
  // Account status is authoritative in Supabase; this function is retained only for API compatibility.
  return;
}

export async function logoutUserSession() {
  currentAccount = null;
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}
