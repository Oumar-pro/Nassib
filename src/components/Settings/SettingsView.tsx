import React, { useState, useEffect } from 'react';
import { User, TabType, Profile, calculateProfileCompletion, isProfileVisible, isProfileFullyComplete } from '../../types';
import { NassibLogoIcon } from '../NasibaLogo';

interface SettingsViewProps {
  user: User;
  profile?: Profile | null;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdateProfile?: (updatedProfile: Partial<Profile>) => void;
  onNavigateTab: (tab: TabType) => void;
  onLogout?: () => void;
}

const COMMON_VALUES = [
  'Prière à l\'heure',
  'Famille & Enfants',
  'Respect mutuel',
  'Honnêteté & Sincérité',
  'Patience (Sabr)',
  'Douceur & Écoute',
  'Modestie (Haya)',
  'Générosité',
  'Recherche du savoir',
  'Vie saine & Sport'
];

const COMMON_DEAL_BREAKERS = [
  'Négligence des prières',
  'Tabac / Chicha',
  'Manque de respect familial',
  'Mensonge & Tromperie',
  'Polygamie non désirée',
  'Violence verbale',
  'Désaccords financiers majeurs'
];

type SettingsSection =
  | null
  | 'photo'
  | 'personal'
  | 'location'
  | 'marriage'
  | 'personality'
  | 'religion'
  | 'wali'
  | 'security';

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  onUpdateUser,
  onUpdateProfile,
  onNavigateTab,
  onLogout,
}) => {
  // Navigation inside Settings: null = main hub, or specific sub-screen
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);
  const [showAllActions, setShowAllActions] = useState<boolean>(true);
  const [showInstallHelp, setShowInstallHelp] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  // Account state
  const [name, setName] = useState<string>(user.name || '');
  const [age, setAge] = useState<number | ''>(
    typeof profile?.age === 'number' && profile.age >= 18
      ? profile.age
      : (user.age && user.age >= 18 ? user.age : '')
  );
  const [email, setEmail] = useState<string>(user.email || '');
  const [phone, setPhone] = useState<string>(user.phone || '');
  const [gender, setGender] = useState<'female' | 'male'>(user.gender || 'female');
  const [photos, setPhotos] = useState<string[]>(
    user.photos && user.photos.length > 0
      ? [user.photos[0] || user.photoUrl || '', user.photos[1] || '', user.photos[2] || '']
      : [user.photoUrl || '', '', '']
  );

  // Profile details state
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [partnerCriteria, setPartnerCriteria] = useState<string>(profile?.partnerCriteria || profile?.presentation || '');
  const [height, setHeight] = useState<number | ''>(profile?.height || '');
  const [weight, setWeight] = useState<number | ''>(profile?.weight || '');
  const [ethnicity, setEthnicity] = useState<string>(profile?.ethnicity || '');
  const [originCity, setOriginCity] = useState<string>(profile?.originCity || '');
  const [hijabStatus, setHijabStatus] = useState<string>(profile?.hijabStatus || '');
  const [religiousPractice, setReligiousPractice] = useState<string>(profile?.religiousPracticeDetails || profile?.religion || 'Musulman(e) Sunnite');
  const [profession, setProfession] = useState<string>(profile?.profession || '');
  const [city, setCity] = useState<string>(profile?.city || 'Niamey');
  const [maritalStatus, setMaritalStatus] = useState<string>(profile?.maritalStatus || 'Jamais marié(e)');
  const [education, setEducation] = useState<string>(profile?.education || 'Licence / Bac+3');
  const [selectedValues, setSelectedValues] = useState<string[]>(profile?.values || ['Prière à l\'heure', 'Famille & Enfants', 'Respect mutuel']);
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>(profile?.dealBreakers || ['Négligence des prières', 'Mensonge & Tromperie']);

  // Wali state
  const [waliName, setWaliName] = useState<string>(user.waliInfo?.name || '');
  const [waliRelation, setWaliRelation] = useState<string>(user.waliInfo?.relation || 'Père');
  const [waliPhone, setWaliPhone] = useState<string>(user.waliInfo?.phone || '');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Synchronize when profile or user changes
  useEffect(() => {
    if (profile) {
      if (typeof profile.age === 'number' && profile.age >= 18) setAge(profile.age);
      if (profile.bio) setBio(profile.bio);
      if (profile.partnerCriteria) setPartnerCriteria(profile.partnerCriteria);
      if (profile.height) setHeight(profile.height);
      if (profile.weight) setWeight(profile.weight);
      if (profile.ethnicity) setEthnicity(profile.ethnicity);
      if (profile.originCity) setOriginCity(profile.originCity);
      if (profile.hijabStatus) setHijabStatus(profile.hijabStatus);
      if (profile.religiousPracticeDetails) setReligiousPractice(profile.religiousPracticeDetails);
      if (profile.profession) setProfession(profile.profession);
      if (profile.city) setCity(profile.city);
      if (profile.maritalStatus) setMaritalStatus(profile.maritalStatus);
      if (profile.education) setEducation(profile.education);
      if (profile.values) setSelectedValues(profile.values);
      if (profile.dealBreakers) setSelectedDealBreakers(profile.dealBreakers);
    }
  }, [profile]);

  useEffect(() => {
    if (user.waliInfo) {
      if (user.waliInfo.name) setWaliName(user.waliInfo.name);
      if (user.waliInfo.relation) setWaliRelation(user.waliInfo.relation);
      if (user.waliInfo.phone) setWaliPhone(user.waliInfo.phone);
    }
  }, [user.waliInfo]);

  // Current draft profile to compute live completion
  const effectivePhotos = (photos || []).filter((p) => Boolean(p) && p.trim() !== '');
  const primaryPhoto = effectivePhotos[0] || user.photoUrl || '';

  const effectiveAge = typeof age === 'number' && age >= 18
    ? age
    : (typeof profile?.age === 'number' && profile.age >= 18 ? profile.age : (user.age && user.age >= 18 ? user.age : undefined));

  const draftProfile: Partial<Profile> = {
    ...profile,
    name,
    gender,
    age: effectiveAge,
    photoUrl: primaryPhoto,
    photos: effectivePhotos,
    bio,
    partnerCriteria,
    presentation: partnerCriteria,
    height: typeof height === 'number' && height > 0 ? height : undefined,
    weight: typeof weight === 'number' && weight > 0 ? weight : undefined,
    ethnicity,
    originCity,
    hijabStatus,
    religiousPracticeDetails: religiousPractice,
    values: selectedValues,
    dealBreakers: selectedDealBreakers,
    profession,
    city,
    maritalStatus,
    education,
    email,
    phone,
    waliReference: waliName ? `${waliName}${waliPhone ? ` (${waliPhone})` : ''}` : (user.waliInfo?.name || ''),
    isWaliApproved: user.isWaliApproved || Boolean(waliName && (gender !== 'female' || Boolean(waliPhone && waliPhone.trim().length >= 8))),
  };

  // Completion statuses - Vérification rigoureuse : chaque information doit être renseignée
  const isPhotoComplete = effectivePhotos.length > 0;
  const isPersonalComplete = Boolean(
    name && name.trim().length >= 2 &&
    effectiveAge && effectiveAge >= 18 &&
    gender && (gender === 'female' || gender === 'male') &&
    typeof height === 'number' && height > 0 &&
    typeof weight === 'number' && weight > 0 &&
    ethnicity && ethnicity.trim().length > 0 &&
    originCity && originCity.trim().length > 0 &&
    maritalStatus && maritalStatus.trim().length > 0
  );
  const isLocationComplete = Boolean(
    city && city.trim().length > 0 &&
    profession && profession.trim().length > 0 &&
    education && education.trim().length > 0
  );
  const isMarriageComplete = Boolean(
    partnerCriteria && partnerCriteria.trim().length >= 15 &&
    selectedValues && selectedValues.length > 0 &&
    selectedDealBreakers && selectedDealBreakers.length > 0
  );
  const isPersonalityComplete = Boolean(bio && bio.trim().length >= 20);
  const isReligionComplete = Boolean(
    religiousPractice && religiousPractice.trim().length > 0 &&
    hijabStatus && hijabStatus.trim().length > 0
  );
  const isWaliComplete = gender === 'female'
    ? Boolean(user.isWaliApproved || (waliName && waliName.trim().length >= 2 && waliPhone && waliPhone.trim().length >= 8))
    : Boolean(user.isWaliApproved || (waliName && waliName.trim().length > 0) || true);
  const isSecurityComplete = Boolean(
    email && email.trim().length > 0 &&
    phone && phone.trim().length > 0
  );

  const areAllSectionsComplete =
    isPhotoComplete &&
    isPersonalComplete &&
    isLocationComplete &&
    isMarriageComplete &&
    isPersonalityComplete &&
    isReligionComplete &&
    isWaliComplete &&
    isSecurityComplete;

  const rawCompletion = calculateProfileCompletion(draftProfile);
  // RÈGLE STRICTE : Avant de dire que le profil est complet à 100%,
  // vérifier rigoureusement que TOUTES les données et informations sont bien renseignées.
  const completionPercentage = areAllSectionsComplete && isProfileFullyComplete(draftProfile)
    ? 100
    : Math.min(95, rawCompletion);

  const isVisible = isProfileVisible(draftProfile);

  const showSaved = (text: string) => {
    setSavedNotice(text);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handlePhotoFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const nextPhotos = [...photos];
        nextPhotos[index] = dataUrl;
        setPhotos(nextPhotos);

        const activePhotos = nextPhotos.filter((p) => Boolean(p) && p.trim() !== '');
        const newPrimary = activePhotos[0] || '';
        onUpdateUser({
          photos: activePhotos,
          photoUrl: newPrimary,
        });
        if (onUpdateProfile) {
          onUpdateProfile({
            photos: activePhotos,
            photoUrl: newPrimary,
          });
        }
        showSaved('Photo mise à jour avec succès');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    const nextPhotos = [...photos];
    nextPhotos[index] = '';
    setPhotos(nextPhotos);

    const activePhotos = nextPhotos.filter((p) => Boolean(p) && p.trim() !== '');
    const newPrimary = activePhotos[0] || '';
    onUpdateUser({
      photos: activePhotos,
      photoUrl: newPrimary,
    });
    if (onUpdateProfile) {
      onUpdateProfile({
        photos: activePhotos,
        photoUrl: newPrimary,
      });
    }
    showSaved('Photo retirée');
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (index === 0 || !photos[index]) return;
    const nextPhotos = [...photos];
    const selected = nextPhotos[index];
    nextPhotos.splice(index, 1);
    nextPhotos.unshift(selected);
    while (nextPhotos.length < 3) {
      nextPhotos.push('');
    }
    setPhotos(nextPhotos);
    const activePhotos = nextPhotos.filter((p) => Boolean(p) && p.trim() !== '');
    onUpdateUser({
      photos: activePhotos,
      photoUrl: selected,
    });
    if (onUpdateProfile) {
      onUpdateProfile({
        photos: activePhotos,
        photoUrl: selected,
      });
    }
    showSaved('Photo principale définie');
  };

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      setSelectedValues(selectedValues.filter((v) => v !== val));
    } else {
      setSelectedValues([...selectedValues, val]);
    }
  };

  const toggleDealBreaker = (db: string) => {
    if (selectedDealBreakers.includes(db)) {
      setSelectedDealBreakers(selectedDealBreakers.filter((d) => d !== db));
    } else {
      setSelectedDealBreakers([...selectedDealBreakers, db]);
    }
  };

  const handleSaveAll = (customNotice?: string) => {
    const activePhotos = (photos || []).filter((p) => Boolean(p) && p.trim() !== '');
    const mainPhoto = activePhotos[0] || '';

    // Save account settings
    onUpdateUser({
      name,
      email,
      phone,
      gender,
      photoUrl: mainPhoto,
      photos: activePhotos,
      waliInfo: waliName ? {
        name: waliName,
        relation: waliRelation,
        phone: waliPhone,
      } : user.waliInfo,
    });

    // Save profile details
    if (onUpdateProfile) {
      onUpdateProfile({
        name,
        gender,
        photoUrl: mainPhoto,
        photos: activePhotos,
        bio,
        partnerCriteria,
        presentation: partnerCriteria,
        height: typeof height === 'number' ? height : undefined,
        weight: typeof weight === 'number' ? weight : undefined,
        ethnicity,
        originCity,
        hijabStatus,
        religiousPracticeDetails: religiousPractice,
        values: selectedValues,
        dealBreakers: selectedDealBreakers,
        profession,
        city,
        maritalStatus,
        education,
        age: effectiveAge || 25,
      });
    }

    showSaved(customNotice || 'Modifications enregistrées');
  };

  // Extract first name for greeting
  const firstName = name ? name.split(' ')[0] : 'Ousmane';

  // Section definition array
  const actionCards = [
    {
      id: 'photo' as const,
      title: 'Photo de profil',
      subtitle: isPhotoComplete ? `${effectivePhotos.length} photo(s) ajoutée(s)` : 'Au moins 1 photo requise',
      icon: 'photo_camera',
      isComplete: isPhotoComplete,
    },
    {
      id: 'personal' as const,
      title: 'Informations personnelles',
      subtitle: isPersonalComplete ? 'Nom, âge, taille, poids, ethnie et origine renseignés' : 'Nom, âge, taille, poids, ethnie, origine...',
      icon: 'person',
      isComplete: isPersonalComplete,
    },
    {
      id: 'location' as const,
      title: 'Localisation & Profession',
      subtitle: isLocationComplete ? 'Ville, profession et niveau d’études renseignés' : 'Ville, métier, diplôme...',
      icon: 'location_on',
      isComplete: isLocationComplete,
    },
    {
      id: 'marriage' as const,
      title: 'Vision du mariage',
      subtitle: isMarriageComplete ? 'Critères, valeurs et lignes rouges renseignés' : 'Ce que tu recherches, valeurs et lignes rouges...',
      icon: 'favorite',
      isComplete: isMarriageComplete,
    },
    {
      id: 'personality' as const,
      title: 'Personnalité',
      subtitle: isPersonalityComplete ? 'Biographie de présentation renseignée' : 'Biographie & traits de caractère...',
      icon: 'groups',
      isComplete: isPersonalityComplete,
    },
    {
      id: 'religion' as const,
      title: 'Pratique religieuse',
      subtitle: isReligionComplete ? 'Pratique et tenue vestimentaire renseignées' : 'Pratique religieuse, tenue / hijab...',
      icon: 'menu_book',
      isComplete: isReligionComplete,
    },
    {
      id: 'wali' as const,
      title: 'Tuteur légal (Wali)',
      subtitle: isWaliComplete ? (user.isWaliApproved ? 'Tuteur validé par l\'équipe' : 'Coordonnées du Wali renseignées') : (gender === 'female' ? 'Coordonnées du Wali obligatoires' : 'Tuteur ou référent familial'),
      icon: 'shield',
      isComplete: isWaliComplete,
    },
    {
      id: 'security' as const,
      title: 'Sécurité & Paramètres du Compte',
      subtitle: isSecurityComplete ? 'Email et téléphone renseignés' : 'Email, téléphone, coordonnées...',
      icon: 'manage_accounts',
      isComplete: isSecurityComplete,
    },
  ];

  // If viewing a sub-screen:
  if (activeSection) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-20">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F5C4D] hover:text-[#0a4337] bg-white px-3.5 py-2 rounded-xl border border-[#E8E3D7] shadow-xs cursor-pointer transition-all hover:bg-[#FAF8F2]"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Retour aux paramètres</span>
          </button>

          {savedNotice && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] border border-[#8BAE9F]/30 font-display text-xs font-semibold animate-fadeIn">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* SECTION 1: PHOTO DE PROFIL */}
        {activeSection === 'photo' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Photo de profil</h2>
                <p className="font-body text-xs text-[#575147]">
                  Ajoutez jusqu'à 3 photos nettes et respectueuses. La photo principale est requise pour rendre votre profil visible.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => {
                const photo = photos[idx];
                return (
                  <div key={idx} className="relative flex flex-col items-center">
                    <div className="w-full h-48 rounded-2xl border-2 border-dashed border-[#E8E3D7] bg-[#FAF8F2] overflow-hidden flex flex-col items-center justify-center relative hover:border-[#0F5C4D]/50 transition-colors">
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
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#211E1A]/80 text-white flex items-center justify-center shadow-md hover:bg-[#211E1A] cursor-pointer transition-colors"
                            title="Supprimer la photo"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                          {idx === 0 ? (
                            <span className="absolute bottom-2 left-2 bg-[#0F5C4D] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                              Principale
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhoto(idx)}
                              className="absolute bottom-2 left-2 bg-white/95 text-[#0F5C4D] hover:bg-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs cursor-pointer border border-[#0F5C4D]/20"
                              title="Définir comme photo principale"
                            >
                              Mettre en principale
                            </button>
                          )}
                        </>
                      ) : (
                        <label
                          htmlFor={`sub-photo-${idx}`}
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center hover:bg-[#8BAE9F]/10 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center mb-1.5">
                            <span className="material-symbols-outlined text-xl">add_a_photo</span>
                          </div>
                          <span className="font-display text-xs font-bold text-[#0F5C4D]">
                            {idx === 0 ? 'Photo Principale' : `Photo ${idx + 1}`}
                          </span>
                          <span className="font-body text-[10px] text-[#7D766C] mt-0.5">
                            Téléverser
                          </span>
                          <input
                            id={`sub-photo-${idx}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoFileChange(idx, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] text-xs text-[#575147] space-y-1.5">
              <p className="font-bold text-[#211E1A] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0F5C4D] text-sm">verified_user</span>
                Règles de bienséance islamique
              </p>
              <p>Les photos doivent respecter la pudeur musulmane (visage dégagé, tenue sobre et couvrante). Aucun contenu inapproprié n'est toléré.</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Photos enregistrées');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Valider et terminer</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: INFORMATIONS PERSONNELLES */}
        {activeSection === 'personal' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Informations personnelles</h2>
                <p className="font-body text-xs text-[#575147]">
                  Renseignez vos renseignements civils et morphologiques pour mieux cibler vos prétendants.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Nom complet</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ousmane Moussa"
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Âge (ans)</label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 26"
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">Civilité (Genre)</label>
                <div className="grid grid-cols-2 gap-3 h-11">
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                        : 'bg-[#FAF8F2] text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">female</span>
                    <span>Femme</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                        : 'bg-[#FAF8F2] text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">male</span>
                    <span>Homme</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Taille (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 175"
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Poids (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 70"
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Ethnie / Communauté</label>
                  <input
                    type="text"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    placeholder="Haoussa, Zarma, Touareg, Peulh, Kanouri..."
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Ville ou Région d'origine</label>
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="Ex: Maradi, Zinder, Tahoua..."
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">Statut matrimonial</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                >
                  <option value="Jamais marié(e)">Jamais marié(e)</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf/Veuve">Veuf/Veuve</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Informations personnelles enregistrées');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Valider et enregistrer</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: LOCALISATION & PROFESSION */}
        {activeSection === 'location' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">location_on</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Localisation &amp; Profession</h2>
                <p className="font-body text-xs text-[#575147]">
                  Indiquez votre lieu de résidence habituel et votre parcours socioprofessionnel.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Ville de résidence</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Niamey, Zinder, Maradi..."
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Profession actuelle</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Ex: Enseignant, Ingénieur, Commerçante..."
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">Niveau d'études</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="Ex: Baccalauréat, Licence, Master, Doctorat, Études religieuses..."
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Localisation & Profession enregistrées');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Valider et enregistrer</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: VISION DU MARIAGE */}
        {activeSection === 'marriage' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">favorite</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Vision du mariage</h2>
                <p className="font-body text-xs text-[#575147]">
                  Définissez ce qui compte pour vous dans le foyer musulman et ce qui n'est pas négociable.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-display text-xs font-bold text-[#211E1A]">
                  Ce que vous recherchez chez votre futur(e) époux(se)
                </label>
                <textarea
                  rows={4}
                  value={partnerCriteria}
                  onChange={(e) => setPartnerCriteria(e.target.value)}
                  placeholder="Décrivez les qualités religieuses, humaines et morales attendues..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl p-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>

              {/* Valeurs cardinales */}
              <div className="space-y-2 pt-2">
                <label className="font-display text-xs font-bold text-[#211E1A]">
                  Valeurs cardinales pour votre foyer
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_VALUES.map((val) => {
                    const isSelected = selectedValues.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => toggleValue(val)}
                        className={`px-3 py-1.5 rounded-full text-xs font-display font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                            : 'bg-[#FAF8F2] text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lignes rouges */}
              <div className="space-y-2 pt-2">
                <label className="font-display text-xs font-bold text-[#211E1A]">
                  Lignes rouges &amp; ce que vous n'acceptez pas (Deal-breakers)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DEAL_BREAKERS.map((db) => {
                    const isSelected = selectedDealBreakers.includes(db);
                    return (
                      <button
                        key={db}
                        type="button"
                        onClick={() => toggleDealBreaker(db)}
                        className={`px-3 py-1.5 rounded-full text-xs font-display font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A45C] text-[#211E1A] border-[#C9A45C] font-semibold shadow-2xs'
                            : 'bg-[#FAF8F2] text-[#575147] border-[#E8E3D7] hover:border-[#C9A45C]'
                        }`}
                      >
                        {isSelected && '✕ '}
                        {db}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Vision du mariage enregistrée');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Valider et enregistrer</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 5: PERSONNALITÉ */}
        {activeSection === 'personality' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Personnalité &amp; Présentation</h2>
                <p className="font-body text-xs text-[#575147]">
                  Présentez-vous sincèrement avec vos mots pour permettre aux prétendants de découvrir qui vous êtes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-display text-xs font-bold text-[#211E1A]">
                  Biographie &amp; Résumé de présentation
                </label>
                <textarea
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Décrivez votre caractère, votre quotidien, ce qui vous anime et vos aspirations..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl p-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
                <p className="text-[11px] text-[#7D766C]">
                  {bio.trim().length} caractères (minimum conseillé : 20 caractères)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Personnalité enregistrée');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Valider et enregistrer</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 6: PRATIQUE RELIGIEUSE */}
        {activeSection === 'religion' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Pratique religieuse</h2>
                <p className="font-body text-xs text-[#575147]">
                  Votre pratique quotidienne et vos engagements selon la Sunna prophétique.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">
                  Pratique religieuse quotidienne
                </label>
                <select
                  value={religiousPractice}
                  onChange={(e) => setReligiousPractice(e.target.value)}
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                >
                  <option value="Musulman(e) Sunnite">Musulman(e) Sunnite</option>
                  <option value="Très pratiquant(e) (5 prières à l'heure, mosquée, jeûnes)">Très pratiquant(e) (5 prières à l'heure, mosquée, jeûnes)</option>
                  <option value="Pratiquant(e) régulier(e) (5 prières quotidiennes)">Pratiquant(e) régulier(e) (5 prières quotidiennes)</option>
                  <option value="En constante progression et apprentissage">En constante progression et apprentissage</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">
                  {gender === 'female' ? 'Port du Hijab / Voile' : 'Tenue vestimentaire & Barbe'}
                </label>
                <input
                  type="text"
                  value={hijabStatus}
                  onChange={(e) => setHijabStatus(e.target.value)}
                  placeholder={gender === 'female' ? 'Ex: Hijab au quotidien, Voile sobre, Niqab...' : 'Ex: Tenue sobre, Barbe sunna...'}
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Pratique religieuse enregistrée');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Valider et enregistrer</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 7: TUTEUR LÉGAL (WALI) */}
        {activeSection === 'wali' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Tuteur légal (Wali)</h2>
                <p className="font-body text-xs text-[#575147]">
                  Présence obligatoire pour superviser les démarches et préserver la moralité islamique.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#211E1A]">Statut de validation du Wali</p>
                  <p className="text-[11px] text-[#575147]">
                    {user.isWaliApproved ? 'Validé par l\'équipe éthique Nasiba' : 'En attente de validation ou non renseigné'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  user.isWaliApproved
                    ? 'bg-[#8BAE9F]/20 text-[#0F5C4D]'
                    : 'bg-[#C9A45C]/15 text-[#735619]'
                }`}>
                  {user.isWaliApproved ? 'Validé' : 'À finaliser'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">Nom complet du Wali</label>
                <input
                  type="text"
                  value={waliName}
                  onChange={(e) => setWaliName(e.target.value)}
                  placeholder="Ex: Moussa Abdoulaye"
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Lien de parenté</label>
                  <select
                    value={waliRelation}
                    onChange={(e) => setWaliRelation(e.target.value)}
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  >
                    <option value="Père">Père</option>
                    <option value="Frère">Frère</option>
                    <option value="Oncle paternel">Oncle paternel</option>
                    <option value="Grand-père">Grand-père</option>
                    <option value="Tuteur légal désigné">Tuteur légal désigné</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-display text-xs font-bold text-[#211E1A]">Numéro de téléphone (+227)</label>
                  <input
                    type="tel"
                    value={waliPhone}
                    onChange={(e) => setWaliPhone(e.target.value)}
                    placeholder="90 00 00 00"
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Informations du Wali enregistrées');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Enregistrer les coordonnées</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('verification')}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#8BAE9F]/15 text-[#0F5C4D] hover:bg-[#8BAE9F]/25 font-display text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-[#8BAE9F]/30"
              >
                <span>Aller à l'espace de vérification officielle</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 8: SÉCURITÉ & PARAMÈTRES DU COMPTE */}
        {activeSection === 'security' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3D7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">manage_accounts</span>
              </div>
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">Sécurité &amp; Confidentialité</h2>
                <p className="font-body text-xs text-[#575147]">
                  Gérez vos identifiants, vos coordonnées et le floutage de vos photos.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">Adresse e-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display text-xs font-bold text-[#211E1A]">Numéro de téléphone (+227)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>

              {/* Mode Floutage Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7]">
                <div className="pr-4">
                  <p className="font-display text-sm font-bold text-[#211E1A]">Mode Floutage des Photos</p>
                  <p className="font-body text-xs text-[#575147]">
                    Masque automatiquement votre photo de profil auprès des utilisateurs non vérifiés.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateUser({ photoBlurringActive: !user.photoBlurringActive })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    user.photoBlurringActive ? 'bg-[#0F5C4D]' : 'bg-[#D6CFBE]'
                  }`}
                  role="switch"
                  aria-checked={user.photoBlurringActive}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      user.photoBlurringActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E8E3D7]">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll('Paramètres de sécurité enregistrés');
                  setActiveSection(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Enregistrer</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white text-[#735619] hover:bg-[#FAF8F2] font-display text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-[#E8E3D7]"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Déconnexion</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN SETTINGS VIEW (Matches the user's screenshots exactly)
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn pb-24">
      {/* 1. GREEN TOP CARD (Identical to Screenshot 1) */}
      <div className="bg-[#0B4A3C] text-white rounded-[28px] p-6 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        {/* Top: Avatar + Greeting */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {primaryPhoto ? (
              <img
                src={primaryPhoto}
                alt={name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/25 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center font-serif-display font-bold text-xl sm:text-2xl text-white">
                {firstName ? firstName.charAt(0).toUpperCase() : 'O'}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-serif-display text-xl sm:text-2xl font-bold tracking-tight">
              Salam, {firstName} !
            </h1>
            <p className="font-body text-xs sm:text-sm text-white/80 mt-0.5">
              Que ta journée soit bénie.
            </p>
          </div>
        </div>

        {/* Middle: Profil complété & Percentage */}
        <div className="mt-6 pt-2">
          <div className="flex justify-between items-center text-sm font-display mb-2">
            <span className="font-medium text-white/95">Profil complété</span>
            <span className="font-bold text-lg text-white">{completionPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(5, completionPercentage)}%` }}
            />
          </div>

          {/* Centered action text */}
          <button
            type="button"
            onClick={() => {
              // Open first incomplete section or photo
              if (!isPhotoComplete) setActiveSection('photo');
              else if (!isPersonalComplete) setActiveSection('personal');
              else if (!isLocationComplete) setActiveSection('location');
              else if (!isMarriageComplete) setActiveSection('marriage');
              else if (!isPersonalityComplete) setActiveSection('personality');
              else if (!isReligionComplete) setActiveSection('religion');
              else if (!isWaliComplete) setActiveSection('wali');
              else if (!isSecurityComplete) setActiveSection('security');
              else setActiveSection('photo');
            }}
            className="w-full text-center text-xs text-white/80 hover:text-white mt-3 font-medium transition-colors cursor-pointer"
          >
            {completionPercentage === 100 ? 'Profil 100% complet et vérifié' : 'Cliquez pour compléter les informations manquantes'}
          </button>
        </div>
      </div>

      {/* 2. COMPLÈTE TON PROFIL HEADER BANNER */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E3D7] shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">
                {completionPercentage === 100 ? 'verified' : 'checklist'}
              </span>
            </div>
            <div>
              <h2 className="font-display font-bold text-sm sm:text-base text-[#211E1A]">
                {completionPercentage === 100 ? 'Profil 100% complété' : 'Complète ton profil'}
              </h2>
              <p className="font-body text-xs text-[#575147] line-clamp-1">
                {completionPercentage === 100
                  ? 'Toutes vos données et informations sont dûment renseignées.'
                  : 'Renseigne l\'intégralité de tes informations pour atteindre 100 %.'}
              </p>
            </div>
          </div>

          <span className="bg-[#EAF5F2] text-[#0F5C4D] text-xs font-bold px-3 py-1 rounded-full shrink-0">
            {completionPercentage}%
          </span>
        </div>

        {/* 3. LIST OF CARDS (Identical to Screenshot 1 & 2) */}
        <div className="space-y-2.5 pt-1">
          {(showAllActions ? actionCards : actionCards.slice(0, 3)).map((card) => {
            return (
              <div
                key={card.id}
                onClick={() => setActiveSection(card.id)}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E8E3D7] hover:border-[#0F5C4D]/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Icon in squircle */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#0F5C4D] flex items-center justify-center shrink-0 group-hover:bg-[#E2F0EA] transition-colors">
                    <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-[#211E1A] truncate group-hover:text-[#0F5C4D] transition-colors">
                      {card.title}
                    </h3>
                    <p className="font-body text-xs text-[#7D766C] truncate mt-0.5">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right: Status indicator (Yellow circle ! or Green circle ✓) + Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {card.isComplete ? (
                    <div
                      className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center text-xs font-bold"
                      title="Complété"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full bg-[#FEF3D6] text-[#B58500] flex items-center justify-center text-xs font-bold"
                      title="À compléter"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">priority_high</span>
                    </div>
                  )}

                  <span className="material-symbols-outlined text-[#BDB7AB] group-hover:text-[#0F5C4D] transition-colors text-xl">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle Button "Voir le reste / Réduire" */}
        {actionCards.length > 3 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAllActions(!showAllActions)}
              className="w-full bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs sm:text-sm font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <span>{showAllActions ? 'Masquer les actions secondaires' : `Voir le reste (${actionCards.length - 3} actions)`}</span>
              <span className="material-symbols-outlined text-base">
                {showAllActions ? 'expand_less' : 'chevron_right'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* PWA / App Installation Option (iPhone & Android) */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E3D7] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">install_mobile</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm text-[#211E1A] truncate">
              Installer l'application Nassib
            </h3>
            <p className="font-body text-xs text-[#7D766C] truncate mt-0.5">
              Accès direct sur iPhone, iPad ou Android
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (installPromptEvent) {
              await installPromptEvent.prompt();
              const choice = await installPromptEvent.userChoice;
              if (choice?.outcome === 'accepted') {
                setInstallPromptEvent(null);
              }
            } else {
              setShowInstallHelp(true);
            }
          }}
          className="bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white text-xs font-bold py-2.5 px-4 rounded-xl shrink-0 cursor-pointer shadow-2xs transition-all active:scale-95"
        >
          Installer
        </button>
      </div>

      {/* Account actions & Logout */}
      {onLogout && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#735619] hover:text-[#523d11] bg-white px-4 py-2.5 rounded-xl border border-[#E8E3D7] shadow-2xs hover:bg-[#FAF8F2] cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Déconnexion du compte</span>
          </button>
        </div>
      )}

      {/* iOS Safari / Mobile Installation Guide Modal */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF8F2] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#E8E3D7] shadow-2xl p-5 sm:p-6 animate-slideUp">
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
                    Ajouter Nassib sur votre écran d'accueil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallHelp(false)}
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
                  Sur iPhone, l'installation se fait exclusivement via le navigateur <strong>Safari officiel</strong> (Apple ne permet pas l'installation depuis Chrome ou les navigateurs intégrés).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-3 py-1.5 rounded-lg bg-[#0F5C4D] text-white font-bold text-[11px] hover:bg-[#0c4a3e] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  Ouvrir dans Safari
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(window.location.href);
                      showSaved("Lien de l'application copié !");
                    } catch {
                      // Fallback
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#C9A45C]/40 text-[#735619] font-medium text-[11px] hover:bg-[#FAF8F2] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  Copier l'adresse
                </button>
              </div>
            </div>

            <div className="py-2 space-y-3">
              <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-[#E8E3D7]">
                <div className="w-7 h-7 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-[#211E1A] leading-relaxed">
                  Sur Safari iPhone, touchez le bouton <span className="font-bold text-[#0F5C4D]">Partager</span> :
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F2] border border-[#E8E3D7] text-[#0F5C4D] font-bold text-[11px]">
                    <span className="material-symbols-outlined text-sm">ios_share</span>
                    <span>Bouton Partager (en bas)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-[#E8E3D7]">
                <div className="w-7 h-7 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-[#211E1A] leading-relaxed">
                  Faites défiler le menu et appuyez sur :
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F2] border border-[#E8E3D7] text-[#0F5C4D] font-bold text-[11px]">
                    <span className="material-symbols-outlined text-sm">add_box</span>
                    <span>Sur l'écran d'accueil</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-[#E8E3D7]">
                <div className="w-7 h-7 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-[#211E1A] leading-relaxed">
                  Appuyez sur <span className="font-bold text-[#0F5C4D]">« Ajouter »</span> en haut à droite. L'application Nassib s'ouvrira en plein écran comme une vraie application !
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="w-full bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl cursor-pointer transition-all"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
