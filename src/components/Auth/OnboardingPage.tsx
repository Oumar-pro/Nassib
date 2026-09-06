import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NasibaLogo } from '../NasibaLogo';
import { OnboardingData } from './OnboardingModal';
import { PremiumSelect } from '../Common/PremiumSelect';
import { PremiumDatePicker } from '../Common/PremiumDatePicker';
import { calculateProfileCompletion } from '../../types';

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
  'Origine & Ethnie',
  'Taille, Poids & Silhouette',
  'Pratique Religieuse & Port du Hijab',
  'Présentation (Bio) & Profession',
  'Personnalité & Priorité Familiale',
  'Valeurs Cardinales du Foyer',
  'Ce que vous cherchez (Critères)',
  'Ce que vous n\'acceptez pas (Lignes Rouges)',
  'Statut Matrimonial & Polygamie',
  'Tuteur Légal (Wali)',
  'Charte Éthique & Engagement',
  'Photos & Visibilité du Profil',
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
  { value: 'Maradi', label: 'Maradi (Pôle économique)' },
  { value: 'Zinder', label: 'Zinder (Capitale historique)' },
  { value: 'Tahoua', label: 'Tahoua (Ader)' },
  { value: 'Agadez', label: 'Agadez (Porte du Sahara)' },
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

const ETHNICITIES_LIST = [
  'Haoussa',
  'Zarma-Songhaï',
  'Touareg',
  'Peul / Fulani',
  'Kanouri',
  'Toubou',
  'Gourmantché',
  'Arabe',
  'Autre ethnie sahélienne',
];

const VALUES_OPTIONS = [
  'Crainte d\'Allah (Taqwa)',
  'Respect mutuel & bienveillance',
  'Respect de la belle-famille',
  'Pudeur & chasteté (Haya)',
  'Vérité & loyauté absolue',
  'Éducation islamique des enfants',
  'Communication sereine & douceur',
  'Patience & indulgence (Sabr)',
  'Simplicité du mode de vie',
  'Entraide matérielle & morale',
];

const DEAL_BREAKERS_OPTIONS = [
  'Consommation d\'alcool',
  'Tabagisme / Chicha',
  'Négligence des 5 prières quotidiennes',
  'Manque de respect envers les parents / belle-famille',
  'Polygamie sans accord préalable',
  'Violence verbale ou colère impulsive',
  'Mensonge, dissimulation ou tromperie',
  'Dépenses inconsidérées / Dettes cachées',
  'Absence de projet de vie ou d\'ambition',
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
  const totalSteps = 15; // Steps 1 to 15

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

  // Step 4: Origin & Ethnicity
  const [originRegion, setOriginRegion] = useState<string>('Région de Niamey');
  const [ethnicity, setEthnicity] = useState<string>('Haoussa');

  // Step 5: Physical characteristics (Height, Weight, Body type)
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(68);
  const [bodyType, setBodyType] = useState<string>('Moyenne / Harmonieuse');

  // Step 6: Religion, Prayers & Hijab
  const [religion, setReligion] = useState<string>('Musulman(e) Sunnite (Rite Malékite)');
  const [religiousPractice, setReligiousPractice] = useState<string>('Régulière à l\'heure (5 prières)');
  const [hijabStatus, setHijabStatus] = useState<string>('Porte le Hijab au quotidien');

  // Step 7: Personal Presentation (Bio) & Profession
  const [bio, setBio] = useState<string>('');
  const [education, setEducation] = useState<string>('Licence / Bac+3');
  const [professionCategory, setProfessionCategory] = useState<string>('Secteur Privé / Cadre');
  const [profession, setProfession] = useState<string>('Salarié(e) Secteur Privé');

  // Step 8: Personality & Family Priority
  const [personalityTrait, setPersonalityTrait] = useState<string>('Calme & Posé(e)');
  const [familyImportance, setFamilyImportance] = useState<string>('Priorité absolue au quotidien');

  // Step 9: Core Values
  const [selectedValues, setSelectedValues] = useState<string[]>([
    'Crainte d\'Allah (Taqwa)',
    'Respect de la belle-famille',
    'Pudeur & chasteté (Haya)',
  ]);

  // Step 10: Partner Criteria (Ce que la personne cherche)
  const [partnerCriteria, setPartnerCriteria] = useState<string>('');
  const [preferredAgeRange, setPreferredAgeRange] = useState<string>('Tranche d\'âge similaire');

  // Step 11: Deal-breakers (Ce qu'elle n'accepte pas)
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>([
    'Consommation d\'alcool',
    'Tabagisme / Chicha',
    'Négligence des 5 prières quotidiennes',
  ]);
  const [customDealBreaker, setCustomDealBreaker] = useState<string>('');

  // Step 12: Matrimonial Status & Polygamy
  const [maritalStatus, setMaritalStatus] = useState<string>('Célibataire (Jamais marié/e)');
  const [polygamyPreference, setPolygamyPreference] = useState<string>('Monogamie stricte souhaitée');
  const [marriageHorizon, setMarriageHorizon] = useState<string>('Dans les 6 mois');

  // Step 13: Wali Info State
  const [skipWaliInfo, setSkipWaliInfo] = useState<boolean>(false);
  const [waliName, setWaliName] = useState<string>('');
  const [waliRelation, setWaliRelation] = useState<string>('Père');
  const [waliPhone, setWaliPhone] = useState<string>('');

  // Step 14: Ethics Agreement
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Step 15: Photos & Visibility Check
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(['', '', '']);

  // Loading animation state at end of onboarding
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);

  const loadingMessages = [
    `Configuration du profil sécurisé de ${userName}...`,
    `Localisation vérifiée à ${region} (${country.replace(/[^\p{L}\s]/gu, '').trim()})...`,
    'Vérification des critères de visibilité éthique...',
    'Application des filtres de pudeur et de discrétion...',
    'Profil matrimonial NASSIB prêt !',
  ];

  // Adjust default options when gender changes
  useEffect(() => {
    if (gender === 'male') {
      if (polygamyPreference.includes('co-épouse') || polygamyPreference.includes('stricte souhaitée')) {
        setPolygamyPreference('Monogamie uniquement');
      }
      setHijabStatus('Barbe soignée selon la Sunnah & tenue pudique');
    } else {
      if (polygamyPreference === 'Monogamie uniquement') {
        setPolygamyPreference('Monogamie stricte souhaitée');
      }
      setHijabStatus('Porte le Hijab au quotidien');
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

  const toggleValueSelection = (val: string) => {
    setSelectedValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const toggleDealBreakerSelection = (item: string) => {
    setSelectedDealBreakers((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Live profile completion score calculation
  const validPhotos = uploadedPhotos.filter((p) => Boolean(p) && p.trim() !== '');
  const hasPhoto = validPhotos.length > 0;
  const currentCompletionScore = calculateProfileCompletion({
    name: userName,
    gender,
    age: calculatedAge,
    city: region,
    profession,
    maritalStatus: maritalStatus as any,
    religion,
    education,
    bio,
    presentation: bio,
    partnerCriteria,
    height: Number(height) || undefined,
    weight: Number(weight) || undefined,
    hijabStatus,
    religiousPracticeDetails: religiousPractice,
    values: selectedValues,
    dealBreakers: [
      ...selectedDealBreakers,
      ...(customDealBreaker.trim() ? [customDealBreaker.trim()] : []),
    ],
    ethnicity,
    originCity: originRegion,
    photoUrl: validPhotos[0] || '',
    photos: validPhotos,
  });

  const isVisibleOnApp = hasPhoto && currentCompletionScore >= 50;

  const completionTriggeredRef = useRef(false);

  const handleStartAnalysis = () => {
    setIsLoadingAnalysis(true);
    setLoadingProgress(0);
    setLoadingMessageIndex(0);
    completionTriggeredRef.current = false;

    const finalNeighborhood =
      neighborhood === 'Autre quartier...' && customNeighborhood.trim()
        ? customNeighborhood.trim()
        : neighborhood;

    const allDealBreakers = [
      ...selectedDealBreakers,
      ...(customDealBreaker.trim() ? [customDealBreaker.trim()] : []),
    ];

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
        // Extended Profile Data
        bio,
        height: Number(height) || undefined,
        weight: Number(weight) || undefined,
        ethnicity,
        originCity: originRegion,
        hijabStatus,
        religiousPracticeDetails: religiousPractice,
        values: selectedValues,
        partnerCriteria,
        dealBreakers: allDealBreakers,
      });
    };

    // Stepped progress animation
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + 4;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(finishOnboarding, 500);
          return 100;
        }
        if (next >= 25 && next < 50) setLoadingMessageIndex(1);
        else if (next >= 50 && next < 75) setLoadingMessageIndex(2);
        else if (next >= 75 && next < 95) setLoadingMessageIndex(3);
        else if (next >= 95) setLoadingMessageIndex(4);
        return next;
      });
    }, 80);
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
      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-8 py-6 sm:py-10 flex flex-col justify-center">
        {/* Inline Navigation & Step Progress */}
        {!isLoadingAnalysis && currentStep > 0 && (
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E3D7] text-xs font-semibold text-[#575147] hover:text-[#0F5C4D] hover:border-[#8BAE9F] shadow-2xs transition-colors cursor-pointer"
              title="Étape précédente"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Retour</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F5C4D]">
                Étape {currentStep} / {totalSteps}
              </span>
              <div className="w-20 sm:w-32 h-1.5 bg-[#E8E3D7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F5C4D] transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

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
                nous vous guidons à travers un parcours d'onboarding complet, bienveillant et 100% confidentiel.
              </p>
            </div>

            {/* Preparation Roadmap */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  Identité &amp; Origine
                </h3>
                <p className="text-[11px] text-[#575147] leading-relaxed">
                  Civilité, localisation précise, mensurations physiques et ethnie d'origine.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/20 text-[#735619] flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  Foi &amp; Tempérament
                </h3>
                <p className="text-[11px] text-[#575147] leading-relaxed">
                  Pratique religieuse, tenue/hijab, présentation personnelle et valeurs cardinales.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#211E1A]">
                  Critères &amp; Pudeur
                </h3>
                <p className="text-[11px] text-[#575147] leading-relaxed">
                  Ce que vous cherchez, vos lignes rouges, photos et garanties de visibilité éthique.
                </p>
              </div>
            </div>

            {/* Sacred Reassurance Note */}
            <div className="p-4 rounded-2xl bg-[#0F5C4D]/5 border border-[#0F5C4D]/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-xl text-[#0F5C4D] shrink-0 mt-0.5">
                shield
              </span>
              <div className="text-xs text-[#575147] leading-relaxed">
                <strong className="text-[#0F5C4D]">Garantie de Pudeur &amp; Confidentialité :</strong> Vos informations sont protégées.
                Sur NASSIB, seuls les profils comportant au moins une photo et complétés à 50% ou plus sont visibles aux autres membres, garantissant le sérieux des échanges.
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
                <div className="text-xs text-[#7D766C]">Temps estimé : ~3 à 4 minutes</div>
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
          /* FORMULAIRE SÉQUENTIEL MULTI-ÉTAPES                           */
          /* ============================================================ */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E3D7] shadow-xl space-y-6">
            <div className="border-b border-[#E8E3D7] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#C9A45C] tracking-wider uppercase">
                  Étape {currentStep} sur {totalSteps}
                </span>
                <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#0F5C4D] mt-0.5">
                  {STEP_TITLES[currentStep]}
                </h2>
              </div>
              <NasibaLogo size="sm" />
            </div>

            <div className="min-h-[280px]">
              {/* ÉTAPE 1 : GENRE */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Veuillez préciser votre civilité pour orienter les correspondances matrimoniales selon les préceptes islamiques :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* ÉTAPE 2 : DATE DE NAISSANCE */}
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

              {/* ÉTAPE 3 : LOCALISATION */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Renseignez votre lieu de vie. Choisissez d'abord votre <strong>pays de résidence</strong>, la <strong>ville</strong> apparaîtra juste en dessous, puis le <strong>quartier</strong>.
                  </p>

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

              {/* ÉTAPE 4 : ORIGINE & ETHNIE */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    L'origine géographique et l'ethnie permettent de respecter les affinités culturelles et linguistiques chères aux familles lors de l'union :
                  </p>

                  <PremiumSelect
                    label="Région ou Ville d'origine"
                    icon="travel_explore"
                    value={originRegion}
                    onChange={(val) => setOriginRegion(val)}
                    options={[
                      'Région de Niamey',
                      'Région de Maradi',
                      'Région de Zinder',
                      'Région de Tahoua',
                      'Région de Dosso',
                      'Région d\'Agadez',
                      'Région de Tillabéri',
                      'Région de Diffa',
                      'Originaire de la Diaspora',
                    ]}
                  />

                  <PremiumSelect
                    label="Ethnie / Communauté culturelle"
                    icon="groups"
                    value={ethnicity}
                    onChange={(val) => setEthnicity(val)}
                    options={ETHNICITIES_LIST}
                  />

                  <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] flex items-center gap-3 text-xs text-[#575147]">
                    <span className="material-symbols-outlined text-[#0F5C4D]">info</span>
                    <span>
                      Ces critères sont purement indicatifs et favorisent les rapprochements dans la bienveillance fraternelle.
                    </span>
                  </div>
                </div>
              )}

              {/* ÉTAPE 5 : MENSURATIONS (TAILLE & POIDS) */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Renseignez vos attributs physiques en toute transparence pour une présentation fidèle et honnête :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Taille en cm */}
                    <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#0F5C4D] text-base">straighten</span>
                          <span>Taille :</span>
                        </label>
                        <span className="px-3 py-1 bg-white border border-[#8BAE9F] rounded-full text-xs font-bold text-[#0F5C4D]">
                          {height} cm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="145"
                        max="210"
                        step="1"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full accent-[#0F5C4D] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#7D766C]">
                        <span>145 cm</span>
                        <span>175 cm</span>
                        <span>210 cm</span>
                      </div>
                    </div>

                    {/* Poids en kg */}
                    <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#0F5C4D] text-base">monitor_weight</span>
                          <span>Poids :</span>
                        </label>
                        <span className="px-3 py-1 bg-white border border-[#8BAE9F] rounded-full text-xs font-bold text-[#0F5C4D]">
                          {weight} kg
                        </span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="135"
                        step="1"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full accent-[#0F5C4D] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#7D766C]">
                        <span>40 kg</span>
                        <span>70 kg</span>
                        <span>135 kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Silhouette */}
                  <PremiumSelect
                    label="Allure / Silhouette générale"
                    icon="accessibility_new"
                    value={bodyType}
                    onChange={(val) => setBodyType(val)}
                    options={[
                      'Mince / Fine',
                      'Moyenne / Harmonieuse',
                      'Athlétique / En forme',
                      'Forte / Ronde',
                    ]}
                  />
                </div>
              )}

              {/* ÉTAPE 6 : PRATIQUE RELIGIEUSE & HIJAB */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    La pratique religieuse est le pilier d'une union solide et bénie. Précisez vos habitudes spirituelles et votre tenue :
                  </p>

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
                        value: 'À la mosquée régulièrement',
                        label: 'À la mosquée régulièrement',
                        badge: 'Pratique en congrégation',
                      },
                      {
                        value: 'Pratique modérée avec effort constant',
                        label: 'Pratique modérée avec effort constant',
                      },
                      {
                        value: 'En progression spirituelle',
                        label: 'En progression spirituelle',
                      },
                    ]}
                  />

                  {gender === 'female' ? (
                    <PremiumSelect
                      label="Port du Hijab &amp; Tenue au quotidien"
                      icon="styler"
                      value={hijabStatus}
                      onChange={(val) => setHijabStatus(val)}
                      options={[
                        {
                          value: 'Porte le Hijab au quotidien',
                          label: 'Porte le Hijab au quotidien',
                          badge: 'Tenue pudique',
                        },
                        {
                          value: 'Porte le Jilbab / Khimar',
                          label: 'Porte le Jilbab / Khimar',
                          badge: 'Couvrance intégrale',
                        },
                        {
                          value: 'Porte le Niqab',
                          label: 'Porte le Niqab',
                          badge: 'Voile intégral',
                        },
                        {
                          value: 'Tenue pudique & voile occasionnel',
                          label: 'Tenue pudique & voile occasionnel',
                        },
                        {
                          value: 'En réflexion sincère pour le porter',
                          label: 'En réflexion sincère pour le porter',
                        },
                      ]}
                    />
                  ) : (
                    <PremiumSelect
                      label="Apparence &amp; Engagement selon la Sunnah"
                      icon="face"
                      value={hijabStatus}
                      onChange={(val) => setHijabStatus(val)}
                      options={[
                        {
                          value: 'Barbe soignée selon la Sunnah & tenue pudique',
                          label: 'Barbe soignée selon la Sunnah & tenue pudique',
                          badge: 'Sunnah respectée',
                        },
                        {
                          value: 'Prières régulières à la mosquée (Fajr)',
                          label: 'Prières régulières à la mosquée (Fajr)',
                        },
                        {
                          value: 'Tenue modeste, propre et pudique',
                          label: 'Tenue modeste, propre et pudique',
                        },
                        {
                          value: 'Pratique islamique constante au quotidien',
                          label: 'Pratique islamique constante au quotidien',
                        },
                      ]}
                    />
                  )}

                  <PremiumSelect
                    label="Courant religieux &amp; École jurisprudentielle"
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
                </div>
              )}

              {/* ÉTAPE 7 : PRÉSENTATION (BIO) & PROFESSION */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#211E1A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#0F5C4D] text-base">edit_note</span>
                        <span>Présentation personnelle (Résumé de qui vous êtes) *</span>
                      </span>
                      <span className="text-[11px] font-normal text-[#7D766C]">
                        {bio.length} caractères (min. 20)
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Ex: Personne calme, sincère et attachée à sa foi. J'aime la lecture, les moments en famille et les projets constructifs. Je souhaite bâtir un foyer fondé sur la piété, la complicité et l'entraide mutuelle..."
                      className="w-full p-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/10 leading-relaxed"
                    />
                    <p className="text-[11px] text-[#7D766C]">
                      Un résumé sincère augmente fortement la confiance des prétendants et de leurs familles.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PremiumSelect
                      label="Niveau d'études"
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
                      label="Secteur d'activité"
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">
                      Intitulé exact de votre métier ou profession :
                    </label>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Comptable, Enseignant(e), Commerçant(e), Juriste, Informaticien..."
                      className="w-full h-12 px-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                    />
                  </div>
                </div>
              )}

              {/* ÉTAPE 8 : PERSONNALITÉ & PRIORITÉ FAMILIALE */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <p className="text-xs sm:text-sm text-[#575147]">
                    Votre tempérament et votre attachement aux liens familiaux :
                  </p>

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
                      'Doux(ce) & À l\'écoute',
                      'Jovial(e) & Optimiste',
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
                      },
                    ]}
                  />
                </div>
              )}

              {/* ÉTAPE 9 : VALEURS CARDINALES DU FOYER */}
              {currentStep === 9 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs sm:text-sm text-[#575147]">
                      Sélectionnez les valeurs fondamentales qui guident votre vie et que vous désirez partager au sein de votre futur foyer (choisissez-en 3 ou plus) :
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VALUES_OPTIONS.map((val) => {
                      const isSelected = selectedValues.includes(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => toggleValueSelection(val)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#0F5C4D]/10 border-[#0F5C4D] text-[#0F5C4D] font-bold shadow-2xs'
                              : 'bg-white border-[#E8E3D7] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">{val}</span>
                          <span
                            className={`material-symbols-outlined text-lg shrink-0 ${
                              isSelected ? 'text-[#0F5C4D]' : 'text-[#7D766C]/40'
                            }`}
                          >
                            {isSelected ? 'check_circle' : 'add_circle'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] flex items-center justify-between text-xs">
                    <span className="text-[#575147]">Valeurs sélectionnées :</span>
                    <span className="font-bold text-[#0F5C4D]">{selectedValues.length} retenue(s)</span>
                  </div>
                </div>
              )}

              {/* ÉTAPE 10 : CE QUE LA PERSONNE CHERCHE */}
              {currentStep === 10 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#211E1A] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#0F5C4D] text-base">search_check</span>
                      <span>Ce que vous cherchez chez votre futur conjoint (Critères clés) *</span>
                    </label>
                    <textarea
                      rows={4}
                      value={partnerCriteria}
                      onChange={(e) => setPartnerCriteria(e.target.value)}
                      placeholder="Ex: Je recherche un époux/une épouse pieux(se), assidu(e) dans ses prières, respectueux(se) de ses engagements et bienveillant(e). Quelqu'un qui a le sens de la famille, qui communique dans la sérénité et souhaite élever des enfants dans les valeurs de l'Islam..."
                      className="w-full p-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/10 leading-relaxed"
                    />
                  </div>

                  <PremiumSelect
                    label="Tranche d'âge privilégiée pour le prétendant"
                    icon="cake"
                    value={preferredAgeRange}
                    onChange={(val) => setPreferredAgeRange(val)}
                    options={[
                      'Tranche d\'âge similaire à la mienne (+/- 3 ans)',
                      '18 - 25 ans',
                      '25 - 32 ans',
                      '30 - 40 ans',
                      '40 ans et plus',
                      'Sans préférence d\'âge stricte (priorité à la maturité)',
                    ]}
                  />
                </div>
              )}

              {/* ÉTAPE 11 : CE QU'ELLE N'ACCEPTE PAS (LIGNES ROUGES) */}
              {currentStep === 11 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs sm:text-sm text-[#575147]">
                      Indiquez vos <strong>lignes rouges</strong> (deal-breakers) afin d'éviter tout malentendu et vous orienter uniquement vers des profils compatibles :
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEAL_BREAKERS_OPTIONS.map((item) => {
                      const isSelected = selectedDealBreakers.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleDealBreakerSelection(item)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-red-50 border-red-300 text-red-800 font-bold shadow-2xs'
                              : 'bg-white border-[#E8E3D7] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">{item}</span>
                          <span
                            className={`material-symbols-outlined text-lg shrink-0 ${
                              isSelected ? 'text-red-600' : 'text-[#7D766C]/40'
                            }`}
                          >
                            {isSelected ? 'cancel' : 'add_circle'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">
                      Autre chose que vous n'acceptez pas (optionnel) :
                    </label>
                    <input
                      type="text"
                      value={customDealBreaker}
                      onChange={(e) => setCustomDealBreaker(e.target.value)}
                      placeholder="Ex: Déménagement imprévu à l'étranger, travail de nuit non négocié..."
                      className="w-full h-12 px-4 bg-white border border-[#E8E3D7] rounded-2xl text-xs sm:text-sm text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                    />
                  </div>
                </div>
              )}

              {/* ÉTAPE 12 : STATUT MATRIMONIAL & POLYGAMIE */}
              {currentStep === 12 && (
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
                </div>
              )}

              {/* ÉTAPE 13 : TUTEUR LÉGAL (WALI) */}
              {currentStep === 13 && (
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

              {/* ÉTAPE 14 : CHARTE ÉTHIQUE */}
              {currentStep === 14 && (
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

              {/* ÉTAPE 15 : PHOTOS & VISIBILITÉ DU PROFIL */}
              {currentStep === 15 && (
                <div className="space-y-6">
                  {/* Critical Visibility Rule Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                      isVisibleOnApp
                        ? 'bg-[#8BAE9F]/15 border-[#0F5C4D]/30 text-[#0F5C4D]'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">
                      {isVisibleOnApp ? 'verified' : 'warning'}
                    </span>
                    <div className="space-y-1">
                      <strong className="font-bold text-sm block">
                        Règles strictes de visibilité sur NASSIB :
                      </strong>
                      <p>
                        <strong>1. Photo obligatoire :</strong> Tout profil n'ayant aucune photo reste <strong>automatiquement masqué et invisible</strong> aux autres membres.
                      </p>
                      <p>
                        <strong>2. Complétion minimale de 50% :</strong> Tout profil dont le pourcentage de complétion est inférieur à 50% reste également <strong>non visible</strong> sur l'application.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Score & Status Card */}
                  <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#211E1A]">
                          Taux de complétion de votre profil :
                        </span>
                        <div className="text-[11px] text-[#575147]">
                          Statut actuel :{' '}
                          {isVisibleOnApp ? (
                            <span className="text-emerald-700 font-bold">
                              Visible aux autres membres
                            </span>
                          ) : (
                            <span className="text-amber-800 font-bold">
                              Non visible sur l'application (Masqué)
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xl font-bold font-mono px-3 py-1 rounded-xl ${
                          currentCompletionScore >= 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {currentCompletionScore}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-white border border-[#E8E3D7] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          currentCompletionScore >= 50 ? 'bg-[#0F5C4D]' : 'bg-amber-500'
                        }`}
                        style={{ width: `${currentCompletionScore}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-sm font-bold ${
                            hasPhoto ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {hasPhoto ? 'check_circle' : 'cancel'}
                        </span>
                        <span className={hasPhoto ? 'text-[#211E1A]' : 'text-red-600 font-semibold'}>
                          Photo ajoutée ({hasPhoto ? 'Oui' : 'Non - Requise'})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-sm font-bold ${
                            currentCompletionScore >= 50 ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {currentCompletionScore >= 50 ? 'check_circle' : 'cancel'}
                        </span>
                        <span
                          className={
                            currentCompletionScore >= 50 ? 'text-[#211E1A]' : 'text-red-600 font-semibold'
                          }
                        >
                          Complétion ≥ 50% ({currentCompletionScore}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload Boxes */}
                  <div className="space-y-2">
                    <label className="font-display text-xs font-bold text-[#211E1A] block">
                      Téléversez votre photo de profil (au moins 1 pour être visible) :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[0, 1, 2].map((idx) => {
                        const photoUrl = uploadedPhotos[idx];
                        return (
                          <div
                            key={idx}
                            className={`relative aspect-square rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center text-center p-2 group transition-colors ${
                              idx === 0 && !photoUrl
                                ? 'border-[#0F5C4D] bg-[#0F5C4D]/5'
                                : 'border-[#E8E3D7] bg-[#FAF8F2] hover:border-[#0F5C4D]'
                            }`}
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
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-3">
                                <span
                                  className={`material-symbols-outlined text-3xl mb-1.5 ${
                                    idx === 0 ? 'text-[#0F5C4D]' : 'text-[#7D766C] group-hover:text-[#0F5C4D]'
                                  }`}
                                >
                                  add_a_photo
                                </span>
                                <span
                                  className={`text-xs font-bold ${
                                    idx === 0 ? 'text-[#0F5C4D]' : 'text-[#7D766C] group-hover:text-[#0F5C4D]'
                                  }`}
                                >
                                  {idx === 0 ? 'Photo principale *' : `Photo ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-[#7D766C]/90 mt-1">
                                  {idx === 0 ? '(Obligatoire pour visibilité)' : '(Complémentaire)'}
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
                disabled={currentStep === 14 && !agreedToTerms}
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
