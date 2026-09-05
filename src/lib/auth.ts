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

export async function fetchProfileStatusFromDB(userId: string) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;
  try {
    const { data, error } = await supabase.from('profiles')
      .select('is_premium,is_verified_nni,is_wali_approved,gender,name,photo_url')
      .eq('user_id', userId).maybeSingle();
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
  } catch { return null; }
}

export function updateAccountPlanAndStatus(identifier: string, updates: Partial<Pick<AuthAccount,'isPremium'|'planName'|'isVerifiedNNI'|'isWaliApproved'>>) {
  if (!identifier || typeof window === 'undefined') return;
  const id = identifier.trim().toLowerCase();
  try {
    const accounts = getRegisteredAccounts();
    const next = accounts.map(a => (a.id.toLowerCase()===id || a.email.toLowerCase()===id || a.name.toLowerCase()===id) ? {...a,...updates} : a);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(next));
    const current = getCurrentUserSession();
    if (current && (current.id.toLowerCase()===id || current.email.toLowerCase()===id || current.name.toLowerCase()===id))
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({...current,...updates}));
    window.dispatchEvent(new CustomEvent('nasiba_status_changed'));
  } catch (e) { console.error('Session update error:', e); }
}

export function getRegisteredAccounts(): AuthAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** Production authentication: server endpoint is the only account-creation path. */
export async function registerAccount(data: {email:string;password?:string;name:string;role?:'candidate'|'wali';phone:string;gender?:'male'|'female'}): Promise<{user:AuthAccount|null;error:string|null}> {
  const email=data.email.trim().toLowerCase();
  if (!email || !data.password) return {user:null,error:'Veuillez saisir une adresse email et un mot de passe valides.'};
  try {
    const res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,email,role:data.role||'candidate',gender:data.gender})});
    const json=await res.json().catch(()=>({}));
    if (!res.ok || !json.success || !json.user) return {user:null,error:json.error||'Impossible de créer le compte. Réessayez.'};
    const account=json.user as AuthAccount;
    if (isSupabaseConfigured && supabase) {
      const {error}=await supabase.auth.signInWithPassword({email,password:data.password});
      if (error) return {user:null,error:'Compte créé mais impossible d’établir la session. Veuillez vous reconnecter.'};
    }
    localStorage.setItem(STORAGE_SESSION_KEY,JSON.stringify(account));
    return {user:account,error:null};
  } catch { return {user:null,error:'Serveur indisponible. Réessayez dans quelques instants.'}; }
}

/** Production authentication: server endpoint first; never authenticate from localStorage. */
export async function loginAccount(data:{email:string;password?:string}):Promise<{user:AuthAccount|null;error:string|null}> {
  const email=data.email.trim().toLowerCase();
  if (!email || !data.password) return {user:null,error:'Veuillez saisir votre adresse email et mot de passe.'};
  try {
    const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:data.password})});
    const json=await res.json().catch(()=>({}));
    if (!res.ok || !json.success || !json.user) return {user:null,error:json.error||'Adresse email ou mot de passe incorrect.'};
    const account=json.user as AuthAccount;
    if (isSupabaseConfigured && supabase) {
      const {error}=await supabase.auth.signInWithPassword({email,password:data.password});
      if (error) return {user:null,error:'Connexion réussie côté serveur, mais la session locale n’a pas pu être établie.'};
    }
    localStorage.setItem(STORAGE_SESSION_KEY,JSON.stringify(account));
    return {user:account,error:null};
  } catch { return {user:null,error:'Serveur indisponible. Réessayez dans quelques instants.'}; }
}

export function getCurrentUserSession(): AuthAccount|null {
  if (typeof window==='undefined') return null;
  try {
    const raw=localStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function refreshCurrentSessionFromDB(): Promise<AuthAccount|null> {
  const current=getCurrentUserSession();
  if (!current) return null;
  const status=await fetchProfileStatusFromDB(current.id);
  if (!status) return current;
  const refreshed={...current,isPremium:status.isPremium,planName:status.planName,isVerifiedNNI:status.isVerifiedNNI,isWaliApproved:status.isWaliApproved,gender:status.gender||current.gender,name:status.name||current.name,photoUrl:status.photoUrl||current.photoUrl};
  localStorage.setItem(STORAGE_SESSION_KEY,JSON.stringify(refreshed));
  return refreshed;
}

export function saveCurrentUserSession(updates: Partial<AuthAccount>) {
  const current=getCurrentUserSession();
  if (!current || typeof window==='undefined') return null;
  const next={...current,...updates};
  localStorage.setItem(STORAGE_SESSION_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('nasiba_session_changed'));
  return next;
}

export function logoutUserSession() {
  if (typeof window!=='undefined') {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
  if (isSupabaseConfigured && supabase) supabase.auth.signOut().catch(()=>{});
}
