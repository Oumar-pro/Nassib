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

const STORAGE_ACCOUNTS_KEY = 'nasiba_registered_accounts';
const STORAGE_SESSION_KEY = 'nasiba_current_session';
const LEGACY_ACCOUNTS_KEY = 'zawaj_registered_accounts';
const LEGACY_SESSION_KEY = 'zawaj_current_session';

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

    const isPrem = true;
    return {
      isPremium: true,
      isVerifiedNNI: Boolean(data.is_verified_nni),
      isWaliApproved: Boolean(data.is_wali_approved),
      planName: 'Accès Gratuit & Illimité',
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
          isPremium: updates.isPremium !== undefined ? updates.isPremium : true,
          planName: updates.planName || 'Accès Gratuit & Illimité',
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
        isPremium: updates.isPremium !== undefined ? updates.isPremium : true,
        planName: updates.planName || 'Accès Gratuit & Illimité',
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
        new CustomEvent('nasiba_status_changed', {
          detail: { identifier, updates },
        })
      );
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
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_ACCOUNTS_KEY);
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
  role?: 'candidate' | 'wali';
  phone: string;
  gender?: 'male' | 'female';
}): Promise<{ user: AuthAccount | null; error: string | null }> {
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!normalizedEmail || !data.password) {
    return { user: null, error: 'Veuillez saisir une adresse email et un mot de passe valides.' };
  }

  const effectiveRole = data.role || 'candidate';
  const effectiveGender = data.gender || 'female';

  // 1. Primary: Server-side API with Service Role for guaranteed Supabase creation
  try {
    const apiRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password: data.password,
        name: data.name,
        phone: data.phone,
        role: effectiveRole,
        gender: effectiveGender,
      }),
    });

    const apiData = await apiRes.json();

    if (apiRes.ok && apiData.success && apiData.user) {
      const regUser: AuthAccount = apiData.user;

      // Also sign in on client Supabase client if available to establish client JWT session
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: data.password,
          });
        } catch (_) {}
      }

      // Cache session locally
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(regUser));
      const accounts = getRegisteredAccounts();
      if (!accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
        accounts.push(regUser);
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      }

      return { user: regUser, error: null };
    } else if (apiData.error) {
      return { user: null, error: apiData.error };
    }
  } catch (apiErr) {
    console.warn('Server register endpoint unreachable or failed, trying direct client:', apiErr);
  }

  // 2. Direct client-side Supabase Auth fallback
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: effectiveRole,
            phone: data.phone,
            gender: effectiveGender,
          },
        },
      });

      if (sbError) {
        return { user: null, error: sbError.message };
      }

      if (sbData?.user) {
        const userId = sbData.user.id;

        // Create initial profile in public.profiles
        try {
          await supabase.from('profiles').upsert([
            {
              user_id: userId,
              name: data.name,
              age: 25,
              profession: effectiveRole === 'wali' ? 'Wali (Tuteur)' : 'Non renseigné',
              city: 'Niamey',
              marital_status: 'Célibataire',
              religion: 'Sunnite',
              education: 'Licence / Bac+3',
              match_percentage: 90,
              is_verified_nni: false,
              is_wali_approved: false,
              is_premium: true,
              gender: effectiveGender,
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
          role: effectiveRole,
          phone: data.phone,
          gender: effectiveGender,
          createdAt: sbData.user.created_at || new Date().toISOString(),
          isPremium: true,
          planName: 'Accès Gratuit & Illimité',
          isVerifiedNNI: false,
          isWaliApproved: false,
        };

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

  // 3. Offline demo fallback
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
    name: data.name || 'Membre NASSIB',
    role: effectiveRole,
    phone: data.phone || '+227 90 12 34 56',
    gender: effectiveGender,
    createdAt: new Date().toISOString(),
    isPremium: true,
    planName: 'Accès Gratuit & Illimité',
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

  // 1. Try server login API
  try {
    const apiRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password: data.password,
      }),
    });

    const apiData = await apiRes.json();

    if (apiRes.ok && apiData.success && apiData.user) {
      const loggedUser: AuthAccount = apiData.user;

      // Sync client-side session if client client exists
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: data.password,
          });
        } catch (_) {}
      }

      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(loggedUser));
      return { user: loggedUser, error: null };
    } else if (apiRes.status === 401 || (apiData.error && apiData.error.includes('incorrect'))) {
      return { user: null, error: 'Adresse email ou mot de passe incorrect.' };
    }
  } catch (apiErr) {
    console.warn('Server login endpoint unreachable, trying direct client:', apiErr);
  }

  // 2. Direct client-side Supabase Auth login
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
        const dbStatus = await fetchProfileStatusFromDB(userId);

        const sbUser: AuthAccount = {
          id: userId,
          email: sbData.user.email || normalizedEmail,
          name: sbData.user.user_metadata?.name || normalizedEmail.split('@')[0],
          role: sbData.user.user_metadata?.role || 'candidate',
          phone: sbData.user.user_metadata?.phone || '+227 90 12 34 56',
          gender: sbData.user.user_metadata?.gender || 'female',
          createdAt: sbData.user.created_at || new Date().toISOString(),
          isPremium: true,
          planName: 'Accès Gratuit & Illimité',
          isVerifiedNNI: dbStatus ? dbStatus.isVerifiedNNI : Boolean(sbData.user.user_metadata?.is_verified_nni),
          isWaliApproved: dbStatus ? dbStatus.isWaliApproved : Boolean(sbData.user.user_metadata?.is_wali_approved),
        };

        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sbUser));
        return { user: sbUser, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase auth sign in error:', err);
      return { user: null, error: err.message || 'Erreur lors de la connexion Supabase.' };
    }
  }

  // 3. Offline demo fallback
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
    const raw = localStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
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
  localStorage.removeItem(LEGACY_SESSION_KEY);
  if (isSupabaseConfigured && supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}
