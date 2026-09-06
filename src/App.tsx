import React, { useCallback, useEffect, useState } from 'react';
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
} from './lib/supabase';
import {
  getCurrentUserSession,
  logoutUserSession,
  AuthAccount,
  restoreCurrentUserSession,
} from './lib/auth';
import {
  getProfiles,
  getMyProfile,
  saveMyProfile,
  getFavorites,
  toggleFavorite,
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
import { AuthPage } from './components/Auth/AuthPage';
import { OnboardingPage } from './components/Auth/OnboardingPage';
import { OnboardingData } from './components/Auth/OnboardingModal';

function getStoredPhotoBlur(): boolean {
  try {
    const val = localStorage.getItem('nassib_photo_blur');
    if (val !== null) return val === 'true';
  } catch {}
  return true;
}

const EMPTY_USER: User = {
  id: '', profileId: undefined, name: '', email: '', phone: '', role: 'candidate', gender: undefined,
  isVerifiedNNI: false, isWaliApproved: false, isPremium: false,
  photoBlurringActive: getStoredPhotoBlur(), photoUrl: '', planName: 'Sadaq (Gratuit)',
  waliInfo: { name: '', relation: '', phone: '' },
  stats: { profileViews: 0, profileConsultations: 0, photoRequests: 0, photoRequestsApproved: 0, matchesCount: 0, favoritesCount: 0, compatibilityRateAvg: 0, weeklyGrowthPercentage: 0 },
};

function accountToUser(account: AuthAccount, profile?: Profile | null, currentBlur?: boolean): User {
  const photoBlurringActive = currentBlur !== undefined ? currentBlur : getStoredPhotoBlur();
  return {
    ...EMPTY_USER,
    id: account.id,
    profileId: profile?.id,
    name: profile?.name || account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    gender: profile?.gender || account.gender,
    isVerifiedNNI: Boolean(profile?.isVerifiedNNI ?? account.isVerifiedNNI),
    isWaliApproved: Boolean(profile?.isWaliApproved ?? account.isWaliApproved),
    isPremium: Boolean(profile?.isPremium ?? account.isPremium),
    photoBlurringActive,
    photoUrl: profile?.photoUrl || account.photoUrl || '',
    photos: profile?.photos || (account.photoUrl ? [account.photoUrl] : []),
    planName: account.planName || 'Sadaq (Gratuit)',
    stats: { ...EMPTY_USER.stats, favoritesCount: profile?.likesCount ?? 0 },
  };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('landing');
  const [user, setUser] = useState<User>(EMPTY_USER);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [favoriteProfileIds, setFavoriteProfileIds] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [registeredUserData, setRegisteredUserData] = useState<{ id?: string; email?: string; name: string; role: 'candidate' | 'wali'; phone: string }>({ name: '', role: 'candidate', phone: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadDatabaseState = useCallback(async (userId: string) => {
    if (!userId || !isSupabaseConfigured) return;
    const myProfile = await getMyProfile(userId);
    if (myProfile) setCurrentUserProfile(myProfile);
    const [dbProfiles, dbFavorites, dbConversations] = await Promise.all([
      getProfiles(userId), getFavorites(userId), fetchConversationsFromSupabase(myProfile?.id),
    ]);
    setProfiles(dbProfiles);
    setFavoriteProfileIds(dbFavorites);
    setConversations(dbConversations);
    const account = getCurrentUserSession();
    if (account) setUser((prev) => accountToUser(account, myProfile, prev.photoBlurringActive));
  }, []);

  const syncAuth = useCallback(async () => {
    const account = await restoreCurrentUserSession();
    if (!account) {
      setUser(EMPTY_USER); setCurrentUserProfile(null); setProfiles([]); setConversations([]); setMessages([]); setFavoriteProfileIds([]); setActiveConvId(null); return;
    }
    const myProfile = await getMyProfile(account.id);
    setCurrentUserProfile(myProfile);
    setUser(accountToUser(account, myProfile));
    await loadDatabaseState(account.id);
  }, [loadDatabaseState]);

  useEffect(() => {
    syncAuth();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => syncAuth(), 0); });
    return () => data.subscription.unsubscribe();
  }, [syncAuth]);

  useEffect(() => {
    if (!supabase || !user.id) return;
    const reload = () => loadDatabaseState(user.id);
    const channel = supabase
      .channel(`nassib:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
        const conversationId = (payload.new as any)?.conversation_id || (payload.old as any)?.conversation_id;
        if (conversationId && conversationId === activeConvId) {
          const remote = await fetchMessagesFromSupabase(conversationId);
          setMessages(remote.map((m) => ({ ...m, isMine: m.senderId === user.profileId })));
        }
        reload();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.profileId, activeConvId, loadDatabaseState]);

  useEffect(() => {
    if (!activeConvId || !user.profileId) { setMessages([]); return; }
    fetchMessagesFromSupabase(activeConvId).then((remote) => setMessages(remote.map((m) => ({ ...m, isMine: m.senderId === user.profileId }))));
  }, [activeConvId, user.profileId]);

  const handleOpenAuth = (mode: 'login' | 'register') => { setAuthMode(mode); setCurrentTab('auth'); };

  const handleToggleFavorite = async (profileId: string) => {
    if (!user.id) return showToast('Veuillez vous connecter pour enregistrer vos favoris.');
    const isCurrentlyFavorited = favoriteProfileIds.includes(profileId);
    // Optimistic UI state update
    setFavoriteProfileIds((prev) =>
      isCurrentlyFavorited ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
    const success = await toggleFavorite(user.id, profileId);
    if (!success) {
      // Revert if request failed
      setFavoriteProfileIds((prev) =>
        isCurrentlyFavorited ? [...prev, profileId] : prev.filter((id) => id !== profileId)
      );
      return showToast('Impossible de modifier vos favoris. Réessayez.');
    }
    const profile = profiles.find((p) => p.id === profileId);
    showToast(
      !isCurrentlyFavorited
        ? `❤️ ${profile?.name || 'Profil'} ajouté(e) à vos favoris.`
        : `${profile?.name || 'Profil'} retiré(e) de vos favoris.`
    );
  };

  const favoriteProfiles = profiles.filter((p) => favoriteProfileIds.includes(p.id));
  const userFansCount = currentUserProfile?.likesCount ?? 0;

  const handleSendMessage = async (text: string, targetConvId?: string) => {
    const convId = targetConvId || activeConvId;
    if (!convId || !user.profileId) return;
    const result = await sendMessageToSupabase(convId, user.profileId, user.name, user.photoUrl, text);
    if (!result) return showToast('Impossible d’envoyer le message. Réessayez.');
    const remote = await fetchMessagesFromSupabase(convId);
    setMessages(remote.map((m) => ({ ...m, isMine: m.senderId === user.profileId })));
  };

  const handleStartMessageWithProfile = async (profile: Profile) => {
    let myProfileId = user.profileId;
    if (!myProfileId && user.id) {
      const myProf = profiles.find((p) => p.userId === user.id) || await getMyProfile(user.id);
      if (myProf) myProfileId = myProf.id;
    }
    if (!myProfileId) return showToast('Veuillez vous connecter pour contacter ce profil.');
    if (myProfileId === profile.id) return showToast('Vous ne pouvez pas démarrer une discussion avec votre propre profil.');
    const conversationId = await createOrGetConversationInSupabase(myProfileId, profile.id);
    if (!conversationId) return showToast('Impossible d’ouvrir cette conversation.');
    await loadDatabaseState(user.id);
    setActiveConvId(conversationId);
    setSelectedProfile(null);
    setCurrentTab('messages');
  };

  const handleReportProfile = async (targetProfile: Profile, reason: string, description?: string) => {
    if (!user.id) return;
    await reportUserOrProfileInSupabase({ reporterUserId: user.id, reportedProfileId: targetProfile.id, reportedUserId: targetProfile.userId, reason, description });
    showToast('Signalement enregistré. Merci.');
  };

  const handleBlockProfile = async (targetProfile: Profile, reason?: string) => {
    if (!user.id || !targetProfile.userId) return;
    const ok = await blockUserInSupabase(user.id, targetProfile.userId, reason);
    if (ok !== false) { setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id)); showToast(`${targetProfile.name} a été bloqué(e).`); }
  };

  const handleRequestPhotoAccess = (_profile: Profile) => showToast('La demande d’accès sera enregistrée dans votre compte.');

  const handleAuthSuccess = async (userAcc: AuthAccount, isRegister: boolean) => {
    const myProfile = await getMyProfile(userAcc.id);
    setUser(accountToUser(userAcc, myProfile));
    await loadDatabaseState(userAcc.id);
    if (isRegister) {
      setRegisteredUserData({ id: userAcc.id, email: userAcc.email, name: userAcc.name, role: userAcc.role, phone: userAcc.phone || '' });
      setCurrentTab('onboarding'); showToast('Compte créé. Complétez maintenant votre profil.');
    } else { setCurrentTab('dashboard'); showToast(`Ravi de vous revoir sur NASSIB, ${userAcc.name} !`); }
  };

  const handleLogout = async () => {
    await logoutUserSession();
    setUser(EMPTY_USER); setProfiles([]); setConversations([]); setMessages([]); setFavoriteProfileIds([]); setActiveConvId(null); setMobileMenuOpen(false); setCurrentTab('landing');
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    const userId = registeredUserData.id || user.id;
    if (!userId) return showToast('Session invalide. Veuillez vous reconnecter.');
    const photos = data.photos || [];
    const hasWaliInfo = Boolean(data.waliName?.trim() && data.waliPhone?.trim());
    const profile: Partial<Profile> = {
      name: registeredUserData.name || user.name,
      age: data.age,
      profession: data.profession,
      city: data.neighborhood ? `${data.region} (${data.neighborhood})` : data.region,
      maritalStatus: data.maritalStatus as any,
      religion: data.religion || 'Sunnite',
      education: data.education as any,
      isVerifiedNNI: false,
      isWaliApproved: hasWaliInfo,
      isPremium: false,
      photoUrl: photos[0] || '',
      photoPrivate: false,
      bio: data.bio || (data.marriageHorizon ? `Horizon mariage : ${data.marriageHorizon}. Priorité : ${data.familyImportance || 'Famille'}.` : `Membre inscrit. Priorité : ${data.familyImportance || 'Famille'}.`),
      gender: data.gender,
      photos,
      personality: data.personalityTrait,
      familyImportance: data.familyImportance,
      presentation: data.partnerCriteria || (data.marriageHorizon ? `Horizon mariage : ${data.marriageHorizon}.` : ''),
      height: data.height,
      weight: data.weight,
      ethnicity: data.ethnicity,
      originCity: data.originCity,
      hijabStatus: data.hijabStatus,
      religiousPracticeDetails: data.religiousPracticeDetails || data.religiousPractice,
      values: data.values,
      partnerCriteria: data.partnerCriteria,
      dealBreakers: data.dealBreakers,
    };
    const saved = await saveMyProfile(userId, profile, data);
    if (!saved) return showToast('Impossible d’enregistrer le profil. Vos données n’ont pas été enregistrées.');
    const account = getCurrentUserSession();
    if (account) setUser(accountToUser(account, saved));
    await loadDatabaseState(userId);
    setCurrentTab('browse');
    showToast('Profil enregistré dans la base de données NASSIB.');
  };

  const handleUpdateUser = async (updated: Partial<User>) => {
    if (!user.id) return;

    if (updated.photoBlurringActive !== undefined) {
      try {
        localStorage.setItem('nassib_photo_blur', String(updated.photoBlurringActive));
      } catch {}
      setUser((prev) => ({ ...prev, photoBlurringActive: updated.photoBlurringActive! }));
    }

    const existing = await getMyProfile(user.id);
    const baseProfile: Partial<Profile> = existing || {
      userId: user.id,
      name: updated.name || user.name || 'Membre',
      gender: updated.gender || user.gender || 'female',
      photoUrl: updated.photoUrl || user.photoUrl || '',
      age: 25,
      city: 'Niamey',
      maritalStatus: 'Célibataire',
    };

    const saved = await saveMyProfile(
      user.id,
      {
        ...baseProfile,
        name: updated.name || baseProfile.name,
        gender: updated.gender || baseProfile.gender,
        photoUrl: updated.photoUrl !== undefined ? updated.photoUrl : baseProfile.photoUrl,
        photos: updated.photos || baseProfile.photos,
        photoPrivate: updated.photoBlurringActive !== undefined ? updated.photoBlurringActive : baseProfile.photoPrivate,
      },
      updated.waliInfo
        ? {
            waliName: updated.waliInfo.name,
            waliRelation: updated.waliInfo.relation,
            waliPhone: updated.waliInfo.phone,
          }
        : undefined
    );

    if (saved) {
      setCurrentUserProfile(saved);
      const account = getCurrentUserSession();
      if (account) setUser((prev) => ({ ...accountToUser(account, saved, prev.photoBlurringActive), ...updated }));
      await loadDatabaseState(user.id);
    } else {
      setUser((prev) => ({ ...prev, ...updated }));
    }
    showToast('Modifications enregistrées.');
  };

  const handleUpdateWaliInfo = async (waliInfo: UserWaliInfo) => {
    if (!user.id) return;
    const existing = await getMyProfile(user.id);
    if (!existing) return;
    const saved = await saveMyProfile(user.id, { ...existing, isWaliApproved: true }, { waliName: waliInfo.name, waliRelation: waliInfo.relation, waliPhone: waliInfo.phone });
    if (saved) { setUser((prev) => ({ ...prev, isWaliApproved: true, waliInfo })); await loadDatabaseState(user.id); showToast('Informations du Wali enregistrées.'); }
  };

  const handleUploadNNI = async () => {
    if (!user.id) return;
    const existing = await getMyProfile(user.id);
    if (!existing) return;
    const saved = await saveMyProfile(user.id, { ...existing, isVerifiedNNI: true });
    if (saved) { setUser((prev) => ({ ...prev, isVerifiedNNI: true })); await loadDatabaseState(user.id); showToast('Vérification NNI enregistrée.'); }
  };

  const isHeaderlessTab = ['browse', 'messages', 'settings'].includes(currentTab);

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] flex flex-col font-body">
      {toastMessage && <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 bg-[#0F5C4D] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-[#8BAE9F]/40"><span className="material-symbols-outlined text-[#C9A45C]">check_circle</span><span className="font-display text-xs sm:text-sm font-semibold">{toastMessage}</span></div>}
      {currentTab === 'auth' ? <AuthPage initialMode={authMode} onBack={() => setCurrentTab('landing')} onSuccess={handleAuthSuccess} /> : currentTab === 'onboarding' ? <OnboardingPage userName={registeredUserData.name || user.name} userRole={registeredUserData.role || user.role} userPhone={registeredUserData.phone || user.phone} onComplete={handleOnboardingComplete} onCancel={() => setCurrentTab('dashboard')} /> : currentTab === 'landing' ? <LandingView onEnterApp={() => setCurrentTab('dashboard')} onOpenAuth={handleOpenAuth} onNavigateTab={setCurrentTab} /> : <>
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} user={user} onOpenAuth={handleOpenAuth} onLogout={handleLogout} unreadCount={0} />
        {!isHeaderlessTab && (
          <MobileHeader user={user} onSelectTab={setCurrentTab} onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)} />
        )}
        {mobileMenuOpen && <div className="md:hidden fixed inset-0 z-50 bg-[#211E1A]/60 backdrop-blur-sm flex justify-end"><div className="w-4/5 max-w-xs bg-[#FAF8F2] h-full p-6 flex flex-col justify-between shadow-2xl"><div><div className="flex justify-between items-center pb-6 border-b border-[#E8E3D7] mb-6"><NasibaLogo size="sm" /><button onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#7D766C]"><span className="material-symbols-outlined">close</span></button></div><nav className="space-y-1.5">{[['dashboard','Tableau de bord','dashboard'],['browse','Parcourir','search'],['imam','Imam Oumar IA','auto_awesome'],['messages','Messages','chat_bubble'],['verification','Vérification Wali','verified_user'],['settings','Paramètres','settings']].map(([id,label,icon]) => <button key={id} onClick={() => { setCurrentTab(id as TabType); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-semibold text-left ${currentTab === id ? 'bg-[#8BAE9F]/20 text-[#0F5C4D]' : 'text-[#575147] hover:bg-[#8BAE9F]/10'}`}><span className="material-symbols-outlined text-lg">{icon}</span>{label}</button>)}</nav></div><button onClick={handleLogout} className="w-full border border-[#E8E3D7] bg-white text-[#575147] font-display font-semibold py-2.5 rounded-xl text-xs">Se déconnecter</button></div></div>}
        <main className={`flex-1 md:ml-64 px-3.5 sm:px-8 pb-28 md:pb-12 min-h-screen ${
          isHeaderlessTab ? 'pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-6' : 'pt-16 md:pt-10'
        }`}>
          {currentTab === 'dashboard' && (
            <DashboardView
              user={user}
              recommendedProfiles={profiles.filter((p) => p.photoUrl && p.userId !== user.id && p.gender !== user.gender)}
              favoriteProfiles={favoriteProfiles}
              favoriteProfileIds={favoriteProfileIds}
              fansCount={userFansCount}
              onSelectProfile={setSelectedProfile}
              onNavigateToTab={setCurrentTab}
              onTogglePhotoBlurring={() => {
                const next = !user.photoBlurringActive;
                try {
                  localStorage.setItem('nassib_photo_blur', String(next));
                } catch {}
                setUser((u) => ({ ...u, photoBlurringActive: next }));
                showToast(next ? 'Mode Floutage activé : photos protégées.' : 'Mode Floutage désactivé.');
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {currentTab === 'browse' && <BrowseView user={user} profiles={profiles} onSelectProfile={setSelectedProfile} onRequestAccess={handleRequestPhotoAccess} favoriteProfileIds={favoriteProfileIds} onToggleFavorite={handleToggleFavorite} />}
          {currentTab === 'imam' && <ImamChatView user={user} />}
          {currentTab === 'messages' && <MessagesView user={user} conversations={conversations} activeMessages={messages} activeConvId={activeConvId} onSelectConversation={setActiveConvId} onSendMessage={handleSendMessage} />}
          {currentTab === 'verification' && <VerificationView user={user} onUpdateWaliInfo={handleUpdateWaliInfo} onUploadNNI={handleUploadNNI} />}
          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              profile={currentUserProfile}
              onUpdateUser={handleUpdateUser}
              onUpdateProfile={async (updatedProfile) => {
                if (!user.id) return;
                const existing = await getMyProfile(user.id);
                const baseProfile = existing || {
                  userId: user.id,
                  name: user.name || 'Membre',
                  gender: user.gender || 'female',
                  photoUrl: user.photoUrl || '',
                  age: 25,
                  city: 'Niamey',
                  maritalStatus: 'Célibataire',
                };
                const saved = await saveMyProfile(user.id, { ...baseProfile, ...updatedProfile });
                if (saved) {
                  setCurrentUserProfile(saved);
                  const account = getCurrentUserSession();
                  if (account) setUser((prev) => accountToUser(account, saved, prev.photoBlurringActive));
                  await loadDatabaseState(user.id);
                  showToast('Profil mis à jour avec succès.');
                }
              }}
              onNavigateTab={setCurrentTab}
              onLogout={handleLogout}
            />
          )}
        </main>
        <MobileBottomNav currentTab={currentTab} onSelectTab={setCurrentTab} unreadCount={0} />
      </>}
      <ProfileDetailModal profile={selectedProfile} currentUser={user} onClose={() => setSelectedProfile(null)} onStartMessage={handleStartMessageWithProfile} onRequestPhotoAccess={handleRequestPhotoAccess} isFavorited={selectedProfile ? favoriteProfileIds.includes(selectedProfile.id) : false} onToggleFavorite={handleToggleFavorite} onReport={handleReportProfile} onBlock={handleBlockProfile} />
    </div>
  );
}
