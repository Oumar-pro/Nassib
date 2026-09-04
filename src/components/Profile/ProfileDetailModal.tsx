import React from 'react';
import { Profile } from '../../types';

interface ProfileDetailModalProps {
  profile: Profile | null;
  onClose: () => void;
  onStartMessage: (profile: Profile) => void;
  onRequestPhotoAccess: (profile: Profile) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (profileId: string) => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  onClose,
  onStartMessage,
  onRequestPhotoAccess,
  isFavorited = false,
  onToggleFavorite,
}) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211E1A]/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8E3D7] max-h-[90vh] flex flex-col bg-white">
        {/* Modal Header Bar */}
        <div className="p-4 sm:p-6 border-b border-[#E8E3D7] flex justify-between items-center bg-[#FAF8F2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0F5C4D]">person</span>
            <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
              Fiche de Profil Matrimonial
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(profile.id)}
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
                  favorite
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#7D766C] hover:text-[#211E1A] hover:bg-[#FAF8F2] rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Main Top Profile Summary */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#0F5C4D] shrink-0 bg-[#FAF8F2] flex items-center justify-center">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className={`w-full h-full object-cover ${profile.photoPrivate ? 'blur-md' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F2] text-[#0F5C4D]">
                  <span className="material-symbols-outlined text-4xl text-[#8BAE9F]">person</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-[#0F5C4D] shadow-xs border border-[#E8E3D7]">
                {profile.matchPercentage}%
              </div>
            </div>

            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-[#211E1A]">
                  {profile.name}, {profile.age} ans
                </h2>
              </div>

              <p className="font-body text-xs sm:text-sm text-[#575147] flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-sm text-[#0F5C4D]">location_on</span>
                {profile.profession} • Ville : {profile.city}
              </p>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.isVerifiedNNI && (
                  <span className="bg-[#8BAE9F]/20 text-[#0F5C4D] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-[#8BAE9F]/30">
                    <span className="material-symbols-outlined text-sm font-bold">verified</span>
                    Identité NNI Vérifiée
                  </span>
                )}
                {profile.isWaliApproved && (
                  <span className="bg-[#C9A45C]/15 text-[#735619] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-[#C9A45C]/30">
                    <span className="material-symbols-outlined text-sm text-[#C9A45C]">shield_person</span>
                    Approuvé par Wali
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key Attributes Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7]">
              <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                Statut Matrimonial
              </span>
              <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                {profile.maritalStatus}
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7]">
              <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                Religion / Pratique
              </span>
              <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                {profile.religion}
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] col-span-2 sm:col-span-1">
              <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                Niveau d'Études
              </span>
              <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                {profile.education}
              </span>
            </div>
          </div>

          {/* Photo Gallery if photos exist */}
          {profile.photos && profile.photos.filter((p) => Boolean(p) && p.trim() !== '').length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-display text-sm font-bold text-[#211E1A] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#0F5C4D]">photo_library</span>
                <span>Photos du Profil ({profile.photos.filter((p) => Boolean(p) && p.trim() !== '').length})</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {profile.photos.filter((p) => Boolean(p) && p.trim() !== '').map((photoUrl, idx) => (
                  <div key={idx} className="h-32 rounded-2xl overflow-hidden border border-[#E8E3D7] bg-[#FAF8F2]">
                    <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio & Intentions */}
          <div className="space-y-2 pt-2">
            <h4 className="font-display text-sm font-bold text-[#211E1A]">
              Présentation &amp; Attentes
            </h4>
            <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed bg-[#FAF8F2] p-4 rounded-2xl border border-[#E8E3D7]">
              "{profile.bio}"
            </p>
          </div>

          {/* Wali Reference Info */}
          {profile.waliReference && (
            <div className="p-4 bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#735619]">
                <span className="material-symbols-outlined text-lg text-[#C9A45C]">supervisor_account</span>
                <div>
                  <p className="font-bold">Référence du Tuteur Légale (Wali)</p>
                  <p className="text-[#575147]">{profile.waliReference}</p>
                </div>
              </div>
              <span className="bg-white text-[#735619] font-bold px-2.5 py-1 rounded-full text-[10px] border border-[#C9A45C]/20">
                Validé
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 border-t border-[#E8E3D7] bg-[#FAF8F2] flex flex-col sm:flex-row gap-3">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(profile.id)}
              className={`px-4 py-3 rounded-xl font-display text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                isFavorited
                  ? 'bg-[#C9A45C]/20 border-[#C9A45C]/50 text-[#735619] hover:bg-[#C9A45C]/30'
                  : 'bg-white border-[#E8E3D7] text-[#575147] hover:bg-[#FAF8F2]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-base ${isFavorited ? 'text-[#C9A45C]' : ''}`}
                style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
              <span>{isFavorited ? 'Dans vos favoris' : 'Ajouter aux favoris'}</span>
            </button>
          )}

          {profile.photoPrivate ? (
            <button
              onClick={() => onRequestPhotoAccess(profile)}
              className="flex-1 py-3 bg-white border border-[#E8E3D7] text-[#211E1A] rounded-xl font-display text-xs font-bold hover:bg-[#FAF8F2] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              Demander Accès à la Photo
            </button>
          ) : null}

          <button
            onClick={() => onStartMessage(profile)}
            className="flex-1 py-3 bg-[#0F5C4D] text-white rounded-xl font-display text-xs sm:text-sm font-bold hover:bg-[#0c4a3e] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              chat
            </span>
            Démarrer une Conversation Supervisée
          </button>
        </div>
      </div>
    </div>
  );
};
