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
  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Accueil', icon: 'dashboard' },
    { id: 'browse', label: 'Parcourir', icon: 'search' },
    { id: 'imam', label: 'Imam IA', icon: 'auto_awesome' },
    { id: 'messages', label: 'Messages', icon: 'chat_bubble', badge: unreadCount },
    { id: 'settings', label: 'Profil', icon: 'person' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#FAF8F2]/95 backdrop-blur-xl border-t border-[#E8E3D7] px-3 py-1.5 flex justify-around items-center z-50 shadow-md">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center p-1.5 transition-colors relative ${
              isActive ? 'text-[#0F5C4D]' : 'text-[#575147] hover:text-[#0F5C4D]'
            }`}
          >
            {tab.badge && tab.badge > 0 ? (
              <div className="absolute top-1 right-2 w-2 h-2 bg-[#C9A45C] rounded-full" />
            ) : null}
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className={`font-body text-[10px] mt-0.5 ${isActive ? 'font-bold text-[#0F5C4D]' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

