import React, { useState } from 'react';
import { Profile } from '../../types';

interface ContactRequestModalProps {
  targetProfile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSend: (targetProfile: Profile, message: string) => Promise<boolean>;
}

export const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  targetProfile,
  isOpen,
  onClose,
  onSend,
}) => {
  const [message, setMessage] = useState(
    `As-salamu alaykum ${targetProfile.name}. Votre profil et vos critères ont retenu mon attention dans le cadre d'un projet de mariage sérieux et pieux.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = message.trim();
    if (!cleanMsg) {
      setError('Veuillez rédiger un message de présentation.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const ok = await onSend(targetProfile, cleanMsg);
      if (ok) {
        onClose();
      } else {
        setError('Impossible d’envoyer la demande pour le moment.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l’envoi de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#211E1A]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E8E3D7] space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#211E1A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0F5C4D]">outgoing_mail</span>
              Demande de contact
            </h3>
            <p className="font-body text-xs text-[#575147]">
              Adressez votre premier message de présentation à <span className="font-bold text-[#211E1A]">{targetProfile.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7D766C] hover:text-[#211E1A] p-1.5 rounded-full hover:bg-[#FAF8F2] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Informative Islamic Guideline Box */}
        <div className="p-3.5 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] text-xs font-body text-[#575147] flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base text-[#0F5C4D] shrink-0 mt-0.5">verified_user</span>
          <div>
            <span className="font-bold text-[#211E1A]">Cadre respectueux et supervisé :</span>
            <p className="mt-0.5">
              Ce message constitue votre unique demande de contact. Vous pourrez échanger davantage une fois que {targetProfile.name} aura accepté votre démarche.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-display text-xs font-bold text-[#211E1A] mb-1.5">
              Votre premier message de présentation
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez brièvement vos intentions et vos valeurs..."
              className="w-full p-3.5 rounded-2xl border border-[#E8E3D7] text-xs sm:text-sm font-body focus:outline-none focus:border-[#0F5C4D] bg-white transition-colors"
            />
            <span className="text-[11px] text-[#7D766C] font-body block text-right mt-1">
              {message.length} caractères
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8E3D7]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#575147] hover:bg-[#FAF8F2] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  Envoi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Envoyer la demande
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
