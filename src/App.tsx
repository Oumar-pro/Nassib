import React, { useState, useEffect, useCallback } from 'react';
import { TabType, Profile, Conversation, PricingPlan, Message, User, UserWaliInfo } from './types';
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
  toggleFavoriteInSupabase
} from './lib/supabase';
import {
  getCurrentUserSession,
  logoutUserSession,
  AuthAccount,
  isAdministratorUser,
  updateAccountPlanAndStatus,
  refreshCurrentSessionFromDB,
} from './lib/auth';

import { Sidebar } from './components/Navigation/Sidebar';
import { MobileHeader } from './components/Navigation/MobileHeader';
import { ZawajLogo } from './components/ZawajLogo';

import { DashboardView } from './components/Dashboard/DashboardView';
import { BrowseView } from './components/Browse/BrowseView';
import { MessagesView } from './components/Messages/MessagesView';
import { PlansView } from './components/Plans/PlansView';
import { VerificationView } from './components/Verification/VerificationView';
import { SettingsView } from './components/Settings/SettingsView';
import { LandingView } from './components/Landing/LandingView';
import { ImamChatView } from './components/ImamOumar/ImamChatView';
import { AdminDashboard } from './components/Admin/AdminDashboard';

import { ProfileDetailModal } from './components/Profile/ProfileDetailModal';
import { PaymentModal } from './components/Payment/PaymentModal';
import { AuthModal } from './components/Auth/AuthModal';
import { OnboardingModal, OnboardingData } from './components/Auth/OnboardingModal';

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
        isPremium: Boolean(activeSession.isPremium),
        planName: activeSession.planName || (activeSession.isPremium ? 'Baraka (Premium)' : 'Sadaq (Gratuit)'),
        isVerifiedNNI: Boolean(activeSession.isVerifiedNNI),
        isWaliApproved: Boolean(activeSession.isWaliApproved),
      }));

      // Pull fresh data from database if connected
      const refreshed = await refreshCurrentSessionFromDB();
      if (refreshed) {
        setUser((prev) => ({
          ...prev,
          isPremium: Boolean(refreshed.isPremium),
          planName: refreshed.planName || (refreshed.isPremium ? 'Baraka (Premium)' : 'Sadaq (Gratuit)'),
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

    window.addEventListener('zawaj_status_changed', handleStatusSync);
    window.addEventListener('storage', handleStatusSync);

    return () => {
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

  // Modals & Sliders
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedPlanPayment, setSelectedPlanPayment] = useState<PricingPlan | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [registeredUserData, setRegisteredUserData] = useState<{
    name: string;
    role: 'candidate' | 'wali';
    phone: string;
  }>({ name: '', role: 'candidate', phone: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites state persisted in localStorage and synced with Supabase per active user account
  const [favoriteProfileIds, setFavoriteProfileIds] = useState<string[]>([]);

  // Sync favorites whenever active user session changes
  useEffect(() => {
    if (!user || !user.id) {
      setFavoriteProfileIds([]);
      return;
    }
    const storageKey = `zawaj_favorites_${user.id}`;
    let localSaved: string[] = [];
    try {
      const saved = localStorage.getItem(storageKey);
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

    const storageKey = `zawaj_favorites_${user.id}`;
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

  const handleSendMessage = (text: string, targetConvId?: string) => {
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

    // Simulated reply after 1.5 seconds
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
  };

  const handleConfirmPlanPayment = (planName: string) => {
    setUser((prev) => ({
      ...prev,
      isPremium: true,
      planName
    }));
    updateAccountPlanAndStatus(user.id, { isPremium: true, planName });
    setSelectedPlanPayment(null);
    showToast(`Félicitations ! Vous êtes désormais abonné(e) à la formule ${planName}.`);
  };

  const handleStartMessageWithProfile = (profile: Profile) => {
    let targetConv = conversations.find(
      (c) => c.participantName === profile.name || c.id === `conv_${profile.id}`
    );

    let targetConvId = targetConv?.id;

    if (!targetConv) {
      targetConvId = `conv_${profile.id}`;
      targetConv = {
        id: targetConvId,
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

    setActiveConvId(targetConvId!);
    setSelectedProfile(null);
    setCurrentTab('messages');
    showToast(`Discussion surveillée engagée avec ${profile.name}.`);
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
    setAuthModalOpen(false);

    if (isRegister) {
      // Trigger Onboarding ONLY after registration
      setRegisteredUserData({ name: userAcc.name, role: userAcc.role, phone: userAcc.phone });
      setOnboardingOpen(true);
    } else {
      // Direct login bypasses onboarding
      setCurrentTab('dashboard');
      showToast(`Ravi de vous revoir sur Zawaj, ${userAcc.name} !`);
    }
  };

  const handleAdminUpdateProfile = (profileId: string, updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId || p.userId === profileId ? { ...p, ...updates } : p))
    );

    // If the updated profile matches the active user session, apply immediately
    setUser((prev) => {
      const isMatch =
        prev.id === profileId ||
        (updates.userEmail && prev.email?.toLowerCase() === updates.userEmail.toLowerCase()) ||
        (updates.name && prev.name?.toLowerCase() === updates.name.toLowerCase());

      if (isMatch) {
        const isPrem = updates.isPremium !== undefined ? updates.isPremium : prev.isPremium;
        return {
          ...prev,
          isPremium: isPrem,
          planName: updates.isPremium !== undefined
            ? (isPrem ? 'Baraka (Premium)' : 'Sadaq (Gratuit)')
            : prev.planName,
          isVerifiedNNI: updates.isVerifiedNNI !== undefined ? updates.isVerifiedNNI : prev.isVerifiedNNI,
          isWaliApproved: updates.isWaliApproved !== undefined ? updates.isWaliApproved : prev.isWaliApproved,
        };
      }
      return prev;
    });
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

    setOnboardingOpen(false);
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
    <div className="min-h-screen bg-[#f9f9ff] text-[#151c27] flex flex-col font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 bg-[#004532] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-[#065f46]">
          <span className="material-symbols-outlined text-[#8bd6b6]">check_circle</span>
          <span className="font-display text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Landing View (If selected) */}
      {currentTab === 'landing' ? (
        <LandingView
          onEnterApp={() => setCurrentTab('dashboard')}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />
      ) : (
        <>
          {/* Desktop Navigation Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            user={user}
            onOpenUpgradeModal={() => setCurrentTab('plans')}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setAuthModalOpen(true);
            }}
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
            <div className="md:hidden fixed inset-0 z-50 bg-[#151c27]/50 backdrop-blur-sm flex justify-end">
              <div className="w-4/5 max-w-xs bg-white h-full p-6 flex flex-col justify-between shadow-2xl animate-fadeIn">
                <div>
                  <div className="flex justify-between items-center pb-6 border-b border-[#bec9c2]/30 mb-6">
                    <ZawajLogo size="md" />
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 text-[#6f7973]"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <nav className="space-y-2">
                    {[
                      { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
                      { id: 'browse', label: 'Parcourir', icon: 'search' },
                      { id: 'imam', label: 'Imam Oumar IA', icon: 'auto_awesome' },
                      { id: 'messages', label: 'Messages', icon: 'chat_bubble' },
                      { id: 'verification', label: 'Vérification Wali', icon: 'verified_user' },
                      { id: 'settings', label: 'Paramètres', icon: 'settings' },
                      ...(user.email?.toLowerCase() === 'moutarioumar7@gmail.com'
                        ? [{ id: 'admin', label: 'Administration', icon: 'admin_panel_settings' }]
                        : []),
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setCurrentTab(m.id as TabType);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-semibold transition-colors text-left ${
                          currentTab === m.id
                            ? 'bg-[#065f46]/10 text-[#004532]'
                            : 'text-[#3f4944] hover:bg-[#dce2f3]/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="pt-6 border-t border-[#bec9c2]/30 space-y-2">
                  {user.email || user.id ? (
                    <button
                      onClick={handleLogout}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-display font-semibold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Se déconnecter
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-[#065f46]/10 text-[#004532] font-display font-semibold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">login</span>
                      Connexion / Authentification
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCurrentTab('plans');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full gold-gradient text-[#574500] font-display font-bold py-3 rounded-xl text-xs text-center"
                  >
                    Passer à Premium
                  </button>
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
                  // The administrator profile must never appear in recommended profiles
                  if (
                    isAdministratorUser(p.userId) ||
                    isAdministratorUser(p.userEmail) ||
                    p.name?.toLowerCase().includes('admin') ||
                    p.name?.toLowerCase().includes('administrateur')
                  ) {
                    return false;
                  }

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

            {currentTab === 'plans' && (
              <PlansView
                user={user}
                onSelectPlanForPayment={(plan) => setSelectedPlanPayment(plan)}
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

            {currentTab === 'admin' && (
              <AdminDashboard
                allProfiles={profiles}
                onUpdateProfile={handleAdminUpdateProfile}
                onShowToast={showToast}
                onRefreshProfiles={async () => {
                  const fetched = await fetchProfilesFromSupabase();
                  if (fetched && fetched.length > 0) {
                    setProfiles(fetched);
                  }
                }}
              />
            )}
          </main>
        </>
      )}

      {/* Global Modals */}
      <ProfileDetailModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onStartMessage={handleStartMessageWithProfile}
        onRequestPhotoAccess={handleRequestPhotoAccess}
        isFavorited={selectedProfile ? favoriteProfileIds.includes(selectedProfile.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      <PaymentModal
        plan={selectedPlanPayment}
        onClose={() => setSelectedPlanPayment(null)}
        onConfirmSuccess={handleConfirmPlanPayment}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        userName={registeredUserData.name}
        userRole={registeredUserData.role}
        userPhone={registeredUserData.phone}
        onClose={() => showToast("L'onboarding est obligatoire après l'inscription. Veuillez compléter les étapes.")}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
