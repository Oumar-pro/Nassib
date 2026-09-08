import React, { useState } from 'react';
import { Conversation, Profile, User } from '../../types';
import SafeImage from '../Common/SafeImage';

export interface PhotoRequestItem {
  id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  note?: string;
  requester_profile_id: string;
  target_profile_id: string;
  requester?: {
    id: string;
    name: string;
    age: number;
    city: string;
    profession?: string;
    photo_url?: string;
  };
  target?: {
    id: string;
    name: string;
    age: number;
    city: string;
    profession?: string;
    photo_url?: string;
  };
}

interface RequestsViewProps {
  user: User;
  conversations?: Conversation[];
  contactRequests?: Conversation[];
  sentContactRequests?: Conversation[];
  receivedPhotoRequests?: PhotoRequestItem[];
  sentPhotoRequests?: PhotoRequestItem[];
  profiles?: Profile[];
  onAcceptContact: (conversationId: string) => Promise<void>;
  onRejectContact: (conversationId: string) => Promise<void>;
  onAcceptPhotoRequest: (requestId: string) => Promise<void>;
  onRejectPhotoRequest: (requestId: string) => Promise<void>;
  onOpenConversation: (conversationId: string) => void;
  onViewProfile: (profileId: string) => void;
  hasUploadedPhoto?: boolean;
  onRequestPhotoUpload?: () => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  user,
  conversations = [],
  contactRequests,
  sentContactRequests: sentContactRequestsProp,
  receivedPhotoRequests = [],
  sentPhotoRequests = [],
  profiles = [],
  onAcceptContact,
  onRejectContact,
  onAcceptPhotoRequest,
  onRejectPhotoRequest,
  onOpenConversation,
  onViewProfile,
  hasUploadedPhoto = true,
  onRequestPhotoUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'photo'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const myProfileId = user.profileId || user.id;

  // Received contact requests:
  // Conversations where status === 'pending' AND requesterId !== myProfileId (or candidateId !== myProfileId)
  const receivedContactRequests =
    contactRequests ??
    (conversations || []).filter((c) => {
      if (c.status !== 'pending') return false;
      if (c.requesterId) {
        return c.requesterId !== myProfileId;
      }
      // Fallback: if candidateId === myProfileId, then candidate was requester
      return c.candidateId !== myProfileId;
    });

  // Sent contact requests:
  // Conversations where status === 'pending' AND requesterId === myProfileId (or candidateId === myProfileId)
  const sentContactRequests =
    sentContactRequestsProp ??
    (conversations || []).filter((c) => {
      if (c.status !== 'pending') return false;
      if (c.requesterId) {
        return c.requesterId === myProfileId;
      }
      return c.candidateId === myProfileId;
    });

  const pendingReceivedPhotos = (receivedPhotoRequests || []).filter((r) => r.status === 'pending');
  const totalReceivedPending = (receivedContactRequests || []).length + pendingReceivedPhotos.length;

  const handleAction = async (id: string, actionFn: (id: string) => Promise<void>) => {
    if (!hasUploadedPhoto) {
      onRequestPhotoUpload?.();
      return;
    }
    setProcessingId(id);
    try {
      await actionFn(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!hasUploadedPhoto && (
        <div className="p-4 bg-white border border-[#C9A45C]/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#C9A45C] shrink-0">
              add_a_photo
            </span>
            <div>
              <p className="font-display font-bold text-xs sm:text-sm text-[#211E1A]">
                Photo de profil requise pour interagir
              </p>
              <p className="font-body text-xs text-[#575147]">
                Vous pouvez consulter les profils. Pour accepter une demande ou échanger, vous devez ajouter au moins une photo.
              </p>
            </div>
          </div>
          {onRequestPhotoUpload && (
            <button
              type="button"
              onClick={onRequestPhotoUpload}
              className="px-4 py-2 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              Ajouter une photo
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#211E1A] flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#0F5C4D] text-3xl">inbox</span>
              Demandes
            </h1>
            <p className="font-body text-sm text-[#575147] mt-1">
              Gérez vos demandes de mise en relation et vos autorisations d'accès aux photos
            </p>
          </div>

          {/* Main Tab Switcher */}
          <div className="flex bg-[#FAF8F2] p-1.5 rounded-2xl border border-[#E8E3D7] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'received'
                  ? 'bg-white text-[#0F5C4D] shadow-xs'
                  : 'text-[#7D766C] hover:text-[#211E1A]'
              }`}
            >
              <span>Reçues</span>
              {totalReceivedPending > 0 && (
                <span className="bg-[#0F5C4D] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {totalReceivedPending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-white text-[#0F5C4D] shadow-xs'
                  : 'text-[#7D766C] hover:text-[#211E1A]'
              }`}
            >
              <span>Envoyées</span>
              {(sentContactRequests.length + sentPhotoRequests.length) > 0 && (
                <span className="bg-[#FAF8F2] border border-[#E8E3D7] text-[#575147] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {sentContactRequests.length + sentPhotoRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#E8E3D7]">
          <span className="font-body text-xs text-[#7D766C] mr-1">Filtrer par :</span>
          {(
            [
              ['all', 'Toutes les demandes'],
              ['contact', 'Demandes de contact'],
              ['photo', 'Accès aux photos'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 rounded-xl font-display text-xs font-medium transition-colors cursor-pointer ${
                filterType === key
                  ? 'bg-[#0F5C4D] text-white'
                  : 'bg-[#FAF8F2] text-[#575147] hover:bg-[#E8E3D7] border border-[#E8E3D7]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content: RECEIVED */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {/* Section Contact Requests */}
          {(filterType === 'all' || filterType === 'contact') && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-[#575147] uppercase tracking-wider px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#0F5C4D]">chat</span>
                Demandes de contact reçues ({receivedContactRequests.length})
              </h2>

              {receivedContactRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-[#E8E3D7] text-center text-xs text-[#7D766C]">
                  Aucune demande de contact en attente.
                </div>
              ) : (
                receivedContactRequests.map((conv) => (
                  <div
                    key={conv.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs hover:border-[#8BAE9F]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        onClick={() => onViewProfile(conv.participantId)}
                        className="w-14 h-14 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90"
                      >
                        {conv.participantAvatar ? (
                          <SafeImage
                            src={conv.participantAvatar}
                            alt={conv.participantName}
                            fallbackName={conv.participantName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8BAE9F]">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>

                      {/* Info & First Message */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => onViewProfile(conv.participantId)}
                            className="font-display font-bold text-base text-[#211E1A] hover:text-[#0F5C4D] text-left transition-colors cursor-pointer"
                          >
                            {conv.participantName}
                          </button>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-[#575147] text-[11px] font-body border border-[#E8E3D7]">
                            {conv.participantCity}
                          </span>
                          <span className="bg-[#C9A45C]/15 text-[#735619] font-display text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Premier message
                          </span>
                        </div>

                        {/* Request Message Box */}
                        <div className="bg-[#FAF8F2] rounded-xl p-3 border border-[#E8E3D7]/70 text-xs sm:text-sm font-body text-[#211E1A] italic">
                          « {conv.lastMessage || 'Bonjour, votre profil a retenu mon attention.'} »
                        </div>
                        <p className="font-body text-[11px] text-[#7D766C]">
                          Reçue {conv.lastMessageTime}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <button
                        onClick={() => onViewProfile(conv.participantId)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E3D7] text-[#575147] font-display text-xs font-semibold hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                      >
                        Voir profil
                      </button>
                      <button
                        disabled={processingId === conv.id}
                        onClick={() => handleAction(conv.id, onRejectContact)}
                        className="px-3.5 py-2 rounded-xl border border-[#D9534F]/30 text-[#D9534F] font-display text-xs font-semibold hover:bg-[#D9534F]/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Refuser
                      </button>
                      <button
                        disabled={processingId === conv.id}
                        onClick={() => handleAction(conv.id, onAcceptContact)}
                        className="px-4 py-2 rounded-xl bg-[#0F5C4D] text-white font-display text-xs font-bold hover:bg-[#0c4a3e] transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Accepter
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section Photo Access Requests */}
          {(filterType === 'all' || filterType === 'photo') && (
            <div className="space-y-3 pt-4">
              <h2 className="font-display text-sm font-bold text-[#575147] uppercase tracking-wider px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#0F5C4D]">visibility</span>
                Demandes d'accès aux photos reçues ({receivedPhotoRequests.length})
              </h2>

              {receivedPhotoRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-[#E8E3D7] text-center text-xs text-[#7D766C]">
                  Aucune demande d'accès aux photos reçue.
                </div>
              ) : (
                receivedPhotoRequests.map((req) => {
                  const isAccepted = req.status === 'accepted' || (req as any).status === 'approved';
                  const isRejected = req.status === 'rejected';
                  const isPending = req.status === 'pending';

                  return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs hover:border-[#8BAE9F]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        onClick={() => onViewProfile(req.requester_profile_id)}
                        className="w-14 h-14 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90"
                      >
                        {req.requester?.photo_url ? (
                          <SafeImage
                            src={req.requester.photo_url}
                            alt={req.requester.name}
                            fallbackName={req.requester.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8BAE9F]">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => onViewProfile(req.requester_profile_id)}
                            className="font-display font-bold text-base text-[#211E1A] hover:text-[#0F5C4D] text-left transition-colors cursor-pointer"
                          >
                            {req.requester?.name || 'Membre intéressé'}
                          </button>
                          {req.requester?.city && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-[#575147] text-[11px] font-body border border-[#E8E3D7]">
                              {req.requester.city}
                            </span>
                          )}
                          {isAccepted && (
                            <span className="bg-[#8BAE9F]/20 text-[#0F5C4D] border border-[#8BAE9F]/40 font-display text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Acceptée • Accès accordé
                            </span>
                          )}
                          {isRejected && (
                            <span className="bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/30 font-display text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">cancel</span>
                              Refusée
                            </span>
                          )}
                          {isPending && (
                            <span className="bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 font-display text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs animate-pulse">hourglass_top</span>
                              En attente
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-[#575147]">
                          {isAccepted
                            ? 'Vous avez autorisé ce membre à voir vos photos de profil.'
                            : isRejected
                            ? 'Vous avez refusé la demande d’accès aux photos.'
                            : 'Demande la permission de voir vos photos sans floutage.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <button
                        onClick={() => onViewProfile(req.requester_profile_id)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E3D7] text-[#575147] font-display text-xs font-semibold hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                      >
                        Voir profil
                      </button>
                      {isPending && (
                        <>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req.id, onRejectPhotoRequest)}
                            className="px-3.5 py-2 rounded-xl border border-[#D9534F]/30 text-[#D9534F] font-display text-xs font-semibold hover:bg-[#D9534F]/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Refuser
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req.id, onAcceptPhotoRequest)}
                            className="px-4 py-2 rounded-xl bg-[#0F5C4D] text-white font-display text-xs font-bold hover:bg-[#0c4a3e] transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">lock_open</span>
                            Autoriser
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: SENT */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {/* Section Sent Contact Requests */}
          {(filterType === 'all' || filterType === 'contact') && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-[#575147] uppercase tracking-wider px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#0F5C4D]">outgoing_mail</span>
                Demandes de contact envoyées ({sentContactRequests.length})
              </h2>

              {sentContactRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-[#E8E3D7] text-center text-xs text-[#7D766C]">
                  Aucune demande de contact envoyée pour le moment.
                </div>
              ) : (
                sentContactRequests.map((conv) => (
                  <div
                    key={conv.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        onClick={() => onViewProfile(conv.participantId)}
                        className="w-14 h-14 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90"
                      >
                        {conv.participantAvatar ? (
                          <SafeImage
                            src={conv.participantAvatar}
                            alt={conv.participantName}
                            fallbackName={conv.participantName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8BAE9F]">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewProfile(conv.participantId)}
                            className="font-display font-bold text-base text-[#211E1A] hover:text-[#0F5C4D] text-left transition-colors cursor-pointer"
                          >
                            {conv.participantName}
                          </button>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-[#575147] text-[11px] font-body border border-[#E8E3D7]">
                            {conv.participantCity}
                          </span>
                        </div>
                        <div className="bg-[#FAF8F2] rounded-xl p-3 border border-[#E8E3D7]/70 text-xs sm:text-sm font-body text-[#575147]">
                          Votre message : « {conv.lastMessage} »
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                      <span className="bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#735619] font-display text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm animate-pulse">hourglass_top</span>
                        En attente d'acceptation
                      </span>
                      <button
                        onClick={() => onViewProfile(conv.participantId)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E3D7] text-[#575147] font-display text-xs font-semibold hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                      >
                        Voir profil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section Sent Photo Access Requests */}
          {(filterType === 'all' || filterType === 'photo') && (
            <div className="space-y-3 pt-4">
              <h2 className="font-display text-sm font-bold text-[#575147] uppercase tracking-wider px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#0F5C4D]">photo_camera</span>
                Demandes d'accès aux photos envoyées ({sentPhotoRequests.length})
              </h2>

              {sentPhotoRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-[#E8E3D7] text-center text-xs text-[#7D766C]">
                  Aucune demande d'accès aux photos envoyée.
                </div>
              ) : (
                sentPhotoRequests.map((req) => {
                  const targetName = req.target?.name || 'Membre NASSIB';
                  const isAccepted = req.status === 'accepted' || (req as any).status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E8E3D7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          onClick={() => onViewProfile(req.target_profile_id)}
                          className="w-14 h-14 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90"
                        >
                          {req.target?.photo_url ? (
                            <SafeImage
                              src={req.target.photo_url}
                              alt={targetName}
                              fallbackName={targetName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8BAE9F]">
                              <span className="material-symbols-outlined text-2xl">person</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <button
                            onClick={() => onViewProfile(req.target_profile_id)}
                            className="font-display font-bold text-base text-[#211E1A] hover:text-[#0F5C4D] text-left transition-colors cursor-pointer"
                          >
                            {targetName}
                          </button>
                          <p className="font-body text-xs text-[#575147]">
                            Demande d'accès aux photos protégées
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                        {isAccepted ? (
                          <span className="bg-[#8BAE9F]/20 text-[#0F5C4D] border border-[#8BAE9F]/40 font-display text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Acceptée • Photos débloquées
                          </span>
                        ) : isRejected ? (
                          <span className="bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/30 font-display text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            Refusée
                          </span>
                        ) : (
                          <span className="bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 font-display text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm animate-pulse">hourglass_top</span>
                            En attente
                          </span>
                        )}

                        <button
                          onClick={() => onViewProfile(req.target_profile_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E3D7] text-[#575147] font-display text-xs font-semibold hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                        >
                          Voir profil
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
