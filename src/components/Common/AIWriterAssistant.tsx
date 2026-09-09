import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AIProfileContext {
  gender?: string;
  age?: number | string;
  city?: string;
  profession?: string;
  education?: string;
  personalityTrait?: string;
  religiousPractice?: string;
  religion?: string;
  selectedValues?: string[];
  selectedDealBreakers?: string[];
  preferredAgeRange?: string;
  userName?: string;
}

export interface AIWriterAssistantProps {
  id?: string;
  type: 'bio' | 'partner_criteria' | 'family_vision' | 'dealbreaker';
  label: string;
  icon?: string;
  value: string;
  onChange: (newValue: string) => void;
  profileContext?: AIProfileContext;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  minChars?: number;
  helperText?: string;
  className?: string;
  isSingleLine?: boolean;
}

const SUGGESTION_TAGS: Record<string, string[]> = {
  bio: [
    'Calme & posé(e)',
    'Attaché(e) à la prière',
    'Aime la lecture & apprendre',
    'Sens des responsabilités',
    'Esprit de famille',
    'Professionnel(le) & structuré(e)',
    'Bienveillant(e) & discret(ète)',
    'Projet de vie pieux',
  ],
  partner_criteria: [
    'Crainte d\'Allah (Taqwa)',
    'Prières quotidiennes à l\'heure',
    'Bon comportement (Husn al-Khuluq)',
    'Communication saine & apaisée',
    'Respect de la belle-famille',
    'Sens des engagements',
    'Maturité affective',
    'Désir d\'entraide dans le dîn',
  ],
  family_vision: [
    'Foyer paisible (Sakina)',
    'Entraide & complicité quotidienne',
    'Éducation islamique bienveillante',
    'Respect mutuel & écoute',
    'Pudeur & piété au foyer',
    'Projets d\'avenir partagés',
  ],
  dealbreaker: [
    'Négligence des 5 prières',
    'Manque de respect à la belle-famille',
    'Absence de dialogue sincère',
    'Comportement colérique ou violent',
    'Désaccord sur l\'éducation des enfants',
  ],
};

export const AIWriterAssistant: React.FC<AIWriterAssistantProps> = ({
  id,
  type,
  label,
  icon = 'auto_awesome',
  value,
  onChange,
  profileContext = {},
  placeholder = '',
  rows = 4,
  required = false,
  minChars = 0,
  helperText,
  className = '',
  isSingleLine = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userHints, setUserHints] = useState('');
  const [selectedTone, setSelectedTone] = useState<'sincere' | 'detailed' | 'concise'>('sincere');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tags = SUGGESTION_TAGS[type] || SUGGESTION_TAGS.bio;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleTag = (tag: string) => {
    const currentList = userHints
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (currentList.includes(tag)) {
      setUserHints(currentList.filter((t) => t !== tag).join(', '));
    } else {
      setUserHints([...currentList, tag].join(', '));
    }
  };

  const executeAIGeneration = async (customHints?: string, directInsert: boolean = false) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          hints: customHints !== undefined ? customHints : userHints,
          currentDraft: value,
          tone: selectedTone,
          profileContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur réseau (${response.status})`);
      }

      const data = await response.json();
      const text = data.text || data.reply || '';

      if (text) {
        if (directInsert) {
          onChange(text);
          showToast('✨ Texte rédigé par l\'IA avec succès !');
          setIsModalOpen(false);
        } else {
          setGeneratedPreview(text);
        }
      } else {
        throw new Error('Aucun texte reçu');
      }
    } catch (err: any) {
      console.warn('Erreur génération IA:', err);
      setErrorMsg('Impossible de joindre l\'assistant IA. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickOneClick = () => {
    executeAIGeneration(userHints || '', true);
  };

  const handleApplyGenerated = () => {
    if (generatedPreview) {
      onChange(generatedPreview);
      setIsModalOpen(false);
      setGeneratedPreview('');
      showToast('✨ Texte inséré dans votre profil !');
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Toast de confirmation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-[#0F5C4D] text-white text-xs font-semibold flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined text-base text-[#C9A45C]">auto_awesome</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label and Top Information */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#0F5C4D] text-base">{icon}</span>
          <span>{label}</span>
          {required && <span className="text-[#A23838]">*</span>}
        </label>
        {minChars > 0 && (
          <span
            className={`text-[11px] font-normal ${
              value.length >= minChars ? 'text-[#0F5C4D] font-semibold' : 'text-[#7D766C]'
            }`}
          >
            {value.length} caractères (min. {minChars})
          </span>
        )}
      </div>

      {/* BANNIÈRE D'INVITATION PROACTIVE IA (Avant même d'écrire) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF8F2] via-[#F4F9F6] to-[#FAF8F2] border border-[#8BAE9F]/40 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0F5C4D] text-[#FAF8F2] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
            <div>
              <p className="font-display text-xs font-bold text-[#0F5C4D] leading-tight">
                {value.trim().length === 0
                  ? 'Pas envie d\'écrire ? Laissez l\'IA rédiger pour vous !'
                  : 'Besoin d\'améliorer ou enrichir votre texte ?'}
              </p>
              <p className="font-body text-[11px] text-[#575147] mt-0.5">
                {value.trim().length === 0
                  ? 'Générez un texte sincère, pudique et élégant à partir de votre profil.'
                  : 'L\'IA retravaille votre brouillon pour le rendre plus éloquent et posé.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {value.trim().length === 0 && (
              <button
                type="button"
                onClick={handleQuickOneClick}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E3D7] hover:border-[#0F5C4D] text-[#0F5C4D] text-xs font-bold font-display flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:bg-[#F4F9F6] active:scale-95 disabled:opacity-50"
                title="Générer instantanément selon vos réponses"
              >
                <span className="material-symbols-outlined text-sm text-[#C9A45C]">bolt</span>
                <span>{isLoading ? 'Rédaction...' : 'En 1 clic'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setGeneratedPreview('');
                setIsModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white text-xs font-bold font-display flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm text-[#C9A45C]">magic_button</span>
              <span>{value.trim().length === 0 ? 'Rédiger avec l\'IA' : 'Perfectionner'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input or Textarea Field */}
      <div className="relative">
        {isSingleLine ? (
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 px-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/10"
          />
        ) : (
          <textarea
            id={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/10 leading-relaxed transition-all"
          />
        )}

        {/* Bouton d'action contextuelle dès qu'on commence à taper */}
        {value.trim().length > 3 && !isSingleLine && (
          <div className="absolute right-3 bottom-3">
            <button
              type="button"
              onClick={() => {
                setGeneratedPreview('');
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#FAF8F2]/90 hover:bg-white border border-[#E8E3D7] hover:border-[#8BAE9F] text-[#0F5C4D] text-[11px] font-semibold flex items-center gap-1 shadow-2xs backdrop-blur-xs transition-all cursor-pointer"
              title="Améliorer le style et l'orthographe avec l'IA"
            >
              <span className="material-symbols-outlined text-xs text-[#C9A45C]">auto_awesome</span>
              <span>Sublimer le texte</span>
            </button>
          </div>
        )}
      </div>

      {helperText && <p className="text-[11px] text-[#7D766C]">{helperText}</p>}

      {/* MODAL / DIALOGUE DE RÉDACTION INTELLIGENTE IA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FAF8F2] w-full max-w-lg rounded-3xl border border-[#E8E3D7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="p-5 border-b border-[#E8E3D7] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-[#0F5C4D]">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="font-serif-display text-base font-bold text-[#211E1A]">
                      Assistant de Rédaction IA Nassib
                    </h3>
                    <p className="text-[11px] text-[#7D766C]">
                      Rédige pour vous un texte conforme à l'éthique musulmane
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D766C] hover:text-[#211E1A] hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Brouillon existant s'il y en a un */}
                {value.trim().length > 0 && !generatedPreview && (
                  <div className="p-3 rounded-2xl bg-white border border-[#E8E3D7] space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#7D766C]">
                      Votre texte actuel :
                    </span>
                    <p className="text-xs text-[#575147] italic line-clamp-3">"{value}"</p>
                  </div>
                )}

                {/* Suggestions de mots-clés rapides */}
                {!generatedPreview && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold font-display text-[#211E1A] flex items-center justify-between">
                      <span>Idées rapides à inclure (cliquez pour ajouter) :</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => {
                        const isSelected = userHints
                          .split(',')
                          .map((s) => s.trim())
                          .includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                                : 'bg-white text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Champ pour mots-clés libres */}
                {!generatedPreview && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-display text-[#211E1A]">
                      Vos mots-clés ou précisions (optionnel) :
                    </label>
                    <input
                      type="text"
                      value={userHints}
                      onChange={(e) => setUserHints(e.target.value)}
                      placeholder="Ex: calme, aime la nature, pieux, ingénieur, cherche personne mature..."
                      className="w-full h-11 px-3.5 bg-white border border-[#E8E3D7] rounded-xl text-xs text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                    />
                  </div>
                )}

                {/* Choix de ton */}
                {!generatedPreview && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-display text-[#211E1A]">
                      Style de formulation :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'sincere', label: 'Sincère & Posé', sub: 'Équilibré' },
                        { id: 'detailed', label: 'Détaillé', sub: 'Chaleureux' },
                        { id: 'concise', label: 'Court & Direct', sub: 'Sobre' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTone(t.id as any)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedTone === t.id
                              ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                              : 'bg-white text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <div className="text-xs font-bold">{t.label}</div>
                          <div className={`text-[10px] ${selectedTone === t.id ? 'text-white/80' : 'text-[#7D766C]'}`}>
                            {t.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Erreur */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-[#A23838]/10 border border-[#A23838]/20 text-[#A23838] text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Prévisualisation du texte généré */}
                {generatedPreview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F5C4D] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#C9A45C]">verified</span>
                        <span>Texte rédigé par l'IA (vous pouvez le retoucher) :</span>
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={generatedPreview}
                      onChange={(e) => setGeneratedPreview(e.target.value)}
                      className="w-full p-3.5 bg-white border border-[#0F5C4D]/40 rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/10 leading-relaxed shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="p-4 bg-white border-t border-[#E8E3D7] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#7D766C] hover:text-[#211E1A] hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                <div className="flex items-center gap-2">
                  {generatedPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={() => executeAIGeneration()}
                        disabled={isLoading}
                        className="px-3.5 py-2.5 rounded-xl border border-[#E8E3D7] text-[#575147] hover:bg-[#FAF8F2] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Autre version</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyGenerated}
                        className="px-5 py-2.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        <span>Insérer ce texte</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => executeAIGeneration()}
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Rédaction en cours...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm text-[#C9A45C]">auto_awesome</span>
                          <span>Générer mon texte</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
