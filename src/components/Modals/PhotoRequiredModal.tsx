import React from 'react';

interface PhotoRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToUpload: () => void;
}

export const PhotoRequiredModal: React.FC<PhotoRequiredModalProps> = ({
  isOpen,
  onClose,
  onGoToUpload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF8F2] w-full max-w-md rounded-3xl border border-[#E8E3D7] shadow-2xl p-6 sm:p-7 animate-slideUp text-center relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#7D766C] hover:text-[#211E1A] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] mx-auto flex items-center justify-center mb-4 border border-[#0F5C4D]/20 shadow-xs">
          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
        </div>

        {/* Title */}
        <h3 className="font-serif-display font-bold text-xl sm:text-2xl text-[#211E1A] mb-2">
          Optimisez votre visibilité
        </h3>

        {/* Description */}
        <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed mb-4">
          Les profils sans photo de profil sont <strong>noyés tout en bas des résultats et presque invisibles</strong> pour les autres membres. Ajoutez au moins une photo pour remonter en tête de liste et maximiser vos chances de trouver votre moitié !
        </p>

        {/* Informative Note on Privacy */}
        <div className="p-3 bg-white rounded-2xl border border-[#E8E3D7] text-left mb-6 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base text-[#C9A45C] shrink-0 mt-0.5">
            lock
          </span>
          <div className="text-[11px] sm:text-xs text-[#735619] leading-snug">
            <span className="font-bold">Option discrétion (Pudeur) :</span> Vous pouvez activer le floutage automatique de votre photo dans vos paramètres. Elle ne sera révélée qu'aux personnes que vous autoriserez explicitement.
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToUpload();
            }}
            className="w-full bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs sm:text-sm font-bold py-3.5 px-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            <span>Ajouter ma photo de profil</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-transparent hover:bg-black/5 text-[#575147] font-display text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
          >
            Continuer (profil peu visible)
          </button>
        </div>
      </div>
    </div>
  );
};
