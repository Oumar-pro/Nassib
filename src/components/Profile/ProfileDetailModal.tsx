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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151c27]/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#bec9c2]/50 max-h-[90vh] flex flex-col bg-white">
        {/* Modal Header Bar */}
        <div className="p-4 sm:p-6 border-b border-[#bec9c2]/30 flex justify-between items-center bg-[#f9f9ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004532]">person</span>
            <h3 className="font-display text-lg font-bold text-[#151c27]">
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
                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                    : 'text-[#6f7973] hover:text-rose-600 hover:bg-[#dce2f3]/50'
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
            <button
              onClick={onClose}
              className="p-1.5 text-[#6f7973] hover:text-[#151c27] hover:bg-[#dce2f3]/50 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Main Top Profile Summary */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#004532] shrink-0 bg-slate-100 flex items-center justify-center">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className={`w-full h-full object-cover ${profile.photoPrivate ? 'blur-md' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-[#004532]">
                  <span className="material-symbols-outlined text-4xl text-[#004532]/40">person</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-[#004532] shadow-xs">
                {profile.matchPercentage}%
              </div>
            </div>

            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-[#151c27]">
                  {profile.name}, {profile.age} ans
                </h2>
                {profile.isPremium && (
                  <span className="gold-gradient text-[#574500] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    PREMIUM
                  </span>
                )}
              </div>

              <p className="font-body text-xs sm:text-sm text-[#3f4944] flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-sm text-[#004532]">location_on</span>
                {profile.profession} • Ville : {profile.city}
              </p>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.isVerifiedNNI && (
                  <span className="bg-[#065f46]/10 text-[#004532] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm font-bold">verified</span>
                    Identité NNI Vérifiée
                  </span>
                )}
                {profile.isWaliApproved && (
                  <span className="bg-[#fed65b]/20 text-[#745c00] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">shield_person</span>
                    Approuvé par Wali
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key Attributes Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[#f0f3ff] rounded-2xl border border-[#bec9c2]/30">
              <span className="font-body text-[10px] text-[#6f7973] uppercase font-bold tracking-wider block">
                Statut Matrimonial
              </span>
              <span className="font-display text-xs sm:text-sm font-bold text-[#151c27]">
                {profile.maritalStatus}
              </span>
            </div>

            <div className="p-3 bg-[#f0f3ff] rounded-2xl border border-[#bec9c2]/30">
              <span className="font-body text-[10px] text-[#6f7973] uppercase font-bold tracking-wider block">
                Religion / Pratique
              </span>
              <span className="font-display text-xs sm:text-sm font-bold text-[#151c27]">
                {profile.religion}
              </span>
            </div>

            <div className="p-3 bg-[#f0f3ff] rounded-2xl border border-[#bec9c2]/30 col-span-2 sm:col-span-1">
              <span className="font-body text-[10px] text-[#6f7973] uppercase font-bold tracking-wider block">
                Niveau d'Études
              </span>
              <span className="font-display text-xs sm:text-sm font-bold text-[#151c27]">
                {profile.education}
              </span>
            </div>
          </div>

          {/* Photo Gallery if photos exist */}
          {profile.photos && profile.photos.filter((p) => Boolean(p) && p.trim() !== '').length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-display text-sm font-bold text-[#151c27] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#004532]">photo_library</span>
                <span>Photos du Profil ({profile.photos.filter((p) => Boolean(p) && p.trim() !== '').length})</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {profile.photos.filter((p) => Boolean(p) && p.trim() !== '').map((photoUrl, idx) => (
                  <div key={idx} className="h-32 rounded-2xl overflow-hidden border border-[#bec9c2]/40 bg-slate-100">
                    <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio & Intentions */}
          <div className="space-y-2 pt-2">
            <h4 className="font-display text-sm font-bold text-[#151c27]">
              Présentation &amp; Attentes
            </h4>
            <p className="font-body text-xs sm:text-sm text-[#3f4944] leading-relaxed bg-[#f9f9ff] p-4 rounded-2xl border border-[#bec9c2]/30">
              "{profile.bio}"
            </p>
          </div>

          {/* Wali Reference Info */}
          {profile.waliReference && (
            <div className="p-4 bg-[#fed65b]/10 border border-[#fed65b]/30 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#745c00]">
                <span className="material-symbols-outlined text-lg">supervisor_account</span>
                <div>
                  <p className="font-bold">Référence du Tuteur Légale (Wali)</p>
                  <p className="text-[#3f4944]">{profile.waliReference}</p>
                </div>
              </div>
              <span className="bg-white text-[#745c00] font-bold px-2.5 py-1 rounded-full text-[10px]">
                Validé
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 border-t border-[#bec9c2]/30 bg-[#f9f9ff] flex flex-col sm:flex-row gap-3">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(profile.id)}
              className={`px-4 py-3 rounded-xl font-display text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                isFavorited
                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                  : 'bg-white border-[#bec9c2]/50 text-[#3f4944] hover:bg-[#f0f3ff]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-base ${isFavorited ? 'text-rose-600' : ''}`}
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
              className="flex-1 py-3 bg-[#e2e8f8] text-[#151c27] rounded-xl font-display text-xs font-bold hover:bg-[#dce2f3] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              Demander Accès à la Photo
            </button>
          ) : null}

          <button
            onClick={() => onStartMessage(profile)}
            className="flex-1 py-3 bg-[#004532] text-white rounded-xl font-display text-xs sm:text-sm font-bold hover:bg-[#065f46] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
