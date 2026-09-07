import React, { useState } from 'react';
import { Profile, User, ContactRelationshipState, PhotoAccessRelationshipState } from '../../types';

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
}) => {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E3D7] shadow-xs flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[#575147] hover:text-[#211E1A] hover:bg-[#FAF8F2] font-display text-xs sm:text-sm font-semibold transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Retour aux profils</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(profile.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isFavorited
                  ? 'bg-[#C9A45C]/15 border-[#C9A45C]/40 text-[#735619]'
                  : 'bg-white border-[#E8E3D7] text-[#7D766C] hover:text-[#C9A45C] hover:bg-[#FAF8F2]'
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
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="p-2.5 text-[#7D766C] hover:text-red-600 hover:bg-red-50 rounded-xl border border-[#E8E3D7] transition-colors cursor-pointer"
            title="Signaler ce profil"
          >
            <span className="material-symbols-outlined text-lg">flag</span>
          </button>

          <button
            type="button"
            onClick={() => setBlockModalOpen(true)}
            className="p-2.5 text-[#7D766C] hover:text-red-700 hover:bg-red-50 rounded-xl border border-[#E8E3D7] transition-colors cursor-pointer"
            title="Bloquer ce profil"
          >
            <span className="material-symbols-outlined text-lg">block</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Main Photo with blur enforcement */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-2 border-[#0F5C4D]/20 shrink-0 bg-[#FAF8F2] flex items-center justify-center shadow-xs">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isPhotoBlurred ? 'blur-2xl scale-125 select-none pointer-events-none' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F2] text-[#0F5C4D]">
                <span className="material-symbols-outlined text-5xl text-[#8BAE9F]">person</span>
              </div>
            )}

            {/* Blurred photo overlay badge */}
            {isPhotoBlurred && (
              <div className="absolute inset-0 bg-[#211E1A]/30 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center text-white">
                <span className="material-symbols-outlined text-3xl mb-1 text-[#E8E3D7]">lock</span>
                <span className="font-display text-[11px] font-bold uppercase tracking-wider">
                  Photo Floutée
                </span>
                <span className="text-[10px] text-[#FAF8F2]/90 mt-0.5 font-body">
                  Conformément aux vœux du profil
                </span>
              </div>
            )}

            {/* Compatibility pill */}
            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-[#0F5C4D] shadow-xs border border-[#E8E3D7]">
              {profile.matchPercentage}% affinité
            </div>
          </div>

          {/* Profile Identity & Status Badges */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#211E1A]">
                {profile.name}, {profile.age} ans
              </h1>
            </div>

            <p className="font-body text-sm sm:text-base text-[#575147] flex items-center justify-center md:justify-start gap-1.5 font-medium">
              <span className="material-symbols-outlined text-base text-[#0F5C4D]">location_on</span>
              <span>{profile.profession}</span>
              <span className="text-[#8BAE9F]">•</span>
              <span>Ville : {profile.city}</span>
            </p>

            {/* Verification Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              {profile.isVerifiedNNI && (
                <span className="bg-[#8BAE9F]/20 text-[#0F5C4D] px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#8BAE9F]/30">
                  <span className="material-symbols-outlined text-sm font-bold">verified</span>
                  Identité NNI Vérifiée
                </span>
              )}
              {profile.isWaliApproved && (
                <span className="bg-[#C9A45C]/15 text-[#735619] px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#C9A45C]/30">
                  <span className="material-symbols-outlined text-sm text-[#C9A45C]">shield_person</span>
                  Approuvé par Wali
                </span>
              )}
              {profile.isAdmin && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-purple-200">
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                  Modérateur
                </span>
              )}
            </div>

            {/* Action Bar / Contact Request / Messaging State */}
            <div className="pt-4 border-t border-[#E8E3D7] flex flex-wrap gap-3 items-center justify-center md:justify-start">
              {/* Relationship Action Controls */}
              {contactState === 'NO_REQUEST' && (
                <button
                  onClick={() => {
                    if (typeof onSendContactRequest === 'function') {
                      onSendContactRequest(profile);
                    } else if (typeof onStartMessage === 'function') {
                      onStartMessage(profile);
                    }
                  }}
                  className="px-5 py-3 rounded-2xl bg-[#0F5C4D] text-white font-display text-xs sm:text-sm font-bold hover:bg-[#0c4a3e] transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">outgoing_mail</span>
                  Envoyer une demande de contact
                </button>
              )}

              {contactState === 'PENDING_SENT' && (
                <div className="px-4 py-2.5 rounded-2xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#735619] font-display text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base animate-pulse">hourglass_top</span>
                  Demande de contact envoyée (En attente d'acceptation)
                </div>
              )}

              {contactState === 'PENDING_RECEIVED' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-display font-semibold text-[#575147]">
                    Demande de contact reçue :
                  </span>
                  <button
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      if (typeof onAcceptContactRequest === 'function' && conversationId) {
                        await onAcceptContactRequest(conversationId);
                      } else if (typeof onAcceptContact === 'function') {
                        await onAcceptContact(profile.id);
                      }
                      setActionLoading(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0F5C4D] text-white font-display text-xs font-bold hover:bg-[#0c4a3e] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Accepter
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      if (typeof onRejectContactRequest === 'function' && conversationId) {
                        await onRejectContactRequest(conversationId);
                      } else if (typeof onRejectContact === 'function') {
                        await onRejectContact(profile.id);
                      }
                      setActionLoading(false);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#D9534F]/30 text-[#D9534F] font-display text-xs font-semibold hover:bg-[#D9534F]/10 transition-colors cursor-pointer"
                  >
                    Refuser
                  </button>
                </div>
              )}

              {contactState === 'ACCEPTED' && (
                <button
                  onClick={() => {
                    if (typeof onOpenConversation === 'function' && conversationId) {
                      onOpenConversation(conversationId);
                    } else if (typeof onStartMessage === 'function') {
                      onStartMessage(profile);
                    }
                  }}
                  className="px-5 py-3 rounded-2xl bg-[#0F5C4D] text-white font-display text-xs sm:text-sm font-bold hover:bg-[#0c4a3e] transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  Ouvrir la conversation supervisée
                </button>
              )}

              {contactState === 'REJECTED' && (
                <div className="px-4 py-2.5 rounded-2xl bg-stone-100 border border-stone-300 text-stone-600 font-display text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">block</span>
                  Demande de contact refusée
                </div>
              )}

              {/* Photo Request Action */}
              {profile.photoPrivate && (
                <div>
                  {photoAccessState === 'ALLOWED' ? (
                    <span className="px-3.5 py-2 rounded-xl bg-[#8BAE9F]/20 border border-[#8BAE9F]/40 text-[#0F5C4D] font-display text-xs font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">lock_open</span>
                      Photos déverrouillées
                    </span>
                  ) : photoAccessState === 'PENDING' ? (
                    <span className="px-3.5 py-2 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#735619] font-display text-xs font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm animate-pulse">hourglass_top</span>
                      Demande d'accès photos en cours
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (typeof onRequestPhotoAccess === 'function') {
                          onRequestPhotoAccess(profile);
                        }
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-white border border-[#E8E3D7] text-[#211E1A] font-display text-xs font-bold hover:bg-[#FAF8F2] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Demander l'accès aux photos
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Key Specs & Attributes */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E3D7] shadow-xs space-y-4">
            <h3 className="font-serif-display text-base font-bold text-[#211E1A] flex items-center gap-2 border-b border-[#E8E3D7] pb-3">
              <span className="material-symbols-outlined text-[#0F5C4D]">tune</span>
              Caractéristiques clés
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                  Statut Matrimonial
                </span>
                <span className="font-display font-semibold text-[#211E1A] text-sm">
                  {profile.maritalStatus}
                </span>
              </div>

              <div>
                <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                  Pratique Religieuse
                </span>
                <span className="font-display font-semibold text-[#211E1A] text-sm">
                  {profile.religion}
                </span>
              </div>

              <div>
                <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                  Niveau d'Études
                </span>
                <span className="font-display font-semibold text-[#211E1A] text-sm">
                  {profile.education}
                </span>
              </div>

              {profile.personality && (
                <div>
                  <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                    Tempérament
                  </span>
                  <span className="font-display font-semibold text-[#211E1A] text-sm">
                    {profile.personality}
                  </span>
                </div>
              )}

              {(profile.height || profile.weight) && (
                <div>
                  <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                    Taille & Poids
                  </span>
                  <span className="font-display font-semibold text-[#211E1A] text-sm">
                    {profile.height ? `${profile.height} cm` : ''}
                    {profile.height && profile.weight ? ' • ' : ''}
                    {profile.weight ? `${profile.weight} kg` : ''}
                  </span>
                </div>
              )}

              {(profile.ethnicity || profile.originCity) && (
                <div>
                  <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                    Origine / Ethnie
                  </span>
                  <span className="font-display font-semibold text-[#211E1A] text-sm">
                    {profile.ethnicity || profile.originCity}
                  </span>
                </div>
              )}

              {(profile.hijabStatus || profile.religiousPracticeDetails) && (
                <div>
                  <span className="text-[#7D766C] font-body uppercase font-bold tracking-wider block text-[10px]">
                    Tenue & Pratique
                  </span>
                  <span className="font-display font-semibold text-[#211E1A] text-sm">
                    {profile.hijabStatus || profile.religiousPracticeDetails}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Wali Reference Card if provided */}
          {profile.waliReference && (
            <div className="bg-[#FAF8F2] rounded-3xl p-5 border border-[#C9A45C]/30 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-[#735619]">
                <span className="material-symbols-outlined text-lg text-[#C9A45C]">shield_person</span>
                <h4 className="font-display text-xs font-bold">Référence du Tuteur (Wali)</h4>
              </div>
              <p className="font-body text-xs text-[#575147]">
                {profile.waliReference}
              </p>
              <div className="inline-block bg-white text-[#735619] font-bold px-2.5 py-1 rounded-full text-[10px] border border-[#C9A45C]/20">
                Supervision validée
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Bio, Criteria, Values, Deal-breakers */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio / Presentation */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-3">
            <h3 className="font-serif-display text-base font-bold text-[#211E1A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0F5C4D]">format_quote</span>
              Présentation Personnelle
            </h3>
            <p className="font-body text-sm sm:text-base text-[#575147] leading-relaxed bg-[#FAF8F2] p-5 rounded-2xl border border-[#E8E3D7]">
              "{profile.bio || profile.presentation || 'Aucune description rédigée.'}"
            </p>
          </div>

          {/* Ce que la personne cherche */}
          {profile.partnerCriteria && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-3">
              <h3 className="font-serif-display text-base font-bold text-[#0F5C4D] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F5C4D]">search_check</span>
                Critères du conjoint recherché
              </h3>
              <p className="font-body text-sm sm:text-base text-[#211E1A] leading-relaxed bg-[#0F5C4D]/5 p-5 rounded-2xl border border-[#0F5C4D]/15">
                {profile.partnerCriteria}
              </p>
            </div>
          )}

          {/* Valeurs Cardinales */}
          {profile.values && profile.values.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-3">
              <h3 className="font-serif-display text-base font-bold text-[#211E1A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C9A45C]">stars</span>
                Valeurs Cardinales du Foyer
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {profile.values.map((val, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl font-display text-xs font-semibold text-[#0F5C4D]"
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lignes Rouges */}
          {profile.dealBreakers && profile.dealBreakers.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-3">
              <h3 className="font-serif-display text-base font-bold text-red-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">block</span>
                Ce qui n'est pas accepté (Lignes Rouges)
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {profile.dealBreakers.map((db, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 bg-red-50 border border-red-200 rounded-xl font-display text-xs font-semibold text-red-700"
                  >
                    {db}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
                    <option value="Photo non conforme aux règles éthiques">Photo non conforme aux règles éthiques</option>
                    <option value="Autre raison">Autre raison</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#575147] mb-1">Précisions (optionnel)</label>
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
