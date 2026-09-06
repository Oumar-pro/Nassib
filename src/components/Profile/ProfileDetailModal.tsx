import React, { useState } from 'react';
import { Profile, User } from '../../types';

interface ProfileDetailModalProps {
  profile: Profile | null;
  currentUser?: User;
  onClose: () => void;
  onStartMessage: (profile: Profile) => void;
  onRequestPhotoAccess: (profile: Profile) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (profileId: string) => void;
  onReport?: (profile: Profile, reason: string, description?: string) => void;
  onBlock?: (profile: Profile, reason?: string) => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  currentUser,
  onClose,
  onStartMessage,
  onRequestPhotoAccess,
  isFavorited = false,
  onToggleFavorite,
  onReport,
  onBlock,
}) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Comportement inapproprié');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('Incompatibilité');
  const [blockSubmitted, setBlockSubmitted] = useState(false);

  if (!profile) return null;

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

            {/* Report button */}
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="p-1.5 text-[#7D766C] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Signaler ce profil"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>

            {/* Block button */}
            <button
              type="button"
              onClick={() => setBlockModalOpen(true)}
              className="p-1.5 text-[#7D766C] hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Bloquer ce profil"
            >
              <span className="material-symbols-outlined text-lg">block</span>
            </button>

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
                {profile.isAdmin && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-purple-200">
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    Modérateur
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

            {profile.personality && (
              <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] col-span-2 sm:col-span-1">
                <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                  Tempérament
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  {profile.personality}
                </span>
              </div>
            )}

            {(profile.height || profile.weight) && (
              <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] col-span-2 sm:col-span-1">
                <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                  Taille &amp; Poids
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  {profile.height ? `${profile.height} cm` : ''}
                  {profile.height && profile.weight ? ' • ' : ''}
                  {profile.weight ? `${profile.weight} kg` : ''}
                </span>
              </div>
            )}

            {(profile.ethnicity || profile.originCity) && (
              <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] col-span-2 sm:col-span-1">
                <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                  Origine &amp; Ethnie
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  {profile.ethnicity || profile.originCity}
                </span>
              </div>
            )}

            {(profile.hijabStatus || profile.religiousPracticeDetails) && (
              <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] col-span-2 sm:col-span-1">
                <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                  Pratique / Tenue
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  {profile.hijabStatus || profile.religiousPracticeDetails}
                </span>
              </div>
            )}

            {profile.familyImportance && (
              <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] col-span-2">
                <span className="font-body text-[10px] text-[#7D766C] uppercase font-bold tracking-wider block">
                  Priorité Familiale
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  {profile.familyImportance}
                </span>
              </div>
            )}
          </div>

          {/* Lifestyle Info (Alcohol, Smoking) */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-xs text-[#575147]">
              <span className="material-symbols-outlined text-sm text-[#0F5C4D]">
                {profile.smokes ? 'smoking_rooms' : 'smoke_free'}
              </span>
              <span>{profile.smokes ? 'Fumeur' : 'Non-fumeur'}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-xs text-[#575147]">
              <span className="material-symbols-outlined text-sm text-[#0F5C4D]">
                {profile.drinksAlcohol ? 'local_bar' : 'no_drinks'}
              </span>
              <span>{profile.drinksAlcohol ? 'Consommation occasionnelle' : 'Ne boit pas d\'alcool'}</span>
            </div>

            {profile.interests && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-xs text-[#575147]">
                <span className="material-symbols-outlined text-sm text-[#C9A45C]">interests</span>
                <span>{profile.interests}</span>
              </div>
            )}
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
          <div className="space-y-3 pt-2">
            <h4 className="font-display text-sm font-bold text-[#211E1A] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#0F5C4D]">description</span>
              <span>Présentation Personnelle (Bio)</span>
            </h4>
            <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed bg-[#FAF8F2] p-4 rounded-2xl border border-[#E8E3D7]">
              "{profile.bio || profile.presentation || 'Aucune description rédigée.'}"
            </p>
          </div>

          {/* Ce que la personne cherche (Critères du conjoint) */}
          {profile.partnerCriteria && (
            <div className="space-y-2 pt-1">
              <h4 className="font-display text-sm font-bold text-[#0F5C4D] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#0F5C4D]">search_check</span>
                <span>Ce que la personne cherche chez son conjoint</span>
              </h4>
              <div className="p-4 bg-[#0F5C4D]/5 rounded-2xl border border-[#0F5C4D]/20 text-xs sm:text-sm text-[#211E1A] leading-relaxed">
                {profile.partnerCriteria}
              </div>
            </div>
          )}

          {/* Valeurs Cardinales du Foyer */}
          {profile.values && profile.values.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="font-display text-sm font-bold text-[#211E1A] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#C9A45C]">stars</span>
                <span>Valeurs Cardinales du Foyer</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.values.map((v, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-xs font-semibold text-[#0F5C4D]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ce qu'elle n'accepte pas (Lignes Rouges) */}
          {profile.dealBreakers && profile.dealBreakers.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="font-display text-sm font-bold text-red-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-red-600">block</span>
                <span>Ce qu'elle n'accepte pas (Lignes Rouges)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.dealBreakers.map((db, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700"
                  >
                    {db}
                  </span>
                ))}
              </div>
            </div>
          )}

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
                  Votre signalement a été transmis à la modération. Merci de préserver l'éthique de la communauté.
                </div>
              ) : (
                <form onSubmit={handleSendReport} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#575147]">Motif du signalement</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full h-10 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs text-[#211E1A]"
                    >
                      <option value="Comportement inapproprié">Comportement inapproprié</option>
                      <option value="Fausse identité / Fraude">Fausse identité / Fraude</option>
                      <option value="Non-respect du cadre islamique">Non-respect du cadre islamique</option>
                      <option value="Harcèlement ou spam">Harcèlement ou spam</option>
                      <option value="Autre motif">Autre motif</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#575147]">Précisions (optionnel)</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={3}
                      placeholder="Expliquez brièvement les faits constatés..."
                      className="w-full bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl p-3 text-xs text-[#211E1A]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="flex-1 py-2 bg-gray-100 text-[#575147] rounded-xl text-xs font-bold hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-xs"
                    >
                      Confirmer le signalement
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
                <h4 className="font-serif-display text-base font-bold text-[#211E1A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-700">block</span>
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
                  Ce membre a été bloqué. Vous ne recevrez plus de messages de sa part.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#575147] leading-relaxed">
                    En bloquant <strong>{profile.name}</strong>, cette personne ne pourra plus consulter votre profil complet ni vous envoyer de messages.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#575147]">Raison du blocage</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Ex: Incompatibilité de projet matrimonial"
                      className="w-full h-10 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs text-[#211E1A]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBlockModalOpen(false)}
                      className="flex-1 py-2 bg-gray-100 text-[#575147] rounded-xl text-xs font-bold hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBlock}
                      className="flex-1 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow-xs"
                    >
                      Bloquer définitivement
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
