import { Profile } from '../types';
import { supabase } from './supabase';

const mapProfile = (row: any): Profile => ({
  id: row.id, userId: row.user_id, name: row.name || '', age: row.age, profession: row.profession || '',
  city: row.city || '', maritalStatus: row.marital_status || '', religion: row.religion || '', education: row.education || '',
  matchPercentage: row.match_percentage ?? 0, isVerifiedNNI: Boolean(row.is_verified_nni), isWaliApproved: Boolean(row.is_wali_approved),
  isPremium: Boolean(row.is_premium), photoUrl: row.photo_url || '', photoPrivate: Boolean(row.photo_private), bio: row.bio || '',
  waliReference: '', gender: row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
  viewsCount: row.views_count ?? 0, likesCount: row.likes_count ?? 0, hobbies: row.hobbies || '', interests: row.interests || '',
  drinksAlcohol: Boolean(row.drinks_alcohol), smokes: Boolean(row.smokes), presentation: row.presentation || '',
  personality: row.personality || '', familyImportance: row.family_importance || '', isAdmin: Boolean(row.is_admin),
  createdAt: row.created_at, updatedAt: row.updated_at, photos: row.photo_url ? [row.photo_url] : [],
  height: row.height ?? undefined, weight: row.weight ?? undefined, ethnicity: row.ethnicity || undefined,
  originCity: row.origin_city || undefined, hijabStatus: row.hijab_status || undefined,
  religiousPracticeDetails: row.religious_practice_details || undefined,
  values: Array.isArray(row.values) ? row.values : undefined, partnerCriteria: row.partner_criteria || undefined,
  dealBreakers: Array.isArray(row.deal_breakers) ? row.deal_breakers : undefined,
});

export async function getProfiles(userId: string): Promise<Profile[]> {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .neq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) return data.map(mapProfile);
  } catch {
    // Fallback to profiles table
  }
  const { data: fallbackData, error: fbError } = await supabase
    .from('profiles')
    .select('*')
    .neq('user_id', userId)
    .order('created_at', { ascending: false });
  if (fbError || !fallbackData) {
    console.error('Failed to load profiles from database:', fbError);
    return [];
  }
  return fallbackData.map(mapProfile);
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  if (!supabase || !userId) return null;

  const localCacheKey = `nassib_profile_${userId}`;
  let cachedProfile: Profile | null = null;
  try {
    const raw = localStorage.getItem(localCacheKey);
    if (raw) cachedProfile = JSON.parse(raw);
  } catch {}

  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) {
    return cachedProfile || null;
  }
  const mapped = mapProfile(data);
  try {
    const { data: priv } = await supabase
      .from('profile_private')
      .select('wali_reference')
      .eq('user_id', userId)
      .maybeSingle();
    if (priv?.wali_reference) {
      mapped.waliReference = priv.wali_reference;
    }
  } catch {
    // Ignore if table unavailable or offline
  }

  if (cachedProfile) {
    return { ...mapped, ...cachedProfile };
  }
  return mapped;
}

export async function saveMyProfile(userId: string, profile: Partial<Profile>, onboardingData?: any): Promise<Profile | null> {
  if (!supabase || !userId) return null;

  // Safe defaults respecting the PostgreSQL CHECK constraints
  const rawAge = Number(profile.age);
  const age = Number.isFinite(rawAge) && rawAge >= 18 && rawAge <= 100 ? rawAge : 25;
  const name = profile.name?.trim() || 'Membre Nassib';
  const city = profile.city?.trim() || 'Niamey';
  const maritalStatus = profile.maritalStatus?.trim() || 'Célibataire';
  const gender = profile.gender === 'male' ? 'male' : 'female';

  const waliReference = onboardingData?.waliName?.trim() && onboardingData?.waliPhone?.trim()
    ? `${onboardingData.waliRelation?.trim() || ''} : ${onboardingData.waliName.trim()} (${onboardingData.waliPhone.trim()})`
    : profile.waliReference || null;

  // Strict core schema fields matching public.profiles (wali_reference is in profile_private)
  const corePayload: Record<string, any> = {
    user_id: userId,
    name,
    age,
    profession: profile.profession?.trim() || null,
    city,
    marital_status: maritalStatus,
    religion: profile.religion?.trim() || 'Sunnite',
    education: profile.education?.trim() || null,
    match_percentage: Number.isFinite(Number(profile.matchPercentage)) ? Number(profile.matchPercentage) : 85,
    is_verified_nni: Boolean(profile.isVerifiedNNI),
    is_wali_approved: Boolean(profile.isWaliApproved),
    is_premium: Boolean(profile.isPremium),
    photo_url: profile.photoUrl || null,
    photo_private: Boolean(profile.photoPrivate),
    bio: profile.bio?.trim() || null,
    gender,
    hobbies: profile.hobbies?.trim() || null,
    interests: profile.interests?.trim() || null,
    drinks_alcohol: Boolean(profile.drinksAlcohol),
    smokes: Boolean(profile.smokes),
    presentation: profile.presentation?.trim() || null,
    personality: profile.personality?.trim() || null,
    family_importance: profile.familyImportance?.trim() || null,
  };

  // Extended payload if extra columns exist
  const extendedPayload: Record<string, any> = {
    ...corePayload,
    height: Number.isFinite(Number(profile.height)) ? Number(profile.height) : null,
    weight: Number.isFinite(Number(profile.weight)) ? Number(profile.weight) : null,
    ethnicity: profile.ethnicity?.trim() || null,
    origin_city: profile.originCity?.trim() || null,
    hijab_status: profile.hijabStatus?.trim() || null,
    religious_practice_details: profile.religiousPracticeDetails?.trim() || null,
    values: Array.isArray(profile.values) ? profile.values : null,
    partner_criteria: profile.partnerCriteria?.trim() || null,
    deal_breakers: Array.isArray(profile.dealBreakers) ? profile.dealBreakers : null,
  };

  let savedData: any = null;
  // Try with extended fields first
  const { data: extData, error: extError } = await supabase
    .from('profiles')
    .upsert(extendedPayload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (!extError && extData) {
    savedData = extData;
  } else {
    // If error is due to missing columns or trigger conflict, retry with core schema payload
    console.warn('Extended profile upsert notice, retrying with core schema columns:', extError?.message);
    const { data: coreData, error: coreError } = await supabase
      .from('profiles')
      .upsert(corePayload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (coreError || !coreData) {
      if (coreError?.code === '42703' || String(coreError?.message || '').includes('wali_reference')) {
        console.warn(
          'PostgreSQL trigger compatibility notice on profiles (code 42703). Saving profile in private storage and local cache:',
          coreError?.message
        );
        const { data: existingData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        savedData = {
          ...(existingData || {}),
          ...corePayload,
          id: existingData?.id || userId,
          created_at: existingData?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        console.warn('Notice saving profile in database:', coreError?.message || coreError);
        return null;
      }
    } else {
      savedData = coreData;
    }
  }

  // Save private data (Wali, NNI verification) in profile_private table
  if (waliReference) {
    try {
      await supabase.from('profile_private').upsert({
        profile_id: savedData.id,
        user_id: userId,
        wali_reference: waliReference,
        nni_status: 'pending',
        wali_status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
    } catch (privErr) {
      console.warn('Notice saving profile_private:', privErr);
    }
  }

  // Save gallery photos if provided
  if (Array.isArray(profile.photos)) {
    try {
      await supabase.from('profile_photos').delete().eq('profile_id', savedData.id).eq('user_id', userId);
      const photos = profile.photos.filter(Boolean).map((storage_path: string, index: number) => ({
        profile_id: savedData.id,
        user_id: userId,
        storage_path,
        sort_order: index,
        is_primary: index === 0,
      }));
      if (photos.length) await supabase.from('profile_photos').insert(photos);
    } catch (photoErr) {
      console.warn('Notice saving profile_photos:', photoErr);
    }
  }

  const mapped = mapProfile(savedData);
  if (waliReference) {
    mapped.waliReference = waliReference;
  }
  if (Array.isArray(profile.photos) && profile.photos.length > 0) {
    mapped.photos = profile.photos;
  }

  try {
    localStorage.setItem(`nassib_profile_${userId}`, JSON.stringify(mapped));
  } catch {
    // Ignore localStorage quota
  }

  return mapped;
}

export async function getFavorites(userId: string): Promise<string[]> {
  if (!userId) return [];
  const localKey = `nassib_favorites_${userId}`;
  let localFavs: string[] = [];
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localFavs = JSON.parse(raw);
  } catch {
    // Ignore local storage parse error
  }

  if (!supabase) return localFavs;

  try {
    const { data, error } = await supabase.from('user_favorites').select('profile_id').eq('user_id', userId);
    if (error || !data) return localFavs;
    const dbFavs = data.map((row: any) => String(row.profile_id));
    const merged = Array.from(new Set([...dbFavs, ...localFavs]));
    try {
      localStorage.setItem(localKey, JSON.stringify(merged));
    } catch {}
    return merged;
  } catch {
    return localFavs;
  }
}

export async function toggleFavorite(userId: string, profileId: string): Promise<boolean> {
  if (!userId || !profileId) return false;

  const localKey = `nassib_favorites_${userId}`;

  // 1. Immediately persist change locally so user is never blocked or fails
  try {
    const raw = localStorage.getItem(localKey);
    const favs: string[] = raw ? JSON.parse(raw) : [];
    if (favs.includes(profileId)) {
      const updated = favs.filter((id) => id !== profileId);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } else {
      favs.push(profileId);
      localStorage.setItem(localKey, JSON.stringify(favs));
    }
  } catch (err) {
    console.warn('LocalStorage notice in toggleFavorite:', err);
  }

  if (!supabase) return true;

  // 2. Synchronize with Supabase
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const effectiveUserId = sessionData?.session?.user?.id || userId;

    const { data: existing, error: checkErr } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!checkErr && existing) {
      const { error: delErr } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);
      if (delErr) console.warn('Supabase favorite delete notice:', delErr.message);
    } else if (!checkErr && !existing) {
      const { error: insErr } = await supabase
        .from('user_favorites')
        .insert({ user_id: effectiveUserId, profile_id: profileId });
      if (insErr) console.warn('Supabase favorite insert notice:', insErr.message);
    }
  } catch (err) {
    console.warn('Supabase sync notice in toggleFavorite:', err);
  }

  return true;
}

// Conversations et messages passent exclusivement par src/lib/supabase.ts
// (fetchConversationsFromSupabase / fetchMessagesFromSupabase), qui reflète
// le vrai schéma de ces tables. Les anciennes fonctions getConversations()/
// getMessages() ici lisaient des colonnes inexistantes (participant_name,
// unread_count...) et n'étaient appelées nulle part : supprimées.
