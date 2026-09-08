import React from 'react';
import { motion } from 'motion/react';

interface PaywallUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureTitle?: string;
  featureDescription?: string;
  featureIcon?: string;
}

export const PaywallUpgradeModal: React.FC<PaywallUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  featureTitle = 'Fonctionnalité réservée aux membres Premium',
  featureDescription = 'Sans Premium, ton profil reste limité. Avec Premium, tu débloques toutes les opportunités pour trouver ta moitié plus vite.',
  featureIcon = 'workspace_premium',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white max-w-md w-full rounded-[28px] border border-[#E8E3D7] shadow-2xl p-6 sm:p-7 relative overflow-hidden text-center space-y-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#7D766C] hover:text-[#211E1A] rounded-full hover:bg-[#FAF8F2] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#EAF5F2] border border-[#8BAE9F]/40 text-[#0F5C4D] flex items-center justify-center mx-auto shadow-xs">
          <span className="material-symbols-outlined text-3xl text-[#C9A45C]">{featureIcon}</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <span className="bg-[#FEF3D6] text-[#B58500] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#FDE68A]">
            Privilège Nassib Premium
          </span>
          <h3 className="font-serif-display text-xl font-bold text-[#211E1A] pt-1">
            {featureTitle}
          </h3>
          <p className="font-body text-xs sm:text-sm text-[#575147] leading-relaxed">
            {featureDescription}
          </p>
        </div>

        {/* 3 Quick highlights */}
        <div className="bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl p-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div>
            <strong className="block font-display text-sm text-[#0F5C4D]">3X</strong>
            <span className="text-[#7D766C]">plus de réponses</span>
          </div>
          <div>
            <strong className="block font-display text-sm text-[#0F5C4D]">Illimité</strong>
            <span className="text-[#7D766C]">contacts directs</span>
          </div>
          <div>
            <strong className="block font-display text-sm text-[#0F5C4D]">100%</strong>
            <span className="text-[#7D766C]">halal garanti</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onUpgrade();
            }}
            className="w-full py-3.5 px-4 bg-[#0F5C4D] hover:bg-[#0c4a3e] active:scale-[0.99] text-white font-display text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-lg">workspace_premium</span>
            <span>Découvrir l'offre Premium</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-display font-medium text-[#7D766C] hover:text-[#211E1A] cursor-pointer"
          >
            Peut-être plus tard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
