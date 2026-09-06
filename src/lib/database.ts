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
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function saveMyProfile(userId: string, profile: Partial<Profile>, onboardingData?: any): Promise<Profile | null> {
  if (!supabase || !userId) return null;
  const age = Number(profile.age);
  if (!profile.name?.trim() || !Number.isFinite(age) || age < 18 || age > 100 || !profile.city?.trim() || !profile.maritalStatus?.trim() || !profile.gender) {
    console.warn('saveMyProfile validation failed:', { name: profile.name, age, city: profile.city, maritalStatus: profile.maritalStatus, gender: profile.gender });
    return null;
  }

  const waliReference = onboardingData?.waliName?.trim() && onboardingData?.waliPhone?.trim()
    ? `${onboardingData.waliRelation?.trim() || ''} : ${onboardingData.waliName.trim()} (${onboardingData.waliPhone.trim()})`
    : profile.waliReference || null;

  // Strict core schema fields matching public.profiles in schema.sql
  const corePayload: Record<string, any> = {
    user_id: userId,
    name: profile.name.trim(),
    age,
    profession: profile.profession?.trim() || null,
    city: profile.city.trim(),
    marital_status: profile.maritalStatus.trim(),
    religion: profile.religion?.trim() || 'Sunnite',
    education: profile.education?.trim() || null,
    match_percentage: Number.isFinite(Number(profile.matchPercentage)) ? Number(profile.matchPercentage) : 85,
    is_verified_nni: Boolean(profile.isVerifiedNNI),
    is_wali_approved: Boolean(profile.isWaliApproved),
    is_premium: Boolean(profile.isPremium),
    photo_url: profile.photoUrl || null,
    photo_private: Boolean(profile.photoPrivate),
    bio: profile.bio?.trim() || null,
    gender: profile.gender === 'male' ? 'male' : 'female',
    wali_reference: waliReference,
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
    // If error is due to missing columns, retry with core schema payload
    console.warn('Extended profile upsert notice, retrying with core schema columns:', extError?.message);
    const { data: coreData, error: coreError } = await supabase
      .from('profiles')
      .upsert(corePayload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (coreError || !coreData) {
      console.error('Failed to save profile in database:', coreError);
      return null;
    }
    savedData = coreData;
  }

  // Save private data (Wali, NNI verification)
  try {
    await supabase.from('profile_private').upsert({
      profile_id: savedData.id,
      user_id: userId,
      wali_reference: waliReference,
      nni_status: 'pending',
      wali_status: Boolean(waliReference) ? 'approved' : 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });
  } catch (privErr) {
    console.warn('Notice saving profile_private:', privErr);
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

  return mapProfile(savedData);
}

export async function getFavorites(userId: string): Promise<string[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from('user_favorites').select('profile_id').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => String(row.profile_id));
}

export async function toggleFavorite(userId: string, profileId: string): Promise<boolean> {
  if (!supabase || !userId || !profileId) return false;
  try {
    const { data: existing, error: checkErr } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (checkErr) {
      console.error('Error querying user_favorites:', checkErr);
      return false;
    }

    if (existing) {
      const { error: delErr } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);
      if (delErr) {
        console.error('Error deleting from user_favorites:', delErr);
        return false;
      }
      return true;
    } else {
      const { error: insErr } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, profile_id: profileId });
      if (insErr) {
        console.error('Error inserting into user_favorites:', insErr);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error('Exception in toggleFavorite:', err);
    return false;
  }
}

// Conversations et messages passent exclusivement par src/lib/supabase.ts
// (fetchConversationsFromSupabase / fetchMessagesFromSupabase), qui reflète
// le vrai schéma de ces tables. Les anciennes fonctions getConversations()/
// getMessages() ici lisaient des colonnes inexistantes (participant_name,
// unread_count...) et n'étaient appelées nulle part : supprimées.
