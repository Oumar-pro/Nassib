import React, { useMemo, useState } from 'react';
import { OnboardingData } from './OnboardingModal';
import { PremiumSelect } from '../Common/PremiumSelect';
import { PremiumDatePicker } from '../Common/PremiumDatePicker';
import { compressAndOptimizeImage } from '../../lib/imageOptimizer';
import { calculateProfileCompletion } from '../../types';

interface Props {
  userName: string;
  userRole?: 'candidate' | 'wali';
  userPhone?: string;
  onComplete: (data: OnboardingData) => void;
  onCancel?: () => void;
}

const valuesOptions = [
  "Crainte d'Allah (Taqwa)", 'Respect mutuel & bienveillance', 'Respect de la belle-famille',
  'Pudeur & chasteté (Haya)', 'Vérité & loyauté absolue', 'Éducation islamique des enfants',
  'Communication sereine & douceur', 'Patience & indulgence (Sabr)', 'Simplicité du mode de vie',
  'Entraide matérielle & morale',
];
const dealBreakerOptions = [
  "Consommation d'alcool", 'Tabagisme / Chicha', 'Négligence des 5 prières quotidiennes',
  'Manque de respect envers les parents / belle-famille', 'Polygamie sans accord préalable',
  'Violence verbale ou colère impulsive', 'Mensonge, dissimulation ou tromperie',
  'Dépenses inconsidérées / Dettes cachées', 'Absence de projet de vie ou d’ambition',
];
const countries = ['Niger', 'Bénin', "Côte d'Ivoire", 'Sénégal', 'Mali', 'Burkina Faso', 'Togo', 'France', 'Autre pays'];
const cities = ['Niamey', 'Maradi', 'Zinder', 'Tahoua', 'Agadez', 'Dosso', 'Tillabéri', 'Diffa', 'Autre ville'];

export const OnboardingPageV2: React.FC<Props> = ({ userName, userRole = 'candidate', userPhone = '', onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<'female' | 'male' | undefined>();
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<number | undefined>();
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [height, setHeight] = useState<number | undefined>();
  const [weight, setWeight] = useState<number | undefined>();
  const [bodyType, setBodyType] = useState('');
  const [religion, setReligion] = useState('');
  const [religiousPracticeDetails, setReligiousPracticeDetails] = useState('');
  const [hijabStatus, setHijabStatus] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [professionCategory, setProfessionCategory] = useState('');
  const [profession, setProfession] = useState('');
  const [personality, setPersonality] = useState('');
  const [familyImportance, setFamilyImportance] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [partnerCriteria, setPartnerCriteria] = useState('');
  const [preferredAgeRange, setPreferredAgeRange] = useState('');
  const [dealBreakers, setDealBreakers] = useState<string[]>([]);
  const [customDealBreaker, setCustomDealBreaker] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [polygamyPreference, setPolygamyPreference] = useState('');
  const [marriageHorizon, setMarriageHorizon] = useState('');
  const [waliName, setWaliName] = useState('');
  const [waliRelation, setWaliRelation] = useState('');
  const [waliPhone, setWaliPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const totalSteps = 15;

  const completion = useMemo(() => calculateProfileCompletion({
    name: userName, gender, age, country, city, neighborhood, originCity, ethnicity, height, weight, bodyType,
    religion, religiousPracticeDetails, hijabStatus, bio, education, professionCategory, profession,
    personality, familyImportance, values, partnerCriteria, preferredAgeRange,
    dealBreakers: [...dealBreakers, ...(customDealBreaker.trim() ? [customDealBreaker.trim()] : [])],
    maritalStatus, polygamyOpinion: polygamyPreference, marriageHorizon, photos,
  }), [userName, gender, age, country, city, neighborhood, originCity, ethnicity, height, weight, bodyType, religion, religiousPracticeDetails, hijabStatus, bio, education, professionCategory, profession, personality, familyImportance, values, partnerCriteria, preferredAgeRange, dealBreakers, customDealBreaker, maritalStatus, polygamyPreference, marriageHorizon, photos]);

  const setPhoto = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const optimized = await compressAndOptimizeImage(file, { maxWidth: 1080, maxHeight: 1080, quality: 0.82 });
    setPhotos(prev => { const next = [...prev]; next[index] = optimized; return next.filter(Boolean); });
  };
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

  const canContinue = () => {
    if (step === 1) return Boolean(gender);
    if (step === 2) return Boolean(age && age >= 18 && birthDate);
    if (step === 3) return Boolean(country.trim() && city.trim() && neighborhood.trim());
    if (step === 4) return Boolean(originCity.trim() && ethnicity.trim());
    if (step === 5) return Boolean(height && height > 0 && weight && weight > 0 && bodyType);
    if (step === 6) return Boolean(religion.trim() && religiousPracticeDetails.trim() && hijabStatus.trim());
    if (step === 7) return Boolean(bio.trim().length >= 20 && education.trim() && professionCategory.trim() && profession.trim());
    if (step === 8) return Boolean(personality.trim() && familyImportance.trim());
    if (step === 9) return values.length >= 1;
    if (step === 10) return Boolean(partnerCriteria.trim().length >= 15 && preferredAgeRange.trim());
    if (step === 11) return dealBreakers.length >= 1 || Boolean(customDealBreaker.trim());
    if (step === 12) return Boolean(maritalStatus && polygamyPreference && marriageHorizon);
    if (step === 13) return userRole === 'wali' || Boolean(waliName.trim() && waliRelation.trim() && waliPhone.trim());
    if (step === 14) return agreedToTerms;
    if (step === 15) return photos.length >= 1;
    return false;
  };

  const finish = () => {
    const allDealBreakers = [...dealBreakers, ...(customDealBreaker.trim() ? [customDealBreaker.trim()] : [])];
    onComplete({
      gender: gender!, birthDate, age: age!, country, region: city, neighborhood,
      maritalStatus, polygamyPreference, religion, education, profession,
      discoverySource: '', personalityTrait: personality, familyImportance,
      religiousPractice: religiousPracticeDetails, marriageHorizon, phoneVerified: Boolean(userPhone),
      waliName, waliRelation, waliPhone, agreedToTerms, photos,
      bio, height, weight, ethnicity, originCity, hijabStatus, religiousPracticeDetails,
      values, partnerCriteria, dealBreakers: allDealBreakers,
      professionCategory, bodyType, preferredAgeRange,
    });
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = '') => (
    <label className="block space-y-1.5"><span className="text-sm font-semibold text-[#211E1A]">{label}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full h-12 px-4 rounded-2xl border border-[#E8E3D7] bg-white text-sm outline-none focus:border-[#0F5C4D]" /></label>
  );

  return <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] flex items-center justify-center p-4">
    <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#E8E3D7] shadow-xl overflow-hidden">
      <header className="p-6 border-b border-[#E8E3D7] flex items-center justify-between"><div><h1 className="text-2xl font-bold text-[#0F5C4D]">Construisons votre profil</h1><p className="text-xs text-[#7D766C] mt-1">Aucune réponse n’est préremplie. Seules vos réponses seront enregistrées.</p></div><span className="text-sm font-bold text-[#0F5C4D]">{step}/{totalSteps}</span></header>
      <div className="h-1.5 bg-[#E8E3D7]"><div className="h-full bg-[#0F5C4D]" style={{width:`${step/totalSteps*100}%`}} /></div>
      <main className="p-6 sm:p-8 space-y-6">
        {step===1 && <div className="space-y-5"><h2 className="text-xl font-bold">Civilité</h2><div className="grid sm:grid-cols-2 gap-3">{(['female','male'] as const).map(g=><button key={g} onClick={()=>setGender(g)} className={`p-5 rounded-2xl border-2 text-left ${gender===g?'border-[#0F5C4D] bg-[#0F5C4D]/5':'border-[#E8E3D7]'}`}>{g==='female'?'Femme':'Homme'}</button>)}</div></div>}
        {step===2 && <div className="space-y-5"><h2 className="text-xl font-bold">Date de naissance</h2><PremiumDatePicker value={birthDate} onChange={(d,a)=>{setBirthDate(d);setAge(a)}} minAge={18} label="Date de naissance" helperText="Votre âge est calculé à partir de cette date." /></div>}
        {step===3 && <div className="space-y-4"><h2 className="text-xl font-bold">Localisation</h2><PremiumSelect label="Pays de résidence" value={country} onChange={setCountry} options={countries}/><PremiumSelect label="Ville de résidence" value={city} onChange={setCity} options={cities}/>{field('Quartier / commune',neighborhood,setNeighborhood,'Votre quartier')}</div>}
        {step===4 && <div className="space-y-4"><h2 className="text-xl font-bold">Origine & communauté</h2>{field('Ville ou région d’origine',originCity,setOriginCity)}<PremiumSelect label="Ethnie / communauté culturelle" value={ethnicity} onChange={setEthnicity} options={['Haoussa','Zarma-Songhaï','Touareg','Peul / Fulani','Kanouri','Toubou','Gourmantché','Arabe','Autre']}/></div>}
        {step===5 && <div className="space-y-4"><h2 className="text-xl font-bold">Taille, poids & silhouette</h2>{field('Taille (cm)',height?.toString()||'',v=>setHeight(v?Number(v):undefined))}{field('Poids (kg)',weight?.toString()||'',v=>setWeight(v?Number(v):undefined))}<PremiumSelect label="Silhouette" value={bodyType} onChange={setBodyType} options={['Mince / Fine','Moyenne / Harmonieuse','Athlétique / En forme','Forte / Ronde']}/></div>}
        {step===6 && <div className="space-y-4"><h2 className="text-xl font-bold">Religion & pratique</h2><PremiumSelect label="Religion / courant" value={religion} onChange={setReligion} options={['Musulman(e) Sunnite (Rite Malékite)','Musulman(e) Sunnite (Général)','Autre courant musulman']}/><PremiumSelect label="Pratique des prières" value={religiousPracticeDetails} onChange={setReligiousPracticeDetails} options={["Régulière à l'heure (5 prières)",'À la mosquée régulièrement','Pratique modérée avec effort constant','En progression spirituelle']}/><PremiumSelect label={gender==='female'?'Port du Hijab / tenue':'Tenue vestimentaire & barbe'} value={hijabStatus} onChange={setHijabStatus} options={gender==='female'?['Porte le Hijab au quotidien','Porte le Jilbab / Khimar','Porte le Niqab','Tenue pudique & voile occasionnel','En réflexion sincère pour le porter']:['Barbe soignée selon la Sunnah & tenue pudique','Tenue modeste, propre et pudique','Pratique islamique constante au quotidien']}/></div>}
        {step===7 && <div className="space-y-4"><h2 className="text-xl font-bold">Présentation & profession</h2>{field('Présentation personnelle (minimum 20 caractères)',bio,setBio)}<PremiumSelect label="Niveau d’études" value={education} onChange={setEducation} options={['Baccalauréat','Licence / Bac+3','Master / Bac+5','Doctorat / Ph.D','Formation professionnelle / BTS','Études islamiques supérieures','Autre niveau d’études']}/><PremiumSelect label="Secteur d’activité" value={professionCategory} onChange={setProfessionCategory} options={['Fonction publique & Administration','Secteur Privé / Cadre','Commerce & Entreprenariat','Santé & Médical','Éducation & Enseignement','Étudiant(e) / Formation','Foyer / Sans activité professionnelle','Autre profession']}/>{field('Profession actuelle',profession,setProfession)}</div>}
        {step===8 && <div className="space-y-4"><h2 className="text-xl font-bold">Personnalité & famille</h2><PremiumSelect label="Trait de caractère principal" value={personality} onChange={setPersonality} options={['Calme & Posé(e)','Sérieux(se) & Organisé(e)','Chaleureux(se) & Sociable','Pieux(se) & Discret(ète)','Généreux(se) & Bienveillant(e)','Ambitieux(se) & Déterminé(e)','Doux(ce) & À l’écoute','Jovial(e) & Optimiste']}/><PremiumSelect label="Place de la famille" value={familyImportance} onChange={setFamilyImportance} options={['Priorité absolue au quotidien','Très importante avec équilibre du couple','Équilibrée et harmonieuse']}/></div>}
        {step===9 && <div className="space-y-4"><h2 className="text-xl font-bold">Valeurs du foyer</h2><div className="grid sm:grid-cols-2 gap-2">{valuesOptions.map(v=><button key={v} onClick={()=>toggle(setValues,v)} className={`p-3 rounded-xl border text-left text-sm ${values.includes(v)?'border-[#0F5C4D] bg-[#0F5C4D]/5 font-semibold':'border-[#E8E3D7]'}`}>{v}</button>)}</div></div>}
        {step===10 && <div className="space-y-4"><h2 className="text-xl font-bold">Ce que vous recherchez</h2>{field('Critères importants (minimum 15 caractères)',partnerCriteria,setPartnerCriteria)}<PremiumSelect label="Tranche d’âge privilégiée" value={preferredAgeRange} onChange={setPreferredAgeRange} options={["18 - 25 ans","25 - 32 ans","30 - 40 ans","40 ans et plus","Sans préférence d'âge stricte"]}/></div>}
        {step===11 && <div className="space-y-4"><h2 className="text-xl font-bold">Vos lignes rouges</h2><div className="grid sm:grid-cols-2 gap-2">{dealBreakerOptions.map(v=><button key={v} onClick={()=>toggle(setDealBreakers,v)} className={`p-3 rounded-xl border text-left text-sm ${dealBreakers.includes(v)?'border-red-400 bg-red-50 font-semibold':'border-[#E8E3D7]'}`}>{v}</button>)}</div>{field('Autre ligne rouge (optionnel)',customDealBreaker,setCustomDealBreaker)}</div>}
        {step===12 && <div className="space-y-4"><h2 className="text-xl font-bold">Statut matrimonial & projet</h2><PremiumSelect label="Statut matrimonial" value={maritalStatus} onChange={setMaritalStatus} options={['Célibataire (Jamais marié/e)','Divorcé(e) sans enfants','Divorcé(e) avec enfants','Veuf / Veuve sans enfants','Veuf / Veuve avec enfants']}/><PremiumSelect label="Position sur la polygamie" value={polygamyPreference} onChange={setPolygamyPreference} options={gender==='male'?['Monogamie uniquement','Ouvert à la polygamie selon les conditions légales islamiques','Déjà engagé(e) dans un foyer polygame']:['Monogamie stricte souhaitée','Ouverte à être seconde ou co-épouse avec équité','À discuter avec respect et bienveillance']}/><PremiumSelect label="Horizon du mariage" value={marriageHorizon} onChange={setMarriageHorizon} options={['Dès que possible (< 3 mois)','Dans les 6 mois',"Dans l'année (6 à 12 mois)"]}/></div>}
        {step===13 && <div className="space-y-4"><h2 className="text-xl font-bold">Tuteur légal (Wali)</h2>{userRole==='wali'?<p className="text-sm text-[#575147]">Ce compte est un compte Wali.</p>:<>{field('Nom du Wali',waliName,setWaliName)}<PremiumSelect label="Lien de parenté" value={waliRelation} onChange={setWaliRelation} options={['Père','Frère aîné','Oncle paternel','Grand-père','Tuteur légal désigné']}/>{field('Téléphone du Wali',waliPhone,setWaliPhone,'+227 ...')}</>}</div>}
        {step===14 && <div className="space-y-5"><h2 className="text-xl font-bold">Charte éthique</h2><p className="text-sm leading-6 text-[#575147]">Je certifie que les informations fournies représentent fidèlement ma situation et que mon inscription vise une démarche matrimoniale licite et respectueuse.</p><label className="flex gap-3 items-start p-4 rounded-2xl border border-[#E8E3D7]"><input type="checkbox" checked={agreedToTerms} onChange={e=>setAgreedToTerms(e.target.checked)} /><span className="text-sm">J’accepte la charte éthique NASSIB.</span></label></div>}
        {step===15 && <div className="space-y-5"><h2 className="text-xl font-bold">Photos</h2><p className="text-sm text-[#575147]">Ajoutez au moins une photo réelle. Aucune photo fictive n’est créée.</p><div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><label key={i} className="aspect-square rounded-2xl border-2 border-dashed border-[#E8E3D7] flex items-center justify-center cursor-pointer overflow-hidden">{photos[i]?<img src={photos[i]} alt="" className="w-full h-full object-cover"/>:<span className="text-xs text-[#7D766C]">Photo {i+1}</span>}<input type="file" accept="image/*" onChange={e=>void setPhoto(i,e)} className="hidden"/></label>)}</div><div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E8E3D7]"><div className="flex justify-between text-sm font-semibold"><span>Complétion réelle</span><span>{completion}%</span></div><div className="h-2 mt-2 bg-[#E8E3D7] rounded-full overflow-hidden"><div className="h-full bg-[#0F5C4D]" style={{width:`${completion}%`}}/></div></div></div>}
      </main>
      <footer className="p-6 border-t border-[#E8E3D7] flex justify-between gap-3"><button onClick={()=>step>1?setStep(step-1):onCancel?.()} className="px-5 py-3 rounded-xl border border-[#E8E3D7] text-sm font-semibold">Retour</button><button disabled={!canContinue()} onClick={()=>step===totalSteps?finish():setStep(step+1)} className="px-6 py-3 rounded-xl bg-[#0F5C4D] text-white text-sm font-bold disabled:opacity-40">{step===totalSteps?'Enregistrer mon profil':'Continuer'}</button></footer>
    </div>
  </div>;
};
