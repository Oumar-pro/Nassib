import React, { useState, useMemo } from 'react';
import { Profile, User } from '../../types';
import { isAdministratorUser } from '../../lib/auth';

interface BrowseViewProps {
  user: User;
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onRequestAccess: (profile: Profile) => void;
  favoriteProfileIds?: string[];
  onToggleFavorite?: (profileId: string) => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  user,
  profiles,
  onSelectProfile,
  onRequestAccess,
  favoriteProfileIds = [],
  onToggleFavorite,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [mahramModeActive, setMahramModeActive] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Rule 0: The administrator profile must NEVER be visible to any user
      if (
        isAdministratorUser(p.userId) ||
        isAdministratorUser(p.userEmail) ||
        p.name?.toLowerCase().includes('admin') ||
        p.name?.toLowerCase().includes('administrateur')
      ) {
        return false;
      }

      // Rule 1: Hide profile if user has not uploaded any image
      const hasPhoto = Boolean(
        (p.photoUrl && p.photoUrl.trim() !== '') ||
        (p.photos && p.photos.some((ph) => Boolean(ph) && ph.trim() !== ''))
      );
      if (!hasPhoto) return false;

      // Rule 2: Opposite gender filtering (Men see women, women see men)
      if (user.gender === 'male' && p.gender !== 'female') return false;
      if (user.gender === 'female' && p.gender !== 'male') return false;

      // Standard user filters
      if (selectedCity && p.city !== selectedCity) return false;
      if (selectedStatus && p.maritalStatus !== selectedStatus) return false;
      if (onlyVerified && !p.isVerifiedNNI) return false;

      if (selectedAgeRange) {
        if (selectedAgeRange === '18-25' && (p.age < 18 || p.age > 25)) return false;
        if (selectedAgeRange === '26-32' && (p.age < 26 || p.age > 32)) return false;
        if (selectedAgeRange === '33-40' && (p.age < 33 || p.age > 40)) return false;
        if (selectedAgeRange === '40+' && p.age < 40) return false;
      }

      return true;
    });
  }, [profiles, user.gender, selectedCity, selectedAgeRange, selectedStatus, onlyVerified]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn relative pb-12">
      {/* Search Header & Filter Bar */}
      <section className="bg-[#f9f9ff]/60 backdrop-blur-md rounded-3xl p-6 border border-[#bec9c2]/30 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-bold text-[#151c27] mb-1">
            Trouvez votre Partenaire de Vie
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#3f4944] leading-relaxed">
            Parcourez les profils vérifiés avec intention et respect. Utilisez les filtres pour affiner votre recherche selon vos principes.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Location Dropdown */}
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7973] text-sm pointer-events-none">
              location_on
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-[#bec9c2]/50 bg-white/80 text-[#151c27] font-body text-xs sm:text-sm appearance-none focus:ring-1 focus:ring-[#004532] focus:border-[#004532] transition-colors cursor-pointer w-full sm:w-auto min-w-[140px]"
            >
              <option value="">Toutes les Villes</option>
              <option value="Niamey">Niamey</option>
              <option value="Zinder">Zinder</option>
              <option value="Maradi">Maradi</option>
              <option value="Tahoua">Tahoua</option>
              <option value="Agadez">Agadez</option>
              <option value="Dosso">Dosso</option>
              <option value="Tillabéri">Tillabéri</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7973] text-sm pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          {/* Age Range Dropdown */}
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7973] text-sm pointer-events-none">
              cake
            </span>
            <select
              value={selectedAgeRange}
              onChange={(e) => setSelectedAgeRange(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-[#bec9c2]/50 bg-white/80 text-[#151c27] font-body text-xs sm:text-sm appearance-none focus:ring-1 focus:ring-[#004532] focus:border-[#004532] transition-colors cursor-pointer w-full sm:w-auto min-w-[130px]"
            >
              <option value="">Tout Âge</option>
              <option value="18-25">18 - 25 ans</option>
              <option value="26-32">26 - 32 ans</option>
              <option value="33-40">33 - 40 ans</option>
              <option value="40+">40 ans et +</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7973] text-sm pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          {/* More Filters Toggle Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#bec9c2]/50 font-body text-xs sm:text-sm transition-colors w-full sm:w-auto justify-center ${
              showMoreFilters ? 'bg-[#004532] text-white' : 'bg-white/80 text-[#151c27] hover:bg-[#dce2f3]/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Plus de filtres
          </button>
        </div>
      </section>

      {/* Expanded Filter Panel */}
      {showMoreFilters && (
        <div className="glass-card rounded-2xl p-6 shadow-sm border border-[#bec9c2]/40 flex flex-wrap gap-6 items-center animate-fadeIn">
          <div>
            <label className="font-body text-xs font-semibold text-[#3f4944] block mb-2">
              Statut Matrimonial
            </label>
            <div className="flex flex-wrap gap-2">
              {['', 'Jamais marié(e)', 'Divorcé(e)', 'Veuf/Veuve'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedStatus === st
                      ? 'bg-[#004532] text-white'
                      : 'bg-[#dce2f3]/60 text-[#151c27] hover:bg-[#dce2f3]'
                  }`}
                >
                  {st === '' ? 'Tous' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="border-l border-[#bec9c2]/30 pl-6">
            <label className="font-body text-xs font-semibold text-[#3f4944] block mb-2">
              Vérification Obligatoire
            </label>
            <button
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                onlyVerified
                  ? 'bg-[#065f46]/20 border-[#004532] text-[#004532]'
                  : 'border-[#bec9c2]/50 text-[#3f4944]'
              }`}
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {onlyVerified ? 'check_box' : 'checkbox_outline_blank'}
              </span>
              Uniquement profils vérifiés NNI
            </button>
          </div>
        </div>
      )}

      {/* Results Count Bar */}
      <div className="flex justify-between items-center text-xs text-[#3f4944] font-medium px-2">
        <span>{filteredProfiles.length} profil(s) trouvés</span>
        {mahramModeActive && (
          <span className="bg-[#fed65b]/30 text-[#745c00] px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">shield</span> Mode Mahram Actif (Filtrage renforcé)
          </span>
        )}
      </div>

      {/* Profile Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center border border-[#bec9c2]/40 max-w-xl mx-auto my-8 bg-white/80">
          <div className="w-16 h-16 rounded-full bg-[#004532]/10 text-[#004532] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">person_search</span>
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#151c27] mb-2">
            Aucun profil correspondant
          </h3>
          <p className="font-body text-xs sm:text-sm text-[#3f4944] leading-relaxed mb-6">
            Aucun membre ne correspond à vos critères de recherche actuels. Essayez d'ajuster ou d'élargir vos filtres pour découvrir davantage de profils compatibles.
          </p>
          <button
            onClick={() => {
              setSelectedCity('');
              setSelectedAgeRange('');
              setSelectedStatus('');
              setOnlyVerified(false);
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#004532] text-white font-display text-xs font-bold hover:bg-[#065f46] transition-all cursor-pointer shadow-sm"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.slice(0, visibleCount).map((profile) => {
            const isPhotoBlurred = profile.photoPrivate || (mahramModeActive && user.photoBlurringActive);
            const isFavorited = favoriteProfileIds.includes(profile.id);

            return (
              <article
                key={profile.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all duration-300 group flex flex-col relative ${
                  profile.isPremium ? 'border-[#fed65b]/60 shadow-md' : 'border-[#bec9c2]/30 hover:shadow-md'
                }`}
              >
                {/* Premium Subtle Gradient Top Bar */}
                {profile.isPremium && (
                  <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient z-20" />
                )}

                {/* Card Image Header */}
                <div className="relative h-64 overflow-hidden bg-slate-100 flex items-center justify-center">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        isPhotoBlurred ? 'blur-xl scale-110' : 'group-hover:scale-105'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-[#004532]">
                      <span className="material-symbols-outlined text-5xl mb-1 text-[#004532]/40">person</span>
                      <span className="font-display font-bold text-sm text-[#004532]/70">{profile.name}</span>
                    </div>
                  )}

                  {/* Favorite Heart Button */}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(profile.id);
                      }}
                      className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md shadow-md flex items-center justify-center transition-all cursor-pointer z-20 ${
                        isFavorited
                          ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
                          : 'bg-white/80 text-[#3f4944] hover:bg-white hover:text-rose-600'
                      }`}
                      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  )}

                  {/* Photo Blur Overlay if Private */}
                  {isPhotoBlurred && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#3f4944] mb-1 opacity-60">
                        visibility_off
                      </span>
                      <p className="font-display text-sm font-bold text-[#151c27]">Photo Privée</p>
                      <p className="font-body text-[11px] text-[#3f4944] mt-0.5">Demander l'accès pour voir</p>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {profile.isPremium && (
                      <span className="gold-gradient px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-[#e9c349]/50 w-fit">
                        <span className="material-symbols-outlined text-xs text-[#574500]">workspace_premium</span>
                        <span className="font-body text-[10px] font-bold text-[#574500]">PREMIUM</span>
                      </span>
                    )}

                    {profile.isVerifiedNNI && (
                      <span className="bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-[#bec9c2]/20 w-fit">
                        <span className="material-symbols-outlined text-xs text-[#004532]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          verified
                        </span>
                        <span className="font-body text-[10px] font-bold text-[#151c27]">VÉRIFIÉ NNI</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-2">
                    <h3 className="font-display text-lg font-bold text-[#151c27] flex items-center gap-1">
                      {profile.name}, {profile.age}
                    </h3>
                    <p className="font-body text-xs text-[#3f4944] flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs text-[#004532]">location_on</span>
                      {profile.city}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
                    <span className="px-2.5 py-1 bg-[#f0f3ff] rounded-md font-body text-[11px] text-[#3f4944] font-medium">
                      {profile.education}
                    </span>
                    <span className="px-2.5 py-1 bg-[#f0f3ff] rounded-md font-body text-[11px] text-[#3f4944] font-medium">
                      {profile.profession}
                    </span>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-auto pt-3 border-t border-[#bec9c2]/20 flex items-center justify-between gap-2">
                    {profile.isWaliApproved && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#735c00] font-semibold">
                        <span className="material-symbols-outlined text-xs">shield_person</span> Wali Approuvé
                      </span>
                    )}

                    {isPhotoBlurred ? (
                      <button
                        onClick={() => onRequestAccess(profile)}
                        className="bg-[#e2e8f8] text-[#151c27] px-3.5 py-2 rounded-xl font-display text-xs font-semibold hover:bg-[#dce2f3] transition-colors ml-auto"
                      >
                        Demander Accès
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectProfile(profile)}
                        className={`px-4 py-2 rounded-xl font-display text-xs font-semibold transition-all ml-auto ${
                          profile.isPremium
                            ? 'gold-gradient text-[#574500] hover:opacity-90'
                            : 'bg-[#004532] text-white hover:bg-[#065f46]'
                        }`}
                      >
                        Voir le Profil
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}


      {/* Pagination / Load More */}
      {visibleCount < filteredProfiles.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 4)}
            className="px-6 py-3 rounded-full border border-[#bec9c2]/50 text-[#151c27] font-display text-sm font-semibold hover:bg-[#dce2f3]/40 transition-colors shadow-sm"
          >
            Charger Plus de Profils
          </button>
        </div>
      )}

      {/* Floating Action Button (Toggle Mahram Mode) */}
      <button
        onClick={() => setMahramModeActive(!mahramModeActive)}
        className={`fixed bottom-20 right-6 md:bottom-10 md:right-10 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-40 group ${
          mahramModeActive
            ? 'bg-[#fed65b] text-[#745c00] ring-4 ring-[#fed65b]/30'
            : 'bg-[#065f46] text-white hover:scale-105'
        }`}
        title="Activer/Désactiver le Mode Mahram"
      >
        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">
          diversity_3
        </span>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-[#2a313d] text-white px-3 py-1.5 rounded-lg text-xs font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          {mahramModeActive ? 'Désactiver Mode Mahram' : 'Activer Mode Mahram'}
        </span>
      </button>
    </div>
  );
};
