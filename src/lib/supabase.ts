import { createClient } from '@supabase/supabase-js';
import { Profile, Conversation, Message, User } from '../types';
import {
  DbProfile,
  DbConversation,
  DbMessage,
  DbPricingPlan,
  DbUserFavorite,
  DbUserRole,
  DbProfilePrivate,
  DbVerificationRequest,
  DbAdminAuditLog,
  DbUserBlock,
  DbUserReport,
  DbProfilePhoto,
  DbReport,
} from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
);

// Initialize Supabase Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export let isSupabaseTableMissing = false;
export let isSupabasePermissionIssue = false;

/**
 * Helper to check if a string is a valid UUID
 */
export function isValidUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * 1. PROFILES TABLE:
 * Fetch profiles from public.profiles table, enriched with public.profile_photos
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
        console.warn('Supabase configuration active, but table "profiles" was not created yet.');
      } else if (error.code === '42501' || error.message?.includes('permission denied')) {
        isSupabasePermissionIssue = true;
        console.warn('Supabase RLS notice: table access requires grant.');
      } else {
        console.warn('Notice fetching profiles from Supabase:', error.message || error);
      }
      return [];
    }

    isSupabaseTableMissing = false;
    isSupabasePermissionIssue = false;
    if (!data || data.length === 0) return [];

    // Optional: fetch profile_photos for all retrieved profiles
    let photosByProfileId: Record<string, string[]> = {};
    try {
      const profileIds = data.map((d: DbProfile) => d.id).filter(isValidUuid);
      if (profileIds.length > 0) {
        const { data: photosData } = await supabase
          .from('profile_photos')
          .select('profile_id, storage_path, sort_order')
          .in('profile_id', profileIds)
          .order('sort_order', { ascending: true });

        if (photosData && photosData.length > 0) {
          for (const item of photosData) {
            if (!photosByProfileId[item.profile_id]) {
              photosByProfileId[item.profile_id] = [];
            }
            photosByProfileId[item.profile_id].push(item.storage_path);
          }
        }
      }
    } catch {
      // Non-blocking if profile_photos table is empty or restricted
    }

    const mapped: Profile[] = data.map((item: DbProfile) => {
      const additionalPhotos = photosByProfileId[item.id] || [];
      const primaryPhoto = item.photo_url || (additionalPhotos.length > 0 ? additionalPhotos[0] : '');

      return {
        id: item.id,
        userId: item.user_id,
        name: item.name,
        age: item.age,
        profession: item.profession || 'Non renseigné',
        city: item.city,
        maritalStatus: item.marital_status,
        religion: item.religion || 'Sunnite',
        education: item.education || '',
        matchPercentage: item.match_percentage ?? 85,
        isVerifiedNNI: Boolean(item.is_verified_nni),
        isWaliApproved: Boolean(item.is_wali_approved),
        isPremium: Boolean(item.is_premium),
        photoUrl: primaryPhoto,
        photoPrivate: Boolean(item.photo_private),
        bio: item.bio || '',
        waliReference: item.wali_reference || '',
        gender: (item.gender === 'male' || item.gender === 'female') ? item.gender : 'female',
        viewsCount: item.views_count ?? 0,
        likesCount: item.likes_count ?? 0,
        hobbies: item.hobbies || '',
        interests: item.interests || '',
        drinksAlcohol: item.drinks_alcohol ?? false,
        smokes: item.smokes ?? false,
        presentation: item.presentation || '',
        personality: item.personality || '',
        familyImportance: item.family_importance || '',
        isAdmin: Boolean(item.is_admin),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        photos: additionalPhotos.length > 0 ? additionalPhotos : (primaryPhoto ? [primaryPhoto] : []),
      };
    });

    // Deduplicate profiles by ID
    const seenIds = new Set<string>();
    const uniqueProfiles: Profile[] = [];

    for (const p of mapped) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      uniqueProfiles.push(p);
    }

    return uniqueProfiles;
  } catch (err) {
    console.warn('Supabase fetch profiles exception:', err);
    return [];
  }
}

/**
 * 2. PROFILES TABLE:
 * Save or update profile in Supabase using upsert on user_id (matches UNIQUE user_id constraint)
 * Also syncs with public.profile_photos and public.profile_private
 */
export async function createProfileInSupabase(
  profile: Partial<Profile>,
  userId?: string
): Promise<Profile | null> {
  if (!supabase) return null;

  try {
    const validUserId = isValidUuid(userId) ? userId! : (isValidUuid(profile.userId) ? profile.userId! : null);
    if (!validUserId) {
      console.warn('createProfileInSupabase: user_id is required and must be a valid UUID');
      return null;
    }

    // Ensure age respects CHECK constraint (18 <= age <= 100)
    const validAge = Math.min(100, Math.max(18, Number(profile.age) || 25));
    // Ensure gender respects CHECK constraint ('male' | 'female')
    const validGender = profile.gender === 'male' ? 'male' : 'female';

    const payload: Partial<DbProfile> = {
      user_id: validUserId,
      name: profile.name || 'Membre NASSIB',
      age: validAge,
      profession: profile.profession || 'Non renseigné',
      city: profile.city || 'Niamey',
      marital_status: profile.maritalStatus || 'Jamais marié(e)',
      religion: profile.religion || 'Sunnite',
      education: profile.education || '',
      match_percentage: profile.matchPercentage ?? 85,
      is_verified_nni: Boolean(profile.isVerifiedNNI),
      is_wali_approved: Boolean(profile.isWaliApproved),
      is_premium: Boolean(profile.isPremium),
      photo_url: profile.photoUrl || null,
      photo_private: Boolean(profile.photoPrivate),
      bio: profile.bio || '',
      wali_reference: profile.waliReference || null,
      gender: validGender,
      views_count: profile.viewsCount ?? 0,
      likes_count: profile.likesCount ?? 0,
      hobbies: profile.hobbies || null,
      interests: profile.interests || null,
      drinks_alcohol: profile.drinksAlcohol ?? false,
      smokes: profile.smokes ?? false,
      presentation: profile.presentation || null,
      personality: profile.personality || null,
      family_importance: profile.familyImportance || null,
      is_admin: Boolean(profile.isAdmin),
      updated_at: new Date().toISOString(),
    };

    // Use upsert on conflict user_id
    const { data, error } = await supabase
      .from('profiles')
      .upsert([payload], { onConflict: 'user_id' })
      .select()
      .single();

    if (error || !data) {
      console.warn('Notice upserting profile in Supabase:', error?.message || error);
      return null;
    }

    const savedProfileId = data.id;

    // 12. Sync with public.profile_photos if multiple photos exist
    if (profile.photos && profile.photos.length > 0 && isValidUuid(savedProfileId)) {
      try {
        const photoInserts = profile.photos
          .filter((url) => Boolean(url) && url.trim() !== '')
          .map((url, idx) => ({
            profile_id: savedProfileId,
            user_id: validUserId,
            storage_path: url,
            sort_order: idx,
            is_primary: idx === 0,
          }));

        if (photoInserts.length > 0) {
          // Delete old entries and insert new list
          await supabase.from('profile_photos').delete().eq('profile_id', savedProfileId);
          await supabase.from('profile_photos').insert(photoInserts);
        }
      } catch (photoErr) {
        console.warn('Notice syncing profile_photos:', photoErr);
      }
    }

    // 7. Sync with public.profile_private
    if (isValidUuid(savedProfileId)) {
      try {
        await supabase.from('profile_private').upsert(
          [
            {
              profile_id: savedProfileId,
              user_id: validUserId,
              wali_reference: profile.waliReference || null,
              nni_status: profile.isVerifiedNNI ? 'verified' : 'pending',
              wali_status: profile.isWaliApproved ? 'approved' : 'pending',
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'profile_id' }
        );
      } catch (privErr) {
        console.warn('Notice syncing profile_private:', privErr);
      }
    }

    // 6. Sync with public.user_roles if admin
    if (profile.isAdmin) {
      try {
        await supabase.from('user_roles').upsert([
          {
            user_id: validUserId,
            role: 'admin',
          },
        ]);
      } catch {}
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      age: data.age,
      profession: data.profession || '',
      city: data.city,
      maritalStatus: data.marital_status,
      religion: data.religion || 'Sunnite',
      education: data.education || '',
      matchPercentage: data.match_percentage ?? 85,
      isVerifiedNNI: Boolean(data.is_verified_nni),
      isWaliApproved: Boolean(data.is_wali_approved),
      isPremium: Boolean(data.is_premium),
      photoUrl: data.photo_url || '',
      photoPrivate: Boolean(data.photo_private),
      bio: data.bio || '',
      waliReference: data.wali_reference || '',
      gender: data.gender || 'female',
      viewsCount: data.views_count ?? 0,
      likesCount: data.likes_count ?? 0,
      hobbies: data.hobbies || '',
      interests: data.interests || '',
      drinksAlcohol: Boolean(data.drinks_alcohol),
      smokes: Boolean(data.smokes),
      presentation: data.presentation || '',
      personality: data.personality || '',
      familyImportance: data.family_importance || '',
      isAdmin: Boolean(data.is_admin),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      photos: profile.photos || (data.photo_url ? [data.photo_url] : []),
    };
  } catch (err) {
    console.warn('Supabase createProfileInSupabase exception:', err);
    return null;
  }
}

/**
 * 5. USER_FAVORITES TABLE:
 * Fetch favorite profile IDs that a user has liked (Mes Favoris)
 */
export async function fetchUserFavoritesFromSupabase(userId: string): Promise<string[]> {
  if (!supabase || !isValidUuid(userId)) return [];
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('profile_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((item: any) => String(item.profile_id));
  } catch (err) {
    console.warn('Supabase fetchUserFavoritesFromSupabase error:', err);
    return [];
  }
}

/**
 * 5. USER_FAVORITES TABLE:
 * Fetch fans count for a profile (people who liked this user's profile)
 */
export async function fetchProfileFansCountFromSupabase(profileId: string): Promise<number> {
  if (!supabase || !isValidUuid(profileId)) return 0;
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
 * 5. USER_FAVORITES TABLE:
 * Toggle favorite in public.user_favorites table and sync profile likes_count
 */
export async function toggleFavoriteInSupabase(
  userId: string,
  profileId: string
): Promise<{ isFavorited: boolean }> {
  if (!supabase || !isValidUuid(userId) || !isValidUuid(profileId)) return { isFavorited: false };
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
 * 2. CONVERSATIONS TABLE:
 * Fetch Conversations from public.conversations with foreign keys candidate_id and suitor_id to public.profiles(id)
 */
export async function fetchConversationsFromSupabase(currentUserProfileId?: string): Promise<Conversation[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        candidate_id,
        suitor_id,
        last_message,
        last_message_time,
        is_supervised,
        candidate:profiles!conversations_candidate_id_fkey(id, name, city, photo_url, is_verified_nni),
        suitor:profiles!conversations_suitor_id_fkey(id, name, city, photo_url, is_verified_nni)
      `)
      .order('updated_at', { ascending: false });

    // Filter for current profile if supplied
    if (isValidUuid(currentUserProfileId)) {
      query = query.or(`candidate_id.eq.${currentUserProfileId},suitor_id.eq.${currentUserProfileId}`);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((item: any) => {
      const isCandidateMe = currentUserProfileId && item.candidate_id === currentUserProfileId;
      const partner = isCandidateMe ? (item.suitor || {}) : (item.candidate || {});
      const partnerId = isCandidateMe ? item.suitor_id : item.candidate_id;

      return {
        id: item.id,
        candidateId: item.candidate_id,
        suitorId: item.suitor_id,
        participantId: partnerId,
        participantName: partner.name || 'Membre NASSIB',
        participantAvatar: partner.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        participantCity: partner.city || 'Niamey',
        lastMessage: item.last_message || 'Discussion ouverte',
        lastMessageTime: item.last_message_time
          ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Récemment',
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
 * 2. CONVERSATIONS TABLE:
 * Create or retrieve an existing conversation between two profiles
 */
export async function createOrGetConversationInSupabase(
  candidateProfileId: string,
  suitorProfileId: string
): Promise<string | null> {
  if (!supabase || !isValidUuid(candidateProfileId) || !isValidUuid(suitorProfileId)) return null;

  try {
    // Check if conversation already exists in either direction
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(candidate_id.eq.${candidateProfileId},suitor_id.eq.${suitorProfileId}),and(candidate_id.eq.${suitorProfileId},suitor_id.eq.${candidateProfileId})`
      )
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    // Insert new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert([
        {
          candidate_id: candidateProfileId,
          suitor_id: suitorProfileId,
          is_supervised: true,
          last_message: 'Discussion engagée sous la supervision du Wali',
          last_message_time: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (error || !newConv) {
      console.warn('Notice creating conversation in Supabase:', error?.message || error);
      return null;
    }

    return newConv.id;
  } catch (err) {
    console.warn('Supabase createOrGetConversation exception:', err);
    return null;
  }
}

/**
 * 3. MESSAGES TABLE:
 * Fetch Messages for a Conversation from public.messages
 */
export async function fetchMessagesFromSupabase(conversationId: string): Promise<Message[]> {
  if (!supabase || !isValidUuid(conversationId)) return [];

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((m: DbMessage) => ({
      id: m.id,
      conversationId: m.conversation_id || conversationId,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar || '',
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
 * 3. MESSAGES TABLE:
 * Send Message to public.messages
 * Foreign key sender_id references public.profiles(id)
 */
export async function sendMessageToSupabase(
  conversationId: string,
  senderProfileId: string,
  senderName: string,
  senderAvatar: string,
  text: string
): Promise<Message | null> {
  if (!supabase || !isValidUuid(conversationId) || !isValidUuid(senderProfileId)) return null;

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderProfileId,
          sender_name: senderName,
          sender_avatar: senderAvatar || null,
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

    // Update conversation last_message and updated_at
    await supabase
      .from('conversations')
      .update({
        last_message: text,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
 * 8. VERIFICATION_REQUESTS TABLE & 7. PROFILE_PRIVATE TABLE:
 * Submit official verification request (NNI or Wali)
 */
export async function submitVerificationRequestInSupabase(params: {
  profileId: string;
  userId: string;
  verificationType: 'nni' | 'wali';
  documentPath?: string;
  adminNote?: string;
}): Promise<boolean> {
  if (!supabase || !isValidUuid(params.profileId) || !isValidUuid(params.userId)) return false;

  try {
    // Insert verification request
    const { error: reqErr } = await supabase.from('verification_requests').insert([
      {
        profile_id: params.profileId,
        user_id: params.userId,
        verification_type: params.verificationType,
        status: 'pending',
        document_path: params.documentPath || null,
        submitted_at: new Date().toISOString(),
        admin_note: params.adminNote || null,
      },
    ]);

    if (reqErr) {
      console.warn('Notice inserting verification request:', reqErr.message || reqErr);
    }

    // Update profile_private
    const updateField = params.verificationType === 'nni' ? { nni_status: 'submitted' } : { wali_status: 'submitted' };
    await supabase.from('profile_private').upsert(
      [
        {
          profile_id: params.profileId,
          user_id: params.userId,
          ...updateField,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'profile_id' }
    );

    return true;
  } catch (err) {
    console.warn('Supabase submitVerificationRequest error:', err);
    return false;
  }
}

/**
 * 11. USER_REPORTS & 13. REPORTS TABLES:
 * Report a profile or user for inappropriate behavior
 */
export async function reportUserOrProfileInSupabase(params: {
  reporterUserId?: string;
  reportedProfileId: string;
  reportedUserId?: string;
  reason: string;
  description?: string;
}): Promise<boolean> {
  if (!supabase || !isValidUuid(params.reportedProfileId)) return false;

  try {
    const validReporterId = isValidUuid(params.reporterUserId) ? params.reporterUserId : null;

    // Insert into reports table
    const { error: repErr } = await supabase.from('reports').insert([
      {
        reporter_user_id: validReporterId,
        reported_profile_id: params.reportedProfileId,
        reason: params.reason,
        status: 'pending',
      },
    ]);

    if (repErr) {
      console.warn('Notice inserting into reports:', repErr.message || repErr);
    }

    // Insert into user_reports if both user IDs are valid
    if (validReporterId && isValidUuid(params.reportedUserId)) {
      await supabase.from('user_reports').insert([
        {
          reporter_user_id: validReporterId,
          reported_user_id: params.reportedUserId!,
          reason: params.reason,
          description: params.description || null,
          status: 'pending',
        },
      ]);
    }

    return true;
  } catch (err) {
    console.warn('Supabase reportUserOrProfile error:', err);
    return false;
  }
}

/**
 * 10. USER_BLOCKS TABLE:
 * Block a user from interacting or sending messages
 */
export async function blockUserInSupabase(
  blockerUserId: string,
  blockedUserId: string,
  reason?: string
): Promise<boolean> {
  if (!supabase || !isValidUuid(blockerUserId) || !isValidUuid(blockedUserId)) return false;

  try {
    const { error } = await supabase.from('user_blocks').insert([
      {
        blocker_user_id: blockerUserId,
        blocked_user_id: blockedUserId,
        reason: reason || null,
      },
    ]);

    if (error) {
      console.warn('Notice blocking user:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase blockUser exception:', err);
    return false;
  }
}

/**
 * 4. PRICING_PLANS TABLE:
 * Fetch pricing plans from public.pricing_plans table
 */
export async function fetchPricingPlansFromSupabase(): Promise<DbPricingPlan[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * 6. USER_ROLES TABLE:
 * Check if a user has admin role
 */
export async function fetchUserRoleFromSupabase(userId: string): Promise<'user' | 'admin'> {
  if (!supabase || !isValidUuid(userId)) return 'user';
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    return data?.role === 'admin' ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}
