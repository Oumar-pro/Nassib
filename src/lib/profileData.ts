import { Profile } from '../types';
import { calculateCompatibility } from './compatibility';
import { supabase } from './supabase';
import * as legacy from './database.ts';

const DISCOVERY_COLUMNS = [
  'id','user_id','created_at','updated_at','name','age','profession','city',
  'marital_status','religion','education','match_percentage','is_verified_nni',
  'is_wali_approved','is_premium','photo_url','photo_private','bio','gender',
  'views_count','likes_count','hobbies','interests','drinks_alcohol','smokes',
  'presentation','personality','family_importance','height','weight','ethnicity',
  'origin_city','hijab_status','religious_practice_details','values',
  'partner_criteria','deal_breakers'
].join(',');

const PROFILE_COLUMNS = [
  DISCOVERY_COLUMNS,'country','neighborhood','marriage_horizon','mother_tongue',
  'preferred_age_range','has_children','children_count','phone','boosts_count',
  'boosted_until','premium_expires_at','daily_contacts_count','daily_contacts_date'
].join(',');

type PhotoRow = { profile_id?: string; storage_path?: string; sort_order?: number | null; is_primary?: boolean | null; user_id?: string };

function mapPhotoRows(rows: PhotoRow[] | null | undefined): string[] {
  return (rows || [])
    .slice()
    .sort((a,b) => (Number(a.sort_order)||0) - (Number(b.sort_order)||0))
    .map(p => typeof p.storage_path === 'string' ? p.storage_path.trim() : '')
    .filter(Boolean);
}

function mapRow(row: any, photos: string[] = []): Profile {
  const photoUrl = typeof row?.photo_url === 'string' ? row.photo_url.trim() : '';
  const resolvedPhotos = photos.length ? photos : (photoUrl ? [photoUrl] : []);
  const gender = String(row?.gender || '').toLowerCase().trim();
  return {
    id: row.id, userId: row.user_id, name: row.name || '', age: row.age,
    gender: gender === 'female' || gender === 'femme' || gender === 'f' ? 'female' : 'male',
    profession: row.profession || '', professionCategory: row.profession_category || undefined,
    city: row.city || '', country: row.country || 'Niger', neighborhood: row.neighborhood || undefined,
    maritalStatus: row.marital_status || '', marriageHorizon: row.marriage_horizon || undefined,
    religion: row.religion || '', education: row.education || '',
    matchPercentage: Number.isFinite(row.match_percentage) ? row.match_percentage : 0,
    isVerifiedNNI: Boolean(row.is_verified_nni), isWaliApproved: Boolean(row.is_wali_approved),
    isPremium: Boolean(row.is_premium), planName: row.plan_name || 'Sadaq (Gratuit)',
    photoUrl: photoUrl || resolvedPhotos[0] || '', photoPrivate: Boolean(row.photo_private), bio: row.bio || '',
    waliReference: '', viewsCount: row.views_count ?? 0, likesCount: row.likes_count ?? 0,
    hobbies: row.hobbies || '', interests: row.interests || '', drinksAlcohol: row.drinks_alcohol ?? undefined,
    smokes: row.smokes ?? undefined, presentation: row.presentation || '', personality: row.personality || '',
    familyImportance: row.family_importance || '', isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at, updatedAt: row.updated_at, photos: resolvedPhotos,
    height: row.height ?? undefined, weight: row.weight ?? undefined, bodyType: row.body_type || undefined,
    ethnicity: row.ethnicity || undefined, originCity: row.origin_city || undefined,
    motherTongue: row.mother_tongue || undefined, hijabStatus: row.hijab_status || undefined,
    religiousPracticeDetails: row.religious_practice_details || undefined, quranPractice: row.quran_practice || undefined,
    preferredAgeRange: row.preferred_age_range || undefined,
    values: Array.isArray(row.values) ? row.values : undefined, partnerCriteria: row.partner_criteria || undefined,
    dealBreakers: Array.isArray(row.deal_breakers) ? row.deal_breakers : undefined,
    hasChildren: row.has_children == null ? undefined : (row.has_children ? 'Oui' : 'Non'),
    childrenCount: row.children_count ?? undefined, phone: row.phone || undefined,
    boostsCount: Number(row.boosts_count ?? 0), boostedUntil: row.boosted_until || undefined,
    premiumExpiresAt: row.premium_expires_at || undefined, dailyContactsCount: Number(row.daily_contacts_count ?? 0),
    dailyContactsDate: row.daily_contacts_date || undefined,
  };
}

export const hasUploadedPhotos = legacy.hasUploadedPhotos;
export const saveMyProfile = legacy.saveMyProfile;
export const updatePhotoPrivacy = legacy.updatePhotoPrivacy;
export const recordProfileView = legacy.recordProfileView;
export const getMyProfileStats = legacy.getMyProfileStats;
export const getFavorites = legacy.getFavorites;
export const toggleFavorite = legacy.toggleFavorite;
export const checkAndConsumeContactQuota = legacy.checkAndConsumeContactQuota;
export const activateProfileBoost = legacy.activateProfileBoost;

async function fetchPhotos(profileIds: string[]): Promise<Map<string,string[]>> {
  const result = new Map<string,string[]>();
  if (!supabase || profileIds.length === 0) return result;
  const { data, error } = await supabase
    .from('profile_photos')
    .select('profile_id,storage_path,sort_order,is_primary,user_id')
    .in('profile_id', profileIds);
  if (error) {
    console.warn('NASSIB profile_photos query failed; continuing without relation data:', error.message);
    return result;
  }
  const grouped = new Map<string, PhotoRow[]>();
  for (const row of (data || []) as PhotoRow[]) {
    if (!row.profile_id) continue;
    const list = grouped.get(row.profile_id) || [];
    list.push(row);
    grouped.set(row.profile_id, list);
  }
  for (const [id, rows] of grouped) result.set(id, mapPhotoRows(rows));
  return result;
}

export async function getProfiles(userId?: string, currentUserProfile?: Profile | null): Promise<Profile[]> {
  if (!supabase) return [];
  try {
    let { data, error } = await supabase
      .from('public_profiles')
      .select(DISCOVERY_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('public_profiles discovery query failed, using profiles fallback:', error.message);
      const fallback = await supabase.from('profiles').select(DISCOVERY_COLUMNS).order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
    if (error || !data) {
      console.warn('getProfiles failed:', error?.message || 'no data');
      return [];
    }

    const rows = data as any[];
    const photos = await fetchPhotos(rows.map(r => r.id).filter(Boolean));
    let profiles = rows.map(r => mapRow(r, photos.get(r.id) || []));
    if (userId) profiles = profiles.filter(p => p.userId !== userId);
    if (currentUserProfile) profiles = profiles.map(p => ({ ...p, matchPercentage: calculateCompatibility(currentUserProfile, p) }));

    const now = Date.now();
    profiles.sort((a,b) => {
      const ap = hasUploadedPhotos(a), bp = hasUploadedPhotos(b);
      if (ap !== bp) return ap ? -1 : 1;
      const ab = Boolean(a.boostedUntil && new Date(a.boostedUntil).getTime() > now);
      const bb = Boolean(b.boostedUntil && new Date(b.boostedUntil).getTime() > now);
      const as = (ab ? 200 : 0) + (a.isPremium ? 100 : 0);
      const bs = (bb ? 200 : 0) + (b.isPremium ? 100 : 0);
      if (as !== bs) return bs - as;
      return (b.matchPercentage || 0) - (a.matchPercentage || 0) ||
        (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    });
    return profiles;
  } catch (err) {
    console.warn('getProfiles exception:', err);
    return [];
  }
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  if (!supabase || !userId) return null;
  try {
    const { data: authData } = await supabase.auth.getUser();
    const effectiveUserId = authData.user?.id || userId;
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('user_id', effectiveUserId)
      .maybeSingle();
    if (error) {
      console.warn('getMyProfile error:', error.message);
      return null;
    }
    if (!data) return null;
    const photos = await fetchPhotos([data.id]);
    const mapped = mapRow(data, photos.get(data.id) || []);
    const { data: priv, error: privError } = await supabase
      .from('profile_private')
      .select('wali_reference,phone')
      .eq('user_id', effectiveUserId)
      .maybeSingle();
    if (!privError && priv) {
      mapped.waliReference = priv.wali_reference || '';
      if (priv.phone && !mapped.phone) mapped.phone = priv.phone;
    }
    return mapped;
  } catch (err) {
    console.warn('getMyProfile exception:', err);
    return null;
  }
}

export async function getProfileById(profileId: string, currentUserProfile?: Profile | null): Promise<Profile | null> {
  if (!supabase || !profileId) return null;
  try {
    const { data, error } = await supabase.from('public_profiles').select(DISCOVERY_COLUMNS).eq('id', profileId).maybeSingle();
    if (error || !data) return null;
    const photos = await fetchPhotos([profileId]);
    const profile = mapRow(data, photos.get(profileId) || []);
    return currentUserProfile ? { ...profile, matchPercentage: calculateCompatibility(currentUserProfile, profile) } : profile;
  } catch (err) {
    console.warn('getProfileById exception:', err);
    return null;
  }
}

export * from './database.ts';
