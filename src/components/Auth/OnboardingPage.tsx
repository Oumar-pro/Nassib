import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NasibaLogo } from '../NasibaLogo';
import { OnboardingData } from './OnboardingModal';
import { PremiumSelect } from '../Common/PremiumSelect';
import { PremiumDatePicker } from '../Common/PremiumDatePicker';

interface OnboardingPageProps {
  userName: string;
  userRole?: 'candidate' | 'wali';
  userPhone?: string;
  onComplete: (data: OnboardingData) => void;
  onCancel?: () => void;
}

const STEP_TITLES = [
  'Accueil & Bienvenue',
  'Civilité (Genre)',
  'Date de Naissance',
  'Localisation Résidentielle',
  'Statut Matrimonial & Polygamie',
  'Religion & Pratique Quotidienne',
  'Niveau d\'Études & Profession',
  'Personnalité & Priorité Familiale',
  'Horizon de Mariage & Origine',
  'Tuteur Légal (Wali)',
  'Charte Éthique & Engagement',
  'Photos & Pudeur du Profil',
];

// Location Data
const COUNTRIES_LIST = [
  { value: 'Niger 🇳🇪', label: 'Niger (Résident national) 🇳🇪' },
  { value: 'Bénin 🇧🇯', label: 'Bénin 🇧🇯' },
  { value: 'Côte d\'Ivoire 🇨🇮', label: 'Côte d\'Ivoire 🇨🇮' },
  { value: 'Sénégal 🇸🇳', label: 'Sénégal 🇸🇳' },
  { value: 'Mali 🇲🇱', label: 'Mali 🇲🇱' },
  { value: 'Burkina Faso 🇧🇫', label: 'Burkina Faso 🇧🇫' },
  { value: 'Togo 🇹🇬', label: 'Togo 🇹🇬' },
  { value: 'France 🇫🇷', label: 'France (Diaspora) 🇫🇷' },
  { value: 'Autre pays', label: 'Autre pays / Diaspora' },
];

const NIGER_CITIES = [
  { value: 'Niamey', label: 'Niamey (Capitale)', badge: 'Plus de 400 profils' },
  { value: 'Maradi', label: 'Maradi', badge: 'Actif' },
  { value: 'Zinder', label: 'Zinder', badge: 'Actif' },
  { value: 'Tahoua', label: 'Tahoua' },
  { value: 'Agadez', label: 'Agadez' },
  { value: 'Dosso', label: 'Dosso' },
  { value: 'Tillabéri', label: 'Tillabéri' },
  { value: 'Diffa', label: 'Diffa' },
];

const OTHER_CITIES = [
  { value: 'Cotonou', label: 'Cotonou' },
  { value: 'Abidjan', label: 'Abidjan' },
  { value: 'Dakar', label: 'Dakar' },
  { value: 'Bamako', label: 'Bamako' },
  { value: 'Ouagadougou', label: 'Ouagadougou' },
  { value: 'Paris', label: 'Paris / Île-de-France' },
  { value: 'Autre ville', label: 'Autre ville' },
];

const NIAMEY_NEIGHBORHOODS = [
  'Plateau',
  'Yantala',
  'Recasement',
  'Koubia',
  'Francophonie',
  'Dar-es-Salam',
  'Goudel',
  'Banifandou',
  'Harobanda',
  'Lazaret',
  'Talladjé',
  'Koira Kano',
  'Koira Tégui',
  'Ryad',
  'Nouveau Marché',
  'Bobiel',
  'Aéroport',
  'Wadata',
  'Sonni',
  'Katako',
  'Bassora',
  'Autre quartier...',
];

const MARADI_NEIGHBORHOODS = [
  'Ali Dan Sofo',
  'Dan Goulbi',
  'Bagalam',
  'Zaria',
  'Zongo',
  'Maradi Ville',
  'Autre quartier...',
];

const ZINDER_NEIGHBORHOODS = [
  'Birni',
  'Zengou',
  'Garin Malam',
  'Sabon Gari',
  'Charé Zamna',
  'Autre quartier...',
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  userName,
  userRole = 'candidate',
  userPhone = '',
  onComplete,
  onCancel,
}) => {
  // Current step: starts at 0 (Welcome Screen)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const totalSteps = 11; // Steps 1 to 11

  // Step 1: Gender
  const [gender, setGender] = useState<'female' | 'male'>('female');

  // Step 2: Date of Birth
  const [birthDate, setBirthDate] = useState<string>('1998-05-15');
  const [calculatedAge, setCalculatedAge] = useState<number>(28);

  // Step 3: Location (Sequential: Country -> City -> Neighborhood)
  const [country, setCountry] = useState<string>('Niger 🇳🇪');
  const [region, setRegion] = useState<string>('Niamey');
  const [neighborhood, setNeighborhood] = useState<string>('Plateau');
  const [customNeighborhood, setCustomNeighborhood] = useState<string>('');

  // Step 4: Matrimonial Status & Polygamy
  const [maritalStatus, setMaritalStatus] = useState<string>('Célibataire (Jamais marié/e)');
  const [polygamyPreference, setPolygamyPreference] = useState<string>('Monogamie stricte souhaitée');

  // Step 5: Religion & Practice
  const [religion, setReligion] = useState<string>('Musulman(e) Sunnite (Rite Malékite)');
  const [religiousPractice, setReligiousPractice] = useState<string>('Régulière à l\'heure (5 prières)');

  // Step 6: Education & Profession
  const [education, setEducation] = useState<string>('Licence / Bac+3');
  const [professionCategory, setProfessionCategory] = useState<string>('Secteur Privé / Cadre');
  const [profession, setProfession] = useState<string>('Salarié(e) Secteur Privé');

  // Step 7: Personality & Family Priority
  const [personalityTrait, setPersonalityTrait] = useState<string>('Calme & Posé(e)');
  const [familyImportance, setFamilyImportance] = useState<string>('Priorité absolue au quotidien');

  // Step 8: Marriage Horizon & Origin
  const [marriageHorizon, setMarriageHorizon] = useState<string>('Dans les 6 mois');
  const [originRegion, setOriginRegion] = useState<string>('Originaire du Niger (Toutes régions)');

  // Step 9: Wali Info State
  const [skipWaliInfo, setSkipWaliInfo] = useState<boolean>(false);
  const [waliName, setWaliName] = useState<string>('');
  const [waliRelation, setWaliRelation] = useState<string>('Père');
  const [waliPhone, setWaliPhone] = useState<string>('');

  // Step 10: Ethics Agreement
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Step 11: Photos
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(['', '', '']);

  // Loading animation state at end of onboarding
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);

  const loadingMessages = [
    `Configuration du profil sécurisé de ${userName}...`,
    `Localisation vérifiée à ${region} (${country.replace(/[^\p{L}\s]/gu, '').trim()})...`,
    'Application des filtres de pudeur et de discrétion...',
    'Initialisation des recommandations matrimoniales conformes...',
    'Profil matrimonial NASSIB prêt !',
  ];

  // Adjust default polygamy option when gender changes
  useEffect(() => {
    if (gender === 'male') {
      if (polygamyPreference.includes('co-épouse') || polygamyPreference.includes('stricte souhaitée')) {
        setPolygamyPreference('Monogamie uniquement');
      }
    } else {
      if (polygamyPreference === 'Monogamie uniquement') {
        setPolygamyPreference('Monogamie stricte souhaitée');
      }
    }
  }, [gender]);

  // Adjust neighborhoods list dynamically
  const getNeighborhoodOptions = () => {
    if (region === 'Niamey') return NIAMEY_NEIGHBORHOODS;
    if (region === 'Maradi') return MARADI_NEIGHBORHOODS;
    if (region === 'Zinder') return ZINDER_NEIGHBORHOODS;
    return ['Centre-ville', 'Quartier résidentiel', 'Périphérie', 'Autre quartier...'];
  };

  // Photo handlers
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

  const completionTriggeredRef = useRef(false);

  const handleStartAnalysis = () => {
    setIsLoadingAnalysis(true);
    setLoadingProgress(0);
    setLoadingMessageIndex(0);
    completionTriggeredRef.current = false;

    const validPhotos = uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '');
    const finalNeighborhood =
      neighborhood === 'Autre quartier...' && customNeighborhood.trim()
        ? customNeighborhood.trim()
        : neighborhood;

    const finishOnboarding = () => {
      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;
      onComplete({
        gender,
        birthDate,
        age: calculatedAge,
        country,
        region,
        neighborhood: finalNeighborhood,
        maritalStatus,
        polygamyPreference,
        religion,
        education,
        profession,
        discoverySource: originRegion,
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

    // Realistic stepped progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + 4;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(finishOnboarding, 600);
          return 100;
        }
        if (next >= 25 && next < 50) setLoadingMessageIndex(1);
        else if (next >= 50 && next < 75) setLoadingMessageIndex(2);
        else if (next >= 75 && next < 95) setLoadingMessageIndex(3);
        else if (next >= 95) setLoadingMessageIndex(4);
        return next;
      });
    }, 90);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleStartAnalysis();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] font-body flex flex-col selection:bg-[#8BAE9F]/25 selection:text-[#0F5C4D]">
      {/* Top Header bar with clean logo and progress */}
      <header className="sticky top-0 z-30 bg-[#FAF8F2]/95 backdrop-blur-md border-b border-[#E8E3D7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-18 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 -ml-2 text-[#575147] hover:text-[#0F5C4D] hover:bg-white rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-[#E8E3D7]"
                title="Étape précédente"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
            <NasibaLogo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F5C4D]">
                  Étape {currentStep} / {totalSteps}
                </span>
                <div className="w-24 sm:w-36 h-2 bg-[#E8E3D7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F5C4D] transition-all duration-300 rounded-full"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E3D7] text-xs font-semibold text-[#0F5C4D]">
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D]"></span>
                <span>Parcours d'accueil</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col justify-center">
        {isLoadingAnalysis ? (
          /* Loading & Profiling Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 sm:p-14 border border-[#E8E3D7] shadow-xl text-center space-y-6 max-w-xl mx-auto"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-[#0F5C4D]/10 border-2 border-[#0F5C4D] flex items-center justify-center text-[#0F5C4D] animate-pulse">
              <span className="material-symbols-outlined text-3xl">hourglass_top</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                Finalisation de votre profil matrimonial
              </h3>
              <p className="text-xs sm:text-sm text-[#575147] h-8 flex items-center justify-center">
                {loadingMessages[loadingMessageIndex]}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-[#FAF8F2] border border-[#E8E3D7] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-[#0F5C4D] rounded-full transition-all duration-150"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-mono font-bold text-[#7D766C]">
                <span>Sauvegarde des critères...</span>
                <span>{loadingProgress}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E3D7] text-[11px] text-[#7D766C] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#C9A45C]">verified</span>
              <span>Inscription protégée par les protocoles éthiques NASSIB</span>
            </div>
          </motion.div>
        ) : currentStep === 0 ? (
          /* ============================================================ */
          /* ÉCRAN DE BIENVENUE & PRÉPARATION (STEP 0)                    */
          /* ============================================================ */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E3D7] shadow-xl relative overflow-hidden space-y-8"
          >
            {/* Spiritual Accent */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF8F2] border border-[#E8E3D7] text-xs font-semibold text-[#0F5C4D]">
                <span className="material-symbols-outlined text-sm text-[#C9A45C]">auto_awesome</span>
                <span>Bismillah Ar-Rahman Ar-Rahim</span>
              </div>

              <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0F5C4D] leading-tight">
                Bienvenue sur NASSIB, {userName} !
              </h1>

              <p className="font-body text-xs sm:text-sm text-[#575147] max-w-2xl mx-auto leading-relaxed">
                Votre démarche matrimoniale repose sur une intention noble et sincère (Niyyah).
                Pour vous présenter les profils les plus compatibles et respectueux de votre vision,
                nous vous guidons à travers un parcours d'onboarding rapide, bienveillant et 100% confidentiel.
              </p>
            </div>

            {/* Preparation Roadmap */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  Civilité &amp; Maturité
                </h3>
                <p className="text-[11px] text-[#575147] leading-relaxed">
                  Précisez votre civilité et votre date de naissance avec notre sélecteur premium sécurisé.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/20 text-[#735619] flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  Localisation Séquentielle
                </h3>
                <p className="text-[11px] text-[#575147] leading-relaxed">
                  Indiquez votre pays, votre ville au Niger puis votre quartier pour faciliter les affinités de proximité.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  Valeurs &amp; Pudeur
                </h3>
                <p className="text-[11px] text-[#575147] leading-relaxed">
                  Pratique religieuse, tuteur légal (Wali), et photos privées floutées selon votre volonté.
                </p>
              </div>
            </div>

            {/* Sacred Reassurance Note */}
            <div className="p-4 rounded-2xl bg-[#0F5C4D]/5 border border-[#0F5C4D]/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-xl text-[#0F5C4D] shrink-0 mt-0.5">
                shield
              </span>
              <div className="text-xs text-[#575147] leading-relaxed">
                <strong className="text-[#0F5C4D]">Garantie de Pudeur (Haya) :</strong> Vos informations restent strictement confidentielles et ne sont jamais partagées à des tiers. Les photos restent sous votre contrôle exclusif.
              </div>
            </div>

            {/* Start Onboarding CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E3D7]">
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs font-semibold text-[#7D766C] hover:text-[#211E1A] cursor-pointer"
                >
                  Revenir plus tard
                </button>
              ) : (
                <div className="text-xs text-[#7D766C]">Temps estimé : ~3 minutes</div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-8 py-4 bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] rounded-2xl font-display text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Commencer mon parcours</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* FORMULAIRE MULTI-ÉTAPES AVEC SÉLECTEURS PREMIUM              */
          /* ============================================================ */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E3D7] shadow-xl space-y-8">
            {/* Step Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F2] border border-[#E8E3D7] text-[11px] font-bold text-[#0F5C4D] mb-2">
                <span>Étape {currentStep} sur {totalSteps}</span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#211E1A]">
                {STEP_TITLES[currentStep]}
              </h2>
            </div>

            <div className="min-h-[300px]">
              {/* ============================================================ */}
              {/* ÉTAPE 1 : CHOIX DU GENRE                                     */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Veuillez préciser votre civilité pour orienter les correspondances matrimoniales selon les préceptes islamiques :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option Femme */}
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        gender === 'female'
                          ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 ring-2 ring-[#0F5C4D]/15'
                          : 'border-[#E8E3D7] bg-white hover:border-[#8BAE9F]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl">woman</span>
                        </div>
                        {gender === 'female' && (
                          <span className="material-symbols-outlined text-2xl text-[#0F5C4D]">
                            check_circle
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="font-display text-base font-bold text-[#211E1A]">
                          Je suis une Femme (Sœur)
                        </div>
                        <p className="text-xs text-[#575147] leading-relaxed">
                          À la recherche d'un époux pieux, intègre et protecteur dans le respect des traditions et avec l'accord de mon tuteur (Wali).
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E8E3D7]/60 text-[11px] font-semibold text-[#0F5C4D] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>Préservation de la pudeur &amp; floutage activable</span>
                      </div>
                    </button>

                    {/* Option Homme */}
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        gender === 'male'
                          ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 ring-2 ring-[#0F5C4D]/15'
                          : 'border-[#E8E3D7] bg-white hover:border-[#8BAE9F]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl">man</span>
                        </div>
                        {gender === 'male' && (
                          <span className="material-symbols-outlined text-2xl text-[#0F5C4D]">
                            check_circle
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="font-display text-base font-bold text-[#211E1A]">
                          Je suis un Homme (Frère)
                        </div>
                        <p className="text-xs text-[#575147] leading-relaxed">
                          À la recherche d'une épouse vertueuse, bienveillante et pieuse pour fonder un foyer stable et harmonieux.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E8E3D7]/60 text-[11px] font-semibold text-[#0F5C4D] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">handshake</span>
                        <span>Démarche d'engagement &amp; respect des familles</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 2 : DATE DE NAISSANCE (SÉLECTEUR PREMIUM)             */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Veuillez sélectionner votre date de naissance avec notre sélecteur premium. NASSIB est strictement réservé aux personnes majeures (18 ans et plus).
                  </p>

                  <PremiumDatePicker
                    value={birthDate}
                    onChange={(newDateStr, newAge) => {
                      setBirthDate(newDateStr);
                      setCalculatedAge(newAge);
                    }}
                    minAge={18}
                    label="Date de naissance officielle"
                    helperText="Votre âge exact sera calculé automatiquement et affiché sur votre profil matrimonial."
                  />
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 3 : LOCALISATION SÉQUENTIELLE                         */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Renseignez votre lieu de vie. Choisissez d'abord votre <strong>pays de résidence</strong>, la <strong>ville</strong> apparaîtra juste en dessous, puis le <strong>quartier</strong>.
                  </p>

                  {/* 1. PAYS DE RÉSIDENCE */}
                  <div className="space-y-1.5">
                    <PremiumSelect
                      label="1. Pays de résidence"
                      icon="public"
                      value={country}
                      onChange={(val) => {
                        setCountry(val);
                        if (val.includes('Niger')) {
                          setRegion('Niamey');
                          setNeighborhood('Plateau');
                        } else {
                          setRegion(OTHER_CITIES[0].value);
                          setNeighborhood('Centre-ville');
                        }
                      }}
                      options={COUNTRIES_LIST}
                      searchable={true}
                    />
                  </div>

                  {/* 2. VILLE / RÉGION (Apparaît juste en dessous une fois le pays choisi) */}
                  <AnimatePresence>
                    {country && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-1.5 pt-2"
                      >
                        <PremiumSelect
                          label="2. Ville / Région de résidence"
                          icon="location_city"
                          value={region}
                          onChange={(val) => {
                            setRegion(val);
                            if (val === 'Niamey') setNeighborhood('Plateau');
                            else if (val === 'Maradi') setNeighborhood('Ali Dan Sofo');
                            else if (val === 'Zinder') setNeighborhood('Birni');
                            else setNeighborhood('Centre-ville');
                          }}
                          options={country.includes('Niger') ? NIGER_CITIES : OTHER_CITIES}
                          searchable={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 3. QUARTIER / COMMUNE (Apparaît juste en dessous une fois la ville choisie) */}
                  <AnimatePresence>
                    {region && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2 pt-2"
                      >
                        <PremiumSelect
                          label={`3. Quartier / Commune (${region})`}
                          icon="home_pin"
                          value={neighborhood}
                          onChange={(val) => setNeighborhood(val)}
                          options={getNeighborhoodOptions()}
                          searchable={true}
                        />

                        {/* Input if "Autre quartier..." is chosen */}
                        {neighborhood === 'Autre quartier...' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-1"
                          >
                            <input
                              type="text"
                              value={customNeighborhood}
                              onChange={(e) => setCustomNeighborhood(e.target.value)}
                              placeholder={`Indiquez le nom de votre quartier à ${region}...`}
                              className="w-full h-12 px-4 bg-white border border-[#0F5C4D] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:ring-2 focus:ring-[#0F5C4D]/20 shadow-xs"
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 4 : STATUT MATRIMONIAL & POLYGAMIE                     */}
              {/* ============================================================ */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <PremiumSelect
                    label="Statut matrimonial actuel"
                    icon="favorite"
                    value={maritalStatus}
                    onChange={(val) => setMaritalStatus(val)}
                    options={[
                      'Célibataire (Jamais marié/e)',
                      'Divorcé(e) sans enfants',
                      'Divorcé(e) avec enfants',
                      'Veuf / Veuve sans enfants',
                      'Veuf / Veuve avec enfants',
                    ]}
                  />

                  <PremiumSelect
                    label="Position sur la polygamie"
                    icon="family_restroom"
                    value={polygamyPreference}
                    onChange={(val) => setPolygamyPreference(val)}
                    options={
                      gender === 'male'
                        ? [
                            {
                              value: 'Monogamie uniquement',
                              label: 'Monogamie uniquement',
                              sublabel: 'Recherche d\'une seule épouse dans le foyer',
                            },
                            {
                              value: 'Ouvert à la polygamie selon les conditions légales islamiques',
                              label: 'Ouvert à la polygamie selon la charia',
                              sublabel: 'Conditionnée à la capacité financière et à l\'équité stricte',
                            },
                            {
                              value: 'Déjà engagé(e) dans un foyer polygame',
                              label: 'Déjà engagé dans un foyer polygame',
                              sublabel: 'Recherche d\'une seconde ou co-épouse avec transparence',
                            },
                          ]
                        : [
                            {
                              value: 'Monogamie stricte souhaitée',
                              label: 'Monogamie stricte souhaitée',
                              sublabel: 'Souhaite être l\'unique épouse',
                            },
                            {
                              value: 'Ouverte à être seconde ou co-épouse avec équité',
                              label: 'Ouverte à être seconde épouse',
                              sublabel: 'Dans le respect scrupuleux de l\'équité religieuse',
                            },
                            {
                              value: 'À discuter avec respect et bienveillance',
                              label: 'À discuter avec respect et bienveillance',
                              sublabel: 'Ouverte à l\'échange avec le prétendant et le tuteur',
                            },
                          ]
                    }
                  />
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 5 : RELIGION & PRATIQUE QUOTIDIENNE                    */}
              {/* ============================================================ */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <PremiumSelect
                    label="Courant religieux"
                    icon="mosque"
                    value={religion}
                    onChange={(val) => setReligion(val)}
                    options={[
                      {
                        value: 'Musulman(e) Sunnite (Rite Malékite)',
                        label: 'Musulman(e) Sunnite (Rite Malékite)',
                        badge: 'Tradition dominante au Niger',
                      },
                      {
                        value: 'Musulman(e) Sunnite (Général)',
                        label: 'Musulman(e) Sunnite (Général)',
                      },
                      {
                        value: 'Musulman(e) Pratiquant(e)',
                        label: 'Musulman(e) Pratiquant(e)',
                      },
                      {
                        value: 'Autre courant musulman',
                        label: 'Autre courant musulman',
                      },
                    ]}
                  />

                  <PremiumSelect
                    label="Pratique des 5 prières quotidiennes"
                    icon="schedule"
                    value={religiousPractice}
                    onChange={(val) => setReligiousPractice(val)}
                    options={[
                      {
                        value: 'Régulière à l\'heure (5 prières)',
                        label: 'Régulière à l\'heure (5 prières)',
                        badge: 'Assiduité complète',
                      },
                      {
                        value: 'Pratique modérée avec effort constant',
                        label: 'Pratique modérée avec effort constant',
                        badge: 'En régularisation',
                      },
                      {
                        value: 'En progression spirituelle',
                        label: 'En progression spirituelle',
                        badge: 'Apprentissage continu',
                      },
                    ]}
                  />
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 6 : ÉTUDES & PROFESSION                                */}
              {/* ============================================================ */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <PremiumSelect
                    label="Niveau d'études académiques ou islamiques"
                    icon="school"
                    value={education}
                    onChange={(val) => setEducation(val)}
                    options={[
                      'Baccalauréat',
                      'Licence / Bac+3',
                      'Master / Bac+5',
                      'Doctorat / Ph.D',
                      'Formation professionnelle / BTS',
                      'Études islamiques supérieures',
                      'Autre niveau d\'études',
                    ]}
                  />

                  <PremiumSelect
                    label="Catégorie socio-professionnelle"
                    icon="work"
                    value={professionCategory}
                    onChange={(val) => setProfessionCategory(val)}
                    options={[
                      'Fonction publique & Administration',
                      'Secteur Privé / Cadre',
                      'Commerce & Entreprenariat',
                      'Santé & Médical',
                      'Éducation & Enseignement',
                      'Étudiant(e) / Formation',
                      'Foyer / Sans activité professionnelle',
                      'Autre profession',
                    ]}
                  />

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">
                      Précision sur votre profession ou métier :
                    </label>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Enseignant, Comptable, Commerçant(e), Juriste, Ingénieur..."
                      className="w-full h-12 px-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 7 : PERSONNALITÉ & PRIORITÉ FAMILIALE                  */}
              {/* ============================================================ */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <PremiumSelect
                    label="Trait de caractère principal"
                    icon="psychology"
                    value={personalityTrait}
                    onChange={(val) => setPersonalityTrait(val)}
                    options={[
                      'Calme & Posé(e)',
                      'Sérieux(se) & Organisé(e)',
                      'Chaleureux(se) & Sociable',
                      'Pieux(se) & Discret(ète)',
                      'Généreux(se) & Bienveillant(e)',
                      'Ambitieux(se) & Déterminé(e)',
                    ]}
                  />

                  <PremiumSelect
                    label="Place de la famille dans votre vie quotidienne"
                    icon="home"
                    value={familyImportance}
                    onChange={(val) => setFamilyImportance(val)}
                    options={[
                      {
                        value: 'Priorité absolue au quotidien',
                        label: 'Priorité absolue au quotidien',
                        sublabel: 'Très proche des parents et de la belle-famille',
                      },
                      {
                        value: 'Très importante avec respect de l\'espace du couple',
                        label: 'Très importante avec équilibre du couple',
                        sublabel: 'Harmonie familiale et préservation de l\'intimité conjugale',
                      },
                      {
                        value: 'Équilibrée et harmonieuse',
                        label: 'Équilibrée et harmonieuse',
                        sublabel: 'Ouvert à la conciliation bienveillante',
                      },
                    ]}
                  />
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 8 : HORIZON DE MARIAGE & ORIGINE                      */}
              {/* ============================================================ */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <PremiumSelect
                    label="Horizon souhaité pour concrétiser le mariage (Zawaj)"
                    icon="event"
                    value={marriageHorizon}
                    onChange={(val) => setMarriageHorizon(val)}
                    options={[
                      {
                        value: 'Dès que possible (< 3 mois)',
                        label: 'Dès que possible (< 3 mois)',
                        badge: 'Projet immédiat',
                      },
                      {
                        value: 'Dans les 6 mois',
                        label: 'Dans les 6 mois',
                        badge: 'Horizon proche',
                      },
                      {
                        value: 'Dans l\'année (6 à 12 mois)',
                        label: 'Dans l\'année (6 à 12 mois)',
                        badge: 'Prendre le temps nécessaire',
                      },
                    ]}
                  />

                  <PremiumSelect
                    label="Région d'origine / Attachement communautaire"
                    icon="travel_explore"
                    value={originRegion}
                    onChange={(val) => setOriginRegion(val)}
                    options={[
                      'Originaire du Niger (Toutes régions)',
                      'Région de Niamey',
                      'Région de Maradi',
                      'Région de Zinder',
                      'Région de Tahoua',
                      'Région de Dosso',
                      'Région d\'Agadez',
                      'Région de Tillabéri',
                      'Région de Diffa',
                      'Diaspora / International',
                    ]}
                  />
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 9 : TUTEUR LÉGAL (WALI)                                */}
              {/* ============================================================ */}
              {currentStep === 9 && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-2xl flex items-start gap-3 text-xs text-[#735619]">
                    <span className="material-symbols-outlined text-lg text-[#C9A45C] shrink-0 mt-0.5">
                      shield_person
                    </span>
                    <div className="leading-relaxed">
                      <strong className="font-bold">Présence du Wali (Tuteur Légal) :</strong>
                      <p className="mt-0.5 text-[#575147]">
                        Renseigner un tuteur légal renforce la confiance des familles et active le badge « Supervision Wali ». Vous pouvez également choisir de le renseigner ultérieurement depuis vos paramètres.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7]">
                    <input
                      type="checkbox"
                      id="skipWali"
                      checked={skipWaliInfo}
                      onChange={(e) => setSkipWaliInfo(e.target.checked)}
                      className="w-4 h-4 text-[#0F5C4D] rounded-md accent-[#0F5C4D] cursor-pointer"
                    />
                    <label htmlFor="skipWali" className="text-xs text-[#575147] cursor-pointer font-medium">
                      Je souhaite renseigner les coordonnées de mon tuteur plus tard
                    </label>
                  </div>

                  {!skipWaliInfo && (
                    <div className="space-y-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="font-display text-xs font-bold text-[#575147]">
                          Nom et Prénom du Tuteur (Wali) :
                        </label>
                        <input
                          type="text"
                          value={waliName}
                          onChange={(e) => setWaliName(e.target.value)}
                          placeholder="Ex: Elhadj Moussa Abdou"
                          className="w-full h-12 px-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <PremiumSelect
                          label="Lien de parenté avec le Wali"
                          icon="people"
                          value={waliRelation}
                          onChange={(val) => setWaliRelation(val)}
                          options={[
                            'Père',
                            'Frère aîné',
                            'Oncle paternel',
                            'Grand-père',
                            'Tuteur légal désigné',
                          ]}
                        />

                        <div className="space-y-1.5">
                          <label className="font-display text-xs font-bold text-[#575147]">
                            Numéro de téléphone du Wali :
                          </label>
                          <input
                            type="tel"
                            value={waliPhone}
                            onChange={(e) => setWaliPhone(e.target.value)}
                            placeholder="+227 90 00 00 00"
                            className="w-full h-12 px-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 10 : CHARTE ÉTHIQUE & ENGAGEMENT                       */}
              {/* ============================================================ */}
              {currentStep === 10 && (
                <div className="space-y-6">
                  <div className="p-6 bg-[#FAF8F2] rounded-3xl border border-[#E8E3D7] space-y-4 text-xs leading-relaxed text-[#575147]">
                    <h4 className="font-display text-sm font-bold text-[#0F5C4D] flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">gavel</span>
                      <span>Engagement sur l'Honneur &amp; Charte Éthique NASSIB</span>
                    </h4>
                    <p>
                      1. <strong>Intention sincère (Niyyah) :</strong> Mon inscription a pour unique objectif la conclusion d'un mariage licite (halal) conforme aux valeurs islamiques et familiales.
                    </p>
                    <p>
                      2. <strong>Pudeur &amp; courtoisie :</strong> Tout comportement irrespectueux, proposition déplacée ou contenu contraire aux convenances entraînera la radiation immédiate.
                    </p>
                    <p>
                      3. <strong>Véracité des déclarations :</strong> Je certifie que toutes les informations fournies représentent fidèlement mon statut réel.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white border border-[#0F5C4D]/30 rounded-2xl">
                    <input
                      type="checkbox"
                      id="agreed"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 text-[#0F5C4D] rounded-md accent-[#0F5C4D] mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="agreed" className="text-xs font-semibold text-[#211E1A] cursor-pointer leading-relaxed">
                      Je m'engage sur l'honneur devant Allah à respecter scrupuleusement la charte éthique et les règles de bienséance de NASSIB.
                    </label>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* ÉTAPE 11 : PHOTOS & PUDEUR DU PROFIL                         */}
              {/* ============================================================ */}
              {currentStep === 11 && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#8BAE9F]/15 border border-[#8BAE9F]/30 rounded-2xl flex items-start gap-3 text-xs text-[#0F5C4D]">
                    <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                      verified_user
                    </span>
                    <div className="leading-relaxed">
                      <strong className="font-bold">Contrôle de la Pudeur :</strong>
                      <p className="mt-0.5 text-[#575147]">
                        Vous pouvez ajouter jusqu'à 3 photos. Par défaut, vos photos bénéficient du mode flouté pour préserver votre intimité. Les autres membres ne pourront les visualiser qu'après votre consentement mutuel.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((idx) => {
                      const photoUrl = uploadedPhotos[idx];
                      return (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-2xl border-2 border-dashed border-[#E8E3D7] bg-[#FAF8F2] overflow-hidden flex flex-col items-center justify-center text-center p-2 group hover:border-[#0F5C4D] transition-colors"
                        >
                          {photoUrl ? (
                            <>
                              <img
                                src={photoUrl}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-full object-cover rounded-xl"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-red-700"
                                title="Supprimer"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <span className="material-symbols-outlined text-3xl text-[#7D766C] group-hover:text-[#0F5C4D] mb-1.5">
                                add_a_photo
                              </span>
                              <span className="text-xs font-bold text-[#7D766C] group-hover:text-[#0F5C4D]">
                                {idx === 0 ? 'Photo principale' : `Photo ${idx + 1}`}
                              </span>
                              <span className="text-[10px] text-[#7D766C]/80 mt-1">
                                (Optionnelle pour débuter)
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(idx, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={handlePrev}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-display text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#E8E3D7] bg-white text-[#575147] hover:bg-[#FAF8F2]"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Étape précédente</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 10 && !agreedToTerms}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] rounded-2xl font-display text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {currentStep === totalSteps
                    ? 'Finaliser mon profil et commencer'
                    : 'Continuer'}
                </span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
