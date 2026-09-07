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
          Photo de profil requise
        </h3>

        {/* Description */}
        <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed mb-4">
          Toute personne qui n'a pas ajouté au moins une photo de profil ne peut pas envoyer de demande ni de message sur NASSIB. Vous pouvez uniquement consulter et lire les profils.
        </p>

        {/* Informative Note on Privacy */}
        <div className="p-3 bg-white rounded-2xl border border-[#E8E3D7] text-left mb-6 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base text-[#C9A45C] shrink-0 mt-0.5">
            lock
          </span>
          <div className="text-[11px] sm:text-xs text-[#735619] leading-snug">
            <span className="font-bold">Mode Floutage disponible :</span> Si vous souhaitez préserver votre intimité, vous pourrez activer le mode photo privée. Vos photos ne seront débloquées qu'après votre accord.
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
            Continuer la lecture des profils
          </button>
        </div>
      </div>
    </div>
  );
};
