import React, { useState } from 'react';
import { Profile, User, ContactRelationshipState, PhotoAccessRelationshipState } from '../../types';
import SafeImage from '../Common/SafeImage';
import { MessageIdeasModal } from '../Modals/MessageIdeasModal';

interface ProfileDetailViewProps {
  profile: Profile;
  currentUser?: User;
  contactState?: ContactRelationshipState;
  photoAccessState?: PhotoAccessRelationshipState;
  conversationId?: string;
  isFavorited?: boolean;
  onBack: () => void;
  onSendContactRequest?: (profile: Profile) => void;
  onAcceptContactRequest?: (conversationId: string) => Promise<void>;
  onRejectContactRequest?: (conversationId: string) => Promise<void>;
  onOpenConversation?: (conversationId: string) => void;
  onRequestPhotoAccess?: (profile: Profile) => void;
  onToggleFavorite?: (profileId: string) => void;
  onReport?: (profile: Profile, reason: string, description?: string) => void;
  onBlock?: (profile: Profile, reason?: string) => void;
  onStartMessage?: (profile: Profile) => void;
  onAcceptContact?: (profileId: string) => Promise<void>;
  onRejectContact?: (profileId: string) => Promise<void>;
  hasUploadedPhoto?: boolean;
  onRequestPhotoUpload?: () => void;
}

export const ProfileDetailView: React.FC<ProfileDetailViewProps> = ({
  profile,
  currentUser,
  contactState = 'NO_REQUEST',
  photoAccessState = 'NO_REQUEST',
  conversationId,
  isFavorited = false,
  onBack,
  onSendContactRequest,
  onAcceptContactRequest,
  onRejectContactRequest,
  onOpenConversation,
  onRequestPhotoAccess,
  onToggleFavorite,
  onReport,
  onBlock,
  onStartMessage,
  onAcceptContact,
  onRejectContact,
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
  const [actionLoading, setActionLoading] = useState(false);

  // Photo blurring rule:
  // Blurred IF profile.photoPrivate is true AND photo access is NOT granted
  const isPhotoBlurred = profile.photoPrivate && photoAccessState !== 'ALLOWED';

  // Build photo array
  const allPhotos: string[] = React.useMemo(() => {
    const list: string[] = [];
    if (profile.photoUrl && profile.photoUrl.trim()) {
      list.push(profile.photoUrl.trim());
    }
    if (Array.isArray(profile.photos)) {
      profile.photos.forEach((ph) => {
        if (ph && ph.trim() && !list.includes(ph.trim())) {
          list.push(ph.trim());
        }
      });
    }
    return list.length > 0 ? list : [profile.photoUrl || ''];
  }, [profile.photoUrl, profile.photos]);

  const currentPhoto = allPhotos[activePhotoIndex] || profile.photoUrl || '';

  // Personality tags extraction (strictly from user input)
  const personalityTags = React.useMemo(() => {
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
    if (profile.hobbies) {
      profile.hobbies.split(/[,;•\n]+/).forEach((t) => {
        const clean = t.trim();
        if (clean && !tags.includes(clean)) tags.push(clean);
      });
    }
    return tags;
  }, [profile.personality, profile.interests, profile.hobbies]);

  // Values tags extraction (strictly from user input)
  const valuesTags = React.useMemo(() => {
    if (Array.isArray(profile.values) && profile.values.length > 0) {
      return profile.values;
    }
    return [];
  }, [profile.values]);

  // Pronoun helper
  const isFemale = profile.gender === 'female';
  const rechercheLabel = isFemale ? "Ce qu'elle recherche" : "Ce qu'il recherche";
  const acceptePasLabel = isFemale ? "Ce qu'elle n'accepte pas" : "Ce qu'il n'accepte pas";
  const visionLabel = 'Ma vision du mariage';

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReport) {
      onReport(profile, reportReason, reportDescription);
    }
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportModalOpen(false);
    }, 1800);
  };

  const handleConfirmBlock = () => {
    if (onBlock) {
      onBlock(profile, blockReason);
    }
    setBlockSubmitted(true);
    setTimeout(() => {
      setBlockSubmitted(false);
      setBlockModalOpen(false);
      onBack();
    }, 1200);
  };

  const handlePrimaryAction = () => {
    if (!hasUploadedPhoto) {
      onRequestPhotoUpload?.();
      return;
    }
    if (contactState === 'NO_REQUEST') {
      if (typeof onSendContactRequest === 'function') {
        onSendContactRequest(profile);
      } else if (typeof onStartMessage === 'function') {
        onStartMessage(profile);
      }
    } else if (contactState === 'ACCEPTED') {
      if (typeof onOpenConversation === 'function' && conversationId) {
        onOpenConversation(conversationId);
      } else if (typeof onStartMessage === 'function') {
        onStartMessage(profile);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16 animate-fadeIn">
      {/* Photo requirement reminder for unverified / no photo users */}
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
                Pour envoyer une demande ou échanger avec {profile.name}, ajoutez au moins une photo à votre profil.
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

      {/* Top Header: Retour + Quick Moderation Menu */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-semibold text-[#211E1A] hover:text-[#0F5C4D] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="p-2 text-[#7D766C] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Signaler ce profil"
          >
            <span className="material-symbols-outlined text-lg">flag</span>
          </button>
          <button
            type="button"
            onClick={() => setBlockModalOpen(true)}
            className="p-2 text-[#7D766C] hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Bloquer ce profil"
          >
            <span className="material-symbols-outlined text-lg">block</span>
          </button>
        </div>
      </div>

      {/* Hero Photo Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E3D7] shadow-xs">
        <div className="relative w-full aspect-square sm:aspect-4/3 max-h-[500px] bg-[#FAF8F2] flex items-center justify-center overflow-hidden">
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
              <span className="material-symbols-outlined text-6xl text-[#8BAE9F]">person</span>
            </div>
          )}

          {/* Top Left Badge: Premium / Seriuex */}
          {profile.isPremium && (
            <div className="absolute top-4 left-4 z-10 bg-[#E6C687] text-[#211E1A] font-display text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 tracking-wider border border-white/50">
              <span className="material-symbols-outlined text-base">workspace_premium</span>
              <span>PREMIUM</span>
            </div>
          )}

          {/* Top Right Favorite Action */}
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
              className={`absolute top-4 right-4 z-10 w-11 h-11 rounded-full shadow-md flex items-center justify-center transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-white text-[#C9A45C] ring-2 ring-[#C9A45C]/40'
                  : 'bg-white/95 backdrop-blur-md text-[#7D766C] hover:text-[#C9A45C]'
              }`}
              title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <span
                className={`material-symbols-outlined text-2xl ${isFavorited ? 'text-[#C9A45C]' : ''}`}
                style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>
          )}

          {/* Blurred Photo Overlay Notice */}
          {isPhotoBlurred && (
            <div className="absolute inset-0 bg-[#211E1A]/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#E8E3D7]">lock</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider">
                Photo confidentielle
              </span>
              <span className="text-xs text-[#FAF8F2]/90 mt-1 max-w-xs font-body">
                Visibilité réservée après accord mutuel de contact
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

        {/* Gallery / Photos counter bar */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E3D7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif-display font-bold text-base text-[#211E1A]">
              Photos ({allPhotos.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {allPhotos.length > 1 ? (
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
            ) : (
              <span className="text-xs text-[#7D766C]">
                {profile.isPremium ? 'Accès vérifié' : 'Photo principale'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Info & Header Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-4">
        {/* Name and Age */}
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#211E1A] tracking-tight">
            {profile.name}{' '}
            <span className="font-normal text-[#7D766C] text-2xl sm:text-3xl ml-1">
              {profile.age} ans
            </span>
          </h1>
        </div>

        {/* Compatibility Pill */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-semibold">
            <span className="material-symbols-outlined text-sm text-[#0F5C4D]">favorite</span>
            <span>{profile.matchPercentage || 0}% compatible</span>
          </span>
        </div>

        {/* Location & Profession */}
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

        {/* Quick Attribute Pills */}
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
          {profile.height && (
            <span className="px-3.5 py-1.5 rounded-full bg-[#EAF5F2] text-[#0F5C4D] text-xs font-medium">
              {profile.height} cm
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
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            Origine & langue
          </h2>
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

      {/* Card: Coran */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">menu_book</span>
          </div>
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            Coran
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-xs text-[#7D766C] font-medium block">Lecture</span>
            <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
              {profile.quranReading || 'Non renseigné'}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#7D766C] font-medium block">Mémorisation</span>
            <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
              {profile.quranMemorization || 'Non renseigné'}
            </span>
          </div>
        </div>
      </div>

      {/* Card: À propos */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
        <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
          À propos
        </h2>
        <p className="font-body text-sm sm:text-base text-[#575147] leading-relaxed">
          {profile.bio || profile.presentation || (
            <span className="text-[#7D766C] italic text-sm">Non renseigné</span>
          )}
        </p>
      </div>

      {/* Card: Valeurs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
        <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
          Valeurs
        </h2>
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
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            {visionLabel}
          </h2>
        </div>
        <p className="font-body text-sm sm:text-base text-[#575147] leading-relaxed">
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
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            {rechercheLabel}
          </h2>
        </div>
        <p className="font-body text-sm sm:text-base text-[#575147] leading-relaxed">
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
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            Pratique religieuse
          </h2>
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
              {isFemale ? 'Tenue vestimentaire / Voile' : 'Barbe'}
            </span>
            <span className="text-sm font-semibold text-[#211E1A] mt-0.5 block">
              {isFemale ? profile.hijabStatus || 'Non renseigné' : profile.beardStatus || 'Non renseigné'}
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
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            Personnalité
          </h2>
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
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            Projet de vie
          </h2>
        </div>

        {/* 5 Tiles Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Tile 1: A des enfants */}
          <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#7D766C]">
              <span className="material-symbols-outlined text-base">child_care</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                A des enfants
              </span>
            </div>
            <p className="text-sm font-semibold text-[#211E1A]">
              {profile.hasChildren || 'Non spécifié'}
            </p>
          </div>

          {/* Tile 2: Souhaite des enfants */}
          <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#7D766C]">
              <span className="material-symbols-outlined text-base">group</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Souhaite des enfants
              </span>
            </div>
            <p className="text-sm font-semibold text-[#211E1A]">
              {profile.wantsChildren || 'Non spécifié'}
            </p>
          </div>

          {/* Tile 3: Ouvert au déménagement */}
          <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#7D766C]">
              <span className="material-symbols-outlined text-base">local_shipping</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Ouvert au déménagement
              </span>
            </div>
            <p className="text-sm font-semibold text-[#211E1A]">
              {profile.relocation || 'Non spécifié'}
            </p>
          </div>

          {/* Tile 4: Polygamie */}
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
                  : 'Non spécifié')}
            </p>
          </div>

          {/* Tile 5: Hijra / Expatriation */}
          <div className="p-3.5 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 space-y-1.5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[#7D766C]">
              <span className="material-symbols-outlined text-base">flight</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Hijra / Expatriation
              </span>
            </div>
            <p className="text-sm font-semibold text-[#211E1A]">
              {profile.hijraProject || 'Non spécifié'}
            </p>
          </div>
        </div>
      </div>

      {/* Card: Ce qu'il/elle n'accepte pas */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">block</span>
          </div>
          <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
            {acceptePasLabel}
          </h2>
        </div>
        <p className="font-body text-sm sm:text-base text-[#575147] leading-relaxed">
          {Array.isArray(profile.dealBreakers) && profile.dealBreakers.length > 0 ? (
            profile.dealBreakers.join(', ')
          ) : (
            <span className="text-[#7D766C] italic text-sm">Non renseigné</span>
          )}
        </p>
      </div>

      {/* Card: Tuteur Légal / Wali (si femme et renseigné) */}
      {profile.waliReference && (
        <div className="bg-[#FAF8F2] rounded-3xl p-5 border border-[#C9A45C]/30 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#735619]">
            <span className="material-symbols-outlined text-lg text-[#C9A45C]">shield_person</span>
            <h4 className="font-display text-xs font-bold">Référence du Tuteur (Wali)</h4>
          </div>
          <p className="font-body text-xs text-[#575147]">{profile.waliReference}</p>
          <div className="inline-block bg-white text-[#735619] font-bold px-2.5 py-1 rounded-full text-[10px] border border-[#C9A45C]/20">
            Supervision validée
          </div>
        </div>
      )}

      {/* Bottom Action Area / Contact Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs space-y-3">
        {/* State: Pending sent */}
        {contactState === 'PENDING_SENT' && (
          <div className="w-full py-3.5 px-4 rounded-2xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#735619] font-display text-sm font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg animate-pulse">hourglass_top</span>
            <span>Demande de contact envoyée (En attente)</span>
          </div>
        )}

        {/* State: Pending received */}
        {contactState === 'PENDING_RECEIVED' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={actionLoading}
              onClick={async () => {
                if (!hasUploadedPhoto) {
                  onRequestPhotoUpload?.();
                  return;
                }
                setActionLoading(true);
                if (typeof onAcceptContactRequest === 'function' && conversationId) {
                  await onAcceptContactRequest(conversationId);
                } else if (typeof onAcceptContact === 'function') {
                  await onAcceptContact(profile.id);
                }
                setActionLoading(false);
              }}
              className="flex-1 py-3.5 rounded-2xl bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              <span>Accepter la demande</span>
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={async () => {
                if (!hasUploadedPhoto) {
                  onRequestPhotoUpload?.();
                  return;
                }
                setActionLoading(true);
                if (typeof onRejectContactRequest === 'function' && conversationId) {
                  await onRejectContactRequest(conversationId);
                } else if (typeof onRejectContact === 'function') {
                  await onRejectContact(profile.id);
                }
                setActionLoading(false);
              }}
              className="py-3.5 px-6 rounded-2xl border border-[#D9534F]/30 text-[#D9534F] font-display text-sm font-semibold hover:bg-[#D9534F]/10 transition-colors cursor-pointer"
            >
              Refuser
            </button>
          </div>
        )}

        {/* State: Accepted -> Ouvrir la conversation */}
        {contactState === 'ACCEPTED' && (
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="w-full py-3.5 rounded-2xl bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            <span>Ouvrir la conversation supervisée</span>
          </button>
        )}

        {/* State: Rejected */}
        {contactState === 'REJECTED' && (
          <div className="w-full py-3 px-4 rounded-2xl bg-stone-100 border border-stone-300 text-stone-600 font-display text-xs font-bold text-center">
            Demande de contact refusée
          </div>
        )}

        {/* State: No request yet -> Primary CTA */}
        {contactState === 'NO_REQUEST' && (
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="w-full py-4 rounded-2xl bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-sm sm:text-base font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>Envoyer une demande de contact</span>
          </button>
        )}

        {/* Secondary CTA: Idées de message */}
        <button
          type="button"
          onClick={() => setIdeasModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-white border border-[#E8E3D7] hover:bg-[#FAF8F2] text-[#211E1A] font-display text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <span className="text-base">💡</span>
          <span>Idées de message</span>
        </button>

        {/* Subtitle Quota / Demandes aujourd'hui */}
        <p className="text-center text-xs text-[#7D766C] pt-1">
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
          handlePrimaryAction();
        }}
      />

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-[#211E1A]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-[#E8E3D7] space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-serif-display text-base font-bold text-[#211E1A] flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">flag</span>
                Signaler ce profil
              </h4>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="text-[#7D766C] hover:text-[#211E1A] p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-4 bg-[#8BAE9F]/20 text-[#0F5C4D] rounded-2xl text-center text-xs font-bold">
                Signalement transmis à l'équipe de modération avec succès.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#575147] mb-1">Motif</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E3D7] text-xs font-medium"
                  >
                    <option value="Comportement inapproprié">Comportement inapproprié</option>
                    <option value="Faux profil ou usurpation">Faux profil ou usurpation</option>
                    <option value="Photo non conforme aux règles éthiques">
                      Photo non conforme aux règles éthiques
                    </option>
                    <option value="Autre raison">Autre raison</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#575147] mb-1">
                    Précisions (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Décrivez brièvement le problème..."
                    className="w-full p-2.5 rounded-xl border border-[#E8E3D7] text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#575147] hover:bg-[#FAF8F2] cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Block Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 bg-[#211E1A]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-[#E8E3D7] space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-serif-display text-base font-bold text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined">block</span>
                Bloquer ce profil
              </h4>
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="text-[#7D766C] hover:text-[#211E1A] p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {blockSubmitted ? (
              <div className="p-4 bg-[#8BAE9F]/20 text-[#0F5C4D] rounded-2xl text-center text-xs font-bold">
                Le profil a été bloqué avec succès.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#575147] leading-relaxed">
                  En bloquant ce profil, vous ne verrez plus ses apparitions et il ne pourra plus interagir avec vous.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[#575147] mb-1">Motif de blocage</label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E3D7] text-xs font-medium"
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
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#575147] hover:bg-[#FAF8F2] cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBlock}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition-colors cursor-pointer"
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
  );
};
