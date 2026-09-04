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
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#f9f9ff]/90 backdrop-blur-xl border-t border-[#bec9c2]/30 px-3 py-1.5 flex justify-around items-center z-50 shadow-lg">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center p-1.5 transition-colors relative ${
              isActive ? 'text-[#004532]' : 'text-[#3f4944] hover:text-[#004532]'
            }`}
          >
            {tab.badge && tab.badge > 0 ? (
              <div className="absolute top-1 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            ) : null}
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className={`font-body text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
