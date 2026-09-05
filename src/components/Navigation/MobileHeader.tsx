import React from 'react';
import { TabType, User } from '../../types';
import { NasibaLogo } from '../NasibaLogo';

interface MobileHeaderProps {
  user: User;
  onSelectTab: (tab: TabType) => void;
  onToggleMobileMenu: () => void;
  unreadCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  onSelectTab,
  onToggleMobileMenu,
  unreadCount = 1
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
        {/* Verification Status Pill */}
        {user.isVerifiedNNI ? (
          <button
            onClick={() => onSelectTab('verification')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] text-[11px] font-bold border border-[#0F5C4D]/20 active:scale-95 transition-transform"
            title="Profil vérifié NNI"
          >
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span className="hidden xs:inline text-[10px]">NNI</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('verification')}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#C9A45C]/15 text-[#735619] text-[10px] font-bold border border-[#C9A45C]/30 active:scale-95 transition-transform"
            title="Vérifier mon identité"
          >
            <span className="material-symbols-outlined text-[13px]">shield</span>
            <span className="text-[10px]">Vérif</span>
          </button>
        )}

        {/* Notifications Icon with Badge */}
        <button 
          onClick={() => onSelectTab('messages')}
          className="w-9 h-9 flex items-center justify-center text-[#575147] hover:text-[#0F5C4D] rounded-full hover:bg-[#8BAE9F]/10 relative active:scale-95 transition-all cursor-pointer"
          aria-label="Messages et notifications"
        >
          <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C9A45C] rounded-full ring-2 ring-[#FAF8F2]" />
          )}
        </button>

        {/* Menu Drawer Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="w-9 h-9 flex items-center justify-center text-[#211E1A] hover:text-[#0F5C4D] rounded-full hover:bg-[#8BAE9F]/10 active:scale-95 transition-all cursor-pointer"
          aria-label="Menu principal"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
      </div>
    </header>
  );
};

