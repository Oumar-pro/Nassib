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
        requester_id,
        status,
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

    if (error) {
      console.warn('Supabase fetch conversations error, falling back to core select:', error.message);
      // Fallback if joined relation aliases or new columns failed
      const { data: fallbackData } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!fallbackData || fallbackData.length === 0) return [];
      return fallbackData.map((item: any) => {
        const isCandidateMe = currentUserProfileId && item.candidate_id === currentUserProfileId;
        const partnerId = isCandidateMe ? item.suitor_id : item.candidate_id;
        const rawStatus = item.status;
        const status = rawStatus === 'accepted' || rawStatus === 'rejected' ? rawStatus : 'pending';

        return {
          id: item.id,
          candidateId: item.candidate_id,
          suitorId: item.suitor_id,
          requesterId: item.requester_id || item.candidate_id,
          status,
          participantId: partnerId,
          participantName: 'Membre NASSIB',
          participantAvatar: '',
          participantCity: 'Niamey',
          lastMessage: item.last_message || 'Demande de contact',
          lastMessageTime: item.last_message_time
            ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Récemment',
          unreadCount: 0,
          isSupervised: Boolean(item.is_supervised),
          isVerifiedNNI: false,
          onlineStatus: true,
          createdAt: item.created_at,
        };
      });
    }

    if (!data || data.length === 0) return [];

    return data.map((item: any) => {
      const isCandidateMe = currentUserProfileId && item.candidate_id === currentUserProfileId;
      const partner = isCandidateMe ? (item.suitor || {}) : (item.candidate || {});
      const partnerId = isCandidateMe ? item.suitor_id : item.candidate_id;
      const rawStatus = item.status;
      const status = rawStatus === 'accepted' || rawStatus === 'rejected' ? rawStatus : 'pending';

      return {
        id: item.id,
        candidateId: item.candidate_id,
        suitorId: item.suitor_id,
        requesterId: item.requester_id || item.candidate_id,
        status,
        participantId: partnerId,
        participantName: partner.name || 'Membre NASSIB',
        participantAvatar: partner.photo_url || '',
        participantCity: partner.city || 'Niamey',
        lastMessage: item.last_message || 'Demande de contact',
        lastMessageTime: item.last_message_time
          ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Récemment',
        unreadCount: 0,
        isSupervised: Boolean(item.is_supervised),
        isVerifiedNNI: Boolean(partner.is_verified_nni),
        onlineStatus: true,
        createdAt: item.created_at,
      };
    });
  } catch (err) {
    console.warn('Supabase conversations error:', err);
    return [];
  }
}

/**
 * Check if a conversation already exists between two profiles
 */
export async function getExistingConversationBetweenProfiles(
  profileId1: string,
  profileId2: string
): Promise<{ id: string; status: 'pending' | 'accepted' | 'rejected'; requesterId?: string } | null> {
  if (!supabase || !isValidUuid(profileId1) || !isValidUuid(profileId2)) return null;

  try {
    const { data: conv1 } = await supabase
      .from('conversations')
      .select('id, status, requester_id, candidate_id')
      .eq('candidate_id', profileId1)
      .eq('suitor_id', profileId2)
      .maybeSingle();

    if (conv1?.id) {
      return {
        id: conv1.id,
        status: (conv1.status === 'accepted' || conv1.status === 'rejected') ? conv1.status : 'pending',
        requesterId: conv1.requester_id || conv1.candidate_id,
      };
    }

    const { data: conv2 } = await supabase
      .from('conversations')
      .select('id, status, requester_id, candidate_id')
      .eq('candidate_id', profileId2)
      .eq('suitor_id', profileId1)
      .maybeSingle();

    if (conv2?.id) {
      return {
        id: conv2.id,
        status: (conv2.status === 'accepted' || conv2.status === 'rejected') ? conv2.status : 'pending',
        requesterId: conv2.requester_id || conv2.candidate_id,
      };
    }
  } catch (err) {
    console.warn('Error checking existing conversation:', err);
  }

  return null;
}

/**
 * 2. CONVERSATIONS & CONTACT REQUESTS:
 * Send a contact request with a polite first message.
 * First message creates a conversation with status: 'pending'.
 */
export async function sendContactRequestInSupabase(params: {
  senderProfileId: string;
  targetProfileId: string;
  firstMessage: string;
  senderName: string;
  senderAvatar?: string;
}): Promise<{ conversationId: string | null; error: string | null }> {
  if (!supabase) return { conversationId: null, error: 'Connexion base de données non disponible.' };
  if (!isValidUuid(params.senderProfileId) || !isValidUuid(params.targetProfileId)) {
    return { conversationId: null, error: 'Identifiants de profil invalides.' };
  }
  if (!params.firstMessage.trim()) {
    return { conversationId: null, error: 'Veuillez rédiger un premier message de présentation.' };
  }

  try {
    // 1. Check if conversation already exists
    const existing = await getExistingConversationBetweenProfiles(params.senderProfileId, params.targetProfileId);
    if (existing) {
      if (existing.status === 'pending') {
        return {
          conversationId: existing.id,
          error: 'Une demande de contact est déjà en cours avec ce profil.',
        };
      }
      if (existing.status === 'rejected') {
        return {
          conversationId: existing.id,
          error: 'La demande de contact précédente a été refusée.',
        };
      }
      return { conversationId: existing.id, error: null };
    }

    // 2. Create new conversation with status: 'pending' and requester_id
    const messageText = params.firstMessage.trim();
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert([
        {
          candidate_id: params.senderProfileId,
          suitor_id: params.targetProfileId,
          requester_id: params.senderProfileId,
          status: 'pending',
          is_supervised: true,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (convErr || !newConv?.id) {
      console.warn('Error creating conversation:', convErr?.message);
      // If error was due to requester_id or status column missing in a transition state:
      const { data: retryConv, error: retryErr } = await supabase
        .from('conversations')
        .insert([
          {
            candidate_id: params.senderProfileId,
            suitor_id: params.targetProfileId,
            is_supervised: true,
            last_message: messageText,
            last_message_time: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (retryErr || !retryConv?.id) {
        return { conversationId: null, error: retryErr?.message || convErr?.message || 'Impossible de créer la demande.' };
      }
      newConv.id = retryConv.id;
    }

    // 3. Insert the initial message
    const { error: msgErr } = await supabase.from('messages').insert([
      {
        conversation_id: newConv.id,
        sender_id: params.senderProfileId,
        sender_name: params.senderName,
        sender_avatar: params.senderAvatar || null,
        text: messageText,
        is_supervised: true,
        status: 'sent',
      },
    ]);

    if (msgErr) {
      console.warn('Error inserting initial request message:', msgErr.message);
    }

    return { conversationId: newConv.id, error: null };
  } catch (err: any) {
    console.warn('sendContactRequestInSupabase exception:', err);
    return { conversationId: null, error: err?.message || 'Erreur lors de l’envoi de la demande.' };
  }
}

/**
 * Respond to a contact request: accept or reject
 */
export async function respondToContactRequestInSupabase(
  conversationId: string,
  status: 'accepted' | 'rejected'
): Promise<boolean> {
  if (!supabase || !isValidUuid(conversationId)) return false;

  try {
    const { error } = await supabase
      .from('conversations')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) {
      console.warn('respondToContactRequestInSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('respondToContactRequestInSupabase exception:', err);
    return false;
  }
}

export async function createOrGetConversationInSupabase(
  candidateProfileId: string,
  suitorProfileId: string
): Promise<string | null> {
  if (!supabase || !isValidUuid(candidateProfileId) || !isValidUuid(suitorProfileId)) {
    return null;
  }

  try {
    const existing = await getExistingConversationBetweenProfiles(candidateProfileId, suitorProfileId);
    if (existing) return existing.id;

    // Insert new conversation in database
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert([
        {
          candidate_id: candidateProfileId,
          suitor_id: suitorProfileId,
          requester_id: candidateProfileId,
          status: 'pending',
          is_supervised: true,
          last_message: 'Discussion engagée sous la supervision du Wali',
          last_message_time: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (!error && newConv) {
      return newConv.id;
    }
  } catch (err) {
    console.warn('Supabase createOrGetConversation exception:', err);
  }

  return null;
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

    if (error || !data || data.length === 0) return [];

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
 * Enforces business rule: if conversation is pending, no additional message allowed until accepted!
 */
export async function sendMessageToSupabase(
  conversationId: string,
  senderProfileId: string,
  senderName: string,
  senderAvatar: string,
  text: string
): Promise<{ message: Message | null; error: string | null }> {
  if (!supabase || !isValidUuid(conversationId) || !isValidUuid(senderProfileId)) {
    return { message: null, error: 'Identifiants invalides.' };
  }

  const cleanText = text.trim();
  if (!cleanText) return { message: null, error: 'Message vide.' };

  try {
    // 1. Verify conversation status
    const { data: convData, error: convCheckErr } = await supabase
      .from('conversations')
      .select('id, status, candidate_id, suitor_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (convCheckErr) {
      console.warn('Conversation check notice:', convCheckErr.message);
    }

    if (convData) {
      if (convData.status === 'rejected') {
        return { message: null, error: 'Cette conversation a été refusée. Aucun message ne peut être envoyé.' };
      }

      if (convData.status === 'pending') {
        // Check message count
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversationId);

        if (count && count > 0) {
          return {
            message: null,
            error: 'La demande de contact est en attente. Vous ne pouvez pas envoyer d’autre message avant acceptation.',
          };
        }
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderProfileId,
          sender_name: senderName,
          sender_avatar: senderAvatar || null,
          text: cleanText,
          is_supervised: true,
          status: 'sent',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('Error sending message:', error.message);
      return { message: null, error: error.message || 'Impossible d’envoyer le message.' };
    }

    if (data) {
      await supabase
        .from('conversations')
        .update({
          last_message: cleanText,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return {
        message: {
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
        },
        error: null,
      };
    }
  } catch (err: any) {
    console.warn('Supabase sendMessage exception:', err);
    return { message: null, error: err?.message || 'Erreur d’envoi de message.' };
  }

  return { message: null, error: 'Erreur inattendue lors de l’envoi.' };
}

/**
 * 4. PHOTO ACCESS REQUESTS TABLE
 */
export async function sendPhotoAccessRequestInSupabase(params: {
  requesterProfileId: string;
  targetProfileId: string;
  requesterUserId?: string;
  targetUserId?: string;
  note?: string;
}): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) return { success: false, error: 'Base de données non disponible.' };
  if (!isValidUuid(params.requesterProfileId) || !isValidUuid(params.targetProfileId)) {
    return { success: false, error: 'Profil invalide.' };
  }

  try {
    const { data: existing } = await supabase
      .from('photo_access_requests')
      .select('id, status')
      .eq('requester_profile_id', params.requesterProfileId)
      .eq('target_profile_id', params.targetProfileId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: true, error: 'Vous avez déjà accès aux photos de ce profil.' };
      }
      if (existing.status === 'pending') {
        return { success: true, error: 'Une demande d’accès aux photos est déjà en attente.' };
      }
      // If rejected, allow re-requesting
      const { error: updateErr } = await supabase
        .from('photo_access_requests')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
          note: params.note || null,
        })
        .eq('id', existing.id);

      if (updateErr) return { success: false, error: updateErr.message };
      return { success: true, error: null };
    }

    const { error } = await supabase.from('photo_access_requests').insert([
      {
        requester_profile_id: params.requesterProfileId,
        target_profile_id: params.targetProfileId,
        requester_user_id: isValidUuid(params.requesterUserId) ? params.requesterUserId : null,
        target_user_id: isValidUuid(params.targetUserId) ? params.targetUserId : null,
        status: 'pending',
        note: params.note || null,
      },
    ]);

    if (error) {
      console.warn('sendPhotoAccessRequest error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.warn('sendPhotoAccessRequest exception:', err);
    return { success: false, error: err?.message || 'Erreur lors de la demande d’accès aux photos.' };
  }
}

/**
 * Fetch all target profile IDs for which currentUser has approved photo access
 */
export async function fetchApprovedPhotoAccessProfileIds(requesterProfileId: string): Promise<string[]> {
  if (!supabase || !isValidUuid(requesterProfileId)) return [];

  try {
    const { data, error } = await supabase
      .from('photo_access_requests')
      .select('target_profile_id')
      .eq('requester_profile_id', requesterProfileId)
      .in('status', ['accepted', 'approved']);

    if (error || !data) return [];
    return data.map((r: any) => String(r.target_profile_id));
  } catch (err) {
    console.warn('fetchApprovedPhotoAccessProfileIds error:', err);
    return [];
  }
}

export interface PhotoAccessRequest {
  id: string;
  created_at?: string;
  updated_at?: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
  note?: string;
  requester?: {
    id: string;
    name: string;
    age?: number;
    city?: string;
    profession?: string;
    photo_url?: string;
  };
  target?: {
    id: string;
    name: string;
    age?: number;
    city?: string;
    profession?: string;
    photo_url?: string;
  };
}

/**
 * Fetch photo access requests received by the user's profile
 */
export async function fetchReceivedPhotoAccessRequests(targetProfileId: string): Promise<PhotoAccessRequest[]> {
  if (!supabase || !isValidUuid(targetProfileId)) return [];

  try {
    const { data, error } = await supabase
      .from('photo_access_requests')
      .select(`
        id,
        created_at,
        updated_at,
        requester_profile_id,
        target_profile_id,
        status,
        note,
        requester:profiles!photo_access_requests_requester_profile_id_fkey(id, name, age, city, profession, photo_url)
      `)
      .eq('target_profile_id', targetProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback without join
      const { data: fallback } = await supabase
        .from('photo_access_requests')
        .select('*')
        .eq('target_profile_id', targetProfileId)
        .order('created_at', { ascending: false });
      return (fallback || []) as PhotoAccessRequest[];
    }

    return (data || []).map((item: any) => ({
      ...item,
      requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
    })) as PhotoAccessRequest[];
  } catch (err) {
    console.warn('fetchReceivedPhotoAccessRequests error:', err);
    return [];
  }
}

/**
 * Fetch photo access requests sent by the user's profile
 */
export async function fetchSentPhotoAccessRequests(requesterProfileId: string): Promise<PhotoAccessRequest[]> {
  if (!supabase || !isValidUuid(requesterProfileId)) return [];

  try {
    const { data, error } = await supabase
      .from('photo_access_requests')
      .select(`
        id,
        created_at,
        updated_at,
        requester_profile_id,
        target_profile_id,
        status,
        note,
        target:profiles!photo_access_requests_target_profile_id_fkey(id, name, age, city, profession, photo_url)
      `)
      .eq('requester_profile_id', requesterProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fallback } = await supabase
        .from('photo_access_requests')
        .select('*')
        .eq('requester_profile_id', requesterProfileId)
        .order('created_at', { ascending: false });
      return (fallback || []) as PhotoAccessRequest[];
    }

    return (data || []).map((item: any) => ({
      ...item,
      target: Array.isArray(item.target) ? item.target[0] : item.target,
    })) as PhotoAccessRequest[];
  } catch (err) {
    console.warn('fetchSentPhotoAccessRequests error:', err);
    return [];
  }
}

/**
 * Respond to a photo access request: accept or reject
 */
export async function respondToPhotoAccessRequestInSupabase(
  requestId: string,
  status: 'approved' | 'accepted' | 'rejected'
): Promise<boolean> {
  if (!supabase || !isValidUuid(requestId)) return false;

  try {
    const dbStatus = status === 'accepted' ? 'approved' : status;
    const { error } = await supabase
      .from('photo_access_requests')
      .update({
        status: dbStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.warn('respondToPhotoAccessRequest error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('respondToPhotoAccessRequest exception:', err);
    return false;
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
