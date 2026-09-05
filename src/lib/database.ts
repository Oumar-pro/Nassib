import { Profile, Conversation, Message } from '../types';
import { supabase } from './supabase';

const emptyProfile = (row: any): Profile => ({
  id: row.id,
  userId: row.user_id,
  name: row.name || 'Membre NASSIB',
  age: row.age,
  profession: row.profession || 'Non renseigné',
  city: row.city || '',
  maritalStatus: row.marital_status || '',
  religion: row.religion || '',
  education: row.education || '',
  matchPercentage: row.match_percentage ?? 0,
  isVerifiedNNI: Boolean(row.is_verified_nni),
  isWaliApproved: Boolean(row.is_wali_approved),
  isPremium: Boolean(row.is_premium),
  photoUrl: row.photo_url || '',
  photoPrivate: Boolean(row.photo_private),
  bio: row.bio || '',
  waliReference: '',
  gender: row.gender === 'male' || row.gender === 'female' ? row.gender : 'female',
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
  photos: row.photo_url ? [row.photo_url] : [],
});

export async function getProfiles(userId?: string): Promise<Profile[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .neq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Failed to load profiles from database:', error);
    return [];
  }
  return data.map(emptyProfile);
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return emptyProfile(data);
}

export async function saveMyProfile(userId: string, profile: Partial<Profile>, onboardingData?: any): Promise<Profile | null> {
  if (!supabase || !userId) return null;

  const payload = {
    user_id: userId,
    name: profile.name || 'Membre NASSIB',
    age: Math.min(100, Math.max(18, Number(profile.age) || 25)),
    profession: profile.profession || 'Non renseigné',
    city: profile.city || 'Niamey',
    marital_status: profile.maritalStatus || 'Célibataire',
    religion: profile.religion || 'Sunnite',
    education: profile.education || '',
    match_percentage: profile.matchPercentage ?? 0,
    is_verified_nni: Boolean(profile.isVerifiedNNI),
    is_wali_approved: Boolean(profile.isWaliApproved),
    is_premium: Boolean(profile.isPremium),
    photo_url: profile.photoUrl || null,
    photo_private: Boolean(profile.photoPrivate),
    bio: profile.bio || '',
    gender: profile.gender === 'male' ? 'male' : 'female',
    views_count: profile.viewsCount ?? 0,
    likes_count: profile.likesCount ?? 0,
    hobbies: profile.hobbies || null,
    interests: profile.interests || null,
    drinks_alcohol: Boolean(profile.drinksAlcohol),
    smokes: Boolean(profile.smokes),
    presentation: profile.presentation || null,
    personality: profile.personality || null,
    family_importance: profile.familyImportance || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error || !data) {
    console.error('Failed to save profile in database:', error);
    return null;
  }

  const waliReference = onboardingData?.waliName && onboardingData?.waliPhone
    ? `${onboardingData.waliRelation || 'Wali'} : ${onboardingData.waliName} (${onboardingData.waliPhone})`
    : null;

  const { error: privateError } = await supabase.from('profile_private').upsert({
    profile_id: data.id,
    user_id: userId,
    wali_reference: waliReference,
    nni_status: profile.isVerifiedNNI ? 'verified' : 'pending',
    wali_status: profile.isWaliApproved ? 'approved' : 'pending',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' });
  if (privateError) console.error('Failed to save private profile data:', privateError);

  if (Array.isArray(profile.photos)) {
    await supabase.from('profile_photos').delete().eq('profile_id', data.id).eq('user_id', userId);
    const photos = profile.photos.filter(Boolean).map((storage_path: string, index: number) => ({
      profile_id: data.id,
      user_id: userId,
      storage_path,
      sort_order: index,
      is_primary: index === 0,
    }));
    if (photos.length) {
      const { error: photosError } = await supabase.from('profile_photos').insert(photos);
      if (photosError) console.error('Failed to save profile photos:', photosError);
    }
  }

  return emptyProfile(data);
}

export async function getFavorites(userId: string): Promise<string[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from('user_favorites').select('profile_id').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => String(row.profile_id));
}

export async function toggleFavorite(userId: string, profileId: string): Promise<boolean> {
  if (!supabase || !userId || !profileId) return false;
  const { data: existing } = await supabase.from('user_favorites').select('id').eq('user_id', userId).eq('profile_id', profileId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from('user_favorites').delete().eq('id', existing.id);
    return !error;
  }
  const { error } = await supabase.from('user_favorites').insert({ user_id: userId, profile_id: profileId });
  return !error;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`candidate_id.eq.${userId},suitor_id.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => {
    const participantId = row.candidate_id === userId ? row.suitor_id : row.candidate_id;
    return {
      id: row.id,
      participantId,
      participantName: row.participant_name || 'Membre NASSIB',
      participantAvatar: row.participant_avatar || '',
      participantCity: row.participant_city || '',
      isSupervised: true,
      isVerifiedNNI: Boolean(row.is_verified_nni),
      lastMessage: row.last_message || '',
      lastMessageTime: row.last_message_at ? new Date(row.last_message_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
      unreadCount: row.unread_count ?? 0,
      onlineStatus: false,
    } as Conversation;
  });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!supabase || !conversationId) return [];
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name || 'Membre NASSIB',
    senderAvatar: row.sender_avatar || '',
    text: row.text || row.content || '',
    timestamp: row.created_at ? new Date(row.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
    isMine: row.sender_id === row.user_id,
    isSupervised: true,
    status: row.status || 'sent',
  } as Message));
}
