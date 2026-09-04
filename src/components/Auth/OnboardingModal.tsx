import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NasibaLogo } from '../NasibaLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  userName: string;
  userRole: 'candidate' | 'wali';
  userPhone: string;
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

export interface OnboardingData {
  gender: 'female' | 'male';
  birthDate: string;
  age: number;
  country: string;
  region: string;
  neighborhood: string;
  maritalStatus: string;
  polygamyPreference: string;
  religion: string;
  education: string;
  profession: string;
  discoverySource: string;
  personalityTrait: string;
  familyImportance: string;
  religiousPractice: string;
  marriageHorizon: string;
  phoneVerified: boolean;
  waliName: string;
  waliRelation: string;
  waliPhone: string;
  agreedToTerms: boolean;
  photos: string[];
}

const MONTHS_LIST = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  userName,
  userRole,
  userPhone,
  onComplete,
  onClose,
}) => {
  // Step indexing: 1 to 10 sub-screens
  // 1: Genre & Date de Naissance
  // 2: Localisation (Pays, Région & Quartier)
  // 3: Statut Matrimonial (Déjà marié ?) & Polygamie
  // 4: Religion & Pratique Religieuse
  // 5: Niveau d'Études & Profession / Travail
  // 6: Personnalité & Piliers de Vie
  // 7: Horizon de Mariage & Origine
  // 8: Coordonnées du Tuteur / Wali (Facultatif)
  // 9: Charte d'Éthique & Engagement
  // 10: Téléversement de Photos
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;

  // Gender State
  const [gender, setGender] = useState<'female' | 'male'>('female');

  // Photo Upload State (Up to 3 photos)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(['', '', '']);

  // Date of Birth State
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(5); // 1-12 (May)
  const [birthYear, setBirthYear] = useState<number>(1998);
  const [birthDate, setBirthDate] = useState<string>('1998-05-15');
  const [calculatedAge, setCalculatedAge] = useState<number>(28);

  // Form State - Location
  const [country, setCountry] = useState<string>('Niger 🇳🇪');
  const [region, setRegion] = useState<string>('Niamey');
  const [neighborhood, setNeighborhood] = useState<string>('Plateau');

  // New Requested Fields:
  // 1. Statut Matrimonial (Déjà marié ?)
  const [maritalStatus, setMaritalStatus] = useState<string>('Célibataire (Jamais marié/e)');
  // 2. Polygamie
  const [polygamyPreference, setPolygamyPreference] = useState<string>('Monogamie stricte souhaitée');
  // 3. Religion
  const [religion, setReligion] = useState<string>('Musulman(e) Sunnite');
  // 4. Études
  const [education, setEducation] = useState<string>('Licence / Bac+3');
  // 5. Profession / Travail
  const [profession, setProfession] = useState<string>('Salarié(e) Secteur Privé');

  // Additional Profiling
  const [discoverySource, setDiscoverySource] = useState<string>('TikTok / Instagram / Facebook');
  const [personalityTrait, setPersonalityTrait] = useState<string>('Sérieux(se) & Organisé(e)');
  const [familyImportance, setFamilyImportance] = useState<string>('Priorité absolue');
  const [religiousPractice, setReligiousPractice] = useState<string>('Pratiquant(e) au quotidien');
  const [marriageHorizon, setMarriageHorizon] = useState<string>('Dans les 6 mois');

  // Optional Wali Info State
  const [skipWaliInfo, setSkipWaliInfo] = useState<boolean>(false);
  const [waliName, setWaliName] = useState<string>('');
  const [waliRelation, setWaliRelation] = useState<string>('Père');
  const [waliPhone, setWaliPhone] = useState<string>('');

  // Terms State
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Final Loading Animation State
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);

  const loadingMessages = [
    `Analyse de vos critères géographiques à ${region}...`,
    'Configuration de la personnalisation de votre profil...',
    'Recherche des profils compatibles selon vos valeurs...',
    'Profil de compatibilité prêt !'
  ];

  // Sync Date of Birth changes with formatted date and calculated age
  useEffect(() => {
    const formattedMonth = String(birthMonth).padStart(2, '0');
    const formattedDay = String(birthDay).padStart(2, '0');
    const dateStr = `${birthYear}-${formattedMonth}-${formattedDay}`;
    setBirthDate(dateStr);

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = (today.getMonth() + 1) - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
      age--;
    }
    setCalculatedAge(isNaN(age) ? 18 : Math.max(0, age));
  }, [birthDay, birthMonth, birthYear]);

  // Adjust default polygamy option when gender changes
  useEffect(() => {
    if (gender === 'male') {
      if (polygamyPreference.includes('souhaitée')) {
        setPolygamyPreference('Monogamie uniquement');
      }
    } else {
      if (polygamyPreference === 'Monogamie uniquement') {
        setPolygamyPreference('Monogamie stricte souhaitée');
      }
    }
  }, [gender]);

  // Photo upload helpers
  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille de la photo ne doit pas dépasser 5 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedPhotos((prev) => {
          const copy = [...prev];
          copy[index] = result;
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => {
      const copy = [...prev];
      copy[index] = '';
      return copy;
    });
  };

  // Robust completion handler using timer ref to prevent any hanging at 100%
  const completionTriggeredRef = useRef(false);

  const handleStartAnalysis = () => {
    setIsLoadingAnalysis(true);
    setLoadingProgress(0);
    setLoadingMessageIndex(0);
    completionTriggeredRef.current = false;

    const validPhotos = uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '');

    const finishOnboarding = () => {
      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;
      onComplete({
        gender,
        birthDate,
        age: calculatedAge,
        country,
        region,
        neighborhood,
        maritalStatus,
        polygamyPreference,
        religion,
        education,
        profession,
        discoverySource,
        personalityTrait,
        familyImportance,
        religiousPractice,
        marriageHorizon,
        phoneVerified: true,
        waliName: skipWaliInfo ? '' : waliName,
        waliRelation: skipWaliInfo ? '' : waliRelation,
        waliPhone: skipWaliInfo ? '' : waliPhone,
        agreedToTerms,
        photos: validPhotos,
      });
    };

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 8;
      if (currentProg >= 100) {
        currentProg = 100;
        setLoadingProgress(100);
        setLoadingMessageIndex(3);
        clearInterval(interval);
        setTimeout(() => {
          finishOnboarding();
        }, 500);
        return;
      }
      setLoadingProgress(currentProg);
      if (currentProg > 25 && currentProg <= 55) setLoadingMessageIndex(1);
      if (currentProg > 55 && currentProg <= 85) setLoadingMessageIndex(2);
      if (currentProg > 85) setLoadingMessageIndex(3);
    }, 100);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleStartAnalysis();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const yearsArray = Array.from({ length: 60 }, (_, i) => currentYear - 18 - i);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#211E1A]/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-xl bg-[#FAF8F2] rounded-3xl shadow-2xl border border-[#E8E3D7] overflow-hidden my-auto flex flex-col min-h-[540px]"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-6 pb-3 border-b border-[#E8E3D7] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <NasibaLogo size="sm" />
              <div className="hidden sm:block h-5 w-px bg-[#E8E3D7]"></div>
              <span className="hidden sm:inline font-body text-xs font-semibold text-[#0F5C4D]">
                Onboarding Éthique &amp; Personnalisé
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {!isLoadingAnalysis && (
                <span className="font-body text-xs font-bold text-[#0F5C4D] bg-[#8BAE9F]/20 px-3 py-1 rounded-full border border-[#8BAE9F]/30">
                  Étape {currentStep}/{totalSteps}
                </span>
              )}
              <span className="font-body text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>Obligatoire</span>
              </span>
            </div>
          </div>

          {/* Step Progress Indicator Bar */}
          {!isLoadingAnalysis && (
            <div className="w-full bg-[#E8E3D7] h-1.5 overflow-hidden">
              <motion.div
                className="bg-[#0F5C4D] h-full"
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Main Content Body */}
          <div className="flex-grow p-6 sm:p-8 flex flex-col justify-between bg-[#FAF8F2]">
            {isLoadingAnalysis ? (
              /* FINAL LOADING & COMPATIBILITY CALCULATION ANIMATION */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-auto flex flex-col items-center text-center py-8"
              >
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#E8E3D7"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#0F5C4D"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * loadingProgress) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-150 ease-out"
                    />
                  </svg>
                  <span className="absolute font-display text-lg font-bold text-[#0F5C4D]">
                    {loadingProgress}%
                  </span>
                </div>

                <h3 className="font-serif-display text-2xl font-bold text-[#0F5C4D] mb-2">
                  Finalisation de votre profil NASIBA
                </h3>

                <p className="font-body text-xs sm:text-sm text-[#575147] max-w-md h-12 flex items-center justify-center leading-relaxed">
                  « {loadingMessages[loadingMessageIndex]} »
                </p>

                <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#735619] text-xs font-semibold">
                  <span className="material-symbols-outlined text-base text-[#C9A45C]">verified</span>
                  <span>Communauté 100% vérifiée et éthique au Niger</span>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {/* SUB-STEP 1: Genre & Date de naissance */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 1 : Identité &amp; Âge
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Quelle est votre date de naissance ?
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Sélectionnez simplement votre genre et votre date de naissance.
                      </p>
                    </div>

                    {/* Gender Selector */}
                    <div className="space-y-2">
                      <label className="font-body text-[11px] font-bold uppercase tracking-wider text-[#7D766C] block">
                        Je suis :
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            gender === 'male'
                              ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 font-bold text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <span className="text-lg">👨</span>
                          <span className="font-display text-xs font-bold">Un Homme</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            gender === 'female'
                              ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 font-bold text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <span className="text-lg">👩</span>
                          <span className="font-display text-xs font-bold">Une Femme</span>
                        </button>
                      </div>
                    </div>

                    {/* Date Selector */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        {/* Jour */}
                        <div>
                          <label className="font-body text-[11px] font-bold uppercase tracking-wider text-[#7D766C] block mb-1.5 text-center">
                            Jour
                          </label>
                          <select
                            value={birthDay}
                            onChange={(e) => setBirthDay(Number(e.target.value))}
                            className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-2 text-center text-sm font-display font-bold text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20 cursor-pointer hover:border-[#8BAE9F] transition-colors"
                          >
                            {daysArray.map((d) => (
                              <option key={d} value={d}>
                                {d < 10 ? `0${d}` : d}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mois */}
                        <div>
                          <label className="font-body text-[11px] font-bold uppercase tracking-wider text-[#7D766C] block mb-1.5 text-center">
                            Mois
                          </label>
                          <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(Number(e.target.value))}
                            className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-2 text-center text-xs sm:text-sm font-display font-bold text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20 cursor-pointer hover:border-[#8BAE9F] transition-colors"
                          >
                            {MONTHS_LIST.map((monthName, idx) => (
                              <option key={monthName} value={idx + 1}>
                                {monthName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Année */}
                        <div>
                          <label className="font-body text-[11px] font-bold uppercase tracking-wider text-[#7D766C] block mb-1.5 text-center">
                            Année
                          </label>
                          <select
                            value={birthYear}
                            onChange={(e) => setBirthYear(Number(e.target.value))}
                            className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-2 text-center text-sm font-display font-bold text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20 cursor-pointer hover:border-[#8BAE9F] transition-colors"
                          >
                            {yearsArray.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Display live calculated age */}
                      <div className="p-4 rounded-2xl bg-[#8BAE9F]/10 border border-[#8BAE9F]/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0F5C4D]/10 flex items-center justify-center text-[#0F5C4D]">
                            <span className="material-symbols-outlined text-xl">cake</span>
                          </div>
                          <div>
                            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-[#7D766C] block">
                              Âge calculé
                            </span>
                            <span className="font-display text-xl font-extrabold text-[#0F5C4D]">
                              {calculatedAge} ans
                            </span>
                          </div>
                        </div>

                        {calculatedAge >= 18 ? (
                          <span className="px-3 py-1.5 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] font-body text-xs font-bold border border-[#0F5C4D]/20 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>Éligible</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-full bg-[#C9A45C]/15 text-[#8E6D29] border border-[#C9A45C]/30 font-body text-xs font-bold">
                            Âge minimum : 18 ans
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 2: Localisation */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 2 : Localisation
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Où vivez-vous actuellement ?
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Pour favoriser les rencontres et faciliter les démarches familiales.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-body text-xs font-semibold text-[#211E1A] block mb-1.5">
                          Pays de résidence
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-4 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                        >
                          <option value="Niger 🇳🇪">Niger 🇳🇪</option>
                          <option value="Diaspora - France 🇫🇷">Diaspora - France 🇫🇷</option>
                          <option value="Diaspora - Côte d'Ivoire 🇨🇮">Diaspora - Côte d'Ivoire 🇨🇮</option>
                          <option value="Diaspora - Autre Pays 🌍">Diaspora - Autre Pays 🌍</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-body text-xs font-semibold text-[#211E1A] block mb-1.5">
                          Région / Ville principale
                        </label>
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-4 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                        >
                          {['Niamey', 'Maradi', 'Zinder', 'Tahoua', 'Agadez', 'Tillabéri', 'Dosso', 'Diffa'].map(
                            (r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="font-body text-xs font-semibold text-[#211E1A] block mb-1.5">
                          Quartier (Optionnel)
                        </label>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          placeholder="Ex: Plateau, Ryad, Bobiel, Dar-Es-Salam..."
                          className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-4 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 3: Statut Matrimonial (Déjà marié ?) & Polygamie */}
                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 3 : Statut Matrimonial &amp; Polygamie
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Votre situation et vision matrimoniale
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Précisez si vous avez déjà été marié(e) et votre position sur la polygamie.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* Statut matrimonial */}
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          1. Êtes-vous ou avez-vous déjà été marié(e) ?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            { label: 'Célibataire', sub: 'Jamais marié(e)', val: 'Célibataire (Jamais marié/e)' },
                            { label: 'Divorcé(e)', sub: 'Précédemment marié(e)', val: 'Divorcé(e)' },
                            { label: 'Veuf / Veuve', sub: 'Conjoint(e) décédé(e)', val: 'Veuf / Veuve' },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setMaritalStatus(item.val)}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                maritalStatus === item.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 font-bold text-[#0F5C4D]'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <div className="font-display text-xs font-bold">{item.label}</div>
                              <div className="font-body text-[10px] text-[#7D766C] mt-0.5">{item.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Position sur la Polygamie */}
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          2. Votre position sur la Polygamie :
                        </label>
                        <div className="space-y-2">
                          {(gender === 'male'
                            ? [
                                { label: 'Monogamie uniquement', desc: 'Recherche une seule et unique épouse', val: 'Monogamie uniquement' },
                                { label: 'Ouvert à la polygamie', desc: 'Prêt à envisager une union polygame selon la Sunna', val: 'Ouvert à la polygamie' },
                                { label: 'Déjà marié (cherche co-épouse)', desc: 'Actuellement marié, recherche une nouvelle épouse', val: 'Déjà marié (cherche 2ème/3ème épouse)' },
                              ]
                            : [
                                { label: 'Monogamie stricte souhaitée', desc: 'Recherche un homme pour une union exclusive', val: 'Monogamie stricte souhaitée' },
                                { label: 'Ouverte à la polygamie', desc: 'Accepte d’être première ou seconde épouse', val: 'Ouverte à la polygamie' },
                                { label: 'Acceptation selon les règles islamiques', desc: 'Conforme aux préceptes avec équité et respect', val: 'Acceptation selon les règles islamiques' },
                              ]
                          ).map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setPolygamyPreference(opt.val)}
                              className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                polygamyPreference === opt.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D]'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <div>
                                <div className="font-display text-xs sm:text-sm font-bold">{opt.label}</div>
                                <div className="font-body text-[11px] text-[#7D766C]">{opt.desc}</div>
                              </div>
                              {polygamyPreference === opt.val && (
                                <span className="material-symbols-outlined text-[#0F5C4D] text-lg">check_circle</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 4: Religion & Pratique Religieuse */}
                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 4 : Religion &amp; Spiritualité
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Quelle est votre pratique religieuse ?
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Pour vous orienter vers des partenaires partageant votre vision de la foi.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Choix de la religion / courant */}
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          1. Courant / Appartenance religieuse :
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { label: 'Musulman(e) Sunnite', desc: 'Rapprochement selon le Coran & la Sunna', val: 'Musulman(e) Sunnite' },
                            { label: 'Musulman(e) Pratiquant(e)', desc: 'Respect assidu des 5 prières quotidiennes', val: 'Musulman(e) Pratiquant(e)' },
                            { label: 'Musulman(e) Modéré(e)', desc: 'Attachement sincère aux valeurs éthiques', val: 'Musulman(e) Modéré(e)' },
                            { label: 'Attaché(e) aux Traditions', desc: 'Ancré(e) dans les valeurs familiales et islamiques', val: 'Attaché(e) aux Traditions' },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setReligion(item.val)}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                religion === item.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D]'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <div className="font-display text-xs sm:text-sm font-bold">{item.label}</div>
                              <div className="font-body text-[10px] text-[#7D766C] mt-0.5">{item.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Niveau de pratique */}
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          2. Intensité de la pratique quotidienne :
                        </label>
                        <div className="space-y-2">
                          {[
                            { val: 'Très pratiquant(e)', title: 'Très pratiquant(e) (Prières à l\'heure à la mosquée / foyer)' },
                            { val: 'Pratiquant(e) au quotidien', title: 'Pratiquant(e) régulier(ère) et respectueux(se)' },
                            { val: 'Modéré(e)', title: 'Modéré(e) avec désir d\'apprentissage mutuel' },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setReligiousPractice(item.val)}
                              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                religiousPractice === item.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D] font-bold'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <span className="font-display text-xs sm:text-sm">{item.title}</span>
                              {religiousPractice === item.val && (
                                <span className="material-symbols-outlined text-[#0F5C4D] text-lg">check_circle</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 5: Niveau d'Études & Profession / Travail */}
                {currentStep === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 5 : Études &amp; Profession
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Niveau d'études et activité professionnelle
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Sélectionnez vos qualifications et votre domaine d'activité.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* Niveau d'études */}
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          1. Niveau d'études :
                        </label>
                        <select
                          value={education}
                          onChange={(e) => setEducation(e.target.value)}
                          className="w-full h-12 bg-white border border-[#E8E3D7] rounded-2xl px-4 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                        >
                          <option value="Études Islamiques / Medersa">Études Islamiques / Medersa</option>
                          <option value="Secondaire / Collège">Secondaire / Collège</option>
                          <option value="Baccalauréat">Baccalauréat</option>
                          <option value="Licence / Bac+3">Licence / Bac+3</option>
                          <option value="Master / Bac+5">Master / Bac+5</option>
                          <option value="Doctorat / Enseignement supérieur">Doctorat / Enseignement supérieur</option>
                          <option value="Formation Professionnelle / Technique">Formation Professionnelle / Technique</option>
                        </select>
                      </div>

                      {/* Profession / Travail */}
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          2. Situation professionnelle / Travail :
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { label: 'Fonctionnaire / Secteur Public', icon: 'account_balance', val: 'Fonctionnaire / Secteur Public' },
                            { label: 'Salarié(e) Secteur Privé', icon: 'business_center', val: 'Salarié(e) Secteur Privé' },
                            { label: 'Commerçant(e) / Entrepreneur', icon: 'storefront', val: 'Commerçant(e) / Entrepreneur' },
                            { label: 'Profession Libérale / Indépendant', icon: 'work', val: 'Profession Libérale / Indépendant(e)' },
                            { label: 'Artisan(e) / Agriculteur', icon: 'handyman', val: 'Artisan(e) / Agriculteur' },
                            { label: 'Étudiant(e)', icon: 'school', val: 'Étudiant(e)' },
                            { label: 'Sans emploi / Au foyer', icon: 'cottage', val: 'Au foyer / Sans emploi' },
                          ].map((job) => (
                            <button
                              key={job.val}
                              type="button"
                              onClick={() => setProfession(job.val)}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                profession === job.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D] font-bold'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-lg text-[#0F5C4D]">{job.icon}</span>
                              <span className="font-display text-xs">{job.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 6: Personnalité & Piliers de vie */}
                {currentStep === 6 && (
                  <motion.div
                    key="step-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-1.5">
                        Étape 6 : Personnalité &amp; Valeurs
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Vos piliers et tempérament
                      </h2>
                      <p className="font-body text-xs text-[#575147]">
                        Pour définir votre profil de compatibilité harmonieuse.
                      </p>
                    </div>

                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          1. Votre trait de caractère dominant :
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { title: '🧘 Calme & Posé(e)', val: 'Calme & Réservé(e)' },
                            { title: '🌟 Chaleureux(se) & Sociable', val: 'Sociable & Énergie positive' },
                            { title: '📋 Rigoureux(se) & Organisé(e)', val: 'Sérieux(se) & Organisé(e)' },
                            { title: '🎨 Créatif(ve) & Passionné(e)', val: 'Créatif(ve) & Passionné(e)' },
                          ].map((t) => (
                            <button
                              key={t.val}
                              type="button"
                              onClick={() => setPersonalityTrait(t.val)}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                personalityTrait === t.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D] font-bold'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <div className="font-display text-xs">{t.title}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="font-body text-xs font-bold text-[#211E1A] block mb-2">
                          2. Importance accordée au foyer familial :
                        </label>
                        <div className="space-y-2">
                          {[
                            { val: 'Priorité absolue', title: 'Priorité absolue (Foyer et bien-être familial au centre de tout)' },
                            { val: 'Très importante', title: 'Très importante (Équilibre harmonieux vie familiale et carrière)' },
                            { val: 'Modérée', title: 'Modérée & Indépendante (Autonomie et respect mutuel)' },
                          ].map((f) => (
                            <button
                              key={f.val}
                              type="button"
                              onClick={() => setFamilyImportance(f.val)}
                              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                familyImportance === f.val
                                  ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D] font-bold'
                                  : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                              }`}
                            >
                              <span className="font-display text-xs sm:text-sm">{f.title}</span>
                              {familyImportance === f.val && (
                                <span className="material-symbols-outlined text-[#0F5C4D] text-lg">check_circle</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 7: Horizon de Mariage & Origine */}
                {currentStep === 7 && (
                  <motion.div
                    key="step-7"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 7 : Horizon &amp; Découverte
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Votre horizon d'union
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Définissez à quelle échéance vous souhaitez concrétiser votre mariage.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: '💍 Dans les 6 mois', val: 'Dans les 6 mois', desc: 'Démarche immédiate et très concrète' },
                        { title: '⏳ D\'ici 1 an', val: 'D\'ici 1 an', desc: 'Souhaite concrétiser l\'union dans l\'année' },
                        { title: '💬 Prendre le temps de faire connaissance', val: 'Prendre le temps', desc: 'Prudence et échange approfondi sous supervision' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setMarriageHorizon(item.val)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            marriageHorizon === item.val
                              ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 ring-2 ring-[#0F5C4D]/20 text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-white text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <div className="font-display text-sm font-bold">{item.title}</div>
                          <div className="font-body text-xs text-[#7D766C] mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 8: Coordonnées du Tuteur / Wali (FACULTATIF) */}
                {currentStep === 8 && (
                  <motion.div
                    key="step-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#C9A45C]/20 text-[#8E6D29] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                          Étape 8 : Supervision du Wali (Facultatif)
                        </span>
                        <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                          Coordonnées du Tuteur (Wali)
                        </h2>
                        <p className="font-body text-xs text-[#575147] mt-1">
                          Étape facultative. Vous pouvez la renseigner ultérieurement.
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-[#FAF8F2] text-[#7D766C] font-body text-xs font-bold shrink-0 border border-[#E8E3D7]">
                        Facultatif
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0F5C4D] text-xl">info</span>
                        <span className="font-body text-xs text-[#211E1A]">
                          Pas sous la main ? Vous pouvez passer cette étape.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSkipWaliInfo(true);
                          handleNext();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E3D7] text-[#0F5C4D] font-body text-xs font-bold hover:bg-[#0F5C4D] hover:text-white transition-all cursor-pointer shadow-xs"
                      >
                        Passer cette étape
                      </button>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      <div>
                        <label className="font-body text-xs font-semibold text-[#211E1A] block mb-1">
                          Nom complet du Wali (Optionnel)
                        </label>
                        <input
                          type="text"
                          value={waliName}
                          onChange={(e) => {
                            setWaliName(e.target.value);
                            setSkipWaliInfo(false);
                          }}
                          placeholder="Ex: Mamadou Seydou"
                          className="w-full h-11 bg-white border border-[#E8E3D7] rounded-2xl px-4 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-body text-xs font-semibold text-[#211E1A] block mb-1">
                            Lien de parenté
                          </label>
                          <select
                            value={waliRelation}
                            onChange={(e) => {
                              setWaliRelation(e.target.value);
                              setSkipWaliInfo(false);
                            }}
                            className="w-full h-11 bg-white border border-[#E8E3D7] rounded-2xl px-3 text-xs font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                          >
                            <option value="Père">Père</option>
                            <option value="Oncle">Oncle</option>
                            <option value="Frère">Frère aîné</option>
                            <option value="Autre tuteur légal">Autre tuteur légal</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-body text-xs font-semibold text-[#211E1A] block mb-1">
                            Téléphone (+227)
                          </label>
                          <input
                            type="tel"
                            value={waliPhone}
                            onChange={(e) => {
                              setWaliPhone(e.target.value);
                              setSkipWaliInfo(false);
                            }}
                            placeholder="+227 96 12 34 56"
                            className="w-full h-11 bg-white border border-[#E8E3D7] rounded-2xl px-3 text-xs font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#8BAE9F]/20"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 9: Charte d'Éthique & Engagement */}
                {currentStep === 9 && (
                  <motion.div
                    key="step-9"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 9 : Engagement
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Charte de respect &amp; Sincérité
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Garantir une communauté honnête, bienveillante et conforme aux valeurs.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0F5C4D]/5 border border-[#0F5C4D]/20 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[#0F5C4D] text-xl shrink-0 mt-0.5">
                          verified_user
                        </span>
                        <p className="font-body text-xs text-[#211E1A] leading-relaxed">
                          Je certifie sur l'honneur l'exactitude des informations transmises et m'engage à chercher le mariage dans le respect total des préceptes islamiques et des traditions nigériennes.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E8E3D7] flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="termsCheck"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="w-5 h-5 accent-[#0F5C4D] rounded-md cursor-pointer"
                        />
                        <label htmlFor="termsCheck" className="font-body text-xs font-bold text-[#0F5C4D] cursor-pointer">
                          J'accepte la Charte Éthique &amp; d'Engagement NASIBA
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUB-STEP 10: Téléversement de Photos */}
                {currentStep === 10 && (
                  <motion.div
                    key="step-10"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        Étape 10 : Photos de Profil (Optionnel)
                      </span>
                      <h2 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                        Téléversez jusqu'à 3 photos de vous
                      </h2>
                      <p className="font-body text-xs text-[#575147] mt-1">
                        Les photos facilitent la rencontre et inspirent confiance. Seuls les profils comportant au moins 1 photo sont visibles sur l'application.
                      </p>
                    </div>

                    {/* 3 Photo Slots */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {[0, 1, 2].map((idx) => {
                        const photo = uploadedPhotos[idx];
                        return (
                          <div key={idx} className="relative flex flex-col items-center">
                            <div className="w-full h-44 rounded-2xl border-2 border-dashed border-[#E8E3D7] bg-[#FAF8F2] overflow-hidden flex flex-col items-center justify-center relative hover:border-[#8BAE9F] transition-colors">
                              {photo ? (
                                <>
                                  <img
                                    src={photo}
                                    alt={`Photo ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(idx)}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#211E1A]/80 text-white flex items-center justify-center shadow-md hover:bg-[#211E1A] cursor-pointer"
                                    title="Supprimer la photo"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                  {idx === 0 && (
                                    <span className="absolute bottom-2 left-2 bg-[#0F5C4D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                      Principale
                                    </span>
                                  )}
                                </>
                              ) : (
                                <label
                                  htmlFor={`onboarding-photo-${idx}`}
                                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-3 text-center"
                                >
                                  <div className="w-10 h-10 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center mb-1.5">
                                    <span className="material-symbols-outlined text-xl">
                                      add_a_photo
                                    </span>
                                  </div>
                                  <span className="font-display text-xs font-bold text-[#0F5C4D]">
                                    {idx === 0 ? 'Photo 1 (Principale)' : `Photo ${idx + 1}`}
                                  </span>
                                  <span className="font-body text-[10px] text-[#7D766C] mt-0.5">
                                    Cliquez pour choisir
                                  </span>
                                  <input
                                    id={`onboarding-photo-${idx}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notice box */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length > 0
                          ? 'bg-[#0F5C4D]/5 border-[#0F5C4D]/20'
                          : 'bg-[#C9A45C]/10 border-[#C9A45C]/30'
                      } flex items-start gap-3`}
                    >
                      <span
                        className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
                          uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length > 0
                            ? 'text-[#0F5C4D]'
                            : 'text-[#8E6D29]'
                        }`}
                      >
                        {uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length > 0
                          ? 'verified_user'
                          : 'info'}
                      </span>
                      <p
                        className={`font-body text-xs leading-relaxed ${
                          uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length > 0
                            ? 'text-[#211E1A]'
                            : 'text-[#211E1A]'
                        }`}
                      >
                        {uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length > 0
                          ? `Vous avez ajouté ${
                              uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length
                            } photo(s). Votre profil sera bien visible par les membres du sexe opposé.`
                          : `Information : Vous avez choisi de ne téléverser aucune photo pour le moment. Votre profil restera masqué pour les autres candidats jusqu'à ce que vous ajoutiez au moins une photo.`}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Bottom Navigation Control Buttons */}
            {!isLoadingAnalysis && (
              <div className="mt-8 pt-4 border-t border-[#E8E3D7] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="px-4 py-2.5 rounded-2xl bg-[#FAF8F2] text-[#575147] font-body text-xs font-bold hover:bg-[#E8E3D7] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Précédent</span>
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleNext}
                  disabled={currentStep === 9 && !agreedToTerms}
                  className="px-6 py-2.5 rounded-2xl bg-[#0F5C4D] text-white font-display text-xs sm:text-sm font-bold hover:bg-[#0A4035] disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>
                    {currentStep === totalSteps
                      ? uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length > 0
                        ? `Finaliser mon profil (${uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '').length} photo)`
                        : 'Finaliser sans photo'
                      : 'Continuer'}
                  </span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
