import React from 'react';
import { TabType, User } from '../../types';
import { ZawajLogo } from '../ZawajLogo';

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
    <header className="md:hidden flex justify-between items-center h-16 px-4 fixed top-0 left-0 w-full z-40 bg-[#f9f9ff]/80 backdrop-blur-xl border-b border-[#bec9c2]/30 shadow-sm">
      <div 
        className="cursor-pointer"
        onClick={() => onSelectTab('dashboard')}
      >
        <ZawajLogo size="sm" />
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => onSelectTab('messages')}
          className="p-2 text-[#3f4944] hover:text-[#004532] rounded-full hover:bg-[#dce2f3]/50 relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
        </button>

        <button
          onClick={() => onSelectTab('verification')}
          className="p-2 text-[#004532] rounded-full hover:bg-[#dce2f3]/50"
          title="Statut de Vérification"
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
        </button>

        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-[#3f4944] hover:text-[#004532]"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      </div>
    </header>
  );
};
