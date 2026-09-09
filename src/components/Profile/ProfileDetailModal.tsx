import React, { useState } from 'react';
import { Profile, User } from '../../types';
import SafeImage from '../Common/SafeImage';
import { MessageIdeasModal } from '../Modals/MessageIdeasModal';

interface ProfileDetailModalProps {
  profile: Profile | null;
  currentUser?: User;
  onClose: () => void;
  onStartMessage: (profile: Profile) => void;
  onRequestPhotoAccess: (profile: Profile) => void;
  photoAccessState?: 'NO_REQUEST' | 'PENDING' | 'ALLOWED' | 'REJECTED';
  isFavorited?: boolean;
  onToggleFavorite?: (profileId: string) => void;
  onReport?: (profile: Profile, reason: string, description?: string) => void;
  onBlock?: (profile: Profile, reason?: string) => void;
  hasUploadedPhoto?: boolean;
  onRequestPhotoUpload?: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  currentUser,
  onClose,
  onStartMessage,
  onRequestPhotoAccess,
  photoAccessState = 'NO_REQUEST',
  isFavorited = false,
  onToggleFavorite,
  onReport,
  onBlock,
  hasUploadedPhoto = true,
  onRequestPhotoUpload,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [ideasModalOpen, setIdeasModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Comportement inapproprié');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('Incompatibilité');
  const [blockSubmitted, setBlockSubmitted] = useState(false);

  if (!profile) return null;

  // Photo blurring rule:
  const isPhotoBlurred = profile.photoPrivate && photoAccessState !== 'ALLOWED';

  // Photo array
  const allPhotos: string[] = [
    ...(profile.photoUrl && profile.photoUrl.trim() ? [profile.photoUrl.trim()] : []),
    ...(Array.isArray(profile.photos)
      ? profile.photos.filter((p) => p && p.trim() && p.trim() !== profile.photoUrl?.trim())
      : []),
  ];
  if (allPhotos.length === 0 && profile.photoUrl) allPhotos.push(profile.photoUrl);
  const currentPhoto = allPhotos[activePhotoIndex] || profile.photoUrl || '';

  // Personality tags (strictly from user input)
  const personalityTags = (() => {
    const tags: string[] = [];
    if (profile.personality) {
      profile.personality.split(/[,;•\n]+/).forEach((t) => {
        const clean = t.trim();
        if (clean && !tags.includes(clean)) tags.push(clean);
      });
    }
    if (profile.interests) {
      profile.interests.split(/[,;•\n]+/).forEach((t) => {
        const clean = t.trim();
        if (clean && !tags.includes(clean)) tags.push(clean);
      });
    }
    return tags;
  })();

  const valuesTags =
    Array.isArray(profile.values) && profile.values.length > 0
      ? profile.values
      : [];

  const isFemale = profile.gender === 'female';
  const rechercheLabel = isFemale ? "Ce qu'elle recherche" : "Ce qu'il recherche";
  const acceptePasLabel = isFemale ? "Ce qu'elle n'accepte pas" : "Ce qu'il n'accepte pas";

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReport) {
      onReport(profile, reportReason, reportDescription);
    }
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportModalOpen(false);
    }, 2000);
  };

  const handleConfirmBlock = () => {
    if (onBlock) {
      onBlock(profile, blockReason);
    }
    setBlockSubmitted(true);
    setTimeout(() => {
      setBlockSubmitted(false);
      setBlockModalOpen(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#211E1A]/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-t-[28px] sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-[#E8E3D7] max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-white relative pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-[#E8E3D7] rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E8E3D7] flex justify-between items-center bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-base font-semibold text-[#211E1A] hover:text-[#0F5C4D] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => {
                  if (!hasUploadedPhoto) {
                    onRequestPhotoUpload?.();
                    return;
                  }
                  onToggleFavorite(profile.id);
                }}
                className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  isFavorited
                    ? 'bg-[#C9A45C]/20 text-[#735619] hover:bg-[#C9A45C]/30'
                    : 'text-[#7D766C] hover:text-[#C9A45C] hover:bg-[#FAF8F2]'
                }`}
                title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <span
                  className={`material-symbols-outlined text-xl ${isFavorited ? 'text-[#C9A45C]' : ''}`}
                  style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="p-2 text-[#7D766C] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Signaler ce profil"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>

            <button
              type="button"
              onClick={() => setBlockModalOpen(true)}
              className="p-2 text-[#7D766C] hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Bloquer ce profil"
            >
              <span className="material-symbols-outlined text-lg">block</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#7D766C] hover:text-[#211E1A] hover:bg-[#FAF8F2] rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Photo Reminder */}
          {!hasUploadedPhoto && (
            <div className="p-4 bg-white border border-[#C9A45C]/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-[#C9A45C] shrink-0">
                  add_a_photo
                </span>
                <div>
                  <p className="font-display font-bold text-xs sm:text-sm text-[#211E1A]">
                    Mode consultation active
                  </p>
                  <p className="font-body text-xs text-[#575147]">
                    Ajoutez au moins une photo à votre profil pour interagir avec {profile.name}.
                  </p>
                </div>
              </div>
              {onRequestPhotoUpload && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestPhotoUpload();
                  }}
                  className="px-4 py-2 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Ajouter ma photo
                </button>
              )}
            </div>
          )}

          {/* Hero Photo Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E3D7] shadow-xs">
            <div className="relative w-full aspect-square sm:aspect-4/3 max-h-[440px] bg-[#FAF8F2] flex items-center justify-center overflow-hidden">
              {currentPhoto ? (
                <SafeImage
                  src={currentPhoto}
                  alt={profile.name}
                  fallbackName={profile.name}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isPhotoBlurred ? 'blur-2xl scale-125 select-none pointer-events-none' : ''
                  }`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F2] text-[#0F5C4D]">
                  <span className="material-symbols-outlined text-5xl text-[#8BAE9F]">person</span>
                </div>
              )}

              {/* Top Left Badge: Premium */}
              {profile.isPremium && (
                <div className="absolute top-4 left-4 z-10 bg-[#E6C687] text-[#211E1A] font-display text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 tracking-wider border border-white/50">
                  <span className="material-symbols-outlined text-base">workspace_premium</span>
                  <span>PREMIUM</span>
                </div>
              )}

              {/* Blurred Photo Overlay Notice */}
              {isPhotoBlurred && (
                <div className="absolute inset-0 bg-[#211E1A]/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-10">
                  <span className="material-symbols-outlined text-4xl mb-2 text-[#E8E3D7]">lock</span>
                  <span className="font-display text-sm font-bold uppercase tracking-wider">
                    Photo confidentielle
                  </span>
                  <span className="text-xs text-[#FAF8F2]/90 mt-1 max-w-xs font-body">
                    Visibilité réservée après accord mutuel
                  </span>
                  {onRequestPhotoAccess && (
                    <button
                      type="button"
                      onClick={() => onRequestPhotoAccess(profile)}
                      className="mt-4 px-4 py-2 rounded-xl bg-white text-[#0F5C4D] font-display text-xs font-bold shadow-md hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                    >
                      {photoAccessState === 'PENDING' ? 'Demande envoyée' : "Demander l'accès"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Gallery counter bar */}
            <div className="px-5 py-3.5 bg-white border-t border-[#E8E3D7] flex items-center justify-between">
              <span className="font-serif-display font-bold text-base text-[#211E1A]">
                Photos ({allPhotos.length})
              </span>
              {allPhotos.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {allPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        activePhotoIndex === idx
                          ? 'bg-[#0F5C4D] w-5'
                          : 'bg-[#D1CABE] hover:bg-[#A89F91]'
                      }`}
                      title={`Photo ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Identity & Badges */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-3">
            <h1 className="font-serif-display text-3xl font-bold text-[#211E1A]">
              {profile.name}{' '}
              <span className="font-normal text-[#7D766C] text-2xl ml-1">
                {profile.age} ans
              </span>
            </h1>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-semibold">
                <span className="material-symbols-outlined text-sm text-[#0F5C4D]">favorite</span>
                <span>{profile.matchPercentage || 0}% compatible</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[#575147] font-medium pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-[#7D766C]">location_on</span>
                <span>{profile.city || 'Niamey'}, Niger 🇳🇪</span>
              </span>
              <span className="text-[#C9C2B5]">•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-[#7D766C]">work</span>
                <span>{profile.profession || 'Activité professionnelle'}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {profile.maritalStatus && (
                <span className="px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-medium">
                  {profile.maritalStatus}
                </span>
              )}
              {profile.profession && (
                <span className="px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-medium">
                  {profile.profession}
                </span>
              )}
              {profile.education && (
                <span className="px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-medium">
                  {profile.education}
                </span>
              )}
            </div>
          </div>

          {/* Card: Origine & langue */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">group</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                Origine & langue
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <span className="text-xs text-[#7D766C] font-medium block">Ethnie</span>
                <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                  {profile.ethnicity || 'Non renseigné'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#7D766C] font-medium block">Ville d'origine</span>
                <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                  {profile.originCity || 'Non renseigné'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-xs text-[#7D766C] font-medium block">Langue maternelle</span>
                <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                  {profile.motherTongue || 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Coran (affiché uniquement si renseigné) */}
          {(profile.quranPractice || profile.quranReading || profile.quranMemorization) && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">menu_book</span>
                </div>
                <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                  Coran
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                {profile.quranPractice ? (
                  <div className="col-span-2">
                    <span className="text-xs text-[#7D766C] font-medium block">Pratique &amp; Rapport au Coran</span>
                    <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                      {profile.quranPractice}
                    </span>
                  </div>
                ) : (
                  <>
                    {profile.quranReading && (
                      <div>
                        <span className="text-xs text-[#7D766C] font-medium block">Lecture</span>
                        <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                          {profile.quranReading}
                        </span>
                      </div>
                    )}
                    {profile.quranMemorization && (
                      <div>
                        <span className="text-xs text-[#7D766C] font-medium block">Mémorisation</span>
                        <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                          {profile.quranMemorization}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Card: À propos */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
            <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
              À propos
            </h3>
            <p className="font-body text-sm text-[#575147] leading-relaxed">
              {profile.bio || profile.presentation || (
                <span className="text-[#7D766C] italic text-sm">Non renseigné</span>
              )}
            </p>
          </div>

          {/* Card: Valeurs */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
            <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
              Valeurs
            </h3>
            {valuesTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {valuesTags.map((val, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-semibold"
                  >
                    <span className="text-xs">✨</span>
                    <span>{val}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7D766C] italic">Non renseigné</p>
            )}
          </div>

          {/* Card: Ma vision du mariage */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">favorite</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                Ma vision du mariage
              </h3>
            </div>
            <p className="font-body text-sm text-[#575147] leading-relaxed">
              {profile.familyImportance || (
                <span className="text-[#7D766C] italic text-sm">Non renseigné</span>
              )}
            </p>
          </div>

          {/* Card: Ce qu'il/elle recherche */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">group</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                {rechercheLabel}
              </h3>
            </div>
            <p className="font-body text-sm text-[#575147] leading-relaxed">
              {profile.partnerCriteria || (
                <span className="text-[#7D766C] italic text-sm">Non renseigné</span>
              )}
            </p>
          </div>

          {/* Card: Pratique religieuse */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">menu_book</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                Pratique religieuse
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-xs text-[#7D766C] font-medium block">Niveau</span>
                <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                  {profile.religion || 'Non renseigné'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#7D766C] font-medium block">Prière</span>
                <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                  {profile.religiousPracticeDetails || 'Non renseigné'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-xs text-[#7D766C] font-medium block">
                  {isFemale ? 'Tenue / Voile' : 'Apparence & Sunnah'}
                </span>
                <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
                  {profile.hijabStatus || profile.beardStatus || (isFemale ? 'Non renseigné' : 'Conforme à la Sunnah')}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Personnalité */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                Personnalité
              </h3>
            </div>
            {personalityTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {personalityTags.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-semibold"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7D766C] italic">Non renseigné</p>
            )}
          </div>

          {/* Card: Projet de vie */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">home</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                Projet de vie
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Tile 1: Situation familiale & Enfants */}
              <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#7D766C]">
                  <span className="material-symbols-outlined text-base">child_care</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Enfants
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#211E1A]">
                  {typeof profile.childrenCount === 'number' && profile.childrenCount > 0
                    ? `${profile.childrenCount} enfant${profile.childrenCount > 1 ? 's' : ''}`
                    : profile.hasChildren
                    ? (profile.hasChildren === 'Oui' || profile.hasChildren === true ? 'A des enfants' : 'Aucun enfant')
                    : 'Aucun enfant'}
                </p>
              </div>

              {/* Tile 2: Horizon de mariage */}
              <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#7D766C]">
                  <span className="material-symbols-outlined text-base">hourglass_bottom</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Horizon de mariage
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#211E1A]">
                  {profile.marriageHorizon || 'Dès que possible in sha Allah'}
                </p>
              </div>

              {/* Tile 3: Vision sur la polygamie */}
              <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#7D766C]">
                  <span className="material-symbols-outlined text-base">diversity_3</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Polygamie
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#211E1A]">
                  {profile.polygamyOpinion ||
                    (profile.maritalStatus?.includes('Polygame')
                      ? 'Déjà engagé(e)'
                      : 'Monogamie stricte souhaitée')}
                </p>
              </div>

              {/* Tile 4: Mobilité ou Vision du foyer */}
              {profile.relocation ? (
                <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#7D766C]">
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Mobilité
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#211E1A]">
                    {profile.relocation}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#7D766C]">
                    <span className="material-symbols-outlined text-base">favorite</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Vision du foyer
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#211E1A] line-clamp-2">
                    {profile.familyImportance || 'Priorité au foyer et à l\'éducation'}
                  </p>
                </div>
              )}

              {/* Optional: Hijra / Expatriation si renseigné */}
              {profile.hijraProject && (
                <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5 col-span-2">
                  <div className="flex items-center gap-1.5 text-[#7D766C]">
                    <span className="material-symbols-outlined text-base">flight</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Hijra / Expatriation
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#211E1A]">
                    {profile.hijraProject}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Ce qu'il/elle n'accepte pas */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">block</span>
              </div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                {acceptePasLabel}
              </h3>
            </div>
            <p className="font-body text-sm text-[#575147] leading-relaxed">
              {Array.isArray(profile.dealBreakers) && profile.dealBreakers.length > 0 ? (
                profile.dealBreakers.join(', ')
              ) : (
                <span className="text-[#7D766C] italic text-sm">Non renseigné</span>
              )}
            </p>
          </div>

          {/* Wali Card */}
          {profile.waliReference && (
            <div className="p-4 bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#735619]">
                <span className="material-symbols-outlined text-lg text-[#C9A45C]">shield_person</span>
                <div>
                  <p className="font-bold">Référence du Tuteur Légal (Wali)</p>
                  <p className="text-[#575147]">{profile.waliReference}</p>
                </div>
              </div>
              <span className="bg-white text-[#735619] font-bold px-2.5 py-1 rounded-full text-[10px] border border-[#C9A45C]/20">
                Validé
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E3D7] bg-white space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                if (!hasUploadedPhoto) {
                  onRequestPhotoUpload?.();
                  return;
                }
                onStartMessage(profile);
              }}
              className="flex-1 py-3.5 bg-[#0F5C4D] text-white rounded-2xl font-display text-sm font-bold hover:bg-[#0c4a3e] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg">outgoing_mail</span>
              <span>Envoyer une demande de contact</span>
            </button>

            <button
              type="button"
              onClick={() => setIdeasModalOpen(true)}
              className="py-3.5 px-4 rounded-2xl bg-white border border-[#E8E3D7] hover:bg-[#FAF8F2] text-[#211E1A] font-display text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>💡 Idées de message</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-[#7D766C]">
            Demandes aujourd'hui {currentUser?.dailyContactsCount || 0}/3
          </p>
        </div>

        {/* Message Ideas Modal */}
        <MessageIdeasModal
          isOpen={ideasModalOpen}
          onClose={() => setIdeasModalOpen(false)}
          profile={profile}
          onSelectIdea={() => {
            setIdeasModalOpen(false);
            if (hasUploadedPhoto) {
              onStartMessage(profile);
            } else {
              onRequestPhotoUpload?.();
            }
          }}
        />

        {/* Nested Report Modal */}
        {reportModalOpen && (
          <div className="absolute inset-0 bg-[#211E1A]/70 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E8E3D7] space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif-display text-base font-bold text-[#211E1A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">flag</span>
                  Signaler ce profil
                </h4>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="text-[#7D766C] hover:text-[#211E1A]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {reportSubmitted ? (
                <div className="p-4 bg-emerald-50 text-[#0F5C4D] rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  Votre signalement a été transmis à la modération.
                </div>
              ) : (
                <form onSubmit={handleSendReport} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#575147]">Motif du signalement</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full h-10 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs text-[#211E1A]"
                    >
                      <option value="Comportement inapproprié">Comportement inapproprié</option>
                      <option value="Faux profil ou usurpation">Faux profil ou usurpation</option>
                      <option value="Photo non conforme">Photo non conforme</option>
                      <option value="Autre motif">Autre motif</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#575147]">Précisions</label>
                    <textarea
                      rows={3}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      className="w-full bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl p-3 text-xs text-[#211E1A]"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#575147] hover:bg-[#FAF8F2] rounded-xl"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700"
                    >
                      Envoyer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Nested Block Modal */}
        {blockModalOpen && (
          <div className="absolute inset-0 bg-[#211E1A]/70 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E8E3D7] space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif-display text-base font-bold text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined">block</span>
                  Bloquer ce profil
                </h4>
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="text-[#7D766C] hover:text-[#211E1A]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {blockSubmitted ? (
                <div className="p-4 bg-emerald-50 text-[#0F5C4D] rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  Le profil a été bloqué avec succès.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#575147]">
                    En bloquant ce profil, vous ne verrez plus ses apparitions et il ne pourra plus interagir avec vous.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-[#575147]">Motif</label>
                    <select
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full h-10 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs text-[#211E1A]"
                    >
                      <option value="Incompatibilité">Incompatibilité</option>
                      <option value="Manque de respect">Manque de respect</option>
                      <option value="Autre motif">Autre motif</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBlockModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#575147] hover:bg-[#FAF8F2] rounded-xl"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBlock}
                      className="px-4 py-2 text-xs font-bold bg-red-700 text-white rounded-xl hover:bg-red-800"
                    >
                      Confirmer le blocage
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
