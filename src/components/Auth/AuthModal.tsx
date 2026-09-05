import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NasibaLogo } from '../NasibaLogo';
import { registerAccount, loginAccount, AuthAccount } from '../../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: AuthAccount, isRegister: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'register',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'candidate' | 'wali'>('candidate');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'register');
      setErrorMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const isRegister = mode === 'register';

    if (isRegister) {
      const res = await registerAccount({
        email,
        password,
        name,
        role,
        phone,
        gender,
      });

      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.user) {
        onSuccess(res.user, true);
      }
    } else {
      const res = await loginAccount({
        email,
        password,
      });

      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.user) {
        onSuccess(res.user, false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211E1A]/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl border border-[#E8E3D7] bg-white grid grid-cols-1 md:grid-cols-12 my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-[#7D766C] hover:text-[#0F5C4D] hover:bg-[#FAF8F2] rounded-full transition-colors cursor-pointer"
            title="Fermer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Left Decorative Branding Side (5 cols) */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 bg-[#FAF8F2] border-r border-[#E8E3D7] relative overflow-hidden">
            {/* Subtle decorative glow */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#0F5C4D]/8 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#C9A45C]/15 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="mb-4">
                <NasibaLogo size="md" />
              </div>
              <p className="font-body text-xs text-[#575147] leading-relaxed">
                Des rencontres avec une intention sérieuse. Pudeur, respect et transparence.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3.5 my-auto py-6 relative z-10">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#E8E3D7] shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shield_lock
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-xs font-bold text-[#211E1A]">Vérification NNI</h4>
                  <p className="font-body text-[10px] text-[#7D766C]">Profils réels et authentifiés</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#E8E3D7] shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    family_restroom
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-xs font-bold text-[#211E1A]">Supervision Wali</h4>
                  <p className="font-body text-[10px] text-[#7D766C]">Bénédiction et cadre familial</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#E8E3D7] shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base text-[#C9A45C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-xs font-bold text-[#211E1A]">Échanges Éthiques</h4>
                  <p className="font-body text-[10px] text-[#7D766C]">Respect et pudeur</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-2 border-t border-[#E8E3D7] flex items-center justify-between text-[10px] font-body text-[#7D766C]">
              <span className="flex items-center gap-1 font-semibold text-[#0F5C4D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4D]"></span>
                Données Chiffrées
              </span>
              <span>NASSIB © 2026</span>
            </div>
          </div>

          {/* Right Form Side (7 cols) */}
          <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-between relative bg-white">
            <div>
              {/* Header Logo for Mobile */}
              <div className="md:hidden mb-4">
                <NasibaLogo size="sm" />
              </div>

              {/* Mode Toggle Switcher */}
              <div className="flex bg-[#FAF8F2] p-1 rounded-2xl border border-[#E8E3D7] mb-6 max-w-xs">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 text-xs font-body font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#0F5C4D] text-white shadow-xs'
                      : 'text-[#575147] hover:text-[#0F5C4D]'
                  }`}
                >
                  Créer un compte
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-xs font-body font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#0F5C4D] text-white shadow-xs'
                      : 'text-[#575147] hover:text-[#0F5C4D]'
                  }`}
                >
                  Se connecter
                </button>
              </div>

              <div className="mb-5">
                <h3 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                  {mode === 'register' ? 'Rejoindre NASSIB' : 'Bon retour parmi nous'}
                </h3>
                <p className="font-body text-xs text-[#575147] mt-1">
                  {mode === 'register'
                    ? 'Inscrivez-vous gratuitement pour débuter votre démarche matrimoniale.'
                    : 'Accédez à vos discussions et à votre profil sécurisé.'}
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-[#211E1A] text-xs font-body animate-fadeIn">
                  <span className="material-symbols-outlined text-[#C9A45C] text-lg shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="leading-relaxed font-medium">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Role & Gender Selectors (Register mode) */}
                {mode === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="font-body text-[11px] font-bold text-[#575147] uppercase tracking-wider">
                        Je m'inscris en tant que :
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRole('candidate')}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            role === 'candidate'
                              ? 'border-[#0F5C4D] bg-[#8BAE9F]/15 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#0F5C4D]/30'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              role === 'candidate' ? 'bg-[#0F5C4D] text-white' : 'bg-[#E8E3D7] text-[#575147]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">person</span>
                          </div>
                          <div>
                            <div className="font-display text-xs font-bold leading-tight">Candidat(e)</div>
                            <div className="font-body text-[10px] text-[#7D766C] font-normal">Recherche mariage</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('wali')}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            role === 'wali'
                              ? 'border-[#C9A45C] bg-[#C9A45C]/15 ring-2 ring-[#C9A45C]/30 text-[#211E1A]'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#C9A45C]/40'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              role === 'wali' ? 'bg-[#C9A45C] text-white' : 'bg-[#E8E3D7] text-[#575147]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">family_restroom</span>
                          </div>
                          <div>
                            <div className="font-display text-xs font-bold leading-tight">Wali (Tuteur)</div>
                            <div className="font-body text-[10px] text-[#7D766C] font-normal">Accompagnateur</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Gender Selector */}
                    <div className="space-y-1.5">
                      <label className="font-body text-[11px] font-bold text-[#575147] uppercase tracking-wider">
                        Sexe / Genre :
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            gender === 'male'
                              ? 'border-[#0F5C4D] bg-[#8BAE9F]/15 ring-2 ring-[#0F5C4D]/20 font-bold text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#0F5C4D]/30'
                          }`}
                        >
                          <span className="text-base">👨</span>
                          <span className="font-display text-xs font-bold">Homme</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            gender === 'female'
                              ? 'border-[#0F5C4D] bg-[#8BAE9F]/15 ring-2 ring-[#0F5C4D]/20 font-bold text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#0F5C4D]/30'
                          }`}
                        >
                          <span className="text-base">👩</span>
                          <span className="font-display text-xs font-bold">Femme</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Full Name Input (Register mode) */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="font-body text-xs font-semibold text-[#211E1A]">Nom complet</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                        badge
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Aminata Seydou"
                        className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl pl-10 pr-4 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/15 transition-all placeholder:text-[#7D766C]"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="font-body text-xs font-semibold text-[#211E1A]">Adresse email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@exemple.ne"
                      className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl pl-10 pr-4 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/15 transition-all placeholder:text-[#7D766C]"
                    />
                  </div>
                </div>

                {/* Phone Input (Register mode) */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="font-body text-xs font-semibold text-[#211E1A]">Téléphone (+227)</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                        call
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="90 12 34 56"
                        className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl pl-10 pr-4 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/15 transition-all placeholder:text-[#7D766C]"
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-body text-xs font-semibold text-[#211E1A]">Mot de passe</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="font-body text-[11px] text-[#0F5C4D] font-semibold hover:underline"
                      >
                        Oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl pl-10 pr-10 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/15 transition-all placeholder:text-[#7D766C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] hover:text-[#0F5C4D] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 bg-[#0F5C4D] text-white font-display text-xs sm:text-sm font-bold rounded-2xl hover:bg-[#0c4a3e] transition-all shadow-md shadow-[#0F5C4D]/15 mt-3 flex items-center justify-center gap-2 ${
                    loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      <span>Traitement en cours...</span>
                    </div>
                  ) : (
                    <>
                      <span>{mode === 'register' ? "Créer mon compte éthique" : 'Se connecter'}</span>
                      <span className="material-symbols-outlined text-base text-[#C9A45C]">arrow_forward</span>
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Footer switcher notice */}
            <div className="mt-6 text-center pt-4 border-t border-[#E8E3D7]">
              <span className="font-body text-xs text-[#575147]">
                {mode === 'register' ? 'Déjà inscrit ? ' : 'Pas encore de profil ? '}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                className="font-body text-xs text-[#0F5C4D] font-bold hover:underline cursor-pointer ml-1"
              >
                {mode === 'register' ? 'Se connecter' : "S'inscrire maintenant"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


