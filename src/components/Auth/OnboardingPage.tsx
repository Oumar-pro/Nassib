import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NasibaLogo } from '../NasibaLogo';
import { OnboardingData } from './OnboardingModal';

interface OnboardingPageProps {
  userName: string;
  userRole: 'candidate' | 'wali';
  userPhone: string;
  onComplete: (data: OnboardingData) => void;
  onCancel?: () => void;
}

const MONTHS_LIST = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const STEP_TITLES = [
  'Civilité & Date de Naissance',
  'Localisation au Niger',
  'Statut Matrimonial & Polygamie',
  'Religion & Pratique Quotidienne',
  'Niveau d\'Études & Profession',
  'Personnalité & Priorité Familiale',
  'Horizon de Mariage & Origine',
  'Tuteur Légal (Wali)',
  'Charte Éthique & Engagement',
  'Photos & Pudeur du Profil'
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  userName,
  userRole,
  userPhone,
  onComplete,
  onCancel,
}) => {
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

  // Matrimonial Status & Polygamy
  const [maritalStatus, setMaritalStatus] = useState<string>('Célibataire (Jamais marié/e)');
  const [polygamyPreference, setPolygamyPreference] = useState<string>('Monogamie stricte souhaitée');

  // Religion & Education & Profession
  const [religion, setReligion] = useState<string>('Musulman(e) Sunnite');
  const [education, setEducation] = useState<string>('Licence / Bac+3');
  const [profession, setProfession] = useState<string>('Salarié(e) Secteur Privé');

  // Additional Profiling
  const [discoverySource, setDiscoverySource] = useState<string>('Recommandation familiale ou amicale');
  const [personalityTrait, setPersonalityTrait] = useState<string>('Sérieux(se) & Organisé(e)');
  const [familyImportance, setFamilyImportance] = useState<string>('Priorité absolue');
  const [religiousPractice, setReligiousPractice] = useState<string>('Pratiquant(e) au quotidien');
  const [marriageHorizon, setMarriageHorizon] = useState<string>('Dans les 6 mois');

  // Wali Info State
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
    `Analyse de vos critères d'affinité à ${region}...`,
    'Configuration du profil éthique et des préférences...',
    'Préparation des correspondances respectueuses...',
    'Profil matrimonial prêt !'
  ];

  // Sync Date of Birth changes
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleStartAnalysis();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onCancel) {
      onCancel();
    }
  };

  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] font-body flex flex-col selection:bg-[#8BAE9F]/25 selection:text-[#0F5C4D]">
      {/* Top Persistent Progress Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E3D7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="p-2 -ml-2 text-[#575147] hover:text-[#0F5C4D] hover:bg-[#FAF8F2] rounded-full transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Étape précédente"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="hidden sm:inline">Précédent</span>
            </button>
            <div className="h-5 w-px bg-[#E8E3D7]"></div>
            <NasibaLogo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-display text-xs font-bold text-[#0F5C4D]">
                Étape {currentStep} sur {totalSteps}
              </div>
              <div className="text-[11px] text-[#7D766C]">
                {STEP_TITLES[currentStep - 1]}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-[#E8E3D7]/60 h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-[#0F5C4D]"
            initial={{ width: '10%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Main Dedicated Content Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-between">
        {isLoadingAnalysis ? (
          <div className="my-auto py-16 text-center space-y-6 bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E3D7] shadow-sm">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#E8E3D7]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#0F5C4D] border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-[#0F5C4D]">favorite</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-display text-2xl font-bold text-[#0F5C4D]">
                Finalisation de votre profil
              </h3>
              <p className="font-body text-sm text-[#575147] animate-pulse">
                {loadingMessages[loadingMessageIndex]}
              </p>
            </div>

            <div className="w-full max-w-xs mx-auto bg-[#FAF8F2] rounded-full h-2.5 overflow-hidden border border-[#E8E3D7]">
              <div
                className="bg-[#0F5C4D] h-full transition-all duration-300 rounded-full"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] text-xs font-bold">
                <span>Étape {currentStep}</span>
                <span>•</span>
                <span>{STEP_TITLES[currentStep - 1]}</span>
              </div>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#211E1A]">
                {currentStep === 1 && 'Précisez votre civilité et date de naissance'}
                {currentStep === 2 && 'Où vivez-vous au Niger ?'}
                {currentStep === 3 && 'Votre situation matrimoniale actuelle'}
                {currentStep === 4 && 'Votre engagement et pratique religieuse'}
                {currentStep === 5 && 'Votre formation et vie professionnelle'}
                {currentStep === 6 && 'Vos traits de personnalité et valeurs'}
                {currentStep === 7 && 'Votre projet de mariage et son horizon'}
                {currentStep === 8 && 'Coordonnées de votre tuteur légal (Wali)'}
                {currentStep === 9 && 'Charte d\'engagement pour un mariage halal'}
                {currentStep === 10 && 'Photos pudiques de votre profil'}
              </h1>
              <p className="font-body text-xs sm:text-sm text-[#575147]">
                {currentStep === 1 && 'Ces données permettent de calculer votre âge exact et de trouver des correspondances compatibles.'}
                {currentStep === 2 && 'NASSIB met en relation les candidats par proximité géographique à Niamey et dans les régions du Niger.'}
                {currentStep === 3 && 'La transparence dès le départ est un pilier fondamental de la confiance mutuelle.'}
                {currentStep === 4 && 'L\'islam est au cœur de chaque démarche : partagez votre niveau de pratique.'}
                {currentStep === 5 && 'Ces éléments aident à comprendre vos aspirations socioprofessionnelles.'}
                {currentStep === 6 && 'Mettez en avant vos qualités morales pour trouver l\'âme sœur.'}
                {currentStep === 7 && 'Sous quel délai envisagez-vous de concrétiser l\'union ?'}
                {currentStep === 8 && 'Le Wali participe à la bénédiction de la démarche selon la tradition islamique.'}
                {currentStep === 9 && 'Lisez et approuvez la charte d\'éthique pour accéder aux profils.'}
                {currentStep === 10 && 'Ajoutez jusqu\'à 3 photos. Vous pourrez activer le floutage de pudeur à tout moment.'}
              </p>
            </div>

            {/* Step Body Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E3D7] shadow-sm">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-display text-xs font-bold text-[#575147] block">
                      Civilité du profil
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          gender === 'female'
                            ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 text-[#0F5C4D] font-bold ring-2 ring-[#0F5C4D]'
                            : 'border-[#E8E3D7] hover:border-[#8BAE9F] text-[#575147]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl">woman</span>
                        <span className="font-display text-sm">Femme (Candidature)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          gender === 'male'
                            ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 text-[#0F5C4D] font-bold ring-2 ring-[#0F5C4D]'
                            : 'border-[#E8E3D7] hover:border-[#8BAE9F] text-[#575147]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl">man</span>
                        <span className="font-display text-sm">Homme (Candidature)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="font-display text-xs font-bold text-[#575147] block">
                      Date de naissance (Jour / Mois / Année)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] text-[#7D766C] block mb-1">Jour</span>
                        <select
                          value={birthDay}
                          onChange={(e) => setBirthDay(Number(e.target.value))}
                          className="w-full h-12 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-sm font-semibold text-[#211E1A]"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] text-[#7D766C] block mb-1">Mois</span>
                        <select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(Number(e.target.value))}
                          className="w-full h-12 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-2 text-xs sm:text-sm font-semibold text-[#211E1A]"
                        >
                          {MONTHS_LIST.map((m, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] text-[#7D766C] block mb-1">Année</span>
                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(Number(e.target.value))}
                          className="w-full h-12 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-sm font-semibold text-[#211E1A]"
                        >
                          {Array.from({ length: 55 }, (_, i) => 2008 - i).map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] flex items-center justify-between text-xs text-[#575147]">
                      <span>Âge calculé automatiquement :</span>
                      <span className="font-bold text-[#0F5C4D] text-sm">{calculatedAge} ans</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Pays de résidence</label>
                    <input
                      type="text"
                      disabled
                      value={country}
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm font-bold text-[#211E1A] opacity-90 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Région / Ville au Niger</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm font-semibold text-[#211E1A]"
                    >
                      <option value="Niamey">Niamey (Capitale)</option>
                      <option value="Maradi">Maradi</option>
                      <option value="Zinder">Zinder</option>
                      <option value="Tahoua">Tahoua</option>
                      <option value="Agadez">Agadez</option>
                      <option value="Dosso">Dosso</option>
                      <option value="Diffa">Diffa</option>
                      <option value="Tillabéri">Tillabéri</option>
                      <option value="Diaspora (Extérieur)">Diaspora (France, Côte d'Ivoire, etc.)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Quartier ou Commune</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Plateau, Yantala, Recasement, Sonni, etc."
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm text-[#211E1A] placeholder-[#7D766C]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-display text-xs font-bold text-[#575147]">Statut matrimonial</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['Célibataire (Jamais marié/e)', 'Divorcé(e)', 'Veuf/Veuve'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMaritalStatus(status)}
                          className={`p-3.5 rounded-2xl border text-center font-display text-xs font-bold transition-all cursor-pointer ${
                            maritalStatus === status
                              ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-2xs'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="font-display text-xs font-bold text-[#575147]">Position sur la polygamie</label>
                    <div className="space-y-2">
                      {(gender === 'male'
                        ? [
                            'Monogamie uniquement',
                            'Ouvert à la polygamie selon les conditions légales islamiques',
                            'Déjà engagé(e) dans un foyer polygame'
                          ]
                        : [
                            'Monogamie stricte souhaitée',
                            'Ouverte à être seconde ou co-épouse avec équité',
                            'À discuter avec respect et bienveillance'
                          ]
                      ).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPolygamyPreference(opt)}
                          className={`w-full p-3.5 rounded-2xl border text-left font-display text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                            polygamyPreference === opt
                              ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 text-[#0F5C4D] font-bold'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          <span>{opt}</span>
                          {polygamyPreference === opt && (
                            <span className="material-symbols-outlined text-base">check_circle</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Courant religieux</label>
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm font-semibold text-[#211E1A]"
                    >
                      <option value="Musulman(e) Sunnite">Musulman(e) Sunnite (Rite Malékite)</option>
                      <option value="Musulman(e) Pratiquant(e)">Musulman(e) Pratiquant(e)</option>
                      <option value="Autre courant musulman">Autre courant musulman</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-display text-xs font-bold text-[#575147]">Pratique des 5 prières quotidiennes</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['Régulière à l\'heure', 'Pratique modérée', 'En progression'].map((prat) => (
                        <button
                          key={prat}
                          type="button"
                          onClick={() => setReligiousPractice(prat)}
                          className={`p-3 rounded-2xl border text-center font-display text-xs font-bold transition-all cursor-pointer ${
                            religiousPractice === prat
                              ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          {prat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Niveau d'études</label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm font-semibold text-[#211E1A]"
                    >
                      <option value="Baccalauréat">Baccalauréat</option>
                      <option value="Licence / Bac+3">Licence / Bac+3</option>
                      <option value="Master / Bac+5">Master / Bac+5</option>
                      <option value="Doctorat / Ph.D">Doctorat / Ph.D</option>
                      <option value="Formation professionnelle / BTS">Formation professionnelle / BTS</option>
                      <option value="Études islamiques supérieures">Études islamiques supérieures</option>
                      <option value="Autre niveau d'études">Autre niveau d'études</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Profession ou Secteur d'activité</label>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Enseignant, Fonctionnaire, Commerçant(e), Ingénieur..."
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm text-[#211E1A]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 6 */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-display text-xs font-bold text-[#575147]">Votre trait de caractère principal</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Calme & Posé(e)',
                        'Sérieux(se) & Organisé(e)',
                        'Chaleureux(se) & Sociable',
                        'Pieux(se) & Discret(ète)'
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPersonalityTrait(t)}
                          className={`p-3 rounded-2xl border text-center font-display text-xs font-bold transition-all cursor-pointer ${
                            personalityTrait === t
                              ? 'border-[#0F5C4D] bg-[#0F5C4D]/10 text-[#0F5C4D]'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Place de la famille dans votre vie</label>
                    <select
                      value={familyImportance}
                      onChange={(e) => setFamilyImportance(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm font-semibold text-[#211E1A]"
                    >
                      <option value="Priorité absolue">Priorité absolue au quotidien</option>
                      <option value="Très importante">Très importante avec respect des espaces</option>
                      <option value="Équilibrée">Équilibrée et harmonieuse</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 7 */}
              {currentStep === 7 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-display text-xs font-bold text-[#575147]">Horizon souhaité pour le mariage</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['Dès que possible (< 3 mois)', 'Dans les 6 mois', 'Dans l\'année (6 à 12 mois)'].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setMarriageHorizon(h)}
                          className={`p-3 rounded-2xl border text-center font-display text-xs font-bold transition-all cursor-pointer ${
                            marriageHorizon === h
                              ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white'
                              : 'border-[#E8E3D7] bg-[#FAF8F2] text-[#575147] hover:border-[#8BAE9F]'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-bold text-[#575147]">Comment avez-vous connu NASSIB ?</label>
                    <select
                      value={discoverySource}
                      onChange={(e) => setDiscoverySource(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm font-semibold text-[#211E1A]"
                    >
                      <option value="Recommandation familiale ou amicale">Recommandation familiale ou amicale</option>
                      <option value="Réseaux sociaux (TikTok / Facebook)">Réseaux sociaux (TikTok / Facebook)</option>
                      <option value="Mosquée / Cercle islamique">Mosquée / Cercle islamique</option>
                      <option value="Bouche à oreille">Bouche à oreille</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 8 */}
              {currentStep === 8 && (
                <div className="space-y-5">
                  <div className="p-4 bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-2xl flex items-start gap-3 text-xs text-[#735619]">
                    <span className="material-symbols-outlined text-lg text-[#C9A45C]">shield_person</span>
                    <div>
                      <p className="font-bold">Présence du Wali</p>
                      <p className="text-[#575147]">
                        Renseigner un tuteur légal renforce la confiance des familles et active le badge "Supervision Wali". Vous pouvez aussi le renseigner plus tard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="font-display text-xs font-bold text-[#575147]">Nom et Prénom du Tuteur (Wali)</label>
                        <input
                          type="text"
                          value={waliName}
                          onChange={(e) => setWaliName(e.target.value)}
                          placeholder="Ex: Elhadj Moussa Abdou"
                          className="w-full h-12 px-4 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm text-[#211E1A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-display text-xs font-bold text-[#575147]">Lien de parenté</label>
                          <select
                            value={waliRelation}
                            onChange={(e) => setWaliRelation(e.target.value)}
                            className="w-full h-12 px-3 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm text-[#211E1A]"
                          >
                            <option value="Père">Père</option>
                            <option value="Frère aîné">Frère aîné</option>
                            <option value="Oncle paternel">Oncle paternel</option>
                            <option value="Tuteur légal désigné">Tuteur légal désigné</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-display text-xs font-bold text-[#575147]">Téléphone du Wali</label>
                          <input
                            type="tel"
                            value={waliPhone}
                            onChange={(e) => setWaliPhone(e.target.value)}
                            placeholder="+227 90 00 00 00"
                            className="w-full h-12 px-3 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl text-sm text-[#211E1A]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 9 */}
              {currentStep === 9 && (
                <div className="space-y-5">
                  <div className="p-5 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] space-y-3 text-xs leading-relaxed text-[#575147]">
                    <h4 className="font-display text-sm font-bold text-[#0F5C4D] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">gavel</span>
                      <span>Engagement sur l'Honneur &amp; Charte Éthique</span>
                    </h4>
                    <p>1. <strong>Intention sincère :</strong> Mon inscription a pour seul et unique but la conclusion d'un mariage licite (halal).</p>
                    <p>2. <strong>Pudeur &amp; respect :</strong> Tout échange verbal ou visuel contraire aux convenances islamiques entraîne la suspension immédiate du compte.</p>
                    <p>3. <strong>Véracité des propos :</strong> Je certifie que les informations et documents fournis reflètent strictement mon identité réelle.</p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white border border-[#0F5C4D]/30 rounded-2xl">
                    <input
                      type="checkbox"
                      id="agreed"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 text-[#0F5C4D] rounded-md accent-[#0F5C4D] mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="agreed" className="text-xs font-semibold text-[#211E1A] cursor-pointer">
                      Je m'engage sur l'honneur devant Allah à respecter scrupuleusement la charte éthique et les valeurs de NASSIB.
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 10 */}
              {currentStep === 10 && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#8BAE9F]/15 border border-[#8BAE9F]/30 rounded-2xl flex items-start gap-3 text-xs text-[#0F5C4D]">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                    <div>
                      <p className="font-bold">Contrôle de la Pudeur</p>
                      <p className="text-[#575147]">
                        Vos photos peuvent être floutées pour préserver votre intimité. Les autres membres devront demander votre accord avant de les visualiser.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                              <span className="material-symbols-outlined text-2xl text-[#7D766C] group-hover:text-[#0F5C4D] mb-1">
                                add_a_photo
                              </span>
                              <span className="text-[10px] font-bold text-[#7D766C] group-hover:text-[#0F5C4D]">
                                {idx === 0 ? 'Photo principale' : `Photo ${idx + 1}`}
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
            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-display text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  currentStep === 1
                    ? 'border-transparent text-transparent pointer-events-none'
                    : 'border-[#E8E3D7] bg-white text-[#575147] hover:bg-[#FAF8F2]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Étape précédente</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 9 && !agreedToTerms}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0F5C4D] text-white hover:bg-[#0c4a3e] rounded-2xl font-display text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{currentStep === totalSteps ? 'Finaliser mon profil et commencer' : 'Continuer'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
