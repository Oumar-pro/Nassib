import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabType, Profile, Conversation, Message, User, UserWaliInfo } from './types';
import {
  supabase,
  isSupabaseConfigured,
  fetchMessagesFromSupabase,
  sendMessageToSupabase,
  createOrGetConversationInSupabase,
  reportUserOrProfileInSupabase,
  blockUserInSupabase,
  fetchConversationsFromSupabase,
  fetchApprovedPhotoAccessProfileIds,
  fetchReceivedPhotoAccessRequests,
  fetchSentPhotoAccessRequests,
  sendPhotoAccessRequestInSupabase,
  respondToPhotoAccessRequestInSupabase,
  sendContactRequestInSupabase,
  respondToContactRequestInSupabase,
  submitVerificationRequestInSupabase,
  PhotoAccessRequest,
} from './lib/supabase';
import { getCurrentUserSession, logoutUserSession, AuthAccount, restoreCurrentUserSession, getCachedAccount } from './lib/auth';
import { 
  getProfiles, 
  getMyProfile, 
  getMyProfileStats, 
  recordProfileView, 
  saveMyProfile, 
  updatePhotoPrivacy, 
  getFavorites, 
  toggleFavorite, 
  hasUploadedPhotos, 
  getProfileById,
  checkAndConsumeContactQuota,
  activateProfileBoost,
} from './lib/database';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileHeader } from './components/Navigation/MobileHeader';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { NasibaLogo } from './components/NasibaLogo';
import { DashboardView } from './components/Dashboard/DashboardView';
import { BrowseView } from './components/Browse/BrowseView';
import { MessagesView } from './components/Messages/MessagesView';
import { VerificationView } from './components/Verification/VerificationView';
import { SettingsView } from './components/Settings/SettingsView';
import { LandingView } from './components/Landing/LandingView';
import { ImamChatView } from './components/ImamOumar/ImamChatView';
import { ProfileDetailModal } from './components/Profile/ProfileDetailModal';
import { ProfileDetailView } from './components/Profile/ProfileDetailView';
import { RequestsView } from './components/Requests/RequestsView';
import { ContactRequestModal } from './components/Modals/ContactRequestModal';
import { PhotoRequiredModal } from './components/Modals/PhotoRequiredModal';
import { ProfileInvisibilityNotice } from './components/Modals/ProfileInvisibilityNotice';
import { PwaInstallPrompt } from './components/Modals/PwaInstallPrompt';
import { PaywallUpgradeModal } from './components/Modals/PaywallUpgradeModal';
import { AuthPage } from './components/Auth/AuthPage';
import { OnboardingPage } from './components/Auth/OnboardingPage';
import { OnboardingData } from './components/Auth/OnboardingModal';

const EMPTY_USER: User = {
  id: '', profileId: undefined, name: '', email: '', phone: '', role: 'candidate', gender: undefined,
  isVerifiedNNI: false, isWaliApproved: false, isPremium: false, photoBlurringActive: false, photoUrl: '', planName: 'Sadaq (Gratuit)',
  waliInfo: { name: '', relation: '', phone: '' },
  stats: { profileViews: 0, profileConsultations: 0, photoRequests: 0, photoRequestsApproved: 0, matchesCount: 0, favoritesCount: 0, compatibilityRateAvg: 0, weeklyGrowthPercentage: 0 },
};

function accountToUser(account: AuthAccount, profile?: Profile | null, currentBlur?: boolean): User {
  const photoBlurringActive = profile ? Boolean(profile.photoPrivate) : Boolean(currentBlur);
  return {
    ...EMPTY_USER,
    id: account.id, profileId: profile?.id, name: profile?.name || account.name, email: account.email, phone: account.phone,
    role: account.role, gender: profile?.gender || account.gender,
    isVerifiedNNI: Boolean(profile?.isVerifiedNNI ?? account.isVerifiedNNI),
    isWaliApproved: Boolean(profile?.isWaliApproved ?? account.isWaliApproved),
    isPremium: Boolean(profile?.isPremium ?? account.isPremium), photoBlurringActive,
    boostsCount: profile?.boostsCount ?? (account as any).boostsCount ?? 0,
    boostedUntil: profile?.boostedUntil,
    premiumExpiresAt: profile?.premiumExpiresAt,
    dailyContactsCount: profile?.dailyContactsCount ?? 0,
    dailyContactsDate: profile?.dailyContactsDate,
    photoUrl: profile?.photoUrl || account.photoUrl || '', photos: profile?.photos || (account.photoUrl ? [account.photoUrl] : []),
    planName: account.planName || 'Sadaq (Gratuit)', stats: { ...EMPTY_USER.stats, favoritesCount: profile?.likesCount ?? 0 },
  };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    try {
      const cached = getCachedAccount();
      if (cached?.id) {
        const savedTab = localStorage.getItem('nassib_active_tab_v1') as TabType;
        const validTabs: TabType[] = ['dashboard', 'browse', 'requests', 'messages', 'imam', 'verification', 'settings'];
        if (savedTab && validTabs.includes(savedTab)) return savedTab;
        return 'dashboard';
      }
    } catch {}
    return 'landing';
  });
  const [user, setUser] = useState<User>(() => {
    const cached = getCachedAccount();
    if (cached?.id) {
      return accountToUser(cached, null, false);
    }
    return EMPTY_USER;
  });
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [favoriteProfileIds, setFavoriteProfileIds] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [returnTab, setReturnTab] = useState<TabType>('browse');
  const previousNonImamTabRef = useRef<TabType>('dashboard');

  useEffect(() => {
    if (currentTab !== 'imam' && currentTab !== 'auth' && currentTab !== 'onboarding' && currentTab !== 'landing') {
      previousNonImamTabRef.current = currentTab;
    }
  }, [currentTab]);
  const [contactModalProfile, setContactModalProfile] = useState<Profile | null>(null);
  const [approvedPhotoIds, setApprovedPhotoIds] = useState<string[]>([]);
  const [receivedPhotoRequests, setReceivedPhotoRequests] = useState<PhotoAccessRequest[]>([]);
  const [sentPhotoRequests, setSentPhotoRequests] = useState<PhotoAccessRequest[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [registeredUserData, setRegisteredUserData] = useState<{ id?: string; email?: string; name: string; role: 'candidate' | 'wali'; phone: string }>({ name: '', role: 'candidate', phone: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPhotoRequiredModal, setShowPhotoRequiredModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallConfig, setPaywallConfig] = useState<{
    title: string;
    description: string;
    icon: string;
  }>({
    title: 'Passez à Premium',
    description: 'Débloquez toutes les fonctionnalités exclusives sans aucune restriction.',
    icon: 'workspace_premium',
  });

  const hasCurrentUserUploadedPhoto = useMemo(() => {
    if (!user.id) return false;
    if (hasUploadedPhotos(currentUserProfile)) return true;
    if (Boolean(user.photoUrl?.trim())) return true;
    if (Array.isArray(user.photos) && user.photos.some((p) => typeof p === 'string' && p.trim() !== '')) return true;
    return false;
  }, [user.id, currentUserProfile, user.photoUrl, user.photos]);

  const showToast = useCallback((message: string) => { setToastMessage(message); window.setTimeout(() => setToastMessage(null), 3500); }, []);

  const isLoadingDbRef = useRef(false);
  const isSyncingRef = useRef(false);

  const loadDatabaseState = useCallback(async (userId: string) => {
    if (!userId || isLoadingDbRef.current) return;
    isLoadingDbRef.current = true;
    try {
      const myProfile = await getMyProfile(userId);
      if (myProfile) setCurrentUserProfile(myProfile);
      const [dbProfiles, dbFavorites, dbConversations, approvedPhotos, recPhotoReqs, sentPhotoReqs, dbStats] = await Promise.all([
        getProfiles(userId, myProfile).catch(() => []),
        getFavorites(userId).catch(() => []),
        fetchConversationsFromSupabase(myProfile?.id).catch(() => []),
        myProfile?.id ? fetchApprovedPhotoAccessProfileIds(myProfile.id).catch(() => []) : Promise.resolve([]),
        myProfile?.id ? fetchReceivedPhotoAccessRequests(myProfile.id).catch(() => []) : Promise.resolve([]),
        myProfile?.id ? fetchSentPhotoAccessRequests(myProfile.id).catch(() => []) : Promise.resolve([]),
        getMyProfileStats().catch(() => null),
      ]);
      setProfiles((dbProfiles || []).filter(hasUploadedPhotos));
      setFavoriteProfileIds(dbFavorites);
      setConversations(dbConversations);
      setApprovedPhotoIds(approvedPhotos);
      setReceivedPhotoRequests(recPhotoReqs);
      setSentPhotoRequests(sentPhotoReqs);
      const account = getCurrentUserSession();
      if (account) {
        setUser((prev) => {
          const next = accountToUser(account, myProfile, myProfile?.photoPrivate ?? prev.photoBlurringActive);
          if (dbStats) next.stats = { ...next.stats, ...dbStats };
          return next;
        });
      }
    } finally {
      isLoadingDbRef.current = false;
    }
  }, []);

  const syncAuth = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const account = await restoreCurrentUserSession();
      if (!account) {
        setUser(EMPTY_USER);
        setCurrentUserProfile(null);
        setProfiles([]);
        setConversations([]);
        setMessages([]);
        setFavoriteProfileIds([]);
        setApprovedPhotoIds([]);
        setReceivedPhotoRequests([]);
        setSentPhotoRequests([]);
        setActiveConvId(null);
        setCurrentTab((prev) => (prev !== 'landing' && prev !== 'auth' ? 'landing' : prev));
        return;
      }
      await loadDatabaseState(account.id);
      setCurrentTab((prev) => {
        if (prev === 'landing' || prev === 'auth') {
          try {
            const savedTab = localStorage.getItem('nassib_active_tab_v1') as TabType;
            const validTabs: TabType[] = ['dashboard', 'browse', 'requests', 'messages', 'imam', 'verification', 'settings'];
            if (savedTab && validTabs.includes(savedTab)) return savedTab;
          } catch {}
          return 'dashboard';
        }
        return prev;
      });
    } finally {
      isSyncingRef.current = false;
    }
  }, [loadDatabaseState]);

  useEffect(() => {
    const validTabs: TabType[] = ['dashboard', 'browse', 'requests', 'messages', 'imam', 'verification', 'settings'];
    if (user.id && validTabs.includes(currentTab)) {
      try {
        localStorage.setItem('nassib_active_tab_v1', currentTab);
      } catch {}
    }
  }, [currentTab, user.id]);

  useEffect(() => {
    syncAuth();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') return;
      window.setTimeout(() => syncAuth(), 100);
    });
    return () => data.subscription.unsubscribe();
  }, [syncAuth]);

  useEffect(() => {
    if (!supabase || !user.id) return;
    const reload = () => loadDatabaseState(user.id);
    const channel = supabase
      .channel(`nassib:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_favorites' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_access_requests' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
        const conversationId = (payload.new as any)?.conversation_id || (payload.old as any)?.conversation_id;
        if (conversationId && conversationId === activeConvId) {
          const remote = await fetchMessagesFromSupabase(conversationId);
          setMessages(remote.map((m) => ({ ...m, isMine: m.senderId === user.profileId })));
        }
        reload();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.profileId, activeConvId, loadDatabaseState]);

  useEffect(() => {
    if (!activeConvId || !user.profileId) { setMessages([]); return; }
    fetchMessagesFromSupabase(activeConvId).then((remote) => setMessages(remote.map((m) => ({ ...m, isMine: m.senderId === user.profileId }))));
  }, [activeConvId, user.profileId]);

  const contactRelationshipMap = useMemo(() => {
    const map: Record<string, 'NO_REQUEST' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'REJECTED'> = {};
    const myProfileId = user.profileId; if (!myProfileId) return map;
    for (const conv of conversations) {
      const otherId = conv.candidateId === myProfileId ? conv.requesterId : conv.candidateId; if (!otherId) continue;
      if (conv.status === 'accepted') map[otherId] = 'ACCEPTED'; else if (conv.status === 'rejected') map[otherId] = 'REJECTED';
      else if (conv.status === 'pending') map[otherId] = conv.requesterId === myProfileId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
    }
    return map;
  }, [conversations, user.profileId]);

  const effectiveApprovedPhotoIds = useMemo(() => {
    const set = new Set<string>(approvedPhotoIds);
    for (const r of sentPhotoRequests) {
      if (r.status === 'approved' || r.status === 'accepted') {
        const targetId = r.target_profile_id || (r as any).targetProfileId;
        if (targetId) set.add(targetId);
      }
    }
    return Array.from(set);
  }, [approvedPhotoIds, sentPhotoRequests]);

  const photoAccessMap = useMemo(() => {
    const map: Record<string, 'NO_REQUEST' | 'PENDING' | 'ALLOWED' | 'REJECTED'> = {};
    for (const profile of profiles) {
      if (effectiveApprovedPhotoIds.includes(profile.id)) map[profile.id] = 'ALLOWED';
      else {
        const sent = sentPhotoRequests.find(
          (r) => r.target_profile_id === profile.id || (r as any).targetProfileId === profile.id
        );
        if (sent?.status === 'pending') map[profile.id] = 'PENDING';
        else if (sent?.status === 'rejected') map[profile.id] = 'REJECTED';
        else if (sent?.status === 'approved' || sent?.status === 'accepted') map[profile.id] = 'ALLOWED';
        else map[profile.id] = 'NO_REQUEST';
      }
    }
    return map;
  }, [profiles, effectiveApprovedPhotoIds, sentPhotoRequests]);

  const pendingContactRequests = useMemo(() => { const id=user.profileId; return id ? conversations.filter((c)=>c.status==='pending'&&c.requesterId!==id) : []; }, [conversations,user.profileId]);
  const sentPendingContactRequests = useMemo(() => { const id=user.profileId; return id ? conversations.filter((c)=>c.status==='pending'&&c.requesterId===id) : []; }, [conversations,user.profileId]);
  const pendingPhotoRequests = useMemo(() => receivedPhotoRequests.filter((r)=>r.status==='pending'), [receivedPhotoRequests]);
  const totalPendingRequestsCount = pendingContactRequests.length + pendingPhotoRequests.length;

  const handleOpenAuth = (mode: 'login' | 'register') => { setAuthMode(mode); setCurrentTab('auth'); };

  const handleSelectProfile = async (profile: Profile, destination: TabType) => {
    setReturnTab(destination); setSelectedProfile(profile); setCurrentTab('profile-detail');
    if (user.profileId && profile.id !== user.profileId) await recordProfileView(profile.id);
  };

  const handleToggleFavorite = async (profileId: string) => {
    if (!user.id) return showToast('Veuillez vous connecter pour enregistrer vos favoris.');
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    const wasFavorited = favoriteProfileIds.includes(profileId);
    const success = await toggleFavorite(user.id, profileId);
    if (!success) return showToast('Impossible de modifier vos favoris. Réessayez.');
    setFavoriteProfileIds(await getFavorites(user.id));
    const profile = profiles.find((p) => p.id === profileId);
    showToast(!wasFavorited ? `❤️ ${profile?.name || 'Profil'} ajouté(e) à vos favoris.` : `${profile?.name || 'Profil'} retiré(e) de vos favoris.`);
  };

  const favoriteProfiles = profiles.filter((p) => hasUploadedPhotos(p) && favoriteProfileIds.includes(p.id));
  const userFansCount = currentUserProfile?.likesCount ?? 0;

  const handleSendMessage = async (text: string, targetConvId?: string) => {
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    const convId = targetConvId || activeConvId; if (!convId || !user.profileId) return;
    const result = await sendMessageToSupabase(convId, user.profileId, user.name, user.photoUrl, text);
    if (!result) return showToast('Impossible d’envoyer le message. Réessayez.');
    const remote = await fetchMessagesFromSupabase(convId); setMessages(remote.map((m) => ({ ...m, isMine: m.senderId === user.profileId })));
  };

  const handleOpenContactModal = (profile: Profile) => {
    if (!user.id || !user.profileId) return showToast('Veuillez vous connecter pour contacter ce profil.');
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    if (user.profileId === profile.id) return showToast('Vous ne pouvez pas envoyer de demande à vous-même.');
    setContactModalProfile(profile);
  };

  const handleConfirmSendContactRequest = async (targetProfile: Profile, messageText: string): Promise<boolean> => {
    if (!user.profileId) { showToast('Veuillez vous connecter pour envoyer une demande.'); return false; }
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return false;
    }

    // Restriction Contact Freemium vs Premium (Free: 3/jour, Premium: Illimité)
    const quota = await checkAndConsumeContactQuota();
    if (!quota.allowed) {
      setContactModalProfile(null);
      setPaywallConfig({
        title: 'Contacte sans limite',
        description: "Tu as flashé sur ce profil ? Écris-lui maintenant, sans attendre demain. Tu as atteint la limite de 3 contacts par jour du compte Gratuit. Passe à Premium pour échanger en illimité !",
        icon: 'forum',
      });
      setShowPaywallModal(true);
      return false;
    }

    const result = await sendContactRequestInSupabase({ senderProfileId: user.profileId, targetProfileId: targetProfile.id, senderName: user.name || 'Membre', senderAvatar: user.photoUrl, firstMessage: messageText });
    if (!result.conversationId || result.error) { showToast(result.error || 'Impossible d’envoyer la demande. Une demande existe peut-être déjà.'); return false; }
    showToast(`Demande de contact transmise avec succès à ${targetProfile.name}.`); await loadDatabaseState(user.id); setActiveConvId(result.conversationId); return true;
  };

  const handleActivateBoost = async () => {
    if (!user.profileId) return;
    if (!user.isPremium) {
      setPaywallConfig({
        title: 'Priorité dans la Sélection & Boosts',
        description: 'Ton profil est proposé en priorité dans la Sélection et dans Découvrir chaque jour. Passe à Premium pour obtenir des Boosts et être vu(e) en premier !',
        icon: 'bolt',
      });
      setShowPaywallModal(true);
      return;
    }
    const res = await activateProfileBoost();
    if (res.success) {
      showToast('🚀 Profil boosté avec succès ! Vous apparaissez en 1ère position pendant 24h.');
      await loadDatabaseState(user.id);
    } else {
      showToast(res.error || 'Impossible d’activer le boost.');
    }
  };

  const handleRespondContact = async (convId: string, status: 'accepted' | 'rejected') => {
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    const ok = await respondToContactRequestInSupabase(convId, status);
    if (ok) { showToast(status === 'accepted' ? 'Demande acceptée ! La discussion est ouverte.' : 'Demande refusée.'); await loadDatabaseState(user.id); }
    else showToast('Erreur lors du traitement de la demande.');
  };

  const handleStartMessageWithProfile = async (profile: Profile) => {
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    let myProfileId = user.profileId;
    if (!myProfileId && user.id) { const myProf = profiles.find((p)=>p.userId===user.id) || await getMyProfile(user.id); if (myProf) myProfileId=myProf.id; }
    if (!myProfileId) return showToast('Veuillez vous connecter pour contacter ce profil.');
    if (myProfileId === profile.id) return showToast('Vous ne pouvez pas démarrer une discussion avec votre propre profil.');
    const relState = contactRelationshipMap[profile.id];
    if (relState === 'PENDING_SENT') return showToast('Votre demande de contact est en attente d’acceptation par ce profil.');
    if (relState === 'REJECTED') return showToast('Cette demande de contact a été clôturée.');
    if (relState === 'ACCEPTED') { const conv=conversations.find((c)=>(c.candidateId===profile.id||c.requesterId===profile.id)&&c.status==='accepted'); if(conv){setActiveConvId(conv.id);setSelectedProfile(null);setCurrentTab('messages');return;} }
    handleOpenContactModal(profile);
  };

  const handleReportProfile = async (targetProfile: Profile, reason: string, description?: string) => { if (!user.id) return; await reportUserOrProfileInSupabase({ reporterUserId:user.id, reportedProfileId:targetProfile.id, reportedUserId:targetProfile.userId, reason, description }); showToast('Signalement enregistré. Merci.'); };
  const handleBlockProfile = async (targetProfile: Profile, reason?: string) => { if (!user.id || !targetProfile.userId) return; const ok=await blockUserInSupabase(user.id,targetProfile.userId,reason); if(ok!==false){setProfiles((prev)=>prev.filter((p)=>p.id!==targetProfile.id));showToast(`${targetProfile.name} a été bloqué(e).`);} };

  const handleRequestPhotoAccess = async (profile: Profile) => {
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    let myProfileId=user.profileId; if(!myProfileId&&user.id){const myProf=profiles.find((p)=>p.userId===user.id)||await getMyProfile(user.id);if(myProf)myProfileId=myProf.id;}
    if(!myProfileId)return showToast('Veuillez vous connecter pour demander l’accès aux photos.'); if(myProfileId===profile.id)return showToast('Il s’agit de votre propre profil.');
    const result=await sendPhotoAccessRequestInSupabase({requesterProfileId:myProfileId,targetProfileId:profile.id,requesterUserId:user.id,targetUserId:profile.userId});
    if(result.success){showToast(`Demande d’accès aux photos transmise à ${profile.name}.`);await loadDatabaseState(user.id);}else showToast(result.error||'Une demande d’accès aux photos est déjà en cours ou a déjà été envoyée.');
  };
  const handleRespondPhotoRequest = async (requestId:string,status:'approved'|'rejected') => {
    if (!hasCurrentUserUploadedPhoto) {
      setShowPhotoRequiredModal(true);
      return;
    }
    const ok = await respondToPhotoAccessRequestInSupabase(requestId,status);
    if(ok){
      showToast(status==='approved'?'Accès aux photos accordé.':'Demande d’accès refusée.');
      setReceivedPhotoRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: status === 'approved' ? 'approved' : 'rejected' } : r))
      );
      await loadDatabaseState(user.id);
    } else showToast('Erreur lors de la réponse à la demande.');
  };

  const handleAuthSuccess = async (userAcc: AuthAccount, isRegister: boolean) => {
    // 1. Mettre à jour l'utilisateur immédiatement en mémoire
    setUser((prev) => ({
      ...prev,
      id: userAcc.id,
      name: userAcc.name || prev.name,
      email: userAcc.email || prev.email,
      phone: userAcc.phone || prev.phone,
      role: userAcc.role || prev.role,
      gender: userAcc.gender || prev.gender,
      isPremium: Boolean(userAcc.isPremium),
      isVerifiedNNI: Boolean(userAcc.isVerifiedNNI),
      isWaliApproved: Boolean(userAcc.isWaliApproved),
      photoUrl: userAcc.photoUrl || prev.photoUrl,
    }));

    if (isRegister) {
      setRegisteredUserData({
        id: userAcc.id,
        email: userAcc.email,
        name: userAcc.name,
        role: userAcc.role,
        phone: userAcc.phone || '',
      });
      setCurrentTab('onboarding');
      showToast('Compte créé. Complétez maintenant votre profil.');
    } else {
      setCurrentTab('dashboard');
      try {
        localStorage.setItem('nassib_active_tab_v1', 'dashboard');
      } catch {}
      showToast(`Ravi de vous revoir sur Nassib, ${userAcc.name || ''} !`);
    }

    // 2. Charger les données en arrière-plan sans bloquer l'interface
    loadDatabaseState(userAcc.id);
  };

  const handleLogout = async () => { await logoutUserSession(); try{localStorage.removeItem('nassib_active_tab_v1');}catch{} setUser(EMPTY_USER);setProfiles([]);setConversations([]);setMessages([]);setFavoriteProfileIds([]);setActiveConvId(null);setMobileMenuOpen(false);setCurrentTab('landing'); };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    const userId=registeredUserData.id||user.id;if(!userId)return showToast('Session invalide. Veuillez vous reconnecter.');
    const photos=data.photos||[];const hasWaliInfo=Boolean(data.waliName?.trim()&&data.waliPhone?.trim());
    const profile:Partial<Profile>={name:registeredUserData.name||user.name,age:data.age,profession:data.profession,city:data.neighborhood?`${data.region} (${data.neighborhood})`:data.region,maritalStatus:data.maritalStatus as any,religion:data.religion||'Sunnite',education:data.education as any,isVerifiedNNI:false,isWaliApproved:hasWaliInfo,isPremium:false,photoUrl:photos[0]||'',photoPrivate:false,bio:data.bio||(data.marriageHorizon?`Horizon mariage : ${data.marriageHorizon}. Priorité : ${data.familyImportance||'Famille'}.`:`Membre inscrit. Priorité : ${data.familyImportance||'Famille'}.`),gender:data.gender,photos,personality:data.personalityTrait,familyImportance:data.familyImportance,presentation:data.partnerCriteria||(data.marriageHorizon?`Horizon mariage : ${data.marriageHorizon}.`:''),height:data.height,weight:data.weight,ethnicity:data.ethnicity,originCity:data.originCity,hijabStatus:data.hijabStatus,religiousPracticeDetails:data.religiousPracticeDetails||data.religiousPractice,values:data.values,partnerCriteria:data.partnerCriteria,dealBreakers:data.dealBreakers};
    const saved=await saveMyProfile(userId,profile,data);if(!saved)return showToast('Impossible d’enregistrer le profil. Vos données n’ont pas été enregistrées.');
    await loadDatabaseState(userId);setCurrentTab('browse');try{localStorage.setItem('nassib_active_tab_v1','browse');}catch{}showToast('Profil enregistré dans la base de données Nassib.');
  };

  const handleUpdateUser = async (updated: Partial<User>) => {
    if(!user.id)return;
    setUser((prev) => ({ ...prev, ...updated }));
    if(updated.photoBlurringActive!==undefined){const privacySaved=await updatePhotoPrivacy(user.id,updated.photoBlurringActive);if(!privacySaved)return showToast('Impossible d’enregistrer cette préférence dans Supabase.');}
    const existing=await getMyProfile(user.id);const baseProfile:Partial<Profile>=existing||{userId:user.id,name:updated.name||user.name||'Membre',gender:updated.gender||user.gender||'female',photoUrl:updated.photoUrl||user.photoUrl||'',age:25,city:'Niamey',maritalStatus:'Célibataire'};
    const saved=await saveMyProfile(user.id,{...baseProfile,name:updated.name||baseProfile.name,gender:updated.gender||baseProfile.gender,photoUrl:updated.photoUrl!==undefined?updated.photoUrl:baseProfile.photoUrl,photos:updated.photos||baseProfile.photos,photoPrivate:updated.photoBlurringActive!==undefined?updated.photoBlurringActive:baseProfile.photoPrivate,isPremium:updated.isPremium!==undefined?updated.isPremium:baseProfile.isPremium},updated.waliInfo?{waliName:updated.waliInfo.name,waliRelation:updated.waliInfo.relation,waliPhone:updated.waliInfo.phone}:undefined);
    if(saved){setCurrentUserProfile(saved);await loadDatabaseState(user.id);}else return showToast('Impossible d’enregistrer les modifications dans Supabase.');
    showToast('Modifications enregistrées.');
  };

  const handleTogglePhotoBlurring = async () => {
    if(!user.id)return;const next=!user.photoBlurringActive;const saved=await updatePhotoPrivacy(user.id,next);if(!saved)return showToast('Impossible d’enregistrer le mode Floutage dans Supabase.');
    const freshProfile=await getMyProfile(user.id);if(!freshProfile)return showToast('Préférence enregistrée mais profil introuvable.');setCurrentUserProfile(freshProfile);const account=getCurrentUserSession();if(account)setUser((prev)=>accountToUser(account,freshProfile,freshProfile.photoPrivate));
    showToast(next?'Mode Floutage activé : vos photos sont désormais protégées.':'Mode Floutage désactivé : vos photos sont désormais visibles.');
  };

  const handleUpdateWaliInfo = async (waliInfo: UserWaliInfo) => { if(!user.id)return;const existing=await getMyProfile(user.id);if(!existing)return;const saved=await saveMyProfile(user.id,{...existing,isWaliApproved:true},{waliName:waliInfo.name,waliRelation:waliInfo.relation,waliPhone:waliInfo.phone});if(saved){setUser((prev)=>({...prev,isWaliApproved:true,waliInfo}));await loadDatabaseState(user.id);showToast('Informations du Wali enregistrées.');} };
  const handleUploadNNI = async () => { if(!user.id)return;const existing=await getMyProfile(user.id);if(!existing)return;const saved=await saveMyProfile(user.id,{...existing,isVerifiedNNI:true});if(saved){setUser((prev)=>({...prev,isVerifiedNNI:true}));await loadDatabaseState(user.id);showToast('Identité vérifiée par carte. Le badge officiel est activé.');} };
  const handleSubmitIdentityVerification = async (params: { documentType: string; documentNumber: string; fullName: string; expiryDate?: string; frontDocumentUrl?: string; backDocumentUrl?: string; autoVerify?: boolean; }): Promise<boolean> => {
    if (!user.id) return false;
    const existing = await getMyProfile(user.id);
    const profileId = existing?.id || user.profileId || user.id;
    const isApproved = Boolean(params.autoVerify);
    const docPathSummary = `${params.documentType.toUpperCase()} - N° ${params.documentNumber} (${params.fullName})`;
    const adminNote = `Document: ${params.documentType}, N°: ${params.documentNumber}, Nom: ${params.fullName}${params.expiryDate ? `, Exp: ${params.expiryDate}` : ''}`;
    
    if (isSupabaseConfigured) {
      await submitVerificationRequestInSupabase({
        profileId,
        userId: user.id,
        verificationType: 'nni',
        documentPath: docPathSummary,
        adminNote,
        status: isApproved ? 'approved' : 'pending',
      });
    }

    if (isApproved) {
      if (existing) {
        await saveMyProfile(user.id, { ...existing, isVerifiedNNI: true });
      }
      setUser((prev) => ({ ...prev, isVerifiedNNI: true }));
      await loadDatabaseState(user.id);
      showToast('Félicitations ! Votre identité est vérifiée par carte. Le badge officiel est maintenant actif.');
    } else {
      await loadDatabaseState(user.id);
      showToast('Votre dossier de vérification d’identité a été transmis avec succès.');
    }
    return true;
  };
  const isHeaderlessTab=['browse','messages','settings','requests','profile-detail','imam'].includes(currentTab);

  return (<div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] flex flex-col font-body">
    {toastMessage&&<div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 bg-[#0F5C4D] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-[#8BAE9F]/40"><span className="material-symbols-outlined text-[#C9A45C]">check_circle</span><span className="font-display text-xs sm:text-sm font-semibold">{toastMessage}</span></div>}
    {currentTab==='auth'?<AuthPage initialMode={authMode} onBack={()=>setCurrentTab('landing')} onSuccess={handleAuthSuccess}/>:currentTab==='onboarding'?<OnboardingPage userName={registeredUserData.name||user.name} userRole={registeredUserData.role||user.role} userPhone={registeredUserData.phone||user.phone} onComplete={handleOnboardingComplete} onCancel={()=>setCurrentTab('dashboard')}/>:currentTab==='landing'?<LandingView onEnterApp={()=>setCurrentTab('dashboard')} onOpenAuth={handleOpenAuth} onNavigateTab={setCurrentTab}/>:<>
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} user={user} onOpenAuth={handleOpenAuth} onLogout={handleLogout} unreadCount={0} pendingRequestsCount={totalPendingRequestsCount}/>
      {!isHeaderlessTab&&<MobileHeader user={user} onSelectTab={setCurrentTab} onToggleMobileMenu={()=>setMobileMenuOpen((v)=>!v)}/>} 
      {mobileMenuOpen&&<div className="md:hidden fixed inset-0 z-50 bg-[#211E1A]/60 backdrop-blur-sm flex justify-end"><div className="w-4/5 max-w-xs bg-[#FAF8F2] h-full p-6 flex flex-col justify-between shadow-2xl"><div><div className="flex justify-between items-center pb-6 border-b border-[#E8E3D7] mb-6"><NasibaLogo size="sm"/><button onClick={()=>setMobileMenuOpen(false)} className="p-1 text-[#7D766C]"><span className="material-symbols-outlined">close</span></button></div><nav className="space-y-1.5">{[['dashboard','Tableau de bord','dashboard'],['browse','Parcourir','search'],['requests','Demandes','mark_email_unread'],['messages','Messages','chat_bubble'],['imam','Imam Oumar IA','auto_awesome'],['verification','Vérification Wali','verified_user'],['settings','Paramètres','settings']].map(([id,label,icon])=><button key={id} onClick={()=>{setCurrentTab(id as TabType);setMobileMenuOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-semibold text-left ${currentTab===id?'bg-[#8BAE9F]/20 text-[#0F5C4D]':'text-[#575147] hover:bg-[#8BAE9F]/10'}`}><span className="material-symbols-outlined text-lg">{icon}</span><span className="flex-1">{label}</span>{id==='requests'&&totalPendingRequestsCount>0&&<span className="bg-[#0F5C4D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{totalPendingRequestsCount}</span>}</button>)}</nav></div><button onClick={handleLogout} className="w-full border border-[#E8E3D7] bg-white text-[#575147] font-display font-semibold py-2.5 rounded-xl text-xs">Se déconnecter</button></div></div>}
      {(()=>{const isMessagingProfileOpen=currentTab==='messages'&&Boolean(activeConvId);const isProfileDetailOpen=currentTab==='profile-detail'||Boolean(selectedProfile);const isImamTab=currentTab==='imam';const shouldHideTabBar=isMessagingProfileOpen||isProfileDetailOpen||isImamTab||currentTab==='auth'||currentTab==='onboarding';return <><main className={`flex-1 md:ml-64 px-3 sm:px-8 ${isMessagingProfileOpen||isImamTab?'pb-1 md:pb-3':'pb-28 md:pb-12'} min-h-screen ${isHeaderlessTab?'pt-[max(0.5rem,env(safe-area-inset-top))] md:pt-4':'pt-16 md:pt-10'}`}>
        {currentTab==='dashboard'&&<DashboardView user={user} recommendedProfiles={profiles.filter((p)=>hasUploadedPhotos(p)&&p.userId!==user.id&&p.gender!==user.gender)} favoriteProfiles={favoriteProfiles} favoriteProfileIds={favoriteProfileIds} fansCount={userFansCount} onSelectProfile={(p)=>{void handleSelectProfile(p,'dashboard')}} onNavigateToTab={setCurrentTab} onTogglePhotoBlurring={handleTogglePhotoBlurring} onToggleFavorite={handleToggleFavorite} approvedPhotoIds={effectiveApprovedPhotoIds} photoAccessMap={photoAccessMap} hasUploadedPhoto={hasCurrentUserUploadedPhoto} onRequestPhotoUpload={()=>setShowPhotoRequiredModal(true)} onActivateBoost={handleActivateBoost} onUpgradeToPremium={()=>setCurrentTab('settings')}/>} 
        {currentTab==='browse'&&<BrowseView user={user} profiles={profiles} onSelectProfile={(p)=>{void handleSelectProfile(p,'browse')}} onRequestAccess={handleRequestPhotoAccess} favoriteProfileIds={favoriteProfileIds} onToggleFavorite={handleToggleFavorite} approvedPhotoIds={effectiveApprovedPhotoIds} photoAccessMap={photoAccessMap} contactRelationshipMap={contactRelationshipMap} onSendContactRequest={handleOpenContactModal} hasUploadedPhoto={hasCurrentUserUploadedPhoto} onRequestPhotoUpload={()=>setShowPhotoRequiredModal(true)}/>} 
        {currentTab==='profile-detail'&&selectedProfile&&<ProfileDetailView profile={selectedProfile} currentUser={user} onBack={()=>{setCurrentTab(returnTab);setSelectedProfile(null)}} onStartMessage={handleStartMessageWithProfile} onSendContactRequest={handleOpenContactModal} onRequestPhotoAccess={handleRequestPhotoAccess} contactState={contactRelationshipMap[selectedProfile.id]||'NO_REQUEST'} photoAccessState={photoAccessMap[selectedProfile.id]||'NO_REQUEST'} conversationId={conversations.find((c)=>c.candidateId===selectedProfile.id||c.requesterId===selectedProfile.id)?.id} onAcceptContactRequest={async(id)=>{await handleRespondContact(id,'accepted')}} onRejectContactRequest={async(id)=>{await handleRespondContact(id,'rejected')}} onOpenConversation={(id)=>{setActiveConvId(id);setSelectedProfile(null);setCurrentTab('messages')}} isFavorited={favoriteProfileIds.includes(selectedProfile.id)} onToggleFavorite={handleToggleFavorite} onReport={handleReportProfile} onBlock={handleBlockProfile} onAcceptContact={async(pid)=>{const c=conversations.find((x)=>(x.candidateId===pid||x.requesterId===pid)&&x.status==='pending');if(c)await handleRespondContact(c.id,'accepted')}} onRejectContact={async(pid)=>{const c=conversations.find((x)=>(x.candidateId===pid||x.requesterId===pid)&&x.status==='pending');if(c)await handleRespondContact(c.id,'rejected')}} hasUploadedPhoto={hasCurrentUserUploadedPhoto} onRequestPhotoUpload={()=>setShowPhotoRequiredModal(true)}/>}
        {currentTab==='requests'&&<RequestsView user={user} conversations={conversations} contactRequests={pendingContactRequests} sentContactRequests={sentPendingContactRequests} receivedPhotoRequests={receivedPhotoRequests} sentPhotoRequests={sentPhotoRequests} profiles={profiles} onAcceptContact={(id)=>handleRespondContact(id,'accepted')} onRejectContact={(id)=>handleRespondContact(id,'rejected')} onAcceptPhotoRequest={(id)=>handleRespondPhotoRequest(id,'approved')} onRejectPhotoRequest={(id)=>handleRespondPhotoRequest(id,'rejected')} onViewProfile={(pid)=>{const found=profiles.find((p)=>p.id===pid);if(found)void handleSelectProfile(found,'requests')}} onOpenConversation={(id)=>{setActiveConvId(id);setCurrentTab('messages')}} hasUploadedPhoto={hasCurrentUserUploadedPhoto} onRequestPhotoUpload={()=>setShowPhotoRequiredModal(true)}/>}
        {currentTab==='imam'&&<ImamChatView user={user} onBack={()=>setCurrentTab(previousNonImamTabRef.current||'dashboard')}/>} 
        {currentTab==='messages'&&<MessagesView user={user} conversations={conversations} activeMessages={messages} activeConvId={activeConvId} onSelectConversation={setActiveConvId} onSendMessage={handleSendMessage} onAcceptContact={(id)=>handleRespondContact(id,'accepted')} onRejectContact={(id)=>handleRespondContact(id,'rejected')} onOpenProfile={(pid)=>{const found=profiles.find((p)=>p.id===pid);if(found)void handleSelectProfile(found,'messages');else getProfileById(pid).then((p)=>{if(p)void handleSelectProfile(p,'messages')})}} hasUploadedPhoto={hasCurrentUserUploadedPhoto} onRequestPhotoUpload={()=>setShowPhotoRequiredModal(true)} onUpgradeToPremium={()=>setCurrentTab('settings')}/>}
        {currentTab==='verification'&&<VerificationView user={user} onUpdateWaliInfo={handleUpdateWaliInfo} onUploadNNI={handleUploadNNI} onSubmitVerification={handleSubmitIdentityVerification}/>} 
        {currentTab==='settings'&&<SettingsView user={user} profile={currentUserProfile} onUpdateUser={handleUpdateUser} onUpdateProfile={async(updatedProfile)=>{if(!user.id)return;const existing=await getMyProfile(user.id);const baseProfile=existing||{userId:user.id,name:user.name||'Membre',gender:user.gender||'female',photoUrl:user.photoUrl||'',age:25,city:'Niamey',maritalStatus:'Célibataire'};const saved=await saveMyProfile(user.id,{...baseProfile,...updatedProfile});if(saved){setCurrentUserProfile(saved);await loadDatabaseState(user.id);showToast('Profil mis à jour avec succès.')}else showToast('Impossible de mettre à jour le profil dans Supabase.')}} onNavigateTab={setCurrentTab} onLogout={handleLogout}/>} 
      </main>{!shouldHideTabBar&&<MobileBottomNav currentTab={currentTab} onSelectTab={setCurrentTab} unreadCount={0} pendingRequestsCount={totalPendingRequestsCount}/>}</>})()}
    </>}
    {selectedProfile&&currentTab!=='profile-detail'&&<ProfileDetailModal profile={selectedProfile} currentUser={user} onClose={()=>setSelectedProfile(null)} onStartMessage={handleStartMessageWithProfile} onRequestPhotoAccess={handleRequestPhotoAccess} photoAccessState={photoAccessMap[selectedProfile.id]||(effectiveApprovedPhotoIds.includes(selectedProfile.id)?'ALLOWED':'NO_REQUEST')} isFavorited={favoriteProfileIds.includes(selectedProfile.id)} onToggleFavorite={handleToggleFavorite} onReport={handleReportProfile} onBlock={handleBlockProfile} hasUploadedPhoto={hasCurrentUserUploadedPhoto} onRequestPhotoUpload={()=>setShowPhotoRequiredModal(true)}/>} 
    {contactModalProfile&&<ContactRequestModal targetProfile={contactModalProfile} isOpen={Boolean(contactModalProfile)} onClose={()=>setContactModalProfile(null)} onSend={handleConfirmSendContactRequest}/>} 
    <PhotoRequiredModal isOpen={showPhotoRequiredModal} onClose={()=>setShowPhotoRequiredModal(false)} onGoToUpload={()=>{setShowPhotoRequiredModal(false);setCurrentTab('settings');}}/>
    {user.id && currentTab !== 'landing' && currentTab !== 'auth' && currentTab !== 'onboarding' && currentTab !== 'settings' && currentTab !== 'imam' && (
      <ProfileInvisibilityNotice
        hasUploadedPhoto={hasCurrentUserUploadedPhoto}
        onGoToUpload={() => setCurrentTab('settings')}
      />
    )}
    <PaywallUpgradeModal
      isOpen={showPaywallModal}
      onClose={() => setShowPaywallModal(false)}
      onUpgrade={() => {
        setShowPaywallModal(false);
        setCurrentTab('settings');
      }}
      featureTitle={paywallConfig.title}
      featureDescription={paywallConfig.description}
      featureIcon={paywallConfig.icon}
    />
    <PwaInstallPrompt />
  </div>);
}
