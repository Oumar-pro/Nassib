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

const STORAGE_ACCOUNTS_KEY = 'zawaj_registered_accounts';
const STORAGE_SESSION_KEY = 'zawaj_current_session';

export const ADMIN_EMAILS = [
  'moutarioumar7@gmail.com',
  'admin@zawaj.ne',
  'contact@zawaj.ne',
];

export const ADMIN_USER_IDS = [
  'usr_admin_001',
  'admin',
  'super_admin',
];

export function isAdministratorUser(identifier?: string | null): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  if (ADMIN_EMAILS.some((adm) => adm.toLowerCase() === clean)) return true;
  if (ADMIN_USER_IDS.some((adm) => adm.toLowerCase() === clean)) return true;
  if (import.meta.env.VITE_ADMIN_EMAIL && clean === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase()) return true;
  return false;
}

/**
 * Fetch authoritative user profile status directly from Supabase DB table `profiles`
 */
export async function fetchProfileStatusFromDB(userId: string): Promise<{
  isPremium: boolean;
  isVerifiedNNI: boolean;
  isWaliApproved: boolean;
  planName: string;
} | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, is_verified_nni, is_wali_approved')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (error || !data) return null;

    const isPrem = Boolean(data.is_premium);
    return {
      isPremium: isPrem,
      isVerifiedNNI: Boolean(data.is_verified_nni),
      isWaliApproved: Boolean(data.is_wali_approved),
      planName: isPrem ? 'Baraka (Premium)' : 'Sadaq (Gratuit)',
    };
  } catch (err) {
    console.warn('Could not fetch authoritative profile status from DB:', err);
    return null;
  }
}

/**
 * Update registered account status and active session
 */
export function updateAccountPlanAndStatus(
  identifier: string,
  updates: { isPremium?: boolean; planName?: string; isVerifiedNNI?: boolean; isWaliApproved?: boolean }
) {
  if (!identifier) return;
  const cleanId = identifier.trim().toLowerCase();

  // Update in local accounts cache
  try {
    const accounts = getRegisteredAccounts();
    let updated = false;
    const nextAccounts = accounts.map((acc) => {
      const isMatch =
        acc.id.toLowerCase() === cleanId ||
        acc.email.toLowerCase() === cleanId ||
        acc.name.toLowerCase() === cleanId;
      if (isMatch) {
        updated = true;
        return {
          ...acc,
          isPremium: updates.isPremium !== undefined ? updates.isPremium : acc.isPremium,
          planName: updates.planName !== undefined ? updates.planName : (updates.isPremium ? 'Baraka (Premium)' : 'Sadaq (Gratuit)'),
          isVerifiedNNI: updates.isVerifiedNNI !== undefined ? updates.isVerifiedNNI : acc.isVerifiedNNI,
          isWaliApproved: updates.isWaliApproved !== undefined ? updates.isWaliApproved : acc.isWaliApproved,
        };
      }
      return acc;
    });

    if (updated) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    }
  } catch (e) {
    console.error('Error updating account status:', e);
  }

  // Update active session
  try {
    const current = getCurrentUserSession();
    if (
      current &&
      (current.id.toLowerCase() === cleanId ||
        current.email.toLowerCase() === cleanId ||
        current.name.toLowerCase() === cleanId)
    ) {
      const nextSession: AuthAccount = {
        ...current,
        isPremium: updates.isPremium !== undefined ? updates.isPremium : current.isPremium,
        planName: updates.planName !== undefined ? updates.planName : (updates.isPremium ? 'Baraka (Premium)' : 'Sadaq (Gratuit)'),
        isVerifiedNNI: updates.isVerifiedNNI !== undefined ? updates.isVerifiedNNI : current.isVerifiedNNI,
        isWaliApproved: updates.isWaliApproved !== undefined ? updates.isWaliApproved : current.isWaliApproved,
      };
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextSession));
    }
  } catch (e) {
    console.error('Error updating current session status:', e);
  }

  // Dispatch real-time global event
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zawaj_status_changed', {
          detail: { identifier, updates },
        })
      );
    }
  } catch (e) {}
}

/**
 * Get all registered accounts cached locally (passwords never stored)
 */
export function getRegisteredAccounts(): AuthAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading registered accounts:', err);
    return [];
  }
}

/**
 * Register a new user account with native Supabase Auth
 */
export async function registerAccount(data: {
  email: string;
  password?: string;
  name: string;
  role: 'candidate' | 'wali';
  phone: string;
  gender?: 'male' | 'female';
}): Promise<{ user: AuthAccount | null; error: string | null }> {
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!normalizedEmail || !data.password) {
    return { user: null, error: 'Veuillez saisir une adresse email et un mot de passe valides.' };
  }

  // Check backend admin login
  try {
    const adminRes = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: data.password }),
    });

    if (adminRes.ok) {
      const adminData = await adminRes.json();
      if (adminData.success && adminData.user) {
        const adminAccount: AuthAccount = {
          id: adminData.user.id || 'usr_admin_001',
          email: adminData.user.email,
          name: data.name || adminData.user.name || 'Administrateur',
          role: 'wali',
          phone: data.phone || '+227 90 00 00 00',
          createdAt: new Date().toISOString(),
        };
        if (adminData.token) {
          localStorage.setItem('zawaj_admin_token', adminData.token);
        }
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(adminAccount));
        return { user: adminAccount, error: null };
      }
    }
  } catch (err) {
    // Backend offline or non-admin
  }

  // 1. Primary: Native Supabase Auth Sign Up
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
            phone: data.phone,
            gender: data.gender || 'female',
          },
        },
      });

      if (sbError) {
        return { user: null, error: sbError.message };
      }

      if (sbData?.user) {
        const userId = sbData.user.id;

        // Automatically create initial profile in public.profiles table
        try {
          await supabase.from('profiles').insert([
            {
              user_id: userId,
              name: data.name,
              age: 25,
              profession: data.role === 'wali' ? 'Wali (Tuteur)' : 'Membre inscrit',
              city: 'Niamey',
              marital_status: 'Jamais marié(e)',
              religion: 'Sunnite',
              education: 'Licence / Bac+3',
              match_percentage: 90,
              is_verified_nni: false,
              is_wali_approved: false,
              is_premium: false,
              gender: data.gender || 'female',
              wali_reference: data.phone || 'Non renseigné',
              bio: `Bienvenue sur le profil de ${data.name}. Démarche sérieuse avec intention de mariage éthique.`,
            },
          ]);
        } catch (profErr) {
          console.warn('Initial profile creation notice:', profErr);
        }

        const sbAccount: AuthAccount = {
          id: userId,
          email: normalizedEmail,
          name: data.name,
          role: data.role,
          phone: data.phone,
          gender: data.gender || 'female',
          createdAt: sbData.user.created_at || new Date().toISOString(),
          isPremium: false,
          planName: 'Sadaq (Gratuit)',
          isVerifiedNNI: false,
          isWaliApproved: false,
        };

        // Cache session (NEVER store password!)
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sbAccount));

        const accounts = getRegisteredAccounts();
        if (!accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
          accounts.push(sbAccount);
          localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
        }

        return { user: sbAccount, error: null };
      }
    } catch (err: any) {
      console.error('Supabase auth signup exception:', err);
      return { user: null, error: err.message || 'Erreur lors de la création du compte Supabase.' };
    }
  }

  // 2. Demo fallback if Supabase is not yet configured in .env
  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return {
      user: null,
      error: 'Un compte existe déjà avec cette adresse email. Cliquez sur "Se connecter".',
    };
  }

  const newAccount: AuthAccount = {
    id: `usr_${Date.now()}`,
    email: normalizedEmail,
    name: data.name || (data.role === 'wali' ? 'Elhadj Mamane' : 'Aminata S.'),
    role: data.role,
    phone: data.phone || '+227 90 12 34 56',
    gender: data.gender || 'female',
    createdAt: new Date().toISOString(),
    isPremium: false,
    planName: 'Sadaq (Gratuit)',
    isVerifiedNNI: false,
    isWaliApproved: false,
  };

  accounts.push(newAccount);
  localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newAccount));

  return { user: newAccount, error: null };
}

/**
 * Login an existing user account with native Supabase Auth
 */
export async function loginAccount(data: {
  email: string;
  password?: string;
}): Promise<{ user: AuthAccount | null; error: string | null }> {
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!normalizedEmail || !data.password) {
    return { user: null, error: 'Veuillez saisir votre adresse email et mot de passe.' };
  }

  // 1. Attempt backend admin authentication
  try {
    const adminRes = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: data.password }),
    });

    if (adminRes.ok) {
      const adminData = await adminRes.json();
      if (adminData.success && adminData.user) {
        const adminAccount: AuthAccount = {
          id: adminData.user.id || 'usr_admin_001',
          email: adminData.user.email,
          name: adminData.user.name || 'Administrateur',
          role: 'wali',
          phone: '+227 90 00 00 00',
          createdAt: new Date().toISOString(),
        };
        if (adminData.token) {
          localStorage.setItem('zawaj_admin_token', adminData.token);
        }
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(adminAccount));
        return { user: adminAccount, error: null };
      }
    }
  } catch (err) {
    // Non-admin or backend unreachable
  }

  // 2. Primary: Native Supabase Auth login
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: data.password,
      });

      if (sbError) {
        return { user: null, error: 'Adresse email ou mot de passe incorrect.' };
      }

      if (sbData?.user) {
        const userId = sbData.user.id;

        // Fetch real status directly from DB
        const dbStatus = await fetchProfileStatusFromDB(userId);

        const sbUser: AuthAccount = {
          id: userId,
          email: sbData.user.email || normalizedEmail,
          name: sbData.user.user_metadata?.name || normalizedEmail.split('@')[0],
          role: sbData.user.user_metadata?.role || 'candidate',
          phone: sbData.user.user_metadata?.phone || '+227 90 12 34 56',
          gender: sbData.user.user_metadata?.gender || 'female',
          createdAt: sbData.user.created_at || new Date().toISOString(),
          isPremium: dbStatus ? dbStatus.isPremium : Boolean(sbData.user.user_metadata?.is_premium),
          planName: dbStatus ? dbStatus.planName : (sbData.user.user_metadata?.planName || 'Sadaq (Gratuit)'),
          isVerifiedNNI: dbStatus ? dbStatus.isVerifiedNNI : Boolean(sbData.user.user_metadata?.is_verified_nni),
          isWaliApproved: dbStatus ? dbStatus.isWaliApproved : Boolean(sbData.user.user_metadata?.is_wali_approved),
        };

        // Save session (NEVER store password!)
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sbUser));
        return { user: sbUser, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase auth sign in error:', err);
      return { user: null, error: err.message || 'Erreur lors de la connexion Supabase.' };
    }
  }

  // 3. Demo fallback if Supabase is not configured
  const accounts = getRegisteredAccounts();
  const matched = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

  if (!matched) {
    return {
      user: null,
      error: 'Identifiants introuvables. Aucun compte inscrit avec cet email. Veuillez créer un compte.',
    };
  }

  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(matched));
  return { user: matched, error: null };
}

/**
 * Get active user session
 */
export function getCurrentUserSession(): AuthAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Refresh current user session from live Supabase DB
 */
export async function refreshCurrentSessionFromDB(): Promise<AuthAccount | null> {
  const current = getCurrentUserSession();
  if (!current || !isSupabaseConfigured || !supabase) return current;

  try {
    const dbStatus = await fetchProfileStatusFromDB(current.id);
    if (dbStatus) {
      const refreshed: AuthAccount = {
        ...current,
        isPremium: dbStatus.isPremium,
        planName: dbStatus.planName,
        isVerifiedNNI: dbStatus.isVerifiedNNI,
        isWaliApproved: dbStatus.isWaliApproved,
      };
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(refreshed));
      return refreshed;
    }
  } catch (e) {
    console.warn('Could not refresh session from DB:', e);
  }
  return current;
}

/**
 * Logout current session
 */
export function logoutUserSession() {
  localStorage.removeItem(STORAGE_SESSION_KEY);
  localStorage.removeItem('zawaj_admin_token');
  if (isSupabaseConfigured && supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}
