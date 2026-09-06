import { createClient } from '@supabase/supabase-js';
import { Profile, Conversation, Message } from '../types';
import { DbMessage } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
);

// Initialize Supabase Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to check if a string is a valid UUID
 */
export function isValidUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

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
        participantAvatar: partner.photo_url || '',
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
    const { data: existing1 } = await supabase
      .from('conversations')
      .select('id')
      .eq('candidate_id', candidateProfileId)
      .eq('suitor_id', suitorProfileId)
      .maybeSingle();

    if (existing1?.id) {
      return existing1.id;
    }

    const { data: existing2 } = await supabase
      .from('conversations')
      .select('id')
      .eq('candidate_id', suitorProfileId)
      .eq('suitor_id', candidateProfileId)
      .maybeSingle();

    if (existing2?.id) {
      return existing2.id;
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
      // Double check in case of concurrent creation
      const { data: retryCheck } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(candidate_id.eq.${candidateProfileId},suitor_id.eq.${suitorProfileId}),and(candidate_id.eq.${suitorProfileId},suitor_id.eq.${candidateProfileId})`
        )
        .maybeSingle();
      return retryCheck?.id || null;
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
