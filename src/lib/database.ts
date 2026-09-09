import { Profile } from '../types';
import { supabase } from './supabase';
import { calculateCompatibility } from './compatibility';

export function hasUploadedPhotos(profile: Partial<Profile> | null | undefined): boolean { if (!profile) return false; return Boolean(profile.photoUrl?.trim()) || Boolean(Array.isArray(profile.photos) && profile.photos.some((p)=>typeof p==='string'&&p.trim())); }
const mapProfile = (row: any): Profile => {
  const photoUrl = typeof row.photo_url === 'string' ? row.photo_url.trim() : '';
  const photos = Array.isArray(row.photos)
    ? row.photos.filter((p: any) => typeof p === 'string' && p.trim())
    : photoUrl ? [photoUrl] : [];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || '',
    age: row.age,
    gender: row.gender === 'male' || row.gender === 'female' ? row.gender : 'female',
    profession: row.profession || '',
    professionCategory: row.profession_category || undefined,
    city: row.city || '',
    country: row.country || 'Niger',
    neighborhood: row.neighborhood || undefined,
    maritalStatus: row.marital_status || '',
    marriageHorizon: row.marriage_horizon || undefined,
    religion: row.religion || '',
    education: row.education || '',
    matchPercentage: Number.isFinite(row.match_percentage) ? row.match_percentage : 0,
    isVerifiedNNI: Boolean(row.is_verified_nni),
    isWaliApproved: Boolean(row.is_wali_approved),
    isPremium: Boolean(row.is_premium),
    planName: row.plan_name || 'Sadaq (Gratuit)',
    photoUrl: photoUrl || photos[0] || '',
    photoPrivate: Boolean(row.photo_private),
    bio: row.bio || '',
    waliReference: '', // Donnée privée protégée (accessible uniquement au titulaire via getMyProfile)
    viewsCount: row.views_count ?? 0,
    likesCount: row.likes_count ?? 0,
    hobbies: row.hobbies || '',
    interests: row.interests || '',
    drinksAlcohol: row.drinks_alcohol ?? undefined,
    smokes: row.smokes ?? undefined,
    presentation: row.presentation || '',
    personality: row.personality || '',
    familyImportance: row.family_importance || '',
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
    bodyType: row.body_type || undefined,
    ethnicity: row.ethnicity || undefined,
    originCity: row.origin_city || undefined,
    motherTongue: row.mother_tongue || undefined,
    hijabStatus: row.hijab_status || undefined,
    religiousPracticeDetails: row.religious_practice_details || undefined,
    quranPractice: row.quran_practice || undefined,
    preferredAgeRange: row.preferred_age_range || undefined,
    values: Array.isArray(row.values) ? row.values : undefined,
    partnerCriteria: row.partner_criteria || undefined,
    dealBreakers: Array.isArray(row.deal_breakers) ? row.deal_breakers : undefined,
    hasChildren: row.has_children !== null && row.has_children !== undefined ? (row.has_children ? 'Oui' : 'Non') : undefined,
    childrenCount: row.children_count ?? undefined,
    boostsCount: Number(row.boosts_count ?? 0),
    boostedUntil: row.boosted_until || undefined,
    premiumExpiresAt: row.premium_expires_at || undefined,
    dailyContactsCount: Number(row.daily_contacts_count ?? 0),
    dailyContactsDate: row.daily_contacts_date || undefined,
  };
};

export async function getProfiles(userId?: string, currentUserProfile?: Profile | null): Promise<Profile[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('getProfiles Supabase error:', error.message);
      return [];
    }
    let profiles = (data || []).map(mapProfile).filter(hasUploadedPhotos);
    if (userId) profiles = profiles.filter(p => p.userId !== userId);
    if (currentUserProfile) {
      profiles = profiles.map(p => ({ ...p, matchPercentage: calculateCompatibility(currentUserProfile, p) }));
    }

    // Tri prioritaire : Profils avec Boost actif ou Statut Premium affichés en premier
    const now = Date.now();
    profiles.sort((a, b) => {
      const aIsBoosted = Boolean(a.boostedUntil && new Date(a.boostedUntil).getTime() > now);
      const bIsBoosted = Boolean(b.boostedUntil && new Date(b.boostedUntil).getTime() > now);

      const aIsPremium = Boolean(a.isPremium && (!a.premiumExpiresAt || new Date(a.premiumExpiresAt).getTime() > now));
      const bIsPremium = Boolean(b.isPremium && (!b.premiumExpiresAt || new Date(b.premiumExpiresAt).getTime() > now));

      // Calcul du score de visibilité :
      // - Profil avec Boost actif : propulsé en 1ère position (priorité maximale)
      // - Profil avec statut Premium : affiché en priorité par rapport aux profils gratuits
      const scoreA = (aIsBoosted ? 200 : 0) + (aIsPremium ? 100 : 0);
      const scoreB = (bIsBoosted ? 200 : 0) + (bIsPremium ? 100 : 0);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Si les deux profils ont un boost actif, prioriser celui ayant le plus de temps restant
      if (aIsBoosted && bIsBoosted && a.boostedUntil && b.boostedUntil) {
        const diffBoost = new Date(b.boostedUntil).getTime() - new Date(a.boostedUntil).getTime();
        if (diffBoost !== 0) return diffBoost;
      }

      // Si égalité de statut/boost, tri par pourcentage de compatibilité
      if ((a.matchPercentage || 0) !== (b.matchPercentage || 0)) {
        return (b.matchPercentage || 0) - (a.matchPercentage || 0);
      }

      // Enfin, tri par date de création (les plus récents en premier)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return profiles;
  } catch (err) {
    console.warn('getProfiles exception:', err);
    return [];
  }
}

export async function getProfileById(profileId:string,currentUserProfile?:Profile|null):Promise<Profile|null>{if(!profileId||!supabase)return null;try{const{data,error}=await supabase.from('profiles').select('*').eq('id',profileId).maybeSingle();if(error){console.warn('getProfileById error:',error.message);return null;}if(!data)return null;const profile=mapProfile(data);return currentUserProfile?{...profile,matchPercentage:calculateCompatibility(currentUserProfile,profile)}:profile;}catch(err){console.warn('getProfileById exception:',err);return null;}}

export async function getMyProfile(userId:string):Promise<Profile|null>{
  if(!userId||!supabase)return null;
  try{
    const queryPromise = supabase.from('profiles').select('*').eq('user_id',userId).maybeSingle();
    const timeoutPromise = new Promise<any>((resolve) => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 4000));
    const {data,error} = await Promise.race([queryPromise, timeoutPromise]);
    if(error){console.warn('getMyProfile error:',error.message);return null;}
    if(!data)return null;
    const mapped=mapProfile(data);
    try {
      const privPromise = supabase.from('profile_private').select('wali_reference').eq('user_id',userId).maybeSingle();
      const privTimeout = new Promise<any>((resolve) => setTimeout(() => resolve({ data: null }), 1500));
      const {data:priv} = await Promise.race([privPromise, privTimeout]);
      if(priv?.wali_reference)mapped.waliReference=priv.wali_reference;
    } catch {}
    return mapped;
  }catch(err){console.warn('getMyProfile exception:',err);return null;}
}

export async function updatePhotoPrivacy(userId:string,photoPrivate:boolean):Promise<boolean>{if(!userId||!supabase)return false;try{const{data,error}=await supabase.from('profiles').update({photo_private:Boolean(photoPrivate)}).eq('user_id',userId).select('photo_private').maybeSingle();if(error){console.warn('updatePhotoPrivacy error:',error.message);return false;}return data?.photo_private===Boolean(photoPrivate);}catch(err){console.warn('updatePhotoPrivacy exception:',err);return false;}}
export async function recordProfileView(profileId:string):Promise<boolean>{if(!supabase||!profileId)return false;const{data,error}=await supabase.rpc('record_profile_view',{target_profile_id:profileId});if(error){console.warn('recordProfileView error:',error.message);return false;}return data===true;}

export interface ProfileStats { profileViews:number; profileConsultations:number; photoRequests:number; photoRequestsApproved:number; photoRequestsSent:number; contactRequestsReceived:number; contactRequestsSent:number; contactRequestsAccepted:number; contactRequestsRejected:number; contactRequestsPending:number; matchesCount:number; favoritesCount:number; weeklyGrowthPercentage:number; }
export async function getMyProfileStats():Promise<ProfileStats|null>{
  if(!supabase)return null;
  try {
    const rpcPromise = supabase.rpc('get_my_profile_stats');
    const timeoutPromise = new Promise<any>((resolve) => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 2500));
    const {data,error} = await Promise.race([rpcPromise, timeoutPromise]);
    if(error){console.warn('getMyProfileStats error:',error.message);return null;}
    if(!data||typeof data!=='object')return null;
    return{profileViews:Number(data.profileViews??0),profileConsultations:Number(data.profileConsultations??0),photoRequests:Number(data.photoRequests??0),photoRequestsApproved:Number(data.photoRequestsApproved??0),photoRequestsSent:Number(data.photoRequestsSent??0),contactRequestsReceived:Number(data.contactRequestsReceived??0),contactRequestsSent:Number(data.contactRequestsSent??0),contactRequestsAccepted:Number(data.contactRequestsAccepted??0),contactRequestsRejected:Number(data.contactRequestsRejected??0),contactRequestsPending:Number(data.contactRequestsPending??0),matchesCount:Number(data.matchesCount??0),favoritesCount:Number(data.favoritesCount??0),weeklyGrowthPercentage:Number(data.weeklyGrowthPercentage??0)};
  } catch (err) {
    return null;
  }
}

export async function saveMyProfile(userId: string, profile: Partial<Profile>, onboardingData?: any): Promise<Profile | null> {
  if (!userId || !supabase) return null;
  const rawAge = Number(profile.age);
  const age = Number.isFinite(rawAge) && rawAge >= 18 && rawAge <= 100 ? rawAge : 25;

  // Le genre est fixé définitivement lors de l'inscription et l'onboarding (non modifiable ultérieurement)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('gender')
    .eq('user_id', userId)
    .maybeSingle();

  const gender = (existingProfile?.gender === 'male' || existingProfile?.gender === 'female')
    ? existingProfile.gender
    : (profile.gender === 'male' ? 'male' : 'female');

  // Conversion propre de has_children en boolean Supabase
  let hasChildrenBool: boolean | null = null;
  if (typeof profile.hasChildren === 'boolean') {
    hasChildrenBool = profile.hasChildren;
  } else if (typeof profile.hasChildren === 'string') {
    const s = profile.hasChildren.toLowerCase().trim();
    if (s.startsWith('oui') || s === 'true') hasChildrenBool = true;
    else if (s.startsWith('non') || s === 'false') hasChildrenBool = false;
  }

  const payload: Record<string, any> = {
    user_id: userId,
    name: profile.name?.trim() || 'Membre Nassib',
    age,
    gender,
    profession: profile.profession?.trim() || null,
    profession_category: profile.professionCategory?.trim() || onboardingData?.professionCategory?.trim() || null,
    city: profile.city?.trim() || 'Niamey',
    country: profile.country?.trim() || onboardingData?.country?.trim() || 'Niger',
    neighborhood: profile.neighborhood?.trim() || onboardingData?.neighborhood?.trim() || null,
    marital_status: profile.maritalStatus?.trim() || 'Célibataire',
    marriage_horizon: profile.marriageHorizon?.trim() || onboardingData?.marriageHorizon?.trim() || null,
    religion: profile.religion?.trim() || 'Sunnite',
    education: profile.education?.trim() || null,
    photo_url: profile.photoUrl?.trim() || null,
    photo_private: Boolean(profile.photoPrivate),
    bio: profile.bio?.trim() || null,
    hobbies: profile.hobbies?.trim() || null,
    interests: profile.interests?.trim() || null,
    drinks_alcohol: profile.drinksAlcohol ?? null,
    smokes: profile.smokes ?? null,
    presentation: profile.presentation?.trim() || profile.partnerCriteria?.trim() || null,
    personality: profile.personality?.trim() || onboardingData?.personalityTrait?.trim() || null,
    family_importance: profile.familyImportance?.trim() || onboardingData?.familyImportance?.trim() || null,
    height: Number.isFinite(Number(profile.height)) && Number(profile.height) > 0 ? Number(profile.height) : null,
    weight: Number.isFinite(Number(profile.weight)) && Number(profile.weight) > 0 ? Number(profile.weight) : null,
    body_type: profile.bodyType?.trim() || onboardingData?.bodyType?.trim() || null,
    preferred_age_range: profile.preferredAgeRange?.trim() || onboardingData?.preferredAgeRange?.trim() || null,
    ethnicity: profile.ethnicity?.trim() || null,
    origin_city: profile.originCity?.trim() || null,
    mother_tongue: profile.motherTongue?.trim() || null,
    hijab_status: gender === 'female' ? (profile.hijabStatus?.trim() || null) : null,
    religious_practice_details: profile.religiousPracticeDetails?.trim() || null,
    quran_practice: profile.quranPractice?.trim() || null,
    has_children: hasChildrenBool,
    children_count: Number.isFinite(Number(profile.childrenCount)) ? Number(profile.childrenCount) : null,
    values: Array.isArray(profile.values) ? profile.values : null,
    partner_criteria: profile.partnerCriteria?.trim() || null,
    deal_breakers: Array.isArray(profile.dealBreakers) ? profile.dealBreakers : null,
  };
  if (profile.isVerifiedNNI !== undefined) payload.is_verified_nni = Boolean(profile.isVerifiedNNI);
  if (profile.isWaliApproved !== undefined) payload.is_wali_approved = Boolean(profile.isWaliApproved);
  if (profile.isPremium !== undefined) payload.is_premium = Boolean(profile.isPremium);
  if (profile.boostsCount !== undefined) payload.boosts_count = Number(profile.boostsCount);
  if (profile.boostedUntil !== undefined) payload.boosted_until = profile.boostedUntil;
  if (profile.premiumExpiresAt !== undefined) payload.premium_expires_at = profile.premiumExpiresAt;

  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (error || !data) {
    console.warn('saveMyProfile error:', error?.message);
    return null;
  }
  const waliReference = onboardingData?.waliName?.trim() && onboardingData?.waliPhone?.trim()
    ? `${onboardingData.waliRelation?.trim() || 'Tuteur'} : ${onboardingData.waliName.trim()} (${onboardingData.waliPhone.trim()})`
    : profile.waliReference?.trim() || null;
  if (waliReference) {
    const { error: privError } = await supabase.from('profile_private').upsert({ profile_id: data.id, user_id: userId, wali_reference: waliReference }, { onConflict: 'profile_id' });
    if (privError) console.warn('saveMyProfile private data error:', privError.message);
  }
  if (Array.isArray(profile.photos)) {
    const { error: deleteError } = await supabase.from('profile_photos').delete().eq('profile_id', data.id).eq('user_id', userId);
    if (deleteError) console.warn('saveMyProfile photo cleanup error:', deleteError.message);
    const rows = profile.photos.filter((p): p is string => Boolean(p && p.trim())).map((storage_path, index) => ({ profile_id: data.id, user_id: userId, storage_path, sort_order: index, is_primary: index === 0 }));
    if (rows.length) {
      const { error: photoError } = await supabase.from('profile_photos').insert(rows);
      if (photoError) console.warn('saveMyProfile photo insert error:', photoError.message);
    }
  }
  const saved = mapProfile(data);
  if (waliReference) saved.waliReference = waliReference;
  if (Array.isArray(profile.photos)) saved.photos = profile.photos;
  return saved;
}

export async function getFavorites(userId:string):Promise<string[]>{if(!userId||!supabase)return[];const{data,error}=await supabase.from('user_favorites').select('profile_id').eq('user_id',userId);if(error){console.warn('getFavorites error:',error.message);return[];}return(data||[]).map((row:any)=>String(row.profile_id));}
export async function toggleFavorite(userId:string,profileId:string):Promise<boolean>{if(!userId||!profileId||!supabase)return false;const{data,error}=await supabase.rpc('toggle_favorite',{target_profile_id:profileId});if(error){console.warn('toggleFavorite error:',error.message);return false;}const{data:sessionData}=await supabase.auth.getSession();const effectiveUserId=sessionData.session?.user?.id;if(!effectiveUserId||effectiveUserId!==userId)return false;const{data:row,error:verifyError}=await supabase.from('user_favorites').select('id').eq('user_id',effectiveUserId).eq('profile_id',profileId).maybeSingle();if(verifyError){console.warn('toggleFavorite verification error:',verifyError.message);return false;}return(data===true)===Boolean(row);}
export async function getPricingPlansFromDB():Promise<any[]>{if(!supabase)return[];const{data,error}=await supabase.from('pricing_plans').select('*').order('price',{ascending:true});if(error){console.warn('getPricingPlansFromDB error:',error.message);return[];}return data||[];}

export async function getWhoFavoritedMe(): Promise<Profile[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('get_who_favorited_me');
    if (error) {
      console.warn('getWhoFavoritedMe error:', error.message);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.profile_id,
      name: row.name || 'Membre',
      age: row.age || 25,
      city: row.city || 'Niamey',
      profession: '',
      maritalStatus: '',
      religion: '',
      education: '',
      matchPercentage: 90,
      isVerifiedNNI: Boolean(row.is_verified_nni),
      isWaliApproved: false,
      isPremium: Boolean(row.is_premium),
      photoUrl: row.photo_url || '',
      photoPrivate: false,
      bio: '',
      gender: 'female' as const,
    }));
  } catch (err) {
    console.warn('getWhoFavoritedMe exception:', err);
    return [];
  }
}

/**
 * Met à jour le champ boostedUntil (boosted_until) dans la table profiles pour 24 heures.
 * @param profileId Identifiant UUID du profil
 * @returns Statut du boost avec la date d'expiration calculée (24 heures)
 */
export async function boostProfile(profileId: string): Promise<{ success: boolean; boostedUntil?: string; remainingBoosts?: number; error?: string }> {
  if (!supabase || !profileId) {
    return { success: false, error: 'Identifiant de profil manquant ou Supabase indisponible' };
  }
  try {
    // Calcul de la fin du boost dans 24 heures
    const boostedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Récupérer le nombre de boosts restant si disponible
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('boosts_count')
      .eq('id', profileId)
      .maybeSingle();

    const currentBoosts = Number(currentProfile?.boosts_count ?? 0);
    const newBoosts = Math.max(0, currentBoosts - 1);

    const updatePayload: Record<string, any> = {
      boosted_until: boostedUntil,
    };
    if (currentProfile && currentProfile.boosts_count !== null && currentProfile.boosts_count !== undefined && currentBoosts > 0) {
      updatePayload.boosts_count = newBoosts;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profileId)
      .select('id, boosted_until, boosts_count')
      .maybeSingle();

    if (error) {
      console.warn('boostProfile table update error, fallback rpc:', error.message);
      // Tentative via la procédure RPC si la mise à jour directe échoue
      const { data: rpcData, error: rpcError } = await supabase.rpc('activate_profile_boost');
      if (!rpcError && rpcData?.success) {
        return {
          success: true,
          boostedUntil: rpcData.boosted_until || boostedUntil,
          remainingBoosts: rpcData.remaining_boosts,
        };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      boostedUntil: data?.boosted_until || boostedUntil,
      remainingBoosts: data?.boosts_count ?? newBoosts,
    };
  } catch (err: any) {
    console.error('boostProfile exception:', err);
    return { success: false, error: err?.message || 'Erreur lors de la mise à jour du boost' };
  }
}

export const updateProfileBoost24h = boostProfile;

export async function activateProfileBoost(profileId?: string): Promise<{ success: boolean; error?: string; remainingBoosts?: number; boostedUntil?: string }> {
  if (!supabase) return { success: false, error: 'Connexion indisponible' };
  try {
    // Si un profileId est fourni, exécuter la mise à jour de boostedUntil pour 24 heures
    if (profileId) {
      const res = await boostProfile(profileId);
      if (res.success) return res;
    }

    // Essayer l'appel RPC activate_profile_boost
    const { data, error } = await supabase.rpc('activate_profile_boost');
    if (!error && data?.success) {
      return {
        success: Boolean(data.success),
        error: data.error,
        remainingBoosts: data.remaining_boosts,
        boostedUntil: data.boosted_until,
      };
    }

    // Si l'appel RPC n'a pas réussi ou n'est pas encore provisionné, tenter avec le profil de la session courante
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    if (currentUserId) {
      const { data: myProfile } = await supabase.from('profiles').select('id').eq('user_id', currentUserId).maybeSingle();
      if (myProfile?.id) {
        const res = await boostProfile(myProfile.id);
        if (res.success) return res;
      }
    }

    return {
      success: false,
      error: data?.error || error?.message || 'Impossible d’activer le boost',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur d’activation du boost' };
  }
}

export async function checkAndConsumeContactQuota(): Promise<{ allowed: boolean; isPremium: boolean; remaining: number; error?: string }> {
  if (!supabase) return { allowed: true, isPremium: false, remaining: 3 };
  try {
    const { data, error } = await supabase.rpc('check_and_consume_contact_quota');
    if (error) return { allowed: true, isPremium: false, remaining: 3 };
    return {
      allowed: Boolean(data?.allowed),
      isPremium: Boolean(data?.is_premium),
      remaining: Number(data?.remaining ?? 0),
      error: data?.error,
    };
  } catch (err: any) {
    return { allowed: true, isPremium: false, remaining: 3 };
  }
}
