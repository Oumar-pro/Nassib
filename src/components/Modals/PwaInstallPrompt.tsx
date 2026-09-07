import React, { useState, useEffect } from 'react';
import { NassibLogoIcon } from '../NasibaLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if running in iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check if already in standalone (installed)
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isInStandalone);

    // Check if user dismissed recently
    const wasDismissed = sessionStorage.getItem('nassib_pwa_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Listen for Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS || isInIframe) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('nassib_pwa_dismissed', 'true');
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenDirect = () => {
    window.open(window.location.href, '_blank');
  };

  // Do not show banner if already installed in standalone mode or dismissed
  if (isStandalone || dismissed) {
    if (!showIOSModal) return null;
  }

  // If not iOS and no install prompt event on desktop/android, hide banner unless iframe
  if (!isIOS && !deferredPrompt && !showIOSModal && !isInIframe) {
    return null;
  }

  return (
    <>
      {/* Floating Compact Banner (Mobile / Desktop) */}
      {!dismissed && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-40 bg-[#FAF8F2] border border-[#C9A45C]/30 shadow-[0_8px_30px_rgba(15,92,77,0.12)] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E3D7] flex items-center justify-center shrink-0 shadow-2xs">
              <NassibLogoIcon size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-xs font-bold text-[#0F5C4D] truncate">
                Installer l'application Nassib
              </p>
              <p className="text-[11px] text-[#7D766C] truncate">
                {isIOS ? 'Disponible sur votre iPhone (Safari)' : 'Accès rapide depuis votre écran'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-[#A8A196] hover:text-[#575147] rounded-lg transition-colors cursor-pointer"
              title="Fermer"
              aria-label="Fermer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Dedicated iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF8F2] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#E8E3D7] shadow-2xl p-5 sm:p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8E3D7]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E3D7] flex items-center justify-center shadow-xs shrink-0">
                  <NassibLogoIcon size={30} />
                </div>
                <div>
                  <h3 className="font-serif-display font-bold text-lg text-[#0F5C4D]">
                    Installer sur iPhone (iOS)
                  </h3>
                  <p className="text-xs text-[#7D766C]">
                    Guide pas-à-pas pour l'écran d'accueil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-[#7D766C] hover:text-[#211E1A] cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Note if in iframe or non-safari browser */}
            <div className="my-3.5 p-3 rounded-2xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 text-xs text-[#735619] space-y-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-[#735619] shrink-0 mt-0.5">info</span>
                <p className="leading-snug">
                  Sur iPhone, l'installation se fait exclusivement via le navigateur <strong>Safari officiel</strong> (Apple ne permet pas l'installation depuis Chrome ou les aperçus intégrés).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleOpenDirect}
                  className="px-3 py-1.5 rounded-lg bg-[#0F5C4D] text-white font-bold text-[11px] hover:bg-[#0c4a3e] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  Ouvrir dans Safari
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#C9A45C]/40 text-[#735619] font-medium text-[11px] hover:bg-[#FAF8F2] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Lien copié !' : 'Copier l\'adresse'}
                </button>
              </div>
            </div>

            {/* Step-by-step Visual Instructions for iPhone Safari */}
            <div className="py-2 space-y-3">
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#E8E3D7]">
                <div className="w-7 h-7 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-[#211E1A] leading-relaxed">
                  Dans <strong>Safari</strong>, touchez le bouton <strong>Partager</strong> situé dans la barre tout en bas de l'écran :
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F2] border border-[#E8E3D7] text-[#0F5C4D] font-bold text-[11px]">
                    <span className="material-symbols-outlined text-sm">ios_share</span>
                    <span>Bouton Partager (carré avec flèche vers le haut)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#E8E3D7]">
                <div className="w-7 h-7 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-[#211E1A] leading-relaxed">
                  Faites défiler la liste vers le bas et sélectionnez l'option :
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F2] border border-[#E8E3D7] text-[#0F5C4D] font-bold text-[11px]">
                    <span className="material-symbols-outlined text-sm">add_box</span>
                    <span>« Sur l'écran d'accueil »</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#E8E3D7]">
                <div className="w-7 h-7 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-[#211E1A] leading-relaxed">
                  Touchez <strong>« Ajouter »</strong> en haut à droite de l'écran. L'icône Nassib est maintenant installée sur votre bureau d'iPhone et s'ouvrira en plein écran !
                </div>
              </div>
            </div>

            {/* Bottom confirmation */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowIOSModal(false);
                }}
                className="w-full bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl cursor-pointer transition-all"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
