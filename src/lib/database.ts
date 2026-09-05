import { Profile, Conversation, Message } from '../types';
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
});

export async function getProfiles(userId: string): Promise<Profile[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from('public_profiles').select('*').neq('user_id', userId).order('created_at', { ascending: false });
  if (error || !data) { console.error('Failed to load profiles from database:', error); return []; }
  return data.map(mapProfile);
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
  if (!profile.name?.trim() || !Number.isFinite(age) || age < 18 || age > 100 || !profile.city?.trim() || !profile.maritalStatus?.trim() || !profile.gender) return null;

  const payload = {
    user_id: userId, name: profile.name.trim(), age, profession: profile.profession?.trim() || null, city: profile.city.trim(),
    marital_status: profile.maritalStatus.trim(), religion: profile.religion?.trim() || null, education: profile.education?.trim() || null,
    match_percentage: Number.isFinite(Number(profile.matchPercentage)) ? Number(profile.matchPercentage) : 0,
    is_verified_nni: false, is_wali_approved: false, is_premium: false, photo_url: profile.photoUrl || null,
    photo_private: Boolean(profile.photoPrivate), bio: profile.bio?.trim() || null, gender: profile.gender === 'male' ? 'male' : 'female',
    hobbies: profile.hobbies?.trim() || null, interests: profile.interests?.trim() || null, drinks_alcohol: Boolean(profile.drinksAlcohol),
    smokes: Boolean(profile.smokes), presentation: profile.presentation?.trim() || null, personality: profile.personality?.trim() || null,
    family_importance: profile.familyImportance?.trim() || null,
  };

  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (error || !data) { console.error('Failed to save profile in database:', error); return null; }

  const waliReference = onboardingData?.waliName?.trim() && onboardingData?.waliPhone?.trim()
    ? `${onboardingData.waliRelation?.trim() || ''} : ${onboardingData.waliName.trim()} (${onboardingData.waliPhone.trim()})` : null;
  const { error: privateError } = await supabase.from('profile_private').upsert({
    profile_id: data.id, user_id: userId, wali_reference: waliReference, nni_status: 'pending', wali_status: 'pending', updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' });
  if (privateError) console.error('Failed to save private profile data:', privateError);

  if (Array.isArray(profile.photos)) {
    await supabase.from('profile_photos').delete().eq('profile_id', data.id).eq('user_id', userId);
    const photos = profile.photos.filter(Boolean).map((storage_path: string, index: number) => ({ profile_id: data.id, user_id: userId, storage_path, sort_order: index, is_primary: index === 0 }));
    if (photos.length) await supabase.from('profile_photos').insert(photos);
  }
  return mapProfile(data);
}

export async function getFavorites(userId: string): Promise<string[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from('user_favorites').select('profile_id').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => String(row.profile_id));
}

export async function toggleFavorite(userId: string, profileId: string): Promise<boolean> {
  if (!supabase || !userId || !profileId || userId === profileId) return false;
  const { data: existing } = await supabase.from('user_favorites').select('id').eq('user_id', userId).eq('profile_id', profileId).maybeSingle();
  if (existing) { const { error } = await supabase.from('user_favorites').delete().eq('id', existing.id); return !error; }
  const { error } = await supabase.from('user_favorites').insert({ user_id: userId, profile_id: profileId });
  return !error;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.filter((r: any) => r.candidate_id === userId || r.suitor_id === userId).map((r: any) => ({
    id: r.id, participantId: r.candidate_id === userId ? r.suitor_id : r.candidate_id, participantName: r.participant_name || '',
    participantAvatar: r.participant_avatar || '', participantCity: r.participant_city || '', isSupervised: Boolean(r.is_supervised),
    isVerifiedNNI: Boolean(r.is_verified_nni), lastMessage: r.last_message || '', lastMessageTime: r.last_message_at || '',
    unreadCount: r.unread_count ?? 0, onlineStatus: false,
  })) as Conversation[];
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!supabase || !conversationId) return [];
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((r: any) => ({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, senderName: r.sender_name || '', senderAvatar: r.sender_avatar || '', text: r.text || '', timestamp: r.created_at || '', isMine: false, isSupervised: Boolean(r.is_supervised), status: r.status || 'sent' })) as Message[];
}
