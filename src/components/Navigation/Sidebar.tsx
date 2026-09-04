import React from 'react';
import { TabType, User } from '../../types';
import { ZawajLogo } from '../ZawajLogo';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  user: User;
  onOpenUpgradeModal: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onLogout?: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenUpgradeModal,
  onOpenAuth,
  onLogout,
  unreadCount = 1
}) => {
  const isAdmin =
    user.email?.toLowerCase() === 'moutarioumar7@gmail.com' ||
    user.email?.toLowerCase() === 'admin@zawaj.ne' ||
    (typeof window !== 'undefined' && localStorage.getItem('zawaj_admin_token') === 'authenticated');

  const navItems: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'browse', label: 'Parcourir', icon: 'search' },
    { id: 'messages', label: 'Messages', icon: 'chat_bubble', badge: unreadCount },
    { id: 'imam', label: 'Imam Oumar IA', icon: 'auto_awesome' },
    { id: 'verification', label: 'Vérification Wali', icon: 'verified_user' },
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
    ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Administration', icon: 'admin_panel_settings' }] : []),
  ];

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-[#f9f9ff]/80 backdrop-blur-xl shadow-sm border-r border-[#bec9c2]/30 flex-col py-6 px-4 z-50">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center pt-2 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
        <ZawajLogo size="lg" />
        <p className="font-body text-xs text-[#3f4944] mt-1 font-medium tracking-wide">
          Matrimonial Premium &amp; Éthique
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium active:scale-[0.98] ${
                isActive
                  ? 'text-[#004532] font-bold border-r-4 border-[#004532] bg-[#065f46]/15'
                  : 'text-[#3f4944] hover:text-[#004532] hover:bg-[#dce2f3]/50'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-body text-sm flex-grow">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-[#004532] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer / Upgrade & User Avatar */}
      <div className="mt-auto pt-4 border-t border-[#bec9c2]/30 flex flex-col gap-3">
        {user.isPremium ? (
          <div className="w-full bg-[#fed65b]/20 border border-[#fed65b] text-[#574500] font-display font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-2xs">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <span>Membre Baraka (Actif)</span>
          </div>
        ) : (
          <button
            onClick={onOpenUpgradeModal}
            className="w-full gold-gradient text-[#574500] font-display font-semibold text-sm py-3 px-4 rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">workspace_premium</span>
            Passer à Premium
          </button>
        )}

        {/* Auth / Logout CTA */}
        {user.email || user.id ? (
          onLogout && (
            <button
              onClick={onLogout}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-display font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Se déconnecter et revenir à l'accueil"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Se déconnecter
            </button>
          )
        ) : (
          onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full bg-[#065f46]/10 text-[#004532] hover:bg-[#065f46]/20 font-display font-semibold text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Connexion / Authentification
            </button>
          )
        )}

        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-[#dce2f3]/40 transition-colors">
          <div 
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
          >
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-[#bec9c2] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#004532]/10 text-[#004532] border border-[#004532]/20 flex items-center justify-center font-display font-bold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-sm text-[#151c27] truncate">
                {user.name}
              </span>
              {user.isVerifiedNNI ? (
                <span className="font-body text-xs text-[#004532] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Vérifié NNI
                </span>
              ) : (
                <span className="font-body text-xs text-amber-700 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  Non vérifié
                </span>
              )}
            </div>
          </div>

          {onLogout && (user.email || user.id) && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#6f7973] hover:text-rose-700 hover:bg-rose-50 transition-colors"
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
