import React from 'react';
import { TabType, User } from '../../types';
import { NasibaLogo } from '../NasibaLogo';

interface MobileHeaderProps {
  user: User;
  onSelectTab: (tab: TabType) => void;
  onToggleMobileMenu?: () => void;
  unreadCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  onSelectTab,
}) => {
  return (
    <header className="md:hidden flex justify-between items-center h-15 px-3.5 fixed top-0 left-0 right-0 w-full z-40 bg-[#FAF8F2]/95 backdrop-blur-xl border-b border-[#E8E3D7]/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] pt-[env(safe-area-inset-top)]">
      <div 
        className="cursor-pointer active:scale-95 transition-transform flex items-center gap-2"
        onClick={() => onSelectTab('dashboard')}
      >
        <NasibaLogo size="sm" />
      </div>

      <div className="flex items-center gap-1.5">
        {/* Verification Status Pill - Uniquement pour les comptes vérifiés par carte */}
        {user.isVerifiedNNI && (
          <button
            onClick={() => onSelectTab('verification')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] text-[11px] font-bold border border-[#0F5C4D]/20 active:scale-95 transition-transform"
            title="Profil vérifié NNI (Identité vérifiée par carte)"
          >
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span className="text-[10px]">Vérifié</span>
          </button>
        )}
      </div>
    </header>
  );
};

