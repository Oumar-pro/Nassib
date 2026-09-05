import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NasibaLogo } from '../NasibaLogo';
import { registerAccount, loginAccount, AuthAccount } from '../../lib/auth';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBack: () => void;
  onSuccess: (user: AuthAccount, isRegister: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'register',
  onBack,
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
    setMode(initialMode || 'register');
    setErrorMessage(null);
  }, [initialMode]);

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
    <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] font-body flex flex-col selection:bg-[#8BAE9F]/25 selection:text-[#0F5C4D]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F2]/95 backdrop-blur-md border-b border-[#E8E3D7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-[#575147] hover:text-[#0F5C4D] hover:bg-white rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-[#E8E3D7]"
              title="Retour à l'accueil"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="hidden sm:inline">Retour à l'accueil</span>
            </button>
            <div className="h-5 w-px bg-[#E8E3D7] hidden sm:block"></div>
            <NasibaLogo size="md" />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E3D7] text-xs text-[#575147]">
              <span className="w-2 h-2 rounded-full bg-[#0F5C4D]"></span>
              <span>Plateforme Matrimoniale Halal • Niger</span>
            </div>
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs font-bold text-[#0F5C4D] hover:underline cursor-pointer px-3 py-1.5 rounded-xl hover:bg-[#8BAE9F]/10 transition-colors"
            >
              {mode === 'login' ? 'Créer un compte' : 'Déjà inscrit ?'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dedicated Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: Brand Story, Sacred Vision & Reassurance */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E3D7] shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F5C4D]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A45C]/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F2] border border-[#E8E3D7] text-xs font-semibold text-[#0F5C4D]">
                <span className="material-symbols-outlined text-sm text-[#C9A45C]">favorite</span>
                <span>L'Union dans le Respect et la Pudeur</span>
              </div>

              <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0F5C4D] leading-tight">
                {mode === 'login' ? 'Ravi de vous retrouver sur NASSIB' : 'Commencez votre projet de mariage béni'}
              </h1>

              <blockquote className="p-4 rounded-2xl bg-[#FAF8F2] border-l-4 border-[#C9A45C] text-xs sm:text-sm text-[#575147] italic leading-relaxed">
                « Et parmi Ses signes Il a créé de vous, pour vous, des épouses, afin que vous viviez en tranquillité avec elles, et Il a mis entre vous de l'affection et de la bonté. »
                <span className="block mt-1 font-semibold text-[#211E1A] not-italic text-[11px]">— Sourate Ar-Rum (30:21)</span>
              </blockquote>

              {/* Pillars Checklist */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-base">verified</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">Authenticité &amp; Sécurité</h3>
                    <p className="font-body text-xs text-[#575147]">Profils vérifiés par Numéro National d'Identification (NNI).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C9A45C]/20 text-[#735619] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-base">shield_person</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">Présence du Tuteur Légal (Wali)</h3>
                    <p className="font-body text-xs text-[#575147]">Accompagnement parental conforme aux valeurs islamiques et familiales nigériennes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-base">visibility_off</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">Pudeur &amp; Confidentialité</h3>
                    <p className="font-body text-xs text-[#575147]">Protection et floutage modéré des photos, partage sur consentement mutuel.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-[#E8E3D7] relative z-10 flex items-center justify-between text-xs text-[#7D766C]">
              <span>Plateforme 100% Gratuite au Niger</span>
              <span className="font-semibold text-[#0F5C4D]">Niamey • Maradi • Zinder • Tahoua</span>
            </div>
          </motion.div>

          {/* Right Column: Dedicated Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E3D7] shadow-lg flex flex-col justify-center"
          >
            {/* Mode Switch Tabs */}
            <div className="flex rounded-2xl bg-[#FAF8F2] p-1.5 border border-[#E8E3D7] mb-8">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-display font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-[#0F5C4D] text-white shadow-xs'
                    : 'text-[#575147] hover:text-[#211E1A]'
                }`}
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Créer un profil</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-display font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-[#0F5C4D] text-white shadow-xs'
                    : 'text-[#575147] hover:text-[#211E1A]'
                }`}
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Se connecter</span>
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-6">
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#211E1A]">
                {mode === 'register' ? 'Création de votre compte matrimonial' : 'Accéder à votre espace NASSIB'}
              </h2>
              <p className="font-body text-xs sm:text-sm text-[#575147] mt-1">
                {mode === 'register'
                  ? 'Rejoignez une communauté bienveillante et orientée vers le mariage halal.'
                  : 'Entrez vos identifiants pour continuer vos échanges supervisés.'}
              </p>
            </div>

            {/* Error Message Alert */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg shrink-0">error</span>
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  {/* Role Selector: Candidat vs Wali */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147] block">
                      Vous vous inscrivez en tant que :
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('candidate')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          role === 'candidate'
                            ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 text-[#0F5C4D]'
                            : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">person</span>
                        <div>
                          <div className="font-display text-xs font-bold">Candidat(e)</div>
                          <div className="text-[10px] text-[#7D766C]">Je cherche un(e) époux(se)</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('wali')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          role === 'wali'
                            ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 text-[#0F5C4D]'
                            : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl text-[#C9A45C]">shield_person</span>
                        <div>
                          <div className="font-display text-xs font-bold">Tuteur (Wali)</div>
                          <div className="text-[10px] text-[#7D766C]">Pour ma fille / sœur / proche</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-display text-xs font-bold text-[#575147] block">
                      Civilité :
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`p-3 rounded-2xl border text-center font-display text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          gender === 'female'
                            ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-2xs'
                            : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">woman</span>
                        <span>Femme (Candidature)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`p-3 rounded-2xl border text-center font-display text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          gender === 'male'
                            ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-2xs'
                            : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">man</span>
                        <span>Homme (Candidature)</span>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147] block">
                      Nom complet ou Prénom usuel <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                        badge
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Amina Abdoulaye ou Ibrahim Moussa"
                        className="w-full h-12 pl-11 pr-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] placeholder-[#7D766C] focus:bg-white focus:border-[#0F5C4D] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number with Niger prefix */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147] block">
                      Numéro de téléphone (Niger) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="h-12 px-3 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl flex items-center gap-1.5 text-xs font-bold text-[#575147] shrink-0">
                        <span>🇳🇪 +227</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="90 12 34 56"
                        className="flex-1 h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] placeholder-[#7D766C] focus:bg-white focus:border-[#0F5C4D] focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="font-display text-xs font-bold text-[#575147] block">
                  Adresse e-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full h-12 pl-11 pr-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] placeholder-[#7D766C] focus:bg-white focus:border-[#0F5C4D] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-display text-xs font-bold text-[#575147]">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <span className="text-[11px] text-[#0F5C4D] hover:underline cursor-pointer">
                      Mot de passe oublié ?
                    </span>
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
                    placeholder={mode === 'register' ? 'Au moins 6 caractères' : 'Votre mot de passe'}
                    className="w-full h-12 pl-11 pr-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] placeholder-[#7D766C] focus:bg-white focus:border-[#0F5C4D] focus:outline-none transition-all"
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
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] rounded-2xl font-display text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{mode === 'register' ? 'Créer mon profil et continuer' : 'Se connecter'}</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Bottom Disclaimer */}
            <div className="mt-6 pt-6 border-t border-[#E8E3D7] text-center">
              <p className="text-[11px] text-[#7D766C] leading-relaxed">
                En continuant, vous confirmez agir avec une intention sincère de mariage halal et acceptez la{' '}
                <span className="text-[#0F5C4D] underline cursor-pointer">Charte Éthique de NASSIB</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
