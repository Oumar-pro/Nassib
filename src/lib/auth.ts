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

const LOCAL_SESSION_KEY = 'nassib_user_session_v1';
const LOCAL_ACTIVE_TAB_KEY = 'nassib_active_tab_v1';

export function getCachedAccount(): AuthAccount | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

export function setCachedAccount(account: AuthAccount | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (account && account.id) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      localStorage.removeItem(LOCAL_ACTIVE_TAB_KEY);
    }
  } catch {}
}

let currentAccount: AuthAccount | null = getCachedAccount();

// Helper to prevent promises from hanging indefinitely
function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
}

async function accountFromAuthUser(authUser: any): Promise<AuthAccount> {
  const metadata = authUser?.user_metadata || {};
  let profile: any = null;

  if (supabase) {
    try {
      // 1.8s timeout max so database delays never block user login
      const queryPromise = supabase
        .from('profiles')
        .select('name,gender,is_premium,is_verified_nni,is_wali_approved,photo_url')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const res = await withTimeout(queryPromise, 1800, { data: null, error: null } as any);
      profile = res.data;

      // Si le profil n'existe pas encore dans la table profiles, le créer immédiatement
      if (!profile && authUser.id) {
        try {
          const autoProfile: Record<string, any> = {
            user_id: authUser.id,
            name: metadata.name || 'Membre Nassib',
            gender: metadata.gender === 'female' ? 'female' : 'male',
            age: 25,
            city: 'Niamey',
            marital_status: 'Célibataire',
            religion: 'Sunnite',
            education: 'Non précisé',
            is_verified_nni: false,
            is_wali_approved: false,
            is_premium: false,
            photo_private: false,
            photo_url: null,
            bio: '',
          };
          const { data: createdProf } = await supabase
            .from('profiles')
            .upsert(autoProfile, { onConflict: 'user_id' })
            .select('name,gender,is_premium,is_verified_nni,is_wali_approved,photo_url')
            .maybeSingle();
          if (createdProf) profile = createdProf;
        } catch (autoErr) {
          console.warn('Notice auto-creation profile on login:', autoErr);
        }
      }
    } catch {
      // Fallback cleanly to metadata
    }
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
    return { user: null, error: 'Connexion à la base de données non configurée.' };
  }

  try {
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
      return { user: null, error: error.message || "Erreur lors de l'inscription." };
    }

    if (signUpData.user) {
      if (signUpData.session) {
        // Enregistrer immédiatement le profil dans public.profiles dès la création du compte
        try {
          const autoProfile: Record<string, any> = {
            user_id: signUpData.user.id,
            name,
            gender: data.gender === 'female' ? 'female' : 'male',
            age: 25,
            city: 'Niamey',
            marital_status: 'Célibataire',
            religion: 'Sunnite',
            education: 'Non précisé',
            is_verified_nni: false,
            is_wali_approved: false,
            is_premium: false,
            photo_private: false,
            photo_url: null,
            bio: '',
          };
          await supabase.from('profiles').upsert(autoProfile, { onConflict: 'user_id' });
        } catch (initialProfErr) {
          console.warn('Initial profile creation notice:', initialProfErr);
        }
      }

      if (!signUpData.session) {
        return { user: null, error: 'Compte créé avec succès. Veuillez vérifier votre boîte email pour confirmer votre inscription.' };
      }
      currentAccount = await accountFromAuthUser(signUpData.user);
      setCachedAccount(currentAccount);
      return { user: currentAccount, error: null };
    }
    return { user: null, error: "Impossible de créer l'utilisateur." };
  } catch (e: any) {
    return { user: null, error: e?.message || "Une erreur est survenue lors de l'inscription." };
  }
}

export async function loginAccount(data: { email: string; password?: string }): Promise<{ user: AuthAccount | null; error: string | null }> {
  const email = data.email.trim().toLowerCase();

  if (!email || !data.password) {
    return { user: null, error: 'Veuillez saisir votre adresse email et mot de passe.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: 'Connexion à la base de données non configurée.' };
  }

  // Helper to attempt login with a resilient 15-second timeout
  const attemptSignIn = async (): Promise<{ data: any; error: any }> => {
    try {
      const signInPromise = supabase!.auth.signInWithPassword({
        email,
        password: data.password!,
      });
      return await withTimeout(
        signInPromise,
        15000,
        { data: { user: null, session: null }, error: { message: 'Délai d’attente dépassé (timeout).', isTimeout: true } as any }
      );
    } catch (err: any) {
      return { data: { user: null, session: null }, error: err };
    }
  };

  try {
    let { data: signInData, error } = await attemptSignIn();

    // If network hiccup, cold start, or temporary timeout, automatically retry once immediately
    const isRetryableError =
      error &&
      (error.isTimeout ||
        error.name === 'AuthRetryableFetchError' ||
        error.name === 'FetchError' ||
        error.message?.toLowerCase().includes('fetch') ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('timeout') ||
        error.message?.toLowerCase().includes('failed'));

    if (isRetryableError) {
      // Short 300ms pause then instant auto-retry to prevent manual re-click
      await new Promise((resolve) => setTimeout(resolve, 300));
      const retryResult = await attemptSignIn();
      if (!retryResult.error && retryResult.data?.user) {
        signInData = retryResult.data;
        error = null;
      } else if (retryResult.error) {
        error = retryResult.error;
      }
    }

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        return { user: null, error: 'Adresse email ou mot de passe incorrect.' };
      }
      if (msg.includes('Email not confirmed')) {
        return { user: null, error: 'Veuillez confirmer votre adresse email avant de vous connecter.' };
      }
      if (msg.includes('timeout') || msg.includes('fetch') || msg.includes('network') || msg.includes('failed')) {
        return { user: null, error: 'Connexion réseau instable. Veuillez vérifier votre connexion et réessayer.' };
      }
      return { user: null, error: msg || 'Adresse email ou mot de passe incorrect.' };
    }

    if (signInData?.user) {
      currentAccount = await accountFromAuthUser(signInData.user);
      setCachedAccount(currentAccount);
      return { user: currentAccount, error: null };
    }
    return { user: null, error: 'Utilisateur introuvable dans la base de données.' };
  } catch (e: any) {
    return { user: null, error: e?.message || 'Erreur lors de la connexion.' };
  }
}

export function getCurrentUserSession(): AuthAccount | null {
  if (!currentAccount) {
    currentAccount = getCachedAccount();
  }
  return currentAccount;
}

/**
 * Indique si le dernier appel à restoreCurrentUserSession() a pu confirmer
 * une session Supabase réellement valide (auth.uid() exploitable côté DB),
 * ou s'il s'est rabattu sur le compte mis en cache localement sans preuve
 * qu'une session serveur valide existe encore.
 *
 * IMPORTANT : tout code qui interroge la base (profils, Discover,
 * statistiques, etc.) doit vérifier ce flag avant de traiter une réponse
 * vide comme "aucune donnée" — une réponse vide alors que ce flag est
 * `false` signifie très probablement que les requêtes sont parties avec le
 * rôle `anon` (RLS "TO authenticated" qui filtre tout), pas que la base est
 * réellement vide.
 */
let lastSessionConfirmed = false;
export function isLastSessionConfirmed(): boolean {
  return lastSessionConfirmed;
}

async function attemptGetSession(timeoutMs: number): Promise<{ data: any; error: any } | { __isTimeout: true }> {
  const sessionPromise = supabase!.auth.getSession();
  const timeoutMarker = { __isTimeout: true as const };
  return Promise.race([
    sessionPromise,
    new Promise<{ __isTimeout: true }>((resolve) => setTimeout(() => resolve(timeoutMarker), timeoutMs)),
  ]);
}

export async function restoreCurrentUserSession(): Promise<AuthAccount | null> {
  // Utiliser le cache local seulement pour un affichage instantané (optimiste),
  // jamais comme preuve d'authentification pour les requêtes à la base.
  if (!currentAccount) {
    currentAccount = getCachedAccount();
  }
  lastSessionConfirmed = false;

  if (!isSupabaseConfigured || !supabase) {
    return currentAccount;
  }

  try {
    // Premier essai, rapide : couvre le cas normal où getSession() lit le
    // token local sans appel réseau.
    let sessionResult = await attemptGetSession(6000);

    if ('__isTimeout' in sessionResult) {
      console.error('[NASSIB] getSession() timeout (6s) — nouvelle tentative avant repli sur le cache local.');
      // Deuxième essai, plus long : couvre le cas d'un rafraîchissement de
      // token sur réseau mobile lent (fréquent en conditions réelles).
      sessionResult = await attemptGetSession(12000);
    }

    if ('__isTimeout' in sessionResult) {
      console.error('[NASSIB] getSession() toujours en échec après 2 tentatives (18s). Session NON confirmée — le compte affiché est celui du cache local, mais les requêtes DB ne doivent pas être considérées comme authentifiées.');
      // On NE retourne PAS silencieusement le compte en cache comme s'il
      // était valide : on le renvoie pour ne pas déconnecter brutalement
      // l'utilisateur à l'écran, mais lastSessionConfirmed reste `false`
      // pour que l'appelant sache ne pas traiter un résultat vide comme
      // "aucune donnée en base".
      return currentAccount;
    }

    const { data, error } = sessionResult as { data: any; error: any };

    if (error) {
      console.error('[NASSIB] Supabase getSession() error', {
        message: error.message,
        name: error.name,
        status: error.status,
      });
      return currentAccount;
    }

    if (data?.session?.user) {
      currentAccount = await accountFromAuthUser(data.session.user);
      setCachedAccount(currentAccount);
      lastSessionConfirmed = true;
      return currentAccount;
    }

    // Pas d'erreur, pas de session : déconnexion confirmée par Supabase.
    currentAccount = null;
    setCachedAccount(null);
    return null;
  } catch (err: any) {
    console.error('[NASSIB] restoreCurrentUserSession() exception', {
      message: err?.message,
      name: err?.name,
    });
    // Erreur réseau imprévue : on garde le compte affiché pour ne pas
    // déconnecter l'utilisateur brutalement, mais on NE confirme PAS la
    // session (lastSessionConfirmed reste false).
    return currentAccount;
  }
}

export async function refreshCurrentSessionFromDB(): Promise<AuthAccount | null> {
  return restoreCurrentUserSession();
}

export function saveCurrentUserSession(updates: Partial<AuthAccount>) {
  if (!currentAccount) return null;
  currentAccount = { ...currentAccount, ...updates };
  setCachedAccount(currentAccount);
  return currentAccount;
}

export function updateAccountPlanAndStatus(_identifier: string, _updates: Partial<Pick<AuthAccount, 'isPremium' | 'planName' | 'isVerifiedNNI' | 'isWaliApproved'>>) {
  // Privileged account changes
}

export async function logoutUserSession() {
  currentAccount = null;
  setCachedAccount(null);
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}
