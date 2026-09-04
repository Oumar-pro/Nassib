import React, { useState, useMemo } from 'react';
import { Profile, User } from '../../types';

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
      <section className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#E8E3D7] shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="max-w-xl">
          <h2 className="font-serif-display text-2xl font-bold text-[#211E1A] mb-1">
            Trouvez votre Partenaire de Vie
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed">
            Parcourez les profils vérifiés avec intention et respect. Utilisez les filtres pour affiner votre recherche selon vos principes.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Location Dropdown */}
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7D766C] text-sm pointer-events-none">
              location_on
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-[#E8E3D7] bg-[#FAF8F2] text-[#211E1A] font-body text-xs sm:text-sm appearance-none focus:ring-1 focus:ring-[#0F5C4D] focus:border-[#0F5C4D] transition-colors cursor-pointer w-full sm:w-auto min-w-[140px]"
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
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-sm pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          {/* Age Range Dropdown */}
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7D766C] text-sm pointer-events-none">
              cake
            </span>
            <select
              value={selectedAgeRange}
              onChange={(e) => setSelectedAgeRange(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-[#E8E3D7] bg-[#FAF8F2] text-[#211E1A] font-body text-xs sm:text-sm appearance-none focus:ring-1 focus:ring-[#0F5C4D] focus:border-[#0F5C4D] transition-colors cursor-pointer w-full sm:w-auto min-w-[130px]"
            >
              <option value="">Tout Âge</option>
              <option value="18-25">18 - 25 ans</option>
              <option value="26-32">26 - 32 ans</option>
              <option value="33-40">33 - 40 ans</option>
              <option value="40+">40 ans et +</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-sm pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          {/* More Filters Toggle Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E3D7] font-body text-xs sm:text-sm transition-colors w-full sm:w-auto justify-center cursor-pointer ${
              showMoreFilters ? 'bg-[#0F5C4D] text-white' : 'bg-[#FAF8F2] text-[#211E1A] hover:bg-[#E8E3D7]/50'
            }`}
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Plus de filtres
          </button>
        </div>
      </section>

      {/* Expanded Filter Panel */}
      {showMoreFilters && (
        <div className="rounded-2xl p-6 shadow-sm border border-[#E8E3D7] bg-white flex flex-wrap gap-6 items-center animate-fadeIn">
          <div>
            <label className="font-body text-xs font-semibold text-[#575147] block mb-2">
              Statut Matrimonial
            </label>
            <div className="flex flex-wrap gap-2">
              {['', 'Jamais marié(e)', 'Divorcé(e)', 'Veuf/Veuve'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#0F5C4D] text-white'
                      : 'bg-[#FAF8F2] text-[#211E1A] hover:bg-[#E8E3D7] border border-[#E8E3D7]'
                  }`}
                >
                  {st === '' ? 'Tous' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="border-l border-[#E8E3D7] pl-6">
            <label className="font-body text-xs font-semibold text-[#575147] block mb-2">
              Vérification Obligatoire
            </label>
            <button
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                onlyVerified
                  ? 'bg-[#8BAE9F]/20 border-[#0F5C4D] text-[#0F5C4D]'
                  : 'border-[#E8E3D7] text-[#575147] bg-[#FAF8F2]'
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
      <div className="flex justify-between items-center text-xs text-[#575147] font-medium px-2">
        <span>{filteredProfiles.length} profil(s) trouvés</span>
        {mahramModeActive && (
          <span className="bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#C9A45C]">shield</span> Mode Mahram Actif (Filtrage renforcé)
          </span>
        )}
      </div>

      {/* Profile Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="rounded-3xl p-10 text-center border border-[#E8E3D7] max-w-xl mx-auto my-8 bg-white shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">person_search</span>
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#211E1A] mb-2">
            Aucun profil correspondant
          </h3>
          <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed mb-6">
            Aucun membre ne correspond à vos critères de recherche actuels. Essayez d'ajuster ou d'élargir vos filtres pour découvrir davantage de profils compatibles.
          </p>
          <button
            onClick={() => {
              setSelectedCity('');
              setSelectedAgeRange('');
              setSelectedStatus('');
              setOnlyVerified(false);
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#0F5C4D] text-white font-display text-xs font-bold hover:bg-[#0c4a3e] transition-all cursor-pointer shadow-sm"
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
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E8E3D7] hover:shadow-md transition-all duration-300 group flex flex-col relative"
              >
                {/* Card Image Header */}
                <div className="relative h-64 overflow-hidden bg-[#FAF8F2] flex items-center justify-center">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        isPhotoBlurred ? 'blur-xl scale-110' : 'group-hover:scale-105'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F2] text-[#0F5C4D]">
                      <span className="material-symbols-outlined text-5xl mb-1 text-[#8BAE9F]">person</span>
                      <span className="font-display font-bold text-sm text-[#0F5C4D]">{profile.name}</span>
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
                      className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md shadow-sm flex items-center justify-center transition-all cursor-pointer z-20 ${
                        isFavorited
                          ? 'bg-[#C9A45C] text-white hover:bg-[#b8944f] scale-105'
                          : 'bg-white/90 text-[#7D766C] hover:bg-white hover:text-[#C9A45C] border border-[#E8E3D7]'
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
                    <div className="absolute inset-0 bg-[#FAF8F2]/60 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#575147] mb-1 opacity-60">
                        visibility_off
                      </span>
                      <p className="font-display text-sm font-bold text-[#211E1A]">Photo Privée</p>
                      <p className="font-body text-[11px] text-[#575147] mt-0.5">Demander l'accès pour voir</p>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {profile.isVerifiedNNI && (
                      <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-[#E8E3D7] w-fit">
                        <span className="material-symbols-outlined text-xs text-[#0F5C4D]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          verified
                        </span>
                        <span className="font-body text-[10px] font-bold text-[#211E1A]">VÉRIFIÉ NNI</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-2">
                    <h3 className="font-display text-lg font-bold text-[#211E1A] flex items-center gap-1">
                      {profile.name}, {profile.age}
                    </h3>
                    <p className="font-body text-xs text-[#575147] flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs text-[#0F5C4D]">location_on</span>
                      {profile.city}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
                    <span className="px-2.5 py-1 bg-[#FAF8F2] border border-[#E8E3D7] rounded-md font-body text-[11px] text-[#575147] font-medium">
                      {profile.education}
                    </span>
                    <span className="px-2.5 py-1 bg-[#FAF8F2] border border-[#E8E3D7] rounded-md font-body text-[11px] text-[#575147] font-medium">
                      {profile.profession}
                    </span>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-auto pt-3 border-t border-[#E8E3D7] flex items-center justify-between gap-2">
                    {profile.isWaliApproved && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#735619] font-semibold">
                        <span className="material-symbols-outlined text-xs text-[#C9A45C]">shield_person</span> Wali Approuvé
                      </span>
                    )}

                    {isPhotoBlurred ? (
                      <button
                        onClick={() => onRequestAccess(profile)}
                        className="bg-[#FAF8F2] border border-[#E8E3D7] text-[#211E1A] px-3.5 py-2 rounded-xl font-display text-xs font-semibold hover:bg-[#E8E3D7] transition-colors ml-auto cursor-pointer"
                      >
                        Demander Accès
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectProfile(profile)}
                        className="px-4 py-2 rounded-xl font-display text-xs font-semibold transition-all ml-auto bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] cursor-pointer shadow-2xs"
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
            className="px-6 py-3 rounded-full border border-[#E8E3D7] bg-white text-[#211E1A] font-display text-sm font-semibold hover:bg-[#FAF8F2] transition-colors shadow-2xs cursor-pointer"
          >
            Charger Plus de Profils
          </button>
        </div>
      )}

      {/* Floating Action Button (Toggle Mahram Mode) */}
      <button
        onClick={() => setMahramModeActive(!mahramModeActive)}
        className={`fixed bottom-20 right-6 md:bottom-10 md:right-10 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-40 group cursor-pointer ${
          mahramModeActive
            ? 'bg-[#C9A45C] text-[#211E1A] ring-4 ring-[#C9A45C]/30'
            : 'bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] hover:scale-105'
        }`}
        title="Activer/Désactiver le Mode Mahram"
      >
        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">
          diversity_3
        </span>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-[#211E1A] text-white px-3 py-1.5 rounded-lg text-xs font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          {mahramModeActive ? 'Désactiver Mode Mahram' : 'Activer Mode Mahram'}
        </span>
      </button>
    </div>
  );
};
