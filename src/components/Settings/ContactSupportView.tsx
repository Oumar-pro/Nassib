import React, { useState } from 'react';
import { User, Profile } from '../../types';

interface ContactSupportViewProps {
  user: User;
  profile?: Profile | null;
  onBack: () => void;
  onShowNotice?: (msg: string) => void;
}

const ISSUE_TYPES = [
  { id: 'technique', label: 'Problème technique ou bug d\'affichage', icon: 'bug_report' },
  { id: 'paiement', label: 'Paiement, abonnement ou souscription', icon: 'credit_card' },
  { id: 'compte', label: 'Compte, connexion ou modification de profil', icon: 'manage_accounts' },
  { id: 'verification', label: 'Vérification d\'identité & carte d\'identité', icon: 'badge' },
  { id: 'signalement', label: 'Signalement d\'un profil ou comportement', icon: 'flag' },
  { id: 'suggestion', label: 'Question générale ou suggestion', icon: 'lightbulb' },
  { id: 'autre', label: 'Autre demande ou préoccupation', icon: 'help_outline' },
];

export const ContactSupportView: React.FC<ContactSupportViewProps> = ({
  user,
  profile,
  onBack,
  onShowNotice,
}) => {
  const [selectedType, setSelectedType] = useState<string>('technique');
  const [description, setDescription] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>(user.phone || profile?.phone || '');
  const [contactName, setContactName] = useState<string>(user.name || profile?.name || '');
  const [contactEmail, setContactEmail] = useState<string>(user.email || profile?.email || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setErrorMessage('Veuillez décrire votre problème ou votre question.');
      return;
    }

    if (cleanDesc.length < 10) {
      setErrorMessage('Merci de fournir une description un peu plus détaillée (au moins 10 caractères).');
      return;
    }

    const typeObj = ISSUE_TYPES.find((t) => t.id === selectedType);
    const issueTypeLabel = typeObj ? typeObj.label : selectedType;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || profile?.id || null,
          userName: contactName.trim() || user.name || 'Membre Nassib',
          userEmail: contactEmail.trim() || user.email || null,
          userPhone: contactPhone.trim() || user.phone || null,
          issueType: issueTypeLabel,
          description: cleanDesc,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Une erreur est survenue lors de l\'envoi.');
      }

      setIsSuccess(true);
      setDescription('');
      if (onShowNotice) {
        onShowNotice('Votre message a été transmis avec succès à l’assistance.');
      }
    } catch (err: any) {
      console.error('Erreur transmission support:', err);
      setErrorMessage(
        err?.message || 'Impossible de transmettre le message pour le moment. Veuillez vérifier votre connexion.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
      {/* Header section */}
      <div className="flex items-start gap-4 pb-5 border-b border-[#E8E3D7]">
        <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#211E1A]">
            Contacter le support / Signaler un problème
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#575147] mt-1 leading-relaxed">
            Une question, un blocage technique, un paiement ou un souci particulier ? Décrivez votre situation ci-dessous. Notre équipe d'assistance reçoit directement votre demande.
          </p>
        </div>
      </div>

      {isSuccess ? (
        <div className="py-8 text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif-display text-xl font-bold text-[#211E1A]">
              Message transmis avec succès
            </h3>
            <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed">
              Votre demande a bien été envoyée à l’administrateur. Notre équipe l'examine avec attention et prendra contact avec vous si nécessaire.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E8E3D7] text-xs font-semibold text-[#575147] hover:bg-[#FAF8F2] transition-colors cursor-pointer"
            >
              Envoyer un autre message
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0a4337] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Retourner aux paramètres
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Type de problème */}
          <div className="space-y-2.5">
            <label className="block font-body text-xs font-bold text-[#211E1A] uppercase tracking-wider">
              1. Type de problème ou sujet
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ISSUE_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F5C4D] bg-[#EAF5F2]/60 text-[#0F5C4D] font-semibold shadow-2xs'
                        : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#0F5C4D]/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#0F5C4D] text-white' : 'bg-[#FAF8F2] text-[#7D766C]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{type.icon}</span>
                    </div>
                    <span className="text-xs leading-snug line-clamp-2">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Description du problème */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="problem-desc" className="font-body text-xs font-bold text-[#211E1A] uppercase tracking-wider">
                2. Description du problème
              </label>
              <span className="text-[11px] text-[#7D766C]">
                {description.length} caractère(s)
              </span>
            </div>
            <textarea
              id="problem-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ici ce qui se passe de manière claire et précise (actions effectuées, message d'erreur éventuel, etc.)..."
              className="w-full p-4 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 text-xs sm:text-sm text-[#211E1A] focus:bg-white focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D] outline-none transition-all placeholder:text-[#9E978C] resize-none"
              required
            />
          </div>

          {/* 3. Coordonnées de contact pour le suivi */}
          <div className="space-y-3 pt-1">
            <label className="block font-body text-xs font-bold text-[#211E1A] uppercase tracking-wider">
              3. Vos coordonnées pour le suivi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-[#7D766C] block mb-1">Votre nom</span>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3D7] bg-white text-xs text-[#211E1A] focus:border-[#0F5C4D] outline-none"
                />
              </div>

              <div>
                <span className="text-[11px] text-[#7D766C] block mb-1">Téléphone de contact</span>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+227 90 00 00 00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3D7] bg-white text-xs text-[#211E1A] focus:border-[#0F5C4D] outline-none"
                />
              </div>

              <div>
                <span className="text-[11px] text-[#7D766C] block mb-1">Adresse email</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3D7] bg-white text-xs text-[#211E1A] focus:border-[#0F5C4D] outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#7D766C]">
              Ces informations permettent à l'assistance de retrouver votre dossier et de vous répondre directement.
            </p>
          </div>

          {/* Bouton de soumission */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C4D] hover:bg-[#0a4337] active:scale-[0.99] text-white font-display text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  <span>Transmission en cours...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>Envoyer mon message au support</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#0F5C4D] bg-[#8BAE9F]/15 p-3 rounded-2xl border border-[#8BAE9F]/30 text-xs">
            <span className="material-symbols-outlined text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span>
              Traitement confidentiel : votre message est transmis directement à l'administrateur sans aucune publicité.
            </span>
          </div>
        </form>
      )}
    </div>
  );
};
