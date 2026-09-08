import React, { useState } from 'react';
import { User } from '../../types';

interface SubscriptionDetailViewProps {
  user: User;
  onBack: () => void;
  onSubscribe?: (planName: string, durationDays: number, price: number) => void;
}

interface PlanOption {
  id: string;
  name: string;
  durationLabel: string;
  durationDays: number;
  price: number;
  originalPrice?: number;
  monthlyEquivalent: string;
  boosts: number;
  badge?: string;
  discountBadge?: string;
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: '15d',
    name: 'Premium 15 jours',
    durationLabel: '15 jours',
    durationDays: 15,
    price: 2800,
    monthlyEquivalent: 'soit 5 600 FCFA / mois',
    boosts: 1,
  },
  {
    id: '1m',
    name: 'Premium 1 mois',
    durationLabel: '1 mois',
    durationDays: 30,
    price: 3800,
    originalPrice: 5800,
    monthlyEquivalent: 'soit 3 800 FCFA / mois',
    boosts: 3,
    badge: 'POPULAIRE',
    discountBadge: '-34%',
    popular: true,
  },
  {
    id: '3m',
    name: 'Premium 3 mois',
    durationLabel: '3 mois',
    durationDays: 90,
    price: 6900,
    originalPrice: 11400,
    monthlyEquivalent: 'soit 2 300 FCFA / mois',
    boosts: 5,
    discountBadge: '-39%',
  },
  {
    id: '6m',
    name: 'Premium 6 mois',
    durationLabel: '6 mois',
    durationDays: 180,
    price: 9999,
    originalPrice: 22800,
    monthlyEquivalent: 'soit 1 667 FCFA / mois',
    boosts: 10,
    discountBadge: '-56%',
  },
  {
    id: '12m',
    name: 'Premium 12 mois',
    durationLabel: '12 mois',
    durationDays: 365,
    price: 16900,
    originalPrice: 45600,
    monthlyEquivalent: 'soit 1 408 FCFA / mois',
    boosts: 20,
    discountBadge: '-63%',
  },
];

const COMPARATIVE_FEATURES = [
  {
    id: 'fav',
    title: "Vois qui t'a mis en favori",
    description: "Découvre toutes les personnes qui te trouvent intéressant(e). Le plus puissant signal d'intérêt.",
    free: 'Bloqué',
    premium: 'Débloqué',
  },
  {
    id: 'repere',
    title: 'Découvre qui te repère',
    description: 'Identifie en un clic qui visite ton profil. Fini les doutes.',
    free: 'Bloqué',
    premium: 'Débloqué',
  },
  {
    id: 'contact',
    title: 'Contacte sans limite',
    description: 'Tu as flashé sur un profil ? Écris-lui maintenant, sans attendre demain.',
    free: '3 / jour',
    premium: 'Illimité',
  },
  {
    id: 'selection',
    title: 'Priorité dans la Sélection',
    isNew: true,
    description: 'Ton profil est proposé en priorité dans la Sélection Nassib et dans Découvrir, chaque jour.',
    free: 'Bloqué',
    premium: 'Débloqué',
  },
  {
    id: 'seen',
    title: 'Sois vu(e) en premier',
    description: 'Ton profil apparaît en tête des recherches. Plus de visibilité, plus de chances.',
    free: 'Bloqué',
    premium: 'Débloqué',
  },
  {
    id: 'boosts',
    title: 'Boosts inclus',
    description: 'Propulse ton profil en première position pendant 24h. Des Boosts offerts selon ton abonnement.',
    free: 'Bloqué',
    premium: 'Débloqué',
  },
  {
    id: 'validation',
    title: 'Validation immédiate',
    description: "Ton compte est validé instantanément, sans attendre les 24h habituelles.",
    free: "jusqu'à 24h",
    premium: 'Immédiate',
  },
  {
    id: 'imam',
    title: 'Coach / Référent éthique illimité',
    description: "Pose toutes tes questions sur le mariage halal, la préparation, ton profil. Accompagnement bienveillant.",
    free: '3 questions/jour',
    premium: 'Illimité',
  },
  {
    id: 'voice',
    title: 'Messages vocaux',
    isNew: true,
    description: 'Fais entendre ta voix. Envoie des messages vocaux pour créer une connexion plus authentique.',
    free: 'Bloqué',
    premium: 'Débloqué',
  },
  {
    id: 'photos',
    title: 'Montre qui tu es vraiment',
    description: '6 photos pour révéler ta personnalité. Un profil complet attire 4x plus.',
    free: '2 photos',
    premium: '6 photos',
  },
  {
    id: 'badge',
    title: 'Badge de sérieux',
    description: 'Le badge doré signale que tu es là pour du concret. Ça filtre les curieux.',
    free: 'Bloqué',
    premium: 'Débloqué',
  },
];

const FAQS = [
  {
    q: 'Quels modes de paiement sont acceptés ?',
    a: 'Nous acceptons les paiements par Mobile Money (Orange Money, Wave, Airtel Money, Moov Money) ainsi que les cartes bancaires internationales (Visa et Mastercard) pour toute la diaspora.',
  },
  {
    q: 'Mon paiement est-il sécurisé ?',
    a: 'Oui, à 100 %. Vos transactions sont chiffrées de bout en bout via des passerelles de paiement certifiées (Chariow / protocoles bancaires PCI-DSS). Vos coordonnées financières ne sont jamais conservées sur nos serveurs.',
  },
  {
    q: 'Puis-je annuler mon abonnement ?',
    a: 'Absolument. Nos formules sont sans engagement et sans reconduction automatique forcée. Vous profitez de vos privilèges jusqu’à l’échéance sans prélèvement imprévu.',
  },
  {
    q: 'Comment fonctionne le renouvellement ?',
    a: 'Aucun renouvellement automatique ! À la fin de votre période d’abonnement, vous décidez librement si vous souhaitez réactiver ou non votre formule. Aucun débit surprise ne sera effectué sur votre compte.',
  },
  {
    q: 'Combien de temps pour voir des résultats ?',
    a: 'La grande majorité des membres Premium reçoivent leurs premiers contacts et réponses qualifiées dans les premières 48 heures grâce à la mise en avant de leur profil et aux consultations prioritaires.',
  },
  {
    q: 'Puis-je faire confiance à Nassib ?',
    a: 'Nassib applique une charte islamique rigoureuse : chaque inscription est vérifiée manuellement par notre équipe de modération, le respect de la pudeur est exigé, et l’encadrement familial (Wali) est soutenu.',
  },
  {
    q: 'Que se passe-t-il si je ne trouve personne ?',
    a: 'Vous gardez un contrôle total sur vos échanges et votre profil. Notre équipe d’assistance reste à votre écoute pour optimiser votre profil, affiner vos critères de recherche et vous orienter avec bienveillance.',
  },
];

const COUNTRIES = [
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { code: 'GN', name: 'Guinée', dial: '+224', flag: '🇬🇳' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
];

export const SubscriptionDetailView: React.FC<SubscriptionDetailViewProps> = ({
  user,
  onBack,
  onSubscribe,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('1m');
  const [paymentType, setPaymentType] = useState<'mobile' | 'card'>('mobile');
  const [mobileOperator, setMobileOperator] = useState<string>('orange');
  const [cardBrand, setCardBrand] = useState<string>('visa');
  const [selectedCountry, setSelectedCountry] = useState<string>('NE');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phone || '');
  const [promoCode, setPromoCode] = useState<string>('');
  const [showPromoInput, setShowPromoInput] = useState<boolean>(false);
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [redirectCheckoutUrl, setRedirectCheckoutUrl] = useState<string | null>(null);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  // Calculate final price with promo discount if valid
  const basePrice = selectedPlan.price;
  const finalPrice = promoApplied
    ? Math.round(basePrice * (1 - promoDiscountPercent / 100))
    : basePrice;

  // Personalization
  const firstName = user.name ? user.name.split(' ')[0] : 'Cher membre';
  const spouseTerm = user.gender === 'female' ? 'ton futur époux' : 'ta future épouse';
  const spousePronoun = user.gender === 'female' ? 'Ne le rate pas.' : 'Ne la rate pas.';

  const handleApplyPromo = () => {
    const trimmed = promoCode.trim().toUpperCase();
    if (trimmed === 'NASSIB10' || trimmed === 'BARAKA' || trimmed === 'ZAWAJNA') {
      setPromoApplied(true);
      setPromoDiscountPercent(10);
      setPromoMessage('Code promo appliqué : 10% de réduction immédiate !');
    } else if (trimmed === 'MARIAGE20') {
      setPromoApplied(true);
      setPromoDiscountPercent(20);
      setPromoMessage('Code promo appliqué : 20% de réduction immédiate !');
    } else {
      setPromoApplied(false);
      setPromoDiscountPercent(0);
      setPromoMessage('Code promo invalide ou expiré.');
    }
  };

  const CHARIOW_PRODUCT_MAP: Record<string, string> = {
    '15d': 'prd_7k0l8i0g', // 2800 FCFA - Forfait 15 jours
    '1m': 'prd_j6ckq4qz',  // 3800 FCFA - Premium 1 mois
    '3m': 'prd_b1qiczzt',  // 6900 FCFA - Premium 3 mois
    '6m': 'prd_fczdiabm',  // 9900/9999 FCFA - Premium 6 mois
    '12m': 'prd_d32ufi24', // 16900 FCFA - Premium 12 mois
  };

  const getProductIdForPlan = (planId: string, price: number) => {
    if (planId === '15d' || price === 2800) return 'prd_7k0l8i0g';
    if (planId === '1m' || price === 3800) return 'prd_j6ckq4qz';
    if (planId === '3m' || price === 6900) return 'prd_b1qiczzt';
    if (planId === '6m' || price === 9999 || price === 9900) return 'prd_fczdiabm';
    if (planId === '12m' || price === 16900) return 'prd_d32ufi24';
    return CHARIOW_PRODUCT_MAP[planId] || 'prd_d32ufi24';
  };

  const handleConfirmSubscription = async () => {
    const cleanPhone = phoneNumber.trim().replace(/[\s\-_().]/g, '');
    if (!cleanPhone) {
      setPhoneError('Veuillez renseigner votre numéro de téléphone avant de continuer.');
      return;
    }
    setPhoneError('');
    setIsProcessing(true);

    const countryParam = selectedCountry || 'NE';
    const productId = getProductIdForPlan(selectedPlanId, selectedPlan.price);

    try {
      let targetCheckoutUrl: string | null = null;

      // 1. Tenter la génération directe d'une session Orqex via l'API Chariow backend
      try {
        const res = await fetch('/api/chariow-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            countryCode: countryParam,
            phoneNumber: cleanPhone,
            name: user.name || 'Membre Nassib',
            email: user.email || `membre_${user.id || Date.now()}@nassib.app`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.checkoutUrl) {
            targetCheckoutUrl = data.checkoutUrl;
          }
        }
      } catch (apiErr) {
        console.warn('API backend checkout failed, trying direct widget API:', apiErr);
      }

      // 2. Si le backend n'a pas répondu, tentative directe via l'API client Chariow
      if (!targetCheckoutUrl) {
        try {
          const clientRes = await fetch('https://api-edge.chariow.com/storefront/store_178jk0xaxj8i/checkout/purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Platform-Source': 'web:storefront',
            },
            body: JSON.stringify({
              channel: 'widget',
              product_id: productId,
              first_name: (user.name || 'Membre').split(' ')[0] || 'Membre',
              last_name: (user.name || 'Nassib').split(' ').slice(1).join(' ') || 'Nassib',
              email: user.email || `membre_${user.id || Date.now()}@nassib.app`,
              phone: {
                country_code: countryParam,
                number: cleanPhone,
              },
            }),
          });
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            if (clientData?.data?.payment?.checkout_url) {
              targetCheckoutUrl = clientData.data.payment.checkout_url;
            }
          }
        } catch (clientErr) {
          console.warn('Direct Chariow API failed:', clientErr);
        }
      }

      // 3. Si une session Orqex a été générée avec succès (sans passer par la page Chariow)
      if (targetCheckoutUrl) {
        setRedirectCheckoutUrl(targetCheckoutUrl);
        if (window.self !== window.top) {
          window.open(targetCheckoutUrl, '_blank');
        } else {
          window.location.href = targetCheckoutUrl;
        }
        setTimeout(() => setIsProcessing(false), 2000);
        return;
      }

      // 4. Secours ultime pré-rempli si l'API est indisponible
      const fallbackUrl = `https://digigenie.mychariow.shop/${productId}/checkout?country=${encodeURIComponent(countryParam)}&phone=${encodeURIComponent(cleanPhone)}&first_name=${encodeURIComponent(user.name || 'Membre')}&email=${encodeURIComponent(user.email || '')}`;
      setRedirectCheckoutUrl(fallbackUrl);
      if (window.self !== window.top) {
        window.open(fallbackUrl, '_blank');
      } else {
        window.location.href = fallbackUrl;
      }
    } catch (err) {
      console.error('Erreur souscription:', err);
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const activeCountry = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-24 text-[#211E1A]">
      {/* Top Header / Back Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0F5C4D] hover:text-[#0a4337] bg-white px-3.5 py-2 rounded-xl border border-[#E8E3D7] shadow-xs cursor-pointer transition-all hover:bg-[#FAF8F2]"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Retour aux paramètres</span>
        </button>

        {user.isPremium ? (
          <span className="bg-[#D1FAE5] text-[#059669] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#A7F3D0]">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>Premium Actif ({user.planName || 'Membre'})</span>
          </span>
        ) : (
          <span className="bg-[#FEF3D6] text-[#B58500] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#FDE68A]">
            <span className="material-symbols-outlined text-sm">lock_open</span>
            <span>Offre Spéciale</span>
          </span>
        )}
      </div>

      {/* Success Modal if just subscribed */}
      {subscriptionSuccess && (
        <div className="bg-[#EAF5F2] border border-[#8BAE9F] rounded-3xl p-6 shadow-sm animate-scaleIn text-center space-y-3">
          <div className="w-14 h-14 bg-[#0F5C4D] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-3xl">
              {redirectCheckoutUrl ? 'lock_open' : 'done_all'}
            </span>
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#0F5C4D]">
            {redirectCheckoutUrl ? 'Session de paiement Orqex prête' : `Mabrouk, ${firstName} !`}
          </h3>
          <p className="font-body text-xs sm:text-sm text-[#3E3A33] max-w-md mx-auto">
            {redirectCheckoutUrl ? (
              <>Votre session de paiement sécurisée de <strong>{finalPrice.toLocaleString('fr-FR')} FCFA</strong> ({selectedPlan.name}) a été générée.</>
            ) : (
              <>Ton abonnement <strong>{selectedPlan.name}</strong> a été activé avec succès. Ton profil bénéficie désormais de tous les privilèges et de la visibilité prioritaire.</>
            )}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {redirectCheckoutUrl && (
              <a
                href={redirectCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#0F5C4D] hover:bg-[#0c4a3e] text-white font-display text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Accéder au paiement sécurisé</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-[#E8E3D7] bg-white text-[#575147] hover:text-[#211E1A] font-display text-xs font-semibold rounded-xl cursor-pointer transition-all"
            >
              Retour à mon compte
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO BANNER - Exact wording requested */}
      <div className="bg-gradient-to-b from-[#0F5C4D] to-[#0A3D33] text-white rounded-[28px] p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-xs border border-white/20 rounded-full text-[11px] font-display font-semibold tracking-wide text-white">
          <span className="material-symbols-outlined text-sm text-[#E6C687]">verified</span>
          <span>Halal, sérieux, vérifié à la main</span>
        </div>

        {/* Headline & Catchphrase */}
        <div className="space-y-2">
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            {firstName},<br />
            {spouseTerm} t'attend. {spousePronoun}
          </h1>
          <p className="font-body text-xs sm:text-sm text-white/85 leading-relaxed max-w-lg">
            Sans Premium, ton profil reste noyé. Avec Premium, tu apparais en premier, tu vois qui s'intéresse à toi, et tu réponds sans limite.
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3 text-center">
            <div className="font-display font-black text-xl sm:text-2xl text-[#E6C687]">
              3X
            </div>
            <div className="font-body text-[11px] sm:text-xs text-white/80 mt-0.5 font-medium leading-tight">
              plus de réponses
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3 text-center">
            <div className="font-display font-black text-xl sm:text-2xl text-[#E6C687]">
              8+
            </div>
            <div className="font-body text-[11px] sm:text-xs text-white/80 mt-0.5 font-medium leading-tight">
              profils vérifiés
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3 text-center">
            <div className="font-display font-black text-xl sm:text-2xl text-[#E6C687]">
              100%
            </div>
            <div className="font-body text-[11px] sm:text-xs text-white/80 mt-0.5 font-medium leading-tight">
              halal garanti
            </div>
          </div>
        </div>
      </div>

      {/* 2. CE QUE PREMIUM DÉBLOQUE POUR TOI */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-5">
        <div>
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#211E1A]">
            Ce que Premium débloque pour toi
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#7D766C] mt-0.5">
            Tout ce qui change pour trouver {spouseTerm} plus vite
          </p>
        </div>

        {/* Comparative Feature Rows */}
        <div className="divide-y divide-[#F0EDE4]">
          {COMPARATIVE_FEATURES.map((item) => (
            <div key={item.id} className="py-3.5 sm:py-4 first:pt-1 last:pb-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-xs sm:text-sm text-[#211E1A]">
                      {item.title}
                    </h3>
                    {item.isNew && (
                      <span className="bg-[#0F5C4D] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-[#7D766C] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F5F2EB] text-[#7D766C] line-through decoration-[#B58500]/60">
                    {item.free}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EAF5F2] text-[#0F5C4D] border border-[#8BAE9F]/40 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check</span>
                    <span>{item.premium}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust guarantees bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-[#211E1A]">
              Profils vérifiés manuellement
            </h4>
            <p className="font-body text-[11px] text-[#7D766C] mt-0.5">
              Notre équipe valide chaque inscription
            </p>
          </div>
        </div>

        <div className="bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">lock</span>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-[#211E1A]">
              Sans engagement
            </h4>
            <p className="font-body text-[11px] text-[#7D766C] mt-0.5">
              Pas de reconduction automatique
            </p>
          </div>
        </div>
      </div>

      {/* 3. MOTIVATIONAL CALLOUT WITH QURANIC VERSE */}
      <div className="bg-[#F8F5EE] border border-[#E8E3D7] rounded-3xl p-6 text-center space-y-3">
        <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
          {firstName}, le bon moment c'est maintenant
        </h3>
        <p className="font-body text-xs sm:text-sm text-[#575147] max-w-md mx-auto">
          Chaque jour où tu attends, c'est peut-être {spouseTerm} que tu ne découvres pas. Fais le premier pas vers ton avenir.
        </p>
        <blockquote className="italic font-serif-display text-xs text-[#0F5C4D] bg-white p-3.5 rounded-2xl border border-[#E8E3D7] max-w-lg mx-auto">
          « Et parmi Ses signes, Il a créé pour vous des épouses issues de vous-mêmes afin que vous trouviez auprès d'elles la tranquillité. »
          <span className="block not-italic font-sans text-[10px] text-[#7D766C] mt-1">
            (Sourate Ar-Rum, 21)
          </span>
        </blockquote>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[11px] text-[#7D766C] pt-1">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#0F5C4D] text-sm">check_circle</span>
            Aucun renouvellement automatique
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#0F5C4D] text-sm">check_circle</span>
            Avantages conservés jusqu'à la fin
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#0F5C4D] text-sm">check_circle</span>
            Paiement 100% sécurisé
          </span>
        </div>
      </div>

      {/* 4. CHOISIS TA DURÉE - PLAN SELECTOR */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-4">
        <div>
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#211E1A]">
            Choisis ta durée
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#7D766C] mt-0.5">
            Plus c'est long, plus tu économises
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0F5C4D] bg-[#F4F9F7] shadow-xs'
                    : 'border-[#E8E3D7] bg-[#FAF8F2] hover:border-[#8BAE9F]'
                }`}
              >
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-bold text-sm text-[#211E1A]">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.popular && (
                      <span className="bg-[#E6C687] text-[#1E1B16] text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase">
                        POPULAIRE
                      </span>
                    )}
                    {plan.discountBadge && (
                      <span className="bg-[#D1FAE5] text-[#059669] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {plan.discountBadge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtitle monthly equivalent & boosts */}
                <p className="font-body text-xs text-[#7D766C]">
                  {plan.monthlyEquivalent}
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F5C4D] mt-1">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>+{plan.boosts} boost{plan.boosts > 1 ? 's' : ''}</span>
                </div>

                {/* Pricing row */}
                <div className="mt-4 pt-3 border-t border-[#E8E3D7] flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    {plan.originalPrice && (
                      <span className="text-xs text-[#A8A196] line-through">
                        {plan.originalPrice.toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                    <span className="font-display font-bold text-base sm:text-lg text-[#0F5C4D]">
                      {plan.price.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white' : 'border-[#BDB7AB]'
                  }`}>
                    {isSelected && (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Promo Code Accordion / Toggle */}
        <div className="pt-2">
          {!showPromoInput ? (
            <button
              type="button"
              onClick={() => setShowPromoInput(true)}
              className="text-xs font-display font-bold text-[#0F5C4D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">sell</span>
              <span>J'ai un code promo</span>
            </button>
          ) : (
            <div className="bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl p-3 space-y-2">
              <label className="font-display text-xs font-bold text-[#211E1A] block">
                Code promo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ex: NASSIB10"
                  className="flex-1 h-10 bg-white border border-[#E8E3D7] rounded-xl px-3 text-xs font-mono uppercase text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 h-10 bg-[#0F5C4D] text-white rounded-xl text-xs font-display font-bold hover:bg-[#0c4a3e] cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
              {promoMessage && (
                <p className={`text-xs ${promoApplied ? 'text-[#059669] font-medium' : 'text-[#DC2626]'}`}>
                  {promoMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. COMMENT VEUX-TU PAYER ? */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-5">
        <div>
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#211E1A]">
            Comment veux-tu payer ?
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#7D766C] mt-0.5">
            Sélectionne ton moyen de paiement sécurisé
          </p>
        </div>

        {/* Payment tabs: Mobile Money vs Carte Bancaire */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentType('mobile')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentType === 'mobile'
                ? 'bg-[#EAF5F2] border-[#0F5C4D] text-[#0F5C4D] font-bold shadow-2xs'
                : 'bg-[#FAF8F2] border-[#E8E3D7] text-[#575147] hover:border-[#8BAE9F]'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">payments</span>
            <span className="text-xs font-display">Mobile Money</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentType('card')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentType === 'card'
                ? 'bg-[#EAF5F2] border-[#0F5C4D] text-[#0F5C4D] font-bold shadow-2xs'
                : 'bg-[#FAF8F2] border-[#E8E3D7] text-[#575147] hover:border-[#8BAE9F]'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">credit_card</span>
            <span className="text-xs font-display">Carte bancaire</span>
          </button>
        </div>

        {/* Sub-selectors */}
        {paymentType === 'mobile' ? (
          <div className="space-y-3 pt-1">
            <label className="font-display text-xs font-bold text-[#211E1A] block">
              Opérateur Mobile Money
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'orange', name: 'Orange Money' },
                { id: 'wave', name: 'Wave' },
                { id: 'airtel', name: 'Airtel Money' },
                { id: 'moov', name: 'Moov Money' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setMobileOperator(op.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-display font-medium text-center transition-all cursor-pointer ${
                    mobileOperator === op.id
                      ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                      : 'bg-[#FAF8F2] text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                  }`}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <label className="font-display text-xs font-bold text-[#211E1A] block">
              Réseau de carte
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'visa', name: 'Visa' },
                { id: 'mc', name: 'Mastercard' },
              ].map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setCardBrand(card.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-display font-medium text-center transition-all cursor-pointer ${
                    cardBrand === card.id
                      ? 'bg-[#0F5C4D] text-white border-[#0F5C4D] shadow-2xs'
                      : 'bg-[#FAF8F2] text-[#575147] border-[#E8E3D7] hover:border-[#8BAE9F]'
                  }`}
                >
                  {card.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Country and phone inputs */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-display text-xs font-bold text-[#211E1A] block">
                Pays du numéro
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3 text-xs font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-display text-xs font-bold text-[#211E1A] block">
                Numéro de téléphone
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-[#7D766C]">
                  {activeCountry.dial}
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder={activeCountry.code === 'FR' ? 'Ex. 06 42 51 36 95' : 'Ex. 90 00 00 00'}
                  className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl pl-16 pr-3.5 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>
            </div>
          </div>
          <p className="font-body text-[11px] text-[#7D766C] leading-relaxed">
            Saisis le numéro sans l’indicatif international. Le pays sélectionné transmet automatiquement le code {activeCountry.code} au paiement sécurisé.
          </p>
        </div>

        {/* Total and Checkout button */}
        <div className="pt-4 border-t border-[#E8E3D7] space-y-3">
          {phoneError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-base text-red-500 shrink-0">error</span>
              <span>{phoneError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-sm text-[#211E1A]">
              Total à payer
            </span>
            <div className="text-right">
              {promoApplied && (
                <span className="block text-xs text-[#A8A196] line-through">
                  {basePrice.toLocaleString('fr-FR')} FCFA
                </span>
              )}
              <span className="font-display font-bold text-xl sm:text-2xl text-[#0F5C4D]">
                {finalPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirmSubscription}
            className="w-full h-13 bg-[#0F5C4D] hover:bg-[#0c4a3e] active:scale-[0.99] text-white font-display text-sm font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                <span>Ouverture de la page de paiement sécurisée...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">workspace_premium</span>
                <span>Devenir membre Premium</span>
              </>
            )}
          </button>

          {redirectCheckoutUrl && (
            <div className="text-center pt-1 animate-fadeIn">
              <a
                href={redirectCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5C4D] hover:underline"
              >
                <span>Accéder directement à la page de paiement ({finalPrice.toLocaleString('fr-FR')} FCFA)</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center">
            <span className="text-[11px] text-[#7D766C] font-medium">
              Activation instantanée • Annulable en 1 clic
            </span>
            <span className="hidden sm:inline text-[#BDB7AB]">•</span>
            <span className="text-[11px] text-[#7D766C] flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-xs text-[#0F5C4D]">lock</span>
              Sécurisé via Chariow / Nassib Pay
            </span>
          </div>
        </div>
      </div>

      {/* 6. QUESTIONS FRÉQUENTES (FAQ) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E3D7] shadow-xs space-y-4">
        <div>
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#211E1A]">
            Questions fréquentes
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#7D766C] mt-0.5">
            Tout ce que tu dois savoir en toute transparence
          </p>
        </div>

        <div className="divide-y divide-[#F0EDE4] pt-1">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-3.5 first:pt-1 last:pb-1">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-3 cursor-pointer group"
                >
                  <span className="font-display font-semibold text-xs sm:text-sm text-[#211E1A] group-hover:text-[#0F5C4D] transition-colors">
                    {faq.q}
                  </span>
                  <span className={`material-symbols-outlined text-lg text-[#7D766C] group-hover:text-[#0F5C4D] transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#0F5C4D]' : ''
                  }`}>
                    keyboard_arrow_down
                  </span>
                </button>
                {isOpen && (
                  <div className="pt-2 text-xs font-body text-[#575147] leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
