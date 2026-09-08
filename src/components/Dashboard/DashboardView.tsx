import React, { useState, useEffect } from 'react';
import { Profile, User } from '../../types';
import { getWhoFavoritedMe } from '../../lib/database';
import { PaywallUpgradeModal } from '../Modals/PaywallUpgradeModal';

interface DashboardViewProps {
  user: User;
  recommendedProfiles?: Profile[];
  favoriteProfiles?: Profile[];
  favoriteProfileIds?: string[];
  fansCount?: number;
  onSelectProfile: (profile: Profile) => void;
  onNavigateToTab: (tab: any) => void;
  onTogglePhotoBlurring: () => void;
  onToggleFavorite?: (profileId: string) => void;
  approvedPhotoIds?: string[];
  photoAccessMap?: Record<string, 'NO_REQUEST' | 'PENDING' | 'ALLOWED' | 'REJECTED'>;
  hasUploadedPhoto?: boolean;
  onRequestPhotoUpload?: () => void;
  onUpgradeToPremium?: () => void;
  onActivateBoost?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  recommendedProfiles = [],
  favoriteProfiles = [],
  favoriteProfileIds = [],
  fansCount,
  onSelectProfile,
  onNavigateToTab,
  onTogglePhotoBlurring,
  onToggleFavorite,
  approvedPhotoIds = [],
  photoAccessMap = {},
  hasUploadedPhoto = true,
  onRequestPhotoUpload,
  onUpgradeToPremium,
  onActivateBoost,
}) => {
  const isWali = user.role === 'wali';
  const [fansProfiles, setFansProfiles] = useState<Profile[]>([]);
  const [paywallModalOpen, setPaywallModalOpen] = useState<boolean>(false);
  const [paywallConfig, setPaywallConfig] = useState<{
    title: string;
    description: string;
    icon: string;
  }>({
    title: 'Fonctionnalité Premium',
    description: 'Passez à Premium pour débloquer cette option.',
    icon: 'workspace_premium',
  });

  useEffect(() => {
    if (user.isPremium) {
      getWhoFavoritedMe().then((fans) => setFansProfiles(fans));
    }
  }, [user.isPremium]);

  const triggerPaywall = (title: string, description: string, icon: string) => {
    setPaywallConfig({ title, description, icon });
    setPaywallModalOpen(true);
  };

  // Real stats from database
  const stats = {
    profileViews: user.stats?.profileViews ?? 0,
    profileConsultations: user.stats?.profileConsultations ?? 0,
    photoRequests: user.stats?.photoRequests ?? 0,
    photoRequestsApproved: user.stats?.photoRequestsApproved ?? 0,
    matchesCount: user.stats?.matchesCount ?? 0,
    favoritesCount: user.stats?.favoritesCount ?? 0,
    compatibilityRateAvg: user.stats?.compatibilityRateAvg ?? 0,
    weeklyGrowthPercentage: user.stats?.weeklyGrowthPercentage ?? 0,
  };

  const actualFansCount = fansCount !== undefined ? fansCount : (user.stats?.favoritesCount ?? 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {!hasUploadedPhoto && (
        <div className="p-4 bg-white border border-[#C9A45C]/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#C9A45C] shrink-0">
              add_a_photo
            </span>
            <div>
              <p className="font-display font-bold text-xs sm:text-sm text-[#211E1A]">
                Votre profil n'est pas visible dans l'application
              </p>
              <p className="font-body text-xs text-[#575147]">
                Tant que vous n'avez pas ajouté de photo, votre profil reste invisible aux autres membres et vous êtes en mode consultation seule. Ajoutez au moins une photo pour devenir visible et pouvoir échanger.
              </p>
            </div>
          </div>
          {onRequestPhotoUpload && (
            <button
              type="button"
              onClick={onRequestPhotoUpload}
              className="px-4 py-2 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              Ajouter ma photo
            </button>
          )}
        </div>
      )}

      {/* Welcome Header & Role Card */}
      <div className="rounded-[24px] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between bg-white border border-[#E8E3D7] shadow-sm">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 bg-[#8BAE9F]/20 text-[#0F5C4D] text-xs font-semibold rounded-full">
                {isWali ? 'Espace Tuteur Légal (Wali)' : 'Tableau de bord membre'}
              </span>
              <span className="inline-block px-3 py-1 bg-[#C9A45C]/15 text-[#735619] text-xs font-semibold rounded-full border border-[#C9A45C]/30">
                Saison 2026
              </span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#211E1A] mb-2 tracking-tight">
              Bienvenue, {user.name}.
            </h2>
            <p className="font-body text-sm sm:text-base text-[#575147] max-w-lg leading-relaxed">
              {isWali
                ? "Suivi éthique, supervision bienveillante et validation des demandes d'accès aux informations de votre filleul(e)."
                : "Votre recherche d'une union sincère et bénie se poursuit. Retrouvez ici le suivi complet de votre visibilité et vos statistiques de compatibilité."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!user.isVerifiedNNI && (
              <button
                type="button"
                onClick={() => onNavigateToTab('verification')}
                className="inline-flex items-center gap-2 bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/40 px-3.5 py-1.5 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-[#C9A45C]/25 transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">pending</span>
                <span>Vérifier mon NNI</span>
              </button>
            )}

            {!user.isWaliApproved && !user.waliInfo?.phone && !user.waliReference && (
              <button
                type="button"
                onClick={() => onNavigateToTab('verification')}
                className="inline-flex items-center gap-2 bg-[#8BAE9F]/15 text-[#0F5C4D] border border-[#8BAE9F]/30 px-3.5 py-1.5 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-[#8BAE9F]/25 transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">family_restroom</span>
                <span>Ajouter un Wali</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToTab('imam')}
              className="inline-flex items-center gap-2 bg-[#0F5C4D] text-white px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-[#0c4a3e] transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-base text-[#C9A45C]">auto_awesome</span>
              <span>Consulter Imam Oumar IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED USER STATISTICS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif-display text-xl font-bold text-[#211E1A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0F5C4D]">analytics</span>
              <span>Statistiques d'activité</span>
            </h3>
            <p className="font-body text-xs text-[#575147]">
              {isWali
                ? "Statistiques de supervision et d'interaction pour le profil sous votre tutelle."
                : "Suivi en temps réel de votre portée, consultations et demandes d'interaction."}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-xs font-bold self-start sm:self-auto">
            Mise à jour en temps réel
          </span>
        </div>

        {/* 6 Grid Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Profile Views */}
          <div className="rounded-[20px] p-4 border border-[#E8E3D7] bg-white flex flex-col justify-between hover:border-[#8BAE9F] transition-all shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#C9A45C]/15 text-[#735619] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">visibility</span>
              </div>
              <span className="text-[#0F5C4D] font-body text-[10px] font-bold bg-[#8BAE9F]/15 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">arrow_upward</span> +{stats.weeklyGrowthPercentage}%
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#211E1A]">{stats.profileViews}</p>
              <p className="font-body text-[11px] text-[#575147] font-semibold mt-0.5">Vues du Profil</p>
              <p className="font-body text-[10px] text-[#7D766C]">Générées ce mois</p>
            </div>
          </div>

          {/* Card 2: Detailed Consultations */}
          <div className="rounded-[20px] p-4 border border-[#E8E3D7] bg-white flex flex-col justify-between hover:border-[#8BAE9F] transition-all shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">person_search</span>
              </div>
              <span className="text-[#0F5C4D] font-body text-[10px] font-bold bg-[#8BAE9F]/15 px-2 py-0.5 rounded-full">
                Lectures
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#211E1A]">{stats.profileConsultations}</p>
              <p className="font-body text-[11px] text-[#575147] font-semibold mt-0.5">Visites Détaillées</p>
              <p className="font-body text-[10px] text-[#7D766C]">Lectures complètes</p>
            </div>
          </div>

          {/* Card 3: Photo Access Requests */}
          <div className="rounded-[20px] p-4 border border-[#E8E3D7] bg-white flex flex-col justify-between hover:border-[#8BAE9F] transition-all shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">lock_open</span>
              </div>
              <span className="text-[#0F5C4D] font-body text-[10px] font-bold bg-[#8BAE9F]/15 px-2 py-0.5 rounded-full">
                {stats.photoRequestsApproved}/{stats.photoRequests}
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#211E1A]">{stats.photoRequests}</p>
              <p className="font-body text-[11px] text-[#575147] font-semibold mt-0.5">Demandes Photos</p>
              <p className="font-body text-[10px] text-[#7D766C]">Accès sollicités</p>
            </div>
          </div>

          {/* Card 4: Favoris Reçus / Mes Fans */}
          <div 
            onClick={() => {
              if (!user.isPremium) {
                triggerPaywall(
                  "Vois qui t'a mis en favori",
                  "Découvre toutes les personnes qui te trouvent intéressant(e). Le plus puissant signal d'intérêt pour trouver ta future moitié.",
                  "favorite"
                );
              }
            }}
            className="rounded-[20px] p-4 border border-[#E8E3D7] bg-white flex flex-col justify-between hover:border-[#C9A45C]/50 transition-all cursor-pointer shadow-2xs group relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#C9A45C]/20 text-[#735619] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </div>
              <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                user.isPremium ? 'bg-[#0F5C4D]/15 text-[#0F5C4D]' : 'bg-[#FEF3D6] text-[#B58500]'
              }`}>
                {!user.isPremium && <span className="material-symbols-outlined text-[11px]">lock</span>}
                {user.isPremium ? 'Débloqué' : 'Mes Fans (Bloqué)'}
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#211E1A]">{actualFansCount}</p>
              <p className="font-body text-[11px] text-[#575147] font-semibold mt-0.5">Favoris Reçus</p>
              <p className="font-body text-[10px] text-[#7D766C]">
                {user.isPremium ? 'Cliquez pour voir vos fans' : 'Débloquez avec Premium'}
              </p>
            </div>
          </div>

          {/* Card 5: Mes Favoris / Envoyés */}
          <div className="rounded-[20px] p-4 border border-[#E8E3D7] bg-white flex flex-col justify-between hover:border-[#8BAE9F] transition-all shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">
                  bookmark_heart
                </span>
              </div>
              <span className="text-[#0F5C4D] font-body text-[10px] font-bold bg-[#8BAE9F]/15 px-2 py-0.5 rounded-full">
                Sauvegardés
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#211E1A]">{favoriteProfiles.length}</p>
              <p className="font-body text-[11px] text-[#575147] font-semibold mt-0.5">Mes Favoris</p>
              <p className="font-body text-[10px] text-[#7D766C]">Profils que vous suivez</p>
            </div>
          </div>

          {/* Card 6: Matches / Correspondances */}
          <div 
            onClick={() => onNavigateToTab('browse')}
            className="rounded-[20px] p-4 border border-[#E8E3D7] bg-white flex flex-col justify-between hover:border-[#0F5C4D]/40 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">handshake</span>
              </div>
              <span className="text-[#0F5C4D] font-body text-[10px] font-bold bg-[#0F5C4D]/10 px-2 py-0.5 rounded-full">
                {stats.compatibilityRateAvg}% Mdn
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#211E1A]">{stats.matchesCount}</p>
              <p className="font-body text-[11px] text-[#575147] font-semibold mt-0.5">Compatibles</p>
              <p className="font-body text-[10px] text-[#7D766C]">Affinité élevée</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION EXCLUSIVE : CE QUE PREMIUM DÉBLOQUE POUR TOI */}
      <div className="rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-white via-[#FAF8F2] to-white border border-[#E8E3D7] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#FEF3D6] text-[#B58500] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#FDE68A]">
                Accélérateur de Rencontres
              </span>
              <span className="text-xs font-bold text-[#0F5C4D] font-display">
                3X plus de réponses
              </span>
            </div>
            <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-[#211E1A]">
              Ce que Premium débloque pour toi
            </h3>
            <p className="font-body text-xs sm:text-sm text-[#575147]">
              Tout ce qui change pour trouver ta future moitié plus vite sans attendre demain
            </p>
          </div>

          {!user.isPremium && (
            <button
              type="button"
              onClick={() => onUpgradeToPremium ? onUpgradeToPremium() : onNavigateToTab('settings')}
              className="px-4 py-2 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              <span>Débloquer avec Premium</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card: Vois qui t'a mis en favori */}
          <div className="rounded-2xl p-5 border border-[#E8E3D7] bg-white flex flex-col justify-between shadow-2xs relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/15 text-[#C9A45C] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-[#211E1A]">
                      Vois qui t'a mis en favori
                    </h4>
                    <span className="font-body text-[11px] text-[#7D766C]">
                      Le plus puissant signal d'intérêt
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  user.isPremium ? 'bg-[#0F5C4D]/10 text-[#0F5C4D]' : 'bg-[#FAF8F2] text-[#7D766C] border border-[#E8E3D7]'
                }`}>
                  <span className="material-symbols-outlined text-[12px]">
                    {user.isPremium ? 'check_circle' : 'lock'}
                  </span>
                  <span>{user.isPremium ? 'Débloqué' : 'Bloqué'}</span>
                </span>
              </div>

              <p className="font-body text-xs text-[#575147] mb-4 leading-relaxed">
                Découvre toutes les personnes qui te trouvent intéressant(e). Ne laisse plus passer une opportunité réciproque.
              </p>

              {user.isPremium ? (
                <div>
                  {fansProfiles.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {fansProfiles.slice(0, 4).map((f) => (
                        <div
                          key={f.id}
                          onClick={() => onSelectProfile(f)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F2] border border-[#E8E3D7] hover:border-[#8BAE9F] cursor-pointer"
                        >
                          <img
                            src={f.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={f.name}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold font-display text-[#211E1A] truncate">{f.name}</p>
                            <p className="text-[10px] text-[#7D766C] font-body">{f.age} ans • {f.city}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#FAF8F2] border border-dashed border-[#E8E3D7] text-center text-xs text-[#7D766C]">
                      Dès qu'un membre vous ajoute en favori, son profil apparaîtra ici en clair.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FAF8F2] border border-dashed border-[#E8E3D7] flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white blur-xs" />
                    <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white blur-xs" />
                    <div className="w-8 h-8 rounded-full bg-slate-500 border-2 border-white blur-xs" />
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerPaywall("Vois qui t'a mis en favori", "Découvre toutes les personnes qui te trouvent intéressant(e). Le plus puissant signal d'intérêt.", "favorite")}
                    className="text-[#0F5C4D] hover:underline font-display text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Voir mes fans</span>
                    <span className="material-symbols-outlined text-sm">lock</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card: Découvre qui te repère */}
          <div className="rounded-2xl p-5 border border-[#E8E3D7] bg-white flex flex-col justify-between shadow-2xs relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-[#211E1A]">
                      Découvre qui te repère
                    </h4>
                    <span className="font-body text-[11px] text-[#7D766C]">
                      Visiteurs de profil
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  user.isPremium ? 'bg-[#0F5C4D]/10 text-[#0F5C4D]' : 'bg-[#FAF8F2] text-[#7D766C] border border-[#E8E3D7]'
                }`}>
                  <span className="material-symbols-outlined text-[12px]">
                    {user.isPremium ? 'check_circle' : 'lock'}
                  </span>
                  <span>{user.isPremium ? 'Débloqué' : 'Bloqué'}</span>
                </span>
              </div>

              <p className="font-body text-xs text-[#575147] mb-4 leading-relaxed">
                Identifie en un clic qui consulte ton profil. Fini les doutes et les suppositions, passe à l'action.
              </p>

              {user.isPremium ? (
                <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#E8E3D7] flex items-center justify-between">
                  <span className="text-xs font-body text-[#575147]">
                    <strong>{stats.profileConsultations} consultations</strong> détaillées cette semaine
                  </span>
                  <span className="text-[#0F5C4D] font-display text-xs font-bold">Actif en direct</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FAF8F2] border border-dashed border-[#E8E3D7] flex items-center justify-between gap-3">
                  <span className="text-xs text-[#7D766C] font-body">
                    {stats.profileConsultations > 0 ? `${stats.profileConsultations} personnes ont consulté votre profil` : 'Plusieurs membres vous ont repéré(e)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerPaywall("Découvre qui te repère", "Identifie en un clic qui visite ton profil. Fini les doutes.", "visibility")}
                    className="text-[#0F5C4D] hover:underline font-display text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Débloquer</span>
                    <span className="material-symbols-outlined text-sm">lock</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Boosts inclus banner */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#211E1A] to-[#342F28] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A45C] text-[#211E1A] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white flex items-center gap-2">
                <span>Boosts de visibilité en tête</span>
                <span className="bg-[#C9A45C]/20 text-[#C9A45C] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#C9A45C]/30">
                  {user.isPremium ? `${user.boostsCount || 3} Boosts restants` : '0 Boost disponible'}
                </span>
              </p>
              <p className="font-body text-xs text-[#FAF8F2]/80 mt-0.5">
                Propulse ton profil en 1ère position pendant 24h. Plus de visibilité, plus de chances.
              </p>
            </div>
          </div>

          {user.isPremium ? (
            <button
              type="button"
              onClick={async () => {
                if (onActivateBoost) {
                  onActivateBoost();
                } else {
                  triggerPaywall("Boost activé", "Votre profil est maintenant propulsé en tête des résultats pendant 24h.", "bolt");
                }
              }}
              className="px-4 py-2 bg-[#C9A45C] hover:bg-[#b8934b] text-[#211E1A] font-display text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              Activer un Boost 24h
            </button>
          ) : (
            <button
              type="button"
              onClick={() => triggerPaywall("Boosts inclus avec Premium", "+1 à +10 Boosts offerts selon la formule. Fais monter ton profil tout en haut des résultats !", "bolt")}
              className="px-4 py-2 bg-[#C9A45C] hover:bg-[#b8934b] text-[#211E1A] font-display text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              Obtenir des Boosts
            </button>
          )}
        </div>
      </div>

      {/* MES PROFILS FAVORIS SECTION */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E8E3D7] space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#C9A45C]/15 text-[#735619] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl text-[#C9A45C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
            </div>
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#211E1A] flex items-center gap-2">
                <span>Mes Profils Favoris</span>
                <span className="bg-[#C9A45C]/15 text-[#735619] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {favoriteProfiles.length}
                </span>
              </h3>
              <p className="font-body text-xs text-[#575147]">
                Profils que vous avez sauvegardés pour suivi ultérieur
              </p>
            </div>
          </div>
          {favoriteProfiles.length > 0 && (
            <button
              onClick={() => onNavigateToTab('browse')}
              className="text-[#0F5C4D] font-display text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Découvrir d'autres profils</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          )}
        </div>

        {favoriteProfiles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FAF8F2] border border-dashed border-[#E8E3D7] text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#C9A45C]/15 text-[#C9A45C] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-2xl">favorite_border</span>
            </div>
            <h4 className="font-display text-sm font-bold text-[#211E1A] mb-1">
              Aucun profil enregistré dans vos favoris
            </h4>
            <p className="font-body text-xs text-[#7D766C] max-w-md mb-4">
              Cliquez sur l'icône de cœur sur les cartes de profil pour les ajouter à cette liste et les retrouver facilement.
            </p>
            <button
              onClick={() => onNavigateToTab('browse')}
              className="px-4 py-2 rounded-xl bg-[#0F5C4D] text-white font-display text-xs font-bold hover:bg-[#0c4a3e] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Parcourir les profils</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteProfiles.map((profile) => {
              const hasPhotoAccess = (approvedPhotoIds && approvedPhotoIds.includes(profile.id)) || (photoAccessMap && photoAccessMap[profile.id] === 'ALLOWED');
              const isPhotoBlurred = profile.photoPrivate && !hasPhotoAccess;

              return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className="rounded-2xl p-3 border border-[#E8E3D7] bg-[#FAF8F2] flex items-center gap-3 hover:border-[#8BAE9F] transition-all cursor-pointer relative group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className={`w-full h-full object-cover ${
                        isPhotoBlurred ? 'blur-md' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F2] text-[#0F5C4D]">
                      <span className="material-symbols-outlined text-2xl text-[#8BAE9F]">person</span>
                    </div>
                  )}
                  {profile.photoPrivate && hasPhotoAccess && (
                    <div className="absolute bottom-0 right-0 bg-[#0F5C4D] text-white p-0.5 rounded-full shadow-xs" title="Photos débloquées">
                      <span className="material-symbols-outlined text-[10px]">lock_open</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm font-bold text-[#211E1A] truncate">
                    {profile.name}, {profile.age} ans
                  </h4>
                  <p className="font-body text-[11px] text-[#575147] truncate">
                    {profile.profession} • {profile.city}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#0F5C4D] bg-[#8BAE9F]/20 px-2 py-0.5 rounded-full">
                    {profile.matchPercentage}% Compatible
                  </span>
                </div>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(profile.id);
                    }}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-[#7D766C] hover:text-[#0F5C4D] border border-[#E8E3D7] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="Retirer des favoris"
                  >
                    <span className="material-symbols-outlined text-base text-[#C9A45C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area: Recommended Profiles & Utilities Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Profiles (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#211E1A]">Profils Recommandés</h3>
              <p className="font-body text-xs text-[#575147]">Sélectionnés selon vos critères d'âge, ville et valeurs</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('browse')}
              className="text-[#0F5C4D] font-display text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Voir tout <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommendedProfiles.length === 0 ? (
              <div className="col-span-full rounded-[24px] p-8 text-center border border-[#E8E3D7] bg-white shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl text-[#C9A45C]">favorite</span>
                </div>
                <h4 className="font-serif-display text-base font-bold text-[#211E1A] mb-1">
                  Découvrez de nouvelles opportunités de rencontre
                </h4>
                <p className="font-body text-xs text-[#575147] mb-4">
                  Consultez les célibataires vérifiés sur la plateforme selon vos critères spirituels et personnels.
                </p>
                <button
                  onClick={() => onNavigateToTab('browse')}
                  className="px-4 py-2 bg-[#0F5C4D] text-white rounded-xl font-display text-xs font-semibold hover:bg-[#0c4a3e] cursor-pointer transition-all shadow-xs"
                >
                  Explorer les profils
                </button>
              </div>
            ) : (
              recommendedProfiles.slice(0, 2).map((profile) => {
                const isFavorited = favoriteProfileIds.includes(profile.id);
                const hasPhotoAccess = (approvedPhotoIds && approvedPhotoIds.includes(profile.id)) || (photoAccessMap && photoAccessMap[profile.id] === 'ALLOWED');
                const isPhotoBlurred = profile.photoPrivate && !hasPhotoAccess;
                const isPhotoPending = profile.photoPrivate && !hasPhotoAccess && photoAccessMap && photoAccessMap[profile.id] === 'PENDING';

                return (
                  <div
                    key={profile.id}
                    onClick={() => onSelectProfile(profile)}
                    className="rounded-[24px] overflow-hidden shadow-sm flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-[#E8E3D7] bg-white"
                  >
                    {/* Photo banner */}
                    <div className="h-52 relative overflow-hidden bg-[#FAF8F2] flex items-center justify-center">
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt={profile.name}
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                            isPhotoBlurred ? 'blur-xl scale-110' : ''
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F2] text-[#0F5C4D]">
                          <span className="material-symbols-outlined text-4xl mb-1 text-[#8BAE9F]">person</span>
                          <span className="font-display font-bold text-xs text-[#0F5C4D]">{profile.name}</span>
                        </div>
                      )}
                      {profile.photoPrivate && hasPhotoAccess && (
                        <div className="absolute top-3 left-3 bg-[#0F5C4D]/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white shadow-xs border border-white/20">
                          <span className="material-symbols-outlined text-xs">lock_open</span>
                          Photos débloquées
                        </div>
                      )}
                      {isPhotoPending && (
                        <div className="absolute top-3 left-3 bg-[#C9A45C]/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white shadow-xs border border-white/20">
                          <span className="material-symbols-outlined text-xs animate-pulse">hourglass_top</span>
                          Accès photo en attente
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-[#0F5C4D] shadow-xs border border-[#E8E3D7]">
                        <span className="material-symbols-outlined text-sm text-[#C9A45C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          verified
                        </span>
                        {profile.matchPercentage}% Compatible
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-display text-lg font-bold text-[#211E1A]">
                          {profile.name}, {profile.age}
                        </h4>
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(profile.id);
                            }}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              isFavorited ? 'text-[#C9A45C] bg-[#C9A45C]/15' : 'text-[#7D766C] hover:text-[#C9A45C]'
                            }`}
                            title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          >
                            <span
                              className="material-symbols-outlined text-xl"
                              style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                          </button>
                        )}
                      </div>

                    <p className="font-body text-xs text-[#575147] mb-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#0F5C4D]">location_on</span>
                      {profile.profession} • {profile.city}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="bg-[#FAF8F2] border border-[#E8E3D7] px-2.5 py-1 rounded-full font-body text-xs text-[#575147]">
                        {profile.maritalStatus}
                      </span>
                      <span className="bg-[#FAF8F2] border border-[#E8E3D7] px-2.5 py-1 rounded-full font-body text-xs text-[#575147]">
                        {profile.religion}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProfile(profile);
                      }}
                      className="mt-auto w-full font-display text-sm font-semibold py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer bg-[#0F5C4D] text-white hover:bg-[#0c4a3e]"
                    >
                      Voir le Profil
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Sidebar Utilities */}
        <div className="space-y-6">
          {/* Privacy Controls */}
          <div className="rounded-[24px] p-6 bg-white border border-[#E8E3D7] shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#8BAE9F]/20 flex items-center justify-center text-[#0F5C4D]">
                <span className="material-symbols-outlined">visibility_off</span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#211E1A]">
                Contrôle de Confidentialité
              </h3>
            </div>
            <p className="font-body text-xs text-[#575147] mb-5 leading-relaxed">
              Gérez la visibilité et le floutage de vos photos vis-à-vis des membres non confirmés.
            </p>

            <div className="flex items-center justify-between p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7]">
              <div>
                <p className="font-display text-sm font-bold text-[#211E1A]">
                  Floutage des Photos
                </p>
                <p className="font-body text-xs text-[#575147]">
                  {user.photoBlurringActive ? 'Actuellement actif' : 'Désactivé (Photos visibles)'}
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <button
                type="button"
                onClick={onTogglePhotoBlurring}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  user.photoBlurringActive ? 'bg-[#0F5C4D]' : 'bg-[#D6CFBE]'
                }`}
                role="switch"
                aria-checked={user.photoBlurringActive}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    user.photoBlurringActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Wali Profile Prompt Banner - shown only if wali step not done */}
          {!user.isWaliApproved && !user.waliInfo?.phone && !user.waliReference && (
            <div className="rounded-[24px] p-6 border border-[#8BAE9F]/30 bg-[#FAF8F2] relative overflow-hidden shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-[#735619]">
                <span className="material-symbols-outlined text-[#C9A45C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield_person
                </span>
                <span className="font-body text-xs font-bold uppercase tracking-wide">Éthique &amp; Confiance</span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#211E1A] mb-2">
                Complétez votre profil Wali
              </h3>
              <p className="font-body text-xs text-[#575147] mb-4 leading-relaxed">
                Ajouter les coordonnées de votre tuteur légal (Père, Frère, Oncle) augmente la confiance des membres et la visibilité de votre profil de +40%.
              </p>
              <button
                onClick={() => onNavigateToTab('verification')}
                className="text-[#0F5C4D] font-display text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                Ajouter les détails du Wali <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <PaywallUpgradeModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        onUpgrade={() => {
          setPaywallModalOpen(false);
          if (onUpgradeToPremium) onUpgradeToPremium();
          else onNavigateToTab('settings');
        }}
        featureTitle={paywallConfig.title}
        featureDescription={paywallConfig.description}
        featureIcon={paywallConfig.icon}
      />
    </div>
  );
};
