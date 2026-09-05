import React from 'react';
import { TabType } from '../../types';

interface MobileBottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadCount = 1
}) => {
  const tabs: { id: TabType; label: string; icon: string; badge?: number; special?: boolean }[] = [
    { id: 'dashboard', label: 'Accueil', icon: 'home' },
    { id: 'browse', label: 'Découvrir', icon: 'explore' },
    { id: 'imam', label: 'Imam IA', icon: 'auto_awesome', special: true },
    { id: 'messages', label: 'Messages', icon: 'chat_bubble', badge: unreadCount },
    { id: 'settings', label: 'Mon Profil', icon: 'person' },
  ];

  return (
    <nav 
      aria-label="Navigation mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-40 bg-[#FAF8F2]/95 backdrop-blur-2xl border-t border-[#E8E3D7]/90 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl relative transition-all duration-200 active:scale-90 select-none cursor-pointer ${
                isActive
                  ? 'text-[#0F5C4D]'
                  : 'text-[#7D766C] hover:text-[#211E1A]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {/* Pill background when active */}
                <div
                  className={`w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive 
                      ? tab.special ? 'bg-[#0F5C4D] text-white shadow-xs' : 'bg-[#8BAE9F]/25 text-[#0F5C4D]' 
                      : 'text-inherit'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] transition-transform ${
                      isActive ? 'scale-105' : 'scale-100'
                    }`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {tab.icon}
                  </span>
                </div>

                {/* Badge notification */}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 right-1 px-1.5 py-0.2 bg-[#C9A45C] text-[#211E1A] font-display text-[10px] font-extrabold rounded-full ring-2 ring-[#FAF8F2] shadow-xs">
                    {tab.badge}
                  </span>
                ) : null}

                {/* Sparkling dot for Imam IA */}
                {tab.special && !isActive && (
                  <span className="absolute -top-0.5 right-1.5 w-2 h-2 bg-[#C9A45C] rounded-full ring-1 ring-white" />
                )}
              </div>

              {/* Label */}
              <span
                className={`font-body text-[10px] tracking-tight mt-0.5 transition-colors ${
                  isActive
                    ? 'font-bold text-[#0F5C4D]'
                    : 'font-medium text-[#7D766C]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

