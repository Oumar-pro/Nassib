import React, { useState, useEffect, useCallback } from 'react';
import { TabType, Profile, Conversation, Message, User, UserWaliInfo } from './types';
import {
  INITIAL_USER,
  MOCK_PROFILES,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES_CONV1
} from './data/mockData';
import {
  isSupabaseConfigured,
  fetchProfilesFromSupabase,
  createProfileInSupabase,
  fetchConversationsFromSupabase,
  fetchMessagesFromSupabase,
  sendMessageToSupabase,
  fetchUserFavoritesFromSupabase,
  toggleFavoriteInSupabase,
  createOrGetConversationInSupabase,
  reportUserOrProfileInSupabase,
  blockUserInSupabase,
} from './lib/supabase';
import {
  getCurrentUserSession,
  logoutUserSession,
  AuthAccount,
  updateAccountPlanAndStatus,
  refreshCurrentSessionFromDB,
} from './lib/auth';

import { Sidebar } from './components/Navigation/Sidebar';
import { MobileHeader } from './components/Navigation/MobileHeader';
import { NasibaLogo } from './components/NasibaLogo';

import { DashboardView } from './components/Dashboard/DashboardView';
import { BrowseView } from './components/Browse/BrowseView';
import { MessagesView } from './components/Messages/MessagesView';
import { VerificationView } from './components/Verification/VerificationView';
import { SettingsView } from './components/Settings/SettingsView';
import { LandingView } from './components/Landing/LandingView';
import { ImamChatView } from './components/ImamOumar/ImamChatView';

import { ProfileDetailModal } from './components/Profile/ProfileDetailModal';
import { AuthPage } from './components/Auth/AuthPage';
import { OnboardingPage } from './components/Auth/OnboardingPage';
import { OnboardingData } from './components/Auth/OnboardingModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('landing');
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES_CONV1);
  const [activeConvId, setActiveConvId] = useState<string | null>('conv_1');

  // Centralized user synchronization with session and database
  const syncUserWithSession = useCallback(async () => {
    const activeSession = getCurrentUserSession();

    if (activeSession) {
      setUser((prev) => ({
        ...prev,
        id: activeSession.id,
        name: activeSession.name,
        role: activeSession.role,
        email: activeSession.email,
        phone: activeSession.phone || prev.phone,
        isPremium: true,
        planName: activeSession.planName || 'Accès Gratuit & Illimité',
        isVerifiedNNI: Boolean(activeSession.isVerifiedNNI),
        isWaliApproved: Boolean(activeSession.isWaliApproved),
      }));

      // Pull fresh data from database if connected
      const refreshed = await refreshCurrentSessionFromDB();
      if (refreshed) {
        setUser((prev) => ({
          ...prev,
          isPremium: true,
          planName: refreshed.planName || 'Accès Gratuit & Illimité',
          isVerifiedNNI: Boolean(refreshed.isVerifiedNNI),
          isWaliApproved: Boolean(refreshed.isWaliApproved),
        }));
      }
    }
  }, []);

  // Restore user session on load and listen for real-time status changes
  useEffect(() => {
    syncUserWithSession();

    const handleStatusSync = () => {
      syncUserWithSession();
    };

    window.addEventListener('nasiba_status_changed', handleStatusSync);
    window.addEventListener('zawaj_status_changed', handleStatusSync);
    window.addEventListener('storage', handleStatusSync);

    return () => {
      window.removeEventListener('nasiba_status_changed', handleStatusSync);
      window.removeEventListener('zawaj_status_changed', handleStatusSync);
      window.removeEventListener('storage', handleStatusSync);
    };
  }, [syncUserWithSession]);

  // Load profiles and data from Supabase if configured
  useEffect(() => {
    async function loadSupabaseData() {
      if (isSupabaseConfigured) {
        const fetchedProfiles = await fetchProfilesFromSupabase();
        if (fetchedProfiles.length > 0) {
          setProfiles(fetchedProfiles);
        }
        const fetchedConvs = await fetchConversationsFromSupabase();
        if (fetchedConvs.length > 0) {
          setConversations(fetchedConvs);
        }
      }
    }
    loadSupabaseData();
  }, []);

  // Modals & Navigation
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [registeredUserData, setRegisteredUserData] = useState<{
    name: string;
    role: 'candidate' | 'wali';
    phone: string;
  }>({ name: '', role: 'candidate', phone: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setCurrentTab('auth');
  };

  // Favorites state persisted in localStorage and synced with Supabase per active user account
  const [favoriteProfileIds, setFavoriteProfileIds] = useState<string[]>([]);

  // Sync favorites whenever active user session changes
  useEffect(() => {
    if (!user || !user.id) {
      setFavoriteProfileIds([]);
      return;
    }
    const storageKey = `nasiba_favorites_${user.id}`;
    const legacyKey = `zawaj_favorites_${user.id}`;
    let localSaved: string[] = [];
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
      if (saved) {
        localSaved = JSON.parse(saved);
      }
    } catch (e) {}

    setFavoriteProfileIds(localSaved);

    if (isSupabaseConfigured) {
      fetchUserFavoritesFromSupabase(user.id).then((sbFavorites) => {
        if (sbFavorites && sbFavorites.length > 0) {
          const merged = Array.from(new Set([...localSaved, ...sbFavorites]));
          setFavoriteProfileIds(merged);
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch (e) {}
        }
      });
    }
  }, [user.id]);

  const handleToggleFavorite = (profileId: string) => {
    if (!user || !user.id) {
      showToast('Veuillez vous connecter pour enregistrer vos favoris.');
      return;
    }
    const exists = favoriteProfileIds.includes(profileId);
    const updated = exists
      ? favoriteProfileIds.filter((id) => id !== profileId)
      : [...favoriteProfileIds, profileId];

    setFavoriteProfileIds(updated);

    const storageKey = `nasiba_favorites_${user.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save favorites to localStorage:', e);
    }

    const prof = profiles.find((p) => p.id === profileId);
    const name = prof ? prof.name : 'Profil';
    showToast(exists ? `${name} retiré(e) de vos favoris.` : `❤️ ${name} ajouté(e) à vos favoris !`);

    // Sync with Supabase user_favorites table
    if (isSupabaseConfigured) {
      toggleFavoriteInSupabase(user.id, profileId).catch((err) => {
        console.warn('Could not sync favorite to Supabase:', err);
      });
    }
  };

  const favoriteProfiles = profiles.filter((p) => favoriteProfileIds.includes(p.id));

  // Compute fans count for the logged-in user (favoris reçus)
  const currentUserProfile = profiles.find(
    (p) => p.id === user.id || p.name.trim().toLowerCase() === user.name.trim().toLowerCase()
  );
  const userFansCount = currentUserProfile?.likesCount ?? user.stats?.favoritesCount ?? (user.role === 'wali' ? 31 : 24);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // State handlers
  const handleTogglePhotoBlurring = () => {
    setUser((prev) => {
      const nextState = !prev.photoBlurringActive;
      showToast(
        nextState
          ? 'Floutage des photos ACTIVÉ (Protection renforcée)'
          : 'Floutage des photos DÉSACTIVÉ (Photos publiques)'
      );
      return { ...prev, photoBlurringActive: nextState };
    });
  };

  const handleUpdateWaliInfo = (newWaliInfo: UserWaliInfo) => {
    setUser((prev) => ({
      ...prev,
      isWaliApproved: true,
      waliInfo: newWaliInfo
    }));
    showToast('Coordonnées du Wali enregistrées et vérifiées avec succès !');
  };

  const handleUploadNNI = () => {
    setUser((prev) => ({ ...prev, isVerifiedNNI: true }));
    showToast('Document NNI téléversé ! Votre profil bénéficie du badge vérifié.');
  };

  const handleSendMessage = async (text: string, targetConvId?: string) => {
    const convId = targetConvId || activeConvId || 'conv_1';
    const targetConv = conversations.find((c) => c.id === convId);
    const recipientName = targetConv ? targetConv.participantName : 'Correspondant';

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: convId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.photoUrl,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      isSupervised: true,
      status: 'sent'
    };

    setMessages((prev) => [...prev, newMsg]);

    if (isSupabaseConfigured && convId && !convId.startsWith('conv_init_')) {
      await sendMessageToSupabase(convId, user.id, user.name, user.photoUrl, text);
    }

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: 'À l\'instant'
            }
          : c
      )
    );

    // Simulated reply after 1.5 seconds if local/mock conversation
    if (!isSupabaseConfigured || convId.startsWith('conv_init_')) {
      setTimeout(() => {
        const replyMsg: Message = {
          id: `msg_reply_${Date.now()}`,
          conversationId: convId,
          senderId: `sender_${convId}`,
          senderName: recipientName,
          senderAvatar: targetConv?.participantAvatar || '',
          text: 'Wa alaikum salam. Merci pour ces précisions respectueuses. Mon Wali est également informé et se réjouit de l\'évolution de nos échanges.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: false,
          isSupervised: true,
          status: 'read'
        };

        setMessages((prev) => [...prev, replyMsg]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: replyMsg.text,
                  lastMessageTime: replyMsg.timestamp,
                  unreadCount: 0
                }
              : c
          )
        );
      }, 1500);
    }
  };

  const handleStartMessageWithProfile = async (profile: Profile) => {
    let targetConv = conversations.find(
      (c) => c.participantName === profile.name || c.id === `conv_${profile.id}`
    );

    let targetConvId = targetConv?.id;

    if (isSupabaseConfigured && user.id && profile.id) {
      const dbConvId = await createOrGetConversationInSupabase(user.id, profile.id);
      if (dbConvId) {
        targetConvId = dbConvId;
        const convMapped: Conversation = {
          id: dbConvId,
          participantId: profile.id,
          participantName: profile.name,
          participantAvatar: profile.photoUrl || '',
          participantCity: profile.city || 'Niamey',
          isSupervised: true,
          isVerifiedNNI: profile.isVerifiedNNI,
          lastMessage: 'Discussion ouverte',
          lastMessageTime: 'À l\'instant',
          unreadCount: 0,
          onlineStatus: true,
        };
        setConversations((prev) => {
          if (prev.some((c) => c.id === convMapped.id)) return prev;
          return [convMapped, ...prev];
        });
        const remoteMsgs = await fetchMessagesFromSupabase(dbConvId);
        if (remoteMsgs && remoteMsgs.length > 0) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.conversationId !== dbConvId);
            return [...filtered, ...remoteMsgs.map((m) => ({
              ...m,
              isMine: m.senderId === user.id
            }))];
          });
        }
      }
    }

    if (!targetConvId) {
      targetConvId = `conv_${profile.id}`;
      targetConv = {
        id: targetConvId,
        participantId: profile.id,
        participantName: profile.name,
        participantAvatar: profile.photoUrl || '',
        participantCity: profile.city || 'Niamey',
        isSupervised: true,
        isVerifiedNNI: profile.isVerifiedNNI,
        lastMessage: 'Discussion ouverte',
        lastMessageTime: 'À l\'instant',
        unreadCount: 0,
        onlineStatus: true
      };
      setConversations((prev) => [targetConv!, ...prev]);

      // Add initial greeting message
      const initMsg: Message = {
        id: `msg_init_${Date.now()}`,
        conversationId: targetConvId,
        senderId: profile.id,
        senderName: profile.name,
        senderAvatar: targetConv.participantAvatar,
        text: `Assalamu alaikum ! Je suis ravi(e) de faire votre connaissance. Mon tuteur légal (Wali) assiste également à notre échange.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: false,
        isSupervised: true,
        status: 'read'
      };
      setMessages((prev) => [...prev, initMsg]);
    }

    setActiveConvId(targetConvId);
    setSelectedProfile(null);
    setCurrentTab('messages');
    showToast(`Discussion surveillée engagée avec ${profile.name}.`);
  };

  const handleReportProfile = async (targetProfile: Profile, reason: string, description?: string) => {
    if (isSupabaseConfigured && user.id) {
      await reportUserOrProfileInSupabase({
        reporterUserId: user.id,
        reportedProfileId: targetProfile.id,
        reason,
        description,
      });
    }
    showToast(`Signalement enregistré pour le profil de ${targetProfile.name}. Merci.`);
  };

  const handleBlockProfile = async (targetProfile: Profile, reason?: string) => {
    if (isSupabaseConfigured && user.id) {
      await blockUserInSupabase(user.id, targetProfile.id, reason);
    }
    setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));
    showToast(`${targetProfile.name} a été bloqué(e).`);
  };

  const handleRequestPhotoAccess = (profile: Profile) => {
    showToast(`Demande d'accès à la photo envoyée avec succès à ${profile.name}.`);
  };

  const handleAuthSuccess = (userAcc: AuthAccount, isRegister: boolean) => {
    setUser((prev) => ({
      ...prev,
      id: userAcc.id,
      name: userAcc.name,
      role: userAcc.role,
      email: userAcc.email,
      phone: userAcc.phone || prev.phone,
      isPremium: Boolean(userAcc.isPremium),
      planName: userAcc.planName || (userAcc.isPremium ? 'Baraka (Premium)' : 'Sadaq (Gratuit)'),
      isVerifiedNNI: Boolean(userAcc.isVerifiedNNI),
      isWaliApproved: Boolean(userAcc.isWaliApproved),
    }));
    if (isRegister) {
      // Trigger dedicated Onboarding PAGE directly after registration
      setRegisteredUserData({ name: userAcc.name, role: userAcc.role, phone: userAcc.phone });
      setCurrentTab('onboarding');
      showToast(`Compte créé ! Veuillez maintenant compléter votre profil.`);
    } else {
      // Direct login bypasses onboarding
      setCurrentTab('dashboard');
      showToast(`Ravi de vous revoir sur NASSIB, ${userAcc.name} !`);
    }
  };

  const handleLogout = () => {
    logoutUserSession();
    setUser(INITIAL_USER);
    setMobileMenuOpen(false);
    setCurrentTab('landing');
    showToast('Vous avez été déconnecté avec succès.');
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    const userPhotos = data.photos || [];
    const mainPhoto = userPhotos.length > 0 ? userPhotos[0] : '';

    const hasWaliInfo = !!(data.waliName?.trim() && data.waliPhone?.trim());

    const newProfileData: Partial<Profile> = {
      name: registeredUserData.name || user.name || 'Nouveau Membre',
      age: data.age || 25,
      profession: data.profession || 'Salarié(e) Secteur Privé',
      city: (data.region as any) || 'Niamey',
      maritalStatus: (data.maritalStatus as any) || 'Célibataire (Jamais marié/e)',
      religion: data.religion || 'Musulman(e) Sunnite',
      education: (data.education as any) || 'Licence / Bac+3',
      matchPercentage: 90,
      isVerifiedNNI: false,
      isWaliApproved: hasWaliInfo,
      isPremium: false,
      photoUrl: mainPhoto,
      photoPrivate: false,
      bio: `Membre inscrit (${data.gender === 'male' ? 'Homme' : 'Femme'}). ${data.polygamyPreference ? `Position : ${data.polygamyPreference}. ` : ''}Priorité : ${data.familyImportance || 'Famille'}.`,
      waliReference: hasWaliInfo ? `${data.waliRelation} (${data.waliName})` : 'Non renseigné',
      gender: data.gender || 'female',
      photos: userPhotos,
    };

    let createdProf: Profile | null = null;
    if (isSupabaseConfigured) {
      createdProf = await createProfileInSupabase(newProfileData, user.id);
    }

    const finalProf: Profile = createdProf || {
      id: `prof_${Date.now()}`,
      name: newProfileData.name!,
      age: newProfileData.age!,
      profession: newProfileData.profession!,
      city: newProfileData.city!,
      maritalStatus: newProfileData.maritalStatus!,
      religion: newProfileData.religion!,
      education: newProfileData.education!,
      matchPercentage: 90,
      isVerifiedNNI: false,
      isWaliApproved: hasWaliInfo,
      isPremium: false,
      photoUrl: mainPhoto,
      photoPrivate: false,
      bio: newProfileData.bio!,
      waliReference: newProfileData.waliReference!,
      gender: newProfileData.gender!,
      photos: userPhotos,
      viewsCount: 0,
      likesCount: 0
    };

    // Strict deduplication: check if profile already exists in state before adding
    setProfiles((prev) => {
      const existsIndex = prev.findIndex(
        (p) => p.id === finalProf.id || p.name.trim().toLowerCase() === finalProf.name.trim().toLowerCase()
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = finalProf;
        return updated;
      }
      return [finalProf, ...prev];
    });

    setUser((prev) => ({
      ...prev,
      id: finalProf.id,
      name: finalProf.name,
      gender: finalProf.gender,
      photoUrl: mainPhoto,
      photos: userPhotos,
      isVerifiedNNI: false,
      isWaliApproved: hasWaliInfo,
      waliInfo: hasWaliInfo
        ? {
            name: data.waliName,
            relation: data.waliRelation,
            phone: data.waliPhone
          }
        : { name: '', relation: '', phone: '' }
    }));

    setCurrentTab('dashboard');
    if (userPhotos.length > 0) {
      showToast(`Profil enregistré avec ${userPhotos.length} photo(s) ! Bienvenue, ${registeredUserData.name || user.name} !`);
    } else {
      showToast(`Profil créé ! Note : Vous devez ajouter au moins 1 photo dans vos paramètres pour rendre votre profil visible.`);
    }
  };

  const handleUpdateUser = (updated: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updated }));

    // Also sync the user's profile card in the profiles list
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === user.id || p.name.trim().toLowerCase() === user.name.trim().toLowerCase()) {
          return {
            ...p,
            name: updated.name !== undefined ? updated.name : p.name,
            photoUrl: updated.photoUrl !== undefined ? updated.photoUrl : p.photoUrl,
            photos: updated.photos !== undefined ? updated.photos : p.photos,
            photoPrivate: updated.photoBlurringActive !== undefined ? updated.photoBlurringActive : p.photoPrivate,
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] flex flex-col font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 bg-[#0F5C4D] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-[#8BAE9F]/40">
          <span className="material-symbols-outlined text-[#C9A45C]">check_circle</span>
          <span className="font-display text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Dedicated Auth Page */}
      {currentTab === 'auth' ? (
        <AuthPage
          initialMode={authMode}
          onBack={() => setCurrentTab('landing')}
          onSuccess={handleAuthSuccess}
        />
      ) : currentTab === 'onboarding' ? (
        <OnboardingPage
          userName={registeredUserData.name || user.name}
          userRole={registeredUserData.role || user.role}
          userPhone={registeredUserData.phone || user.phone}
          onComplete={handleOnboardingComplete}
          onCancel={() => setCurrentTab('dashboard')}
        />
      ) : currentTab === 'landing' ? (
        <LandingView
          onEnterApp={() => setCurrentTab('dashboard')}
          onOpenAuth={handleOpenAuth}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />
      ) : (
        <>
          {/* Desktop Navigation Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            user={user}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            unreadCount={1}
          />

          {/* Mobile Navigation Header */}
          <MobileHeader
            user={user}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Mobile Overlay Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-[#211E1A]/60 backdrop-blur-sm flex justify-end">
              <div className="w-4/5 max-w-xs bg-[#FAF8F2] h-full p-6 flex flex-col justify-between shadow-2xl animate-fadeIn border-l border-[#E8E3D7]">
                <div>
                  <div className="flex justify-between items-center pb-6 border-b border-[#E8E3D7] mb-6">
                    <NasibaLogo size="sm" />
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 text-[#7D766C] hover:text-[#0F5C4D]"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <nav className="space-y-1.5">
                    {[
                      { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
                      { id: 'browse', label: 'Parcourir', icon: 'search' },
                      { id: 'imam', label: 'Imam Oumar IA', icon: 'auto_awesome' },
                      { id: 'messages', label: 'Messages', icon: 'chat_bubble' },
                      { id: 'verification', label: 'Vérification Wali', icon: 'verified_user' },
                      { id: 'settings', label: 'Paramètres', icon: 'settings' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setCurrentTab(m.id as TabType);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-semibold transition-colors text-left ${
                          currentTab === m.id
                            ? 'bg-[#8BAE9F]/20 text-[#0F5C4D] font-bold'
                            : 'text-[#575147] hover:bg-[#8BAE9F]/10'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="pt-6 border-t border-[#E8E3D7] space-y-2">
                  {user.email || user.id ? (
                    <button
                      onClick={handleLogout}
                      className="w-full bg-white hover:bg-[#FAF8F2] text-[#575147] hover:text-[#211E1A] border border-[#E8E3D7] font-display font-semibold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-base text-[#7D766C]">logout</span>
                      Se déconnecter
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleOpenAuth('login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] font-display font-semibold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">login</span>
                      Connexion / Inscription
                    </button>
                  )}
                  <div className="w-full bg-[#8BAE9F]/15 border border-[#8BAE9F]/30 text-[#0F5C4D] font-display font-semibold py-2.5 px-3 rounded-xl text-xs text-center flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]"></span>
                    <span>Plateforme 100% Gratuite</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main App Content View Wrapper */}
          <main className="flex-1 md:ml-64 pt-20 md:pt-10 px-4 sm:px-8 pb-12 min-h-screen">
            {currentTab === 'dashboard' && (
              <DashboardView
                user={user}
                recommendedProfiles={profiles.filter((p) => {
                  const hasPhoto = Boolean(
                    (p.photoUrl && p.photoUrl.trim() !== '') ||
                    (p.photos && p.photos.some((ph) => Boolean(ph) && ph.trim() !== ''))
                  );
                  if (!hasPhoto) return false;
                  if (user.gender === 'male' && p.gender !== 'female') return false;
                  if (user.gender === 'female' && p.gender !== 'male') return false;
                  return true;
                })}
                favoriteProfiles={favoriteProfiles}
                favoriteProfileIds={favoriteProfileIds}
                fansCount={userFansCount}
                onSelectProfile={(p) => setSelectedProfile(p)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onTogglePhotoBlurring={handleTogglePhotoBlurring}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {currentTab === 'browse' && (
              <BrowseView
                user={user}
                profiles={profiles}
                onSelectProfile={(p) => setSelectedProfile(p)}
                onRequestAccess={handleRequestPhotoAccess}
                favoriteProfileIds={favoriteProfileIds}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {currentTab === 'imam' && (
              <ImamChatView user={user} />
            )}

            {currentTab === 'messages' && (
              <MessagesView
                user={user}
                conversations={conversations}
                activeMessages={messages}
                activeConvId={activeConvId}
                onSelectConversation={(id) => setActiveConvId(id)}
                onSendMessage={handleSendMessage}
              />
            )}

            {currentTab === 'verification' && (
              <VerificationView
                user={user}
                onUpdateWaliInfo={handleUpdateWaliInfo}
                onUploadNNI={handleUploadNNI}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                user={user}
                onUpdateUser={handleUpdateUser}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onLogout={handleLogout}
              />
            )}
          </main>
        </>
      )}

      {/* Global Modals */}
      <ProfileDetailModal
        profile={selectedProfile}
        currentUser={user}
        onClose={() => setSelectedProfile(null)}
        onStartMessage={handleStartMessageWithProfile}
        onRequestPhotoAccess={handleRequestPhotoAccess}
        isFavorited={selectedProfile ? favoriteProfileIds.includes(selectedProfile.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onReport={handleReportProfile}
        onBlock={handleBlockProfile}
      />
    </div>
  );
}
