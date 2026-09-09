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
  'partner_criteria','deal_breakers','plan_name','premium_expires_at',
  'boosts_count','boosted_until','profession_category','body_type','quran_practice'
].join(',');

const PROFILE_COLUMNS = `${DISCOVERY_COLUMNS},country,neighborhood,marriage_horizon,mother_tongue,preferred_age_range,has_children,children_count,phone,daily_contacts_count,daily_contacts_date`;

type Row = Record<string, any>;

const mapProfile = (row: Row, photos: string[] = []): Profile => {
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
    photoUrl: photoUrl || resolvedPhotos[0] || '', photoPrivate: Boolean(row.photo_private),
    bio: row.bio || '', waliReference: '', viewsCount: row.views_count ?? 0, likesCount: row.likes_count ?? 0,
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
};

async function authenticatedUserId(fallback?: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user?.id) return data.user.id;
  } catch (error) {
    console.warn('NASSIB auth identity lookup failed:', error);
  }
  return fallback || null;
}

async function fetchPhotos(profileIds: string[]): Promise<Map<string,string[]>> {
  const result = new Map<string,string[]>();
  if (!supabase || !profileIds.length) return result;
  const { data, error } = await supabase.from('profile_photos')
    .select('profile_id,storage_path,sort_order,is_primary,user_id')
    .in('profile_id', profileIds);
  if (error) {
    console.warn('NASSIB photo lookup failed; profile data remains available:', error.message);
    return result;
  }
  for (const row of (data || []) as Row[]) {
    if (!row.profile_id || typeof row.storage_path !== 'string' || !row.storage_path.trim()) continue;
    const current = result.get(row.profile_id) || [];
    current.push(row.storage_path.trim());
    result.set(row.profile_id, current);
  }
  return result;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  if (!supabase || !userId) return null;
  const effectiveId = await authenticatedUserId(userId);
  if (!effectiveId) return null;
  try {
    const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS)
      .eq('user_id', effectiveId).maybeSingle();
    if (error) {
      console.error('NASSIB getMyProfile:', error.message);
      return null;
    }
    if (!data) return null;
    const photos = await fetchPhotos([data.id]);
    const profile = mapProfile(data, photos.get(data.id) || []);
    const { data: priv } = await supabase.from('profile_private')
      .select('wali_reference').eq('user_id', effectiveId).maybeSingle();
    if (priv?.wali_reference) profile.waliReference = priv.wali_reference;
    return profile;
  } catch (error) {
    console.error('NASSIB getMyProfile exception:', error);
    return null;
  }
}

export async function getProfiles(userId?: string, currentUserProfile?: Profile | null): Promise<Profile[]> {
  if (!supabase) return [];
  const effectiveId = await authenticatedUserId(userId);
  if (!effectiveId) return [];
  try {
    let { data, error } = await supabase.from('public_profiles').select(DISCOVERY_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('NASSIB public_profiles lookup failed, trying profiles:', error.message);
      const fallback = await supabase.from('profiles').select(DISCOVERY_COLUMNS)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      console.error('NASSIB discovery query failed:', error.message);
      return [];
    }
    const rows = (data || []) as Row[];
    const photos = await fetchPhotos(rows.map(r => r.id).filter(Boolean));
    let profiles = rows.map(row => mapProfile(row, photos.get(row.id) || []))
      .filter(profile => profile.userId !== effectiveId);
    if (currentUserProfile) {
      profiles = profiles.map(profile => ({
        ...profile,
        matchPercentage: calculateCompatibility(currentUserProfile, profile),
      }));
    }
    return profiles.sort((a, b) => {
      const aPhoto = Boolean(a.photoUrl || a.photos?.length);
      const bPhoto = Boolean(b.photoUrl || b.photos?.length);
      if (aPhoto !== bPhoto) return aPhoto ? -1 : 1;
      const aPremium = Boolean(a.isPremium);
      const bPremium = Boolean(b.isPremium);
      if (aPremium !== bPremium) return bPremium ? 1 : -1;
      return (b.matchPercentage || 0) - (a.matchPercentage || 0) ||
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  } catch (error) {
    console.error('NASSIB getProfiles exception:', error);
    return [];
  }
}

export async function getProfileById(profileId: string, currentUserProfile?: Profile | null): Promise<Profile | null> {
  if (!supabase || !profileId) return null;
  try {
    const { data, error } = await supabase.from('public_profiles').select(DISCOVERY_COLUMNS)
      .eq('id', profileId).maybeSingle();
    if (error || !data) return null;
    const photos = await fetchPhotos([profileId]);
    const profile = mapProfile(data, photos.get(profileId) || []);
    return currentUserProfile
      ? { ...profile, matchPercentage: calculateCompatibility(currentUserProfile, profile) }
      : profile;
  } catch (error) {
    console.error('NASSIB getProfileById exception:', error);
    return null;
  }
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
export const getWhoFavoritedMe = legacy.getWhoFavoritedMe;
export * from './database.ts';
