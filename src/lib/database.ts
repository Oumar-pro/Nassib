import { Profile } from '../types';
import { supabase } from './supabase';

export function hasUploadedPhotos(profile: Partial<Profile> | null | undefined): boolean {
  if (!profile) return false;
  const hasValidPhotoUrl = Boolean(profile.photoUrl && typeof profile.photoUrl === 'string' && profile.photoUrl.trim() !== '');
  const hasValidGallery = Array.isArray(profile.photos) && profile.photos.some((p) => Boolean(p) && typeof p === 'string' && p.trim() !== '');
  return hasValidPhotoUrl || hasValidGallery;
}

const mapProfile = (row: any): Profile => {
  const photoUrl = (row.photo_url || '').trim();
  const photos = Array.isArray(row.photos)
    ? row.photos.filter((p: any) => typeof p === 'string' && p.trim() !== '')
    : photoUrl
    ? [photoUrl]
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || '',
    age: row.age,
    profession: row.profession || '',
    city: row.city || '',
    maritalStatus: row.marital_status || '',
    religion: row.religion || '',
    education: row.education || '',
    matchPercentage: row.match_percentage ?? 85,
    isVerifiedNNI: Boolean(row.is_verified_nni),
    isWaliApproved: Boolean(row.is_wali_approved),
    isPremium: Boolean(row.is_premium),
    photoUrl: photoUrl || (photos.length > 0 ? photos[0] : ''),
    photoPrivate: row.photo_private === true || row.photo_private === 'true' || row.photo_private === 't' || row.photo_private === 1,
    bio: row.bio || '',
    waliReference: '',
    gender: row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
    viewsCount: row.views_count ?? 0,
    likesCount: row.likes_count ?? 0,
    hobbies: row.hobbies || '',
    interests: row.interests || '',
    drinksAlcohol: Boolean(row.drinks_alcohol),
    smokes: Boolean(row.smokes),
    presentation: row.presentation || '',
    personality: row.personality || '',
    familyImportance: row.family_importance || '',
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos: photos.length > 0 ? photos : (photoUrl ? [photoUrl] : []),
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
    ethnicity: row.ethnicity || undefined,
    originCity: row.origin_city || undefined,
    hijabStatus: row.hijab_status || undefined,
    religiousPracticeDetails: row.religious_practice_details || undefined,
    values: Array.isArray(row.values) ? row.values : undefined,
    partnerCriteria: row.partner_criteria || undefined,
    dealBreakers: Array.isArray(row.deal_breakers) ? row.deal_breakers : undefined,
  };
};

export async function getProfiles(userId?: string): Promise<Profile[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.neq('user_id', userId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map(mapProfile).filter(hasUploadedPhotos);
    }

    // Try public_profiles view if available
    const { data: viewData, error: viewError } = await supabase
      .from('public_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!viewError && viewData && viewData.length > 0) {
      const filtered = userId ? viewData.filter((p: any) => p.user_id !== userId) : viewData;
      return filtered.map(mapProfile).filter(hasUploadedPhotos);
    }
  } catch (err) {
    console.warn('Database getProfiles exception:', err);
  }

  // All data comes strictly from the database: no mock or seed profiles
  return [];
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  if (!profileId || !supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle();
    if (!error && data) {
      return mapProfile(data);
    }
  } catch (err) {
    console.warn('getProfileById error:', err);
  }
  return null;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  if (!userId || !supabase) return null;

  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!error && data) {
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
        // Ignore if table unavailable
      }
      return mapped;
    }
  } catch (err) {
    console.warn('getMyProfile error:', err);
  }

  return null;
}

export async function updatePhotoPrivacy(userId: string, photoPrivate: boolean): Promise<boolean> {
  if (!userId || !supabase) return false;

  const isPrivate = Boolean(photoPrivate);

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        photo_private: isPrivate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.warn('Error updating photo_private in profiles table:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception updating photo_private in profiles table:', err);
    return false;
  }
}

export async function saveMyProfile(userId: string, profile: Partial<Profile>, onboardingData?: any): Promise<Profile | null> {
  if (!userId) return null;

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
  if (supabase) {
    // Try with extended fields first
    try {
      const { data: extData, error: extError } = await supabase
        .from('profiles')
        .upsert(extendedPayload, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (!extError && extData) {
        savedData = extData;
      } else {
        console.warn('Extended profile upsert notice, retrying with core schema columns:', extError?.message);
        const { data: coreData, error: coreError } = await supabase
          .from('profiles')
          .upsert(corePayload, { onConflict: 'user_id' })
          .select('*')
          .single();

        if (coreError || !coreData) {
          if (coreError?.code === '42703' || String(coreError?.message || '').includes('wali_reference')) {
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
          }
        } else {
          savedData = coreData;
        }
      }
    } catch (dbErr) {
      console.warn('Supabase profile save error:', dbErr);
    }
  }

  if (!savedData) {
    return null;
  }

  // Save private data (Wali, NNI verification) in profile_private table
  if (supabase && waliReference) {
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
  if (supabase && Array.isArray(profile.photos)) {
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

  return mapped;
}

export async function getFavorites(userId: string): Promise<string[]> {
  if (!userId || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('profile_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((row: any) => String(row.profile_id));
  } catch (err) {
    console.warn('Supabase getFavorites notice:', err);
    return [];
  }
}

export async function toggleFavorite(userId: string, profileId: string): Promise<boolean> {
  if (!userId || !profileId || !supabase) return false;

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
      await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);
      return false; // Removed
    } else if (!checkErr && !existing) {
      await supabase
        .from('user_favorites')
        .insert({ user_id: effectiveUserId, profile_id: profileId });
      return true; // Added
    }
  } catch (err) {
    console.warn('Supabase toggleFavorite error:', err);
  }

  return true;
}

export async function getPricingPlansFromDB(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('price', { ascending: true });
    if (!error && data) return data;
  } catch (err) {
    console.warn('Error fetching pricing_plans:', err);
  }
  return [];
}

// Conversations et messages passent exclusivement par src/lib/supabase.ts
// (fetchConversationsFromSupabase / fetchMessagesFromSupabase), qui reflète
// le vrai schéma de ces tables. Les anciennes fonctions getConversations()/
// getMessages() ici lisaient des colonnes inexistantes (participant_name,
// unread_count...) et n'étaient appelées nulle part : supprimées.
