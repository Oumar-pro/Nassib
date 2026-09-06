import React from 'react';
import { TabType, User } from '../../types';
import { NasibaLogo } from '../NasibaLogo';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  user: User;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onLogout?: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  unreadCount = 0
}) => {
  const navItems: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'browse', label: 'Parcourir', icon: 'search' },
    { id: 'messages', label: 'Messages', icon: 'chat_bubble', badge: unreadCount },
    { id: 'imam', label: 'Imam Oumar IA', icon: 'auto_awesome' },
    { id: 'verification', label: 'Vérification Wali', icon: 'verified_user' },
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
  ];

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-[#FAF8F2]/90 backdrop-blur-xl shadow-xs border-r border-[#E8E3D7] flex-col py-6 px-4 z-50">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center pt-2 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
        <NasibaLogo size="md" />
        <p className="font-body text-[11px] text-[#7D766C] mt-2 font-medium tracking-wide text-center">
          Des rencontres avec une intention sérieuse
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 flex-grow">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left font-medium active:scale-[0.98] ${
                isActive
                  ? 'text-[#0F5C4D] font-bold border-r-4 border-[#0F5C4D] bg-[#8BAE9F]/15 shadow-2xs'
                  : 'text-[#575147] hover:text-[#0F5C4D] hover:bg-[#8BAE9F]/10'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ 
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  color: isActive ? '#0F5C4D' : undefined
                }}
              >
                {item.icon}
              </span>
              <span className="font-body text-sm flex-grow">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-[#0F5C4D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer / Free Platform Guarantee & User Avatar */}
      <div className="mt-auto pt-4 border-t border-[#E8E3D7] flex flex-col gap-3">
        <div className="w-full bg-[#8BAE9F]/15 border border-[#8BAE9F]/30 text-[#0F5C4D] font-display font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]"></span>
          <span>Plateforme 100% Gratuite</span>
        </div>

        {/* Auth / Logout CTA */}
        {user.email || user.id ? (
          onLogout && (
            <button
              onClick={onLogout}
              className="w-full bg-white hover:bg-[#FAF8F2] text-[#575147] hover:text-[#211E1A] border border-[#E8E3D7] font-display font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              title="Se déconnecter et revenir à l'accueil"
            >
              <span className="material-symbols-outlined text-base text-[#7D766C]">logout</span>
              Se déconnecter
            </button>
          )
        ) : (
          onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] font-display font-semibold text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Connexion / Inscription
            </button>
          )
        )}

        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-[#8BAE9F]/10 transition-colors">
          <div 
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
          >
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-[#E8E3D7] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] border border-[#0F5C4D]/20 flex items-center justify-center font-display font-bold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-sm text-[#211E1A] truncate">
                {user.name}
              </span>
              {user.isVerifiedNNI ? (
                <span className="font-body text-xs text-[#0F5C4D] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#C9A45C]">verified</span>
                  Vérifié
                </span>
              ) : (
                <span className="font-body text-xs text-[#7D766C] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  Non vérifié
                </span>
              )}
            </div>
          </div>

          {onLogout && (user.email || user.id) && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#7D766C] hover:text-[#211E1A] hover:bg-[#8BAE9F]/10 transition-colors"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
