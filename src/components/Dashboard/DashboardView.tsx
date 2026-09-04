import React from 'react';
import { Profile, User } from '../../types';

interface DashboardViewProps {
  user: User;
  recommendedProfiles: Profile[];
  favoriteProfiles?: Profile[];
  favoriteProfileIds?: string[];
  fansCount?: number;
  onSelectProfile: (profile: Profile) => void;
  onNavigateToTab: (tab: any) => void;
  onTogglePhotoBlurring: () => void;
  onToggleFavorite?: (profileId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  recommendedProfiles,
  favoriteProfiles = [],
  favoriteProfileIds = [],
  fansCount,
  onSelectProfile,
  onNavigateToTab,
  onTogglePhotoBlurring,
  onToggleFavorite,
}) => {
  const isWali = user.role === 'wali';

  // Dynamic user stats with fallback defaults
  const stats = user.stats || {
    profileViews: isWali ? 186 : 148,
    profileConsultations: isWali ? 42 : 36,
    photoRequests: isWali ? 14 : 8,
    photoRequestsApproved: isWali ? 11 : 5,
    matchesCount: isWali ? 18 : 12,
    favoritesCount: isWali ? 31 : 24,
    compatibilityRateAvg: 92,
    weeklyGrowthPercentage: 18,
  };

  const actualFansCount = fansCount !== undefined ? fansCount : (stats.favoritesCount ?? (isWali ? 31 : 24));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Welcome Header & Role Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 glass-card rounded-[24px] p-6 sm:p-8 ambient-shadow relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white via-[#f0f3ff] to-white border border-[#bec9c2]/40">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-3 py-1 bg-[#065f46]/10 text-[#004532] text-xs font-semibold rounded-full">
                  {isWali ? 'Espace Tuteur Légal (Wali)' : 'Tableau de bord membre'}
                </span>
                <span className="inline-block px-3 py-1 bg-[#fed65b]/20 text-[#745c00] text-xs font-semibold rounded-full border border-[#fed65b]/40">
                  Saison 2026
                </span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#151c27] mb-2 tracking-tight">
                Bienvenue, {user.name}.
              </h2>
              <p className="font-body text-sm sm:text-base text-[#3f4944] max-w-lg leading-relaxed">
                {isWali
                  ? "Suivi éthique, supervision bienveillante et validation des demandes d'accès aux informations de votre filleul(e)."
                  : "Votre recherche d'une union sincère et bénie se poursuit. Retrouvez ici le suivi complet de votre visibilité et vos statistiques de compatibilité."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {user.isPremium ? (
                <div className="inline-flex items-center gap-2 bg-[#fed65b]/20 text-[#745c00] border border-[#fed65b] px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold shadow-2xs">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                  <span>Formule Baraka (Premium Actif)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('plans')}
                  className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer shadow-2xs"
                  title="Voir les formules"
                >
                  <span className="material-symbols-outlined text-base">workspace_premium</span>
                  <span>Formule Sadaq (Gratuit)</span>
                </button>
              )}

              {user.isVerifiedNNI ? (
                <div className="inline-flex items-center gap-2 bg-[#065f46]/10 text-[#004532] px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold border border-[#004532]/20">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  Vérifié NNI
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('verification')}
                  className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base">pending</span>
                  <span>Vérifier mon NNI</span>
                </button>
              )}

              {user.isWaliApproved ? (
                <div className="inline-flex items-center gap-2 bg-[#fed65b]/20 text-[#745c00] border border-[#fed65b]/50 px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold shadow-2xs">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shield
                  </span>
                  Approuvé par Wali
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('verification')}
                  className="inline-flex items-center gap-2 bg-[#004532]/10 text-[#004532] border border-[#004532]/30 px-3.5 py-1.5 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-[#004532]/20 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base">family_restroom</span>
                  <span>Ajouter un Wali</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateToTab('imam')}
                className="inline-flex items-center gap-2 bg-[#004532] text-white px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold hover:bg-[#065f46] transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                <span>Consulter Imam Oumar IA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Bento Banner */}
        <div className="glass-card rounded-[24px] p-6 ambient-shadow bg-gradient-to-br from-[#004532] to-[#065f46] text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#fed65b] text-2xl">auto_awesome</span>
              <span className="font-body text-xs font-bold text-[#fed65b] uppercase tracking-wider">
                Conseiller Spirituel
              </span>
            </div>
            <h3 className="font-serif-display text-xl font-bold mb-2 text-white">
              Guide Matrimonial Imam Oumar
            </h3>
            <p className="font-body text-xs text-emerald-100 leading-relaxed mb-4">
              Des interrogations sur le rôle du Wali, la fixation de la dot ou l'éthique des fiançailles ? Posez vos questions à tout moment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('imam')}
            className="w-full py-3 px-4 rounded-xl bg-[#fed65b] text-[#574500] font-display font-bold text-xs sm:text-sm hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Poser une question à l'Imam</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* DETAILED USER STATISTICS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif-display text-xl font-bold text-[#151c27] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004532]">analytics</span>
              <span>Statistiques d'Activité &amp; Visibilité du Profil</span>
            </h3>
            <p className="font-body text-xs text-[#3f4944]">
              {isWali
                ? "Statistiques de supervision et d'interaction pour le profil sous votre tutelle."
                : "Suivi en temps réel de votre portée, consultations et demandes d'interaction."}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#004532]/10 text-[#004532] font-body text-xs font-bold self-start sm:self-auto">
            Mise à jour en temps réel
          </span>
        </div>

        {/* 6 Grid Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Profile Views */}
          <div className="glass-card rounded-[20px] p-4 ambient-shadow border border-[#bec9c2]/40 bg-white flex flex-col justify-between hover:border-[#004532]/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#fed65b]/20 text-[#745c00] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">visibility</span>
              </div>
              <span className="text-[#004532] font-body text-[10px] font-bold bg-[#065f46]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">arrow_upward</span> +{stats.weeklyGrowthPercentage}%
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#151c27]">{stats.profileViews}</p>
              <p className="font-body text-[11px] text-[#3f4944] font-semibold mt-0.5">Vues du Profil</p>
              <p className="font-body text-[10px] text-[#6f7973]">Générées ce mois</p>
            </div>
          </div>

          {/* Card 2: Detailed Consultations */}
          <div className="glass-card rounded-[20px] p-4 ambient-shadow border border-[#bec9c2]/40 bg-white flex flex-col justify-between hover:border-[#004532]/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-[#065f46]/10 text-[#004532] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">person_search</span>
              </div>
              <span className="text-[#004532] font-body text-[10px] font-bold bg-[#065f46]/10 px-2 py-0.5 rounded-full">
                Lectures
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#151c27]">{stats.profileConsultations}</p>
              <p className="font-body text-[11px] text-[#3f4944] font-semibold mt-0.5">Visites Détaillées</p>
              <p className="font-body text-[10px] text-[#6f7973]">Lectures complètes</p>
            </div>
          </div>

          {/* Card 3: Photo Access Requests */}
          <div className="glass-card rounded-[20px] p-4 ambient-shadow border border-[#bec9c2]/40 bg-white flex flex-col justify-between hover:border-[#004532]/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">lock_open</span>
              </div>
              <span className="text-purple-700 font-body text-[10px] font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                {stats.photoRequestsApproved}/{stats.photoRequests}
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#151c27]">{stats.photoRequests}</p>
              <p className="font-body text-[11px] text-[#3f4944] font-semibold mt-0.5">Demandes Photos</p>
              <p className="font-body text-[10px] text-[#6f7973]">Accès sollicités</p>
            </div>
          </div>

          {/* Card 4: Favoris Reçus / Mes Fans (Ceux qui m'ont aimé) */}
          <div className="glass-card rounded-[20px] p-4 ambient-shadow border border-[#bec9c2]/40 bg-white flex flex-col justify-between hover:border-pink-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </div>
              <span className="text-pink-700 font-body text-[10px] font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                Mes Fans
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#151c27]">{actualFansCount}</p>
              <p className="font-body text-[11px] text-[#3f4944] font-semibold mt-0.5">Favoris Reçus</p>
              <p className="font-body text-[10px] text-[#6f7973]">Ont aimé votre profil</p>
            </div>
          </div>

          {/* Card 5: Mes Favoris / Envoyés (Ceux que j'ai aimés) */}
          <div className="glass-card rounded-[20px] p-4 ambient-shadow border border-[#bec9c2]/40 bg-white flex flex-col justify-between hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">
                  bookmark_heart
                </span>
              </div>
              <span className="text-rose-700 font-body text-[10px] font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                Sauvegardés
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#151c27]">{favoriteProfiles.length}</p>
              <p className="font-body text-[11px] text-[#3f4944] font-semibold mt-0.5">Mes Favoris</p>
              <p className="font-body text-[10px] text-[#6f7973]">Profils que vous suivez</p>
            </div>
          </div>

          {/* Card 6: Matches / Correspondances */}
          <div 
            onClick={() => onNavigateToTab('browse')}
            className="glass-card rounded-[20px] p-4 ambient-shadow border border-[#bec9c2]/40 bg-white flex flex-col justify-between hover:border-[#004532]/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#004532] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">handshake</span>
              </div>
              <span className="text-[#004532] font-body text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                {stats.compatibilityRateAvg}% Mdn
              </span>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#151c27]">{stats.matchesCount}</p>
              <p className="font-body text-[11px] text-[#3f4944] font-semibold mt-0.5">Compatibles</p>
              <p className="font-body text-[10px] text-[#6f7973]">Affinité élevée</p>
            </div>
          </div>
        </div>
      </div>

      {/* MES PROFILS FAVORIS SECTION */}
      <div className="glass-card rounded-[24px] p-6 ambient-shadow bg-white border border-[#bec9c2]/40 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
            </div>
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#151c27] flex items-center gap-2">
                <span>Mes Profils Favoris</span>
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {favoriteProfiles.length}
                </span>
              </h3>
              <p className="font-body text-xs text-[#3f4944]">
                Profils que vous avez sauvegardés pour suivi ultérieur
              </p>
            </div>
          </div>
          {favoriteProfiles.length > 0 && (
            <button
              onClick={() => onNavigateToTab('browse')}
              className="text-[#004532] font-display text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Découvrir d'autres profils</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          )}
        </div>

        {favoriteProfiles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#f0f3ff]/60 border border-dashed border-[#bec9c2]/50 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-2xl">favorite_border</span>
            </div>
            <h4 className="font-display text-sm font-bold text-[#151c27] mb-1">
              Aucun profil enregistré dans vos favoris
            </h4>
            <p className="font-body text-xs text-[#6f7973] max-w-md mb-4">
              Cliquez sur l'icône de cœur ❤️ présente sur les cartes de profil pour les ajouter à cette liste et les retrouver facilement.
            </p>
            <button
              onClick={() => onNavigateToTab('browse')}
              className="px-4 py-2 rounded-xl bg-[#004532] text-white font-display text-xs font-bold hover:bg-[#065f46] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Parcourir les profils</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className="rounded-2xl p-3 border border-[#bec9c2]/40 bg-[#f9f9ff] flex items-center gap-3 hover:border-[#004532]/40 transition-all cursor-pointer relative group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                  <img
                    src={profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm font-bold text-[#151c27] truncate">
                    {profile.name}, {profile.age} ans
                  </h4>
                  <p className="font-body text-[11px] text-[#3f4944] truncate">
                    {profile.profession} • {profile.city}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#004532] bg-[#004532]/10 px-2 py-0.2 rounded-full">
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
                    className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="Retirer des favoris"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area: Recommended Profiles & Utilities Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Profiles (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#151c27]">Profils Recommandés</h3>
              <p className="font-body text-xs text-[#3f4944]">Sélectionnés selon vos critères d'âge, ville et valeurs</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('browse')}
              className="text-[#004532] font-display text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Voir tout <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommendedProfiles.length === 0 ? (
              <div className="col-span-full glass-card rounded-[24px] p-8 text-center border border-[#bec9c2]/30 bg-white">
                <div className="w-12 h-12 rounded-full bg-[#004532]/10 text-[#004532] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </div>
                <h4 className="font-serif-display text-base font-bold text-[#151c27] mb-1">
                  Découvrez de nouvelles opportunités de rencontre
                </h4>
                <p className="font-body text-xs text-[#3f4944] mb-4">
                  Consultez les célibataires vérifiés sur la plateforme selon vos critères spirituels et personnels.
                </p>
                <button
                  onClick={() => onNavigateToTab('browse')}
                  className="px-4 py-2 bg-[#004532] text-white rounded-xl font-display text-xs font-semibold hover:bg-[#065f46] cursor-pointer transition-all shadow-xs"
                >
                  Explorer les profils
                </button>
              </div>
            ) : (
              recommendedProfiles.slice(0, 2).map((profile) => {
                const isFavorited = favoriteProfileIds.includes(profile.id);

                return (
                  <div
                    key={profile.id}
                    onClick={() => onSelectProfile(profile)}
                    className="glass-card rounded-[24px] overflow-hidden ambient-shadow flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-[#bec9c2]/30 bg-white"
                  >
                    {/* Photo banner */}
                    <div className="h-52 relative overflow-hidden bg-slate-100 flex items-center justify-center">
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt={profile.name}
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                            profile.photoPrivate && user.photoBlurringActive ? 'blur-[3px]' : ''
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-[#004532]">
                          <span className="material-symbols-outlined text-4xl mb-1 text-[#004532]/40">person</span>
                          <span className="font-display font-bold text-xs text-[#004532]/70">{profile.name}</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-[#004532] shadow-sm">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          verified
                        </span>
                        {profile.matchPercentage}% Compatible
                      </div>
                      {profile.isPremium && (
                        <div className="absolute top-3 left-3 gold-gradient text-[#574500] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                          PREMIUM
                        </div>
                      )}
                    </div>

                    {/* Profile Details */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-display text-lg font-bold text-[#151c27]">
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
                              isFavorited ? 'text-rose-600 bg-rose-50' : 'text-[#6f7973] hover:text-rose-600'
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

                    <p className="font-body text-xs text-[#3f4944] mb-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#004532]">location_on</span>
                      {profile.profession} • {profile.city}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="bg-[#dce2f3] px-2.5 py-1 rounded-full font-body text-xs text-[#3f4944]">
                        {profile.maritalStatus}
                      </span>
                      <span className="bg-[#dce2f3] px-2.5 py-1 rounded-full font-body text-xs text-[#3f4944]">
                        {profile.religion}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProfile(profile);
                      }}
                      className={`mt-auto w-full font-display text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer ${
                        profile.isPremium 
                          ? 'gold-gradient text-[#574500] hover:opacity-90' 
                          : 'bg-[#004532] text-white hover:bg-[#065f46]'
                      }`}
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
          <div className="glass-card rounded-[24px] p-6 ambient-shadow bg-white border border-[#bec9c2]/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#065f46]/10 flex items-center justify-center text-[#004532]">
                <span className="material-symbols-outlined">visibility_off</span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#151c27]">
                Contrôle de Confidentialité
              </h3>
            </div>
            <p className="font-body text-xs text-[#3f4944] mb-5 leading-relaxed">
              Gérez la visibilité et le floutage de vos photos vis-à-vis des membres non confirmés.
            </p>

            <div className="flex items-center justify-between p-4 bg-[#f0f3ff] rounded-2xl border border-[#bec9c2]/30">
              <div>
                <p className="font-display text-sm font-bold text-[#151c27]">
                  Floutage des Photos
                </p>
                <p className="font-body text-xs text-[#3f4944]">
                  {user.photoBlurringActive ? 'Actuellement actif' : 'Désactivé (Photos visibles)'}
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <button
                type="button"
                onClick={onTogglePhotoBlurring}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  user.photoBlurringActive ? 'bg-[#004532]' : 'bg-[#bec9c2]'
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

          {/* Wali Profile Prompt Banner */}
          <div className="glass-card rounded-[24px] p-6 ambient-shadow border border-[#004532]/20 bg-[#065f46]/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2 text-[#745c00]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_person
              </span>
              <span className="font-body text-xs font-bold uppercase tracking-wide">Éthique &amp; Confiance</span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#151c27] mb-2">
              Complétez votre profil Wali
            </h3>
            <p className="font-body text-xs text-[#3f4944] mb-4 leading-relaxed">
              Ajouter les coordonnées de votre tuteur légal (Père, Frère, Oncle) augmente la confiance des membres et la visibilité de votre profil de +40%.
            </p>
            <button
              onClick={() => onNavigateToTab('verification')}
              className="text-[#004532] font-display text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ajouter les détails du Wali <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
