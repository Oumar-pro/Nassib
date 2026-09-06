import React, { useState, useMemo } from 'react';
import { Profile, User, isProfileVisible } from '../../types';

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
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [mahramModeActive, setMahramModeActive] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Filter Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [draftCity, setDraftCity] = useState<string>('');
  const [draftAgeRange, setDraftAgeRange] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [draftOnlyVerified, setDraftOnlyVerified] = useState<boolean>(false);

  const openFilterModal = () => {
    setDraftCity(selectedCity);
    setDraftAgeRange(selectedAgeRange);
    setDraftStatus(selectedStatus);
    setDraftOnlyVerified(onlyVerified);
    setIsFilterModalOpen(true);
  };

  const applyDraftFilters = () => {
    setSelectedCity(draftCity);
    setSelectedAgeRange(draftAgeRange);
    setSelectedStatus(draftStatus);
    setOnlyVerified(draftOnlyVerified);
    setIsFilterModalOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftCity('');
    setDraftAgeRange('');
    setDraftStatus('');
    setDraftOnlyVerified(false);
  };

  const clearAllActiveFilters = () => {
    setSelectedCity('');
    setSelectedAgeRange('');
    setSelectedStatus('');
    setOnlyVerified(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity) count++;
    if (selectedAgeRange) count++;
    if (selectedStatus) count++;
    if (onlyVerified) count++;
    return count;
  }, [selectedCity, selectedAgeRange, selectedStatus, onlyVerified]);

  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedCity) parts.push(selectedCity);
    if (selectedAgeRange) parts.push(`${selectedAgeRange} ans`);
    if (selectedStatus) parts.push(selectedStatus);
    if (onlyVerified) parts.push('Vérifié NNI');
    if (parts.length === 0) return 'Tous critères • Aucune restriction';
    return parts.join(' • ');
  }, [selectedCity, selectedAgeRange, selectedStatus, onlyVerified]);

  // Helper to normalize gender strings safely
  const normalizeGender = (g?: string): 'male' | 'female' | 'unknown' => {
    if (!g) return 'unknown';
    const s = String(g).toLowerCase().trim();
    if (s === 'male' || s === 'homme' || s === 'garçon' || s === 'garcon' || s === 'h' || s === 'm') return 'male';
    if (s === 'female' || s === 'femme' || s === 'fille' || s === 'f') return 'female';
    return 'unknown';
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Règle Halal Stricte :
      // - Si un garçon (homme) est connecté, il voit UNIQUEMENT tous les profils de filles (femmes).
      // - Si une fille (femme) est connectée, elle voit UNIQUEMENT tous les profils de garçons (hommes).
      // Note : Cette logique affiche tous les profils inscrits (distincte de la recommandation de l'accueil).
      const userGender = normalizeGender(user.gender);
      const profGender = normalizeGender(p.gender);

      if (userGender === 'male') {
        if (profGender !== 'female') return false;
      } else if (userGender === 'female') {
        if (profGender !== 'male') return false;
      }

      // 2. Masquer son propre profil
      if (user.id && (p.userId === user.id || p.id === user.id)) return false;
      if (user.email && (p.email === user.email || p.userEmail === user.email)) return false;
      if (user.name && p.name && user.name.trim().toLowerCase() === p.name.trim().toLowerCase()) return false;

      // 3. Filtres optionnels choisis par l'utilisateur
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
  }, [profiles, user.gender, user.id, user.email, user.name, selectedCity, selectedAgeRange, selectedStatus, onlyVerified]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn relative pb-12">
      {/* Title & Context - Positioned directly at the top outside the card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0F5C4D]">
              Trouvez votre partenaire
            </h1>
            {user.gender && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#8BAE9F]/15 text-[#0F5C4D] border border-[#8BAE9F]/30 text-xs font-semibold shrink-0">
                <span className="material-symbols-outlined text-sm">
                  {normalizeGender(user.gender) === 'female' ? 'male' : 'female'}
                </span>
                <span>
                  {normalizeGender(user.gender) === 'female' ? 'Profils Hommes Inscrits' : 'Profils Femmes Inscrites'}
                </span>
              </span>
            )}
          </div>
          <p className="font-body text-xs sm:text-sm text-[#575147]">
            {normalizeGender(user.gender) === 'female'
              ? 'Tous les profils hommes inscrits vérifiés selon les critères islamiques et traditionnels.'
              : normalizeGender(user.gender) === 'male'
              ? 'Tous les profils femmes inscrits vérifiés avec accompagnement du tuteur légal (Wali).'
              : 'Tous les profils inscrits vérifiés selon les valeurs de respect.'}
          </p>
        </div>

        <span className="text-[11px] font-bold text-[#0F5C4D] bg-[#8BAE9F]/15 px-3 py-1.5 rounded-full border border-[#8BAE9F]/30 shrink-0">
          {filteredProfiles.length} profil(s) inscrit(s)
        </span>
      </div>

      {/* Minimized Filter Trigger Card (few mm high, opens modal on click) */}
      <div className="space-y-2">
        <div
          onClick={openFilterModal}
          className="bg-white rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-2.5 border border-[#E8E3D7] shadow-2xs hover:shadow-xs hover:border-[#0F5C4D]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center shrink-0 group-hover:bg-[#0F5C4D] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[17px]">tune</span>
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A] shrink-0">
                Filtres de recherche
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#C9A45C] text-[#211E1A] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-[#7D766C] text-xs truncate hidden sm:inline">
                • {activeFiltersSummary}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5C4D] shrink-0">
            <span className="hidden xs:inline text-xs">Filtrer</span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </div>
        </div>

        {/* Active filter badges if any are active */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            <span className="text-[11px] font-semibold text-[#575147]">Filtres appliqués :</span>
            {selectedCity && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] text-xs font-medium">
                {selectedCity}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCity('');
                  }}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {selectedAgeRange && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] text-xs font-medium">
                {selectedAgeRange} ans
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAgeRange('');
                  }}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] text-xs font-medium">
                {selectedStatus}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatus('');
                  }}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {onlyVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] text-xs font-medium">
                Vérifié NNI
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOnlyVerified(false);
                  }}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllActiveFilters}
              className="text-xs text-[#735619] underline font-medium hover:text-[#211E1A] ml-1 cursor-pointer"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-[#211E1A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-[#E8E3D7] max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D7]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">tune</span>
                </div>
                <div>
                  <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#211E1A]">
                    Filtres de recherche
                  </h3>
                  <p className="font-body text-xs text-[#7D766C]">
                    Choisissez vos critères et appliquez-les
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F2] hover:bg-[#E8E3D7] text-[#7D766C] hover:text-[#211E1A] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* City Filter */}
              <div>
                <label className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-sm text-[#0F5C4D]">location_on</span>
                  Ville / Région
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '', label: 'Toutes les villes' },
                    { id: 'Niamey', label: 'Niamey' },
                    { id: 'Zinder', label: 'Zinder' },
                    { id: 'Maradi', label: 'Maradi' },
                    { id: 'Tahoua', label: 'Tahoua' },
                    { id: 'Agadez', label: 'Agadez' },
                    { id: 'Dosso', label: 'Dosso' },
                    { id: 'Tillabéri', label: 'Tillabéri' },
                    { id: 'Diffa', label: 'Diffa' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraftCity(c.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        draftCity === c.id
                          ? 'bg-[#0F5C4D] text-white shadow-xs font-semibold'
                          : 'bg-[#FAF8F2] text-[#575147] hover:bg-[#E8E3D7] border border-[#E8E3D7]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range Filter */}
              <div>
                <label className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-sm text-[#0F5C4D]">cake</span>
                  Tranche d'âge
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: '', label: 'Tout âge' },
                    { id: '18-25', label: '18-25 ans' },
                    { id: '26-32', label: '26-32 ans' },
                    { id: '33-40', label: '33-40 ans' },
                    { id: '40+', label: '40 ans +' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setDraftAgeRange(a.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                        draftAgeRange === a.id
                          ? 'bg-[#0F5C4D] text-white shadow-xs font-semibold'
                          : 'bg-[#FAF8F2] text-[#575147] hover:bg-[#E8E3D7] border border-[#E8E3D7]'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marital Status Filter */}
              <div>
                <label className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-sm text-[#0F5C4D]">favorite</span>
                  Statut matrimonial
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '', label: 'Tous les statuts' },
                    { id: 'Jamais marié(e)', label: 'Jamais marié(e)' },
                    { id: 'Divorcé(e)', label: 'Divorcé(e)' },
                    { id: 'Veuf/Veuve', label: 'Veuf / Veuve' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDraftStatus(st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        draftStatus === st.id
                          ? 'bg-[#0F5C4D] text-white shadow-xs font-semibold'
                          : 'bg-[#FAF8F2] text-[#575147] hover:bg-[#E8E3D7] border border-[#E8E3D7]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* NNI Verification Toggle */}
              <div className="pt-2 border-t border-[#E8E3D7]">
                <button
                  type="button"
                  onClick={() => setDraftOnlyVerified(!draftOnlyVerified)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    draftOnlyVerified
                      ? 'bg-[#8BAE9F]/15 border-[#0F5C4D] text-[#0F5C4D]'
                      : 'bg-[#FAF8F2] border-[#E8E3D7] text-[#575147] hover:bg-[#E8E3D7]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="material-symbols-outlined text-xl text-[#0F5C4D]"
                      style={{ fontVariationSettings: draftOnlyVerified ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      verified
                    </span>
                    <div className="text-left">
                      <p className="font-display text-xs font-bold text-[#211E1A]">
                        Profils vérifiés NNI uniquement
                      </p>
                      <p className="font-body text-[11px] text-[#7D766C]">
                        Afficher seulement les membres dont l'identité est validée
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-xl">
                    {draftOnlyVerified ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7] gap-3">
              <button
                type="button"
                onClick={resetDraftFilters}
                className="px-3 py-2 rounded-xl text-xs font-display font-semibold text-[#7D766C] hover:text-[#211E1A] hover:bg-[#FAF8F2] transition-colors cursor-pointer"
              >
                Réinitialiser
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-display font-semibold text-[#575147] border border-[#E8E3D7] hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={applyDraftFilters}
                  className="px-4 py-2 rounded-xl bg-[#0F5C4D] text-white text-xs font-display font-bold hover:bg-[#0c4a3e] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Appliquer les filtres</span>
                </button>
              </div>
            </div>
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
                onClick={() => onSelectProfile(profile)}
                className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs sm:shadow-sm border border-[#E8E3D7] hover:shadow-md active:scale-[0.99] transition-all duration-200 group flex flex-col relative cursor-pointer"
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
        className={`fixed bottom-22 right-4 sm:bottom-10 sm:right-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-30 group cursor-pointer active:scale-95 ${
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
