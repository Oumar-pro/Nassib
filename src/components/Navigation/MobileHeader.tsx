import React from 'react';
import { TabType, User } from '../../types';
import { NasibaLogo } from '../NasibaLogo';

interface MobileHeaderProps {
  user: User;
  onSelectTab: (tab: TabType) => void;
  onToggleMobileMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  onSelectTab,
  onToggleMobileMenu
}) => {
  return (
    <header className="md:hidden flex justify-between items-center h-16 px-4 fixed top-0 left-0 w-full z-40 bg-[#FAF8F2]/90 backdrop-blur-xl border-b border-[#E8E3D7] shadow-xs">
      <div 
        className="cursor-pointer"
        onClick={() => onSelectTab('dashboard')}
      >
        <NasibaLogo size="sm" />
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onSelectTab('messages')}
          className="p-2 text-[#575147] hover:text-[#0F5C4D] rounded-full hover:bg-[#8BAE9F]/10 relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C9A45C] rounded-full"></span>
        </button>

        <button
          onClick={() => onSelectTab('verification')}
          className="p-2 text-[#0F5C4D] rounded-full hover:bg-[#8BAE9F]/10"
          title="Statut de Vérification"
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
        </button>

        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-[#575147] hover:text-[#0F5C4D]"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      </div>
    </header>
  );
};

