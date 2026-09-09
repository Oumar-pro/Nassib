import React, { useState, useEffect } from 'react';

interface ProfileInvisibilityNoticeProps {
  hasUploadedPhoto: boolean;
  onGoToUpload: () => void;
}

export const ProfileInvisibilityNotice: React.FC<ProfileInvisibilityNoticeProps> = ({
  hasUploadedPhoto,
  onGoToUpload,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);

  useEffect(() => {
    // Si l'utilisateur a une photo, ne jamais afficher
    if (hasUploadedPhoto) {
      setIsVisible(false);
      return;
    }

    // Affichage initial après 3 secondes
    const initialTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => window.clearTimeout(initialTimer);
  }, [hasUploadedPhoto]);

  // Si l'utilisateur ferme la carte, la réafficher de temps en temps (toutes les 2 minutes et demie)
  useEffect(() => {
    if (hasUploadedPhoto || isVisible) return;

    const intervalTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 150000); // 2 min 30 s

    return () => window.clearTimeout(intervalTimer);
  }, [hasUploadedPhoto, isVisible, dismissCount]);

  if (hasUploadedPhoto || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-40 max-w-sm bg-white border border-[#C9A45C]/60 rounded-2xl shadow-xl p-4 sm:p-4.5 animate-slideUp transition-all duration-300"
      role="alert"
    >
      {/* Bouton de fermeture */}
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          setDismissCount((c) => c + 1);
        }}
        className="absolute top-2.5 right-2.5 p-1 text-[#7D766C] hover:text-[#211E1A] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
        aria-label="Fermer temporairement l'avertissement"
        title="Masquer temporairement"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#8A6724] flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-xl">visibility_off</span>
        </div>

        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C9A45C] animate-pulse shrink-0" />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-[#8A6724]">
              Visibilité très faible
            </span>
          </div>

          <h4 className="font-serif-display font-bold text-sm text-[#211E1A] leading-tight">
            Votre profil est presque invisible
          </h4>

          <p className="font-body text-xs text-[#575147] leading-relaxed">
            Les profils sans photo de profil sont <strong>noyés tout en bas des résultats et presque invisibles</strong> pour les autres membres. Ajoutez une photo pour remonter immédiatement en tête de liste et attirer des prétendant(e)s sérieux ! (Mode discrétion flouté disponible).
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                onGoToUpload();
              }}
              className="px-3.5 py-1.5 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_a_photo</span>
              Ajouter une photo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                setDismissCount((c) => c + 1);
              }}
              className="px-2.5 py-1.5 text-xs font-display text-[#7D766C] hover:text-[#211E1A] transition-colors cursor-pointer"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
