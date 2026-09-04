import { createClient } from '@supabase/supabase-js';
import { Profile, Conversation, Message, PricingPlan, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));

// Initialize Supabase Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export let isSupabaseTableMissing = false;
export let isSupabasePermissionIssue = false;

/**
 * Fetch profiles from Supabase database table `profiles` with uniqueness verification
 */
export async function fetchProfilesFromSupabase(): Promise<Profile[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        isSupabaseTableMissing = true;
        console.warn('Supabase configuration active, but table "profiles" was not created yet in Supabase SQL Editor.');
      } else if (error.code === '42501' || error.message?.includes('is_admin') || error.message?.includes('permission denied')) {
        isSupabasePermissionIssue = true;
        console.warn('Supabase RLS/Function permission notice (42501): function is_admin or table access needs execute grant. Fallback to local data active.');
      } else {
        console.warn('Notice fetching profiles from Supabase:', error.message || error);
      }
      return [];
    }

    isSupabaseTableMissing = false;
    isSupabasePermissionIssue = false;
    if (!data) return [];

    const mapped: Profile[] = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      userEmail: item.email || item.user_email,
      name: item.name,
      age: item.age,
      profession: item.profession || 'Non renseigné',
      city: item.city,
      maritalStatus: item.marital_status,
      religion: item.religion || 'Sunnite',
      education: item.education || '',
      matchPercentage: item.match_percentage || 85,
      isVerifiedNNI: Boolean(item.is_verified_nni),
      isWaliApproved: Boolean(item.is_wali_approved),
      isPremium: Boolean(item.is_premium),
      photoUrl: item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      photoPrivate: Boolean(item.photo_private),
      bio: item.bio || '',
      waliReference: item.wali_reference || 'Non renseigné',
      gender: item.gender || 'female',
      viewsCount: item.views_count || 0,
      likesCount: item.likes_count || 0,
    }));

    // Deduplicate profiles by ID and filter out administrator profiles
    const seenIds = new Set<string>();
    const uniqueProfiles: Profile[] = [];
    const ADMIN_EMAILS_LOWER = ['moutarioumar7@gmail.com', 'admin@zawaj.ne', 'contact@zawaj.ne'];
    const ADMIN_USER_IDS = ['usr_admin_001', 'admin', 'super_admin'];

    for (const p of mapped) {
      if (seenIds.has(p.id)) continue;

      // Filter out admin profile from general member listing
      const isAdminProfile =
        (p.userId && ADMIN_USER_IDS.includes(p.userId.toLowerCase())) ||
        (p.userEmail && ADMIN_EMAILS_LOWER.includes(p.userEmail.toLowerCase())) ||
        (p.name && (p.name.toLowerCase().includes('admin') || p.name.toLowerCase().includes('administrateur')));

      if (isAdminProfile) continue;

      seenIds.add(p.id);
      uniqueProfiles.push(p);
    }

    return uniqueProfiles;
  } catch (err) {
    console.warn('Supabase fetch profiles exception, using local fallback:', err);
    return [];
  }
}

/**
 * Save or update profile in Supabase
 */
export async function createProfileInSupabase(profile: Partial<Profile>, userId?: string): Promise<Profile | null> {
  if (!supabase) return null;

  try {
    const payload: any = {
      name: profile.name,
      age: profile.age,
      profession: profile.profession,
      city: profile.city,
      marital_status: profile.maritalStatus,
      religion: profile.religion || 'Sunnite',
      education: profile.education,
      match_percentage: profile.matchPercentage || 85,
      is_verified_nni: profile.isVerifiedNNI ?? false,
      is_wali_approved: profile.isWaliApproved ?? false,
      is_premium: profile.isPremium ?? false,
      photo_url: profile.photoUrl,
      photo_private: profile.photoPrivate ?? false,
      bio: profile.bio,
      wali_reference: profile.waliReference,
      gender: profile.gender || 'female',
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        isSupabaseTableMissing = true;
        console.warn('Supabase configuration active, but table "profiles" was not created yet in Supabase SQL Editor.');
      } else {
        console.warn('Notice inserting profile in Supabase:', error.message || error);
      }
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      profession: data.profession,
      city: data.city,
      maritalStatus: data.marital_status,
      religion: data.religion,
      education: data.education,
      matchPercentage: data.match_percentage,
      isVerifiedNNI: data.is_verified_nni,
      isWaliApproved: data.is_wali_approved,
      isPremium: data.is_premium,
      photoUrl: data.photo_url,
      photoPrivate: data.photo_private,
      bio: data.bio,
      waliReference: data.wali_reference,
      gender: data.gender,
      viewsCount: data.views_count,
      likesCount: data.likes_count,
    };
  } catch (err) {
    console.warn('Supabase create profile exception:', err);
    return null;
  }
}

/**
 * Fetch favorite profile IDs that a user has liked (Mes Favoris)
 */
export async function fetchUserFavoritesFromSupabase(userId: string): Promise<string[]> {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('profile_id')
      .eq('user_id', userId);

    if (error) {
      return [];
    }
    return data ? data.map((item: any) => String(item.profile_id)) : [];
  } catch (err) {
    console.warn('Supabase fetchUserFavoritesFromSupabase error:', err);
    return [];
  }
}

/**
 * Fetch fans count for a profile (people who liked this user's profile)
 */
export async function fetchProfileFansCountFromSupabase(profileId: string): Promise<number> {
  if (!supabase || !profileId) return 0;
  try {
    const { count, error } = await supabase
      .from('user_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Toggle favorite in Supabase user_favorites table and sync profile likes_count
 */
export async function toggleFavoriteInSupabase(
  userId: string,
  profileId: string
): Promise<{ isFavorited: boolean }> {
  if (!supabase || !userId || !profileId) return { isFavorited: false };
  try {
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_favorites').delete().eq('id', existing.id);
      // Decrement profile likes_count
      try {
        const { data: prof } = await supabase.from('profiles').select('likes_count').eq('id', profileId).maybeSingle();
        if (prof) {
          await supabase.from('profiles').update({ likes_count: Math.max(0, (prof.likes_count || 1) - 1) }).eq('id', profileId);
        }
      } catch {}
      return { isFavorited: false };
    } else {
      await supabase.from('user_favorites').insert([{ user_id: userId, profile_id: profileId }]);
      // Increment profile likes_count
      try {
        const { data: prof } = await supabase.from('profiles').select('likes_count').eq('id', profileId).maybeSingle();
        if (prof) {
          await supabase.from('profiles').update({ likes_count: (prof.likes_count || 0) + 1 }).eq('id', profileId);
        }
      } catch {}
      return { isFavorited: true };
    }
  } catch (err) {
    console.warn('Supabase toggleFavoriteInSupabase error:', err);
    return { isFavorited: false };
  }
}

/**
 * Fetch Conversations from Supabase
 */
export async function fetchConversationsFromSupabase(): Promise<Conversation[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        last_message,
        last_message_time,
        is_supervised,
        candidate_id,
        suitor_id,
        candidate:profiles!conversations_candidate_id_fkey(name, city, photo_url, is_verified_nni),
        suitor:profiles!conversations_suitor_id_fkey(name, city, photo_url, is_verified_nni)
      `);

    if (error || !data) return [];

    return data.map((item: any) => {
      const partner = item.candidate || item.suitor || {};
      return {
        id: item.id,
        participantId: item.candidate_id || item.suitor_id,
        participantName: partner.name || 'Membre Zawaj',
        participantAvatar: partner.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        participantCity: partner.city || 'Niamey',
        lastMessage: item.last_message || 'Auncun message',
        lastMessageTime: item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Récemment',
        unreadCount: 0,
        isSupervised: Boolean(item.is_supervised),
        isVerifiedNNI: Boolean(partner.is_verified_nni),
        onlineStatus: true,
      };
    });
  } catch (err) {
    console.warn('Supabase conversations error:', err);
    return [];
  }
}

/**
 * Fetch Messages for a Conversation from Supabase
 */
export async function fetchMessagesFromSupabase(conversationId: string): Promise<Message[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar,
      text: m.text,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: false,
      isSupervised: Boolean(m.is_supervised),
      status: m.status || 'sent',
    }));
  } catch (err) {
    console.warn('Supabase messages error:', err);
    return [];
  }
}

/**
 * Send Message to Supabase
 */
export async function sendMessageToSupabase(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  text: string
): Promise<Message | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          text,
          is_supervised: true,
          status: 'sent',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('Notice sending message via Supabase:', error.message || error);
      return null;
    }

    // Update conversation last_message
    await supabase
      .from('conversations')
      .update({
        last_message: text,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      senderAvatar: data.sender_avatar,
      text: data.text,
      timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      isSupervised: true,
      status: 'sent',
    };
  } catch (err) {
    console.warn('Supabase sendMessage exception:', err);
    return null;
  }
}

/**
 * Fetch Pricing Plans from Supabase
 */
export async function fetchPricingPlansFromSupabase(): Promise<PricingPlan[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*');

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      period: item.period,
      description: item.description,
      features: typeof item.features === 'string' ? JSON.parse(item.features) : item.features,
      popular: Boolean(item.popular),
      ctaText: item.cta_text,
    }));
  } catch (err) {
    console.error('Supabase pricing plans error:', err);
    return [];
  }
}
