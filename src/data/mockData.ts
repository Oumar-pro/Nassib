import { Profile, Conversation, Message, PricingPlan, User } from '../types';

// Default empty structures and dynamic constants (No fake/mock profile records)

export const INITIAL_USER: User = {
  id: '',
  name: 'Membre Zawaj',
  email: '',
  phone: '',
  role: 'candidate',
  isVerifiedNNI: false,
  isWaliApproved: false,
  isPremium: false,
  photoBlurringActive: true,
  photoUrl: '',
  planName: 'Sadaq (Gratuit)',
  waliInfo: {
    name: '',
    relation: '',
    phone: '',
  },
  stats: {
    profileViews: 0,
    profileConsultations: 0,
    photoRequests: 0,
    photoRequestsApproved: 0,
    matchesCount: 0,
    favoritesCount: 0,
    compatibilityRateAvg: 0,
    weeklyGrowthPercentage: 0,
  },
};

// Completely empty collections (no mock profiles or messages)
export const MOCK_PROFILES: Profile[] = [];

export const MOCK_CONVERSATIONS: Conversation[] = [];

export const MOCK_MESSAGES_CONV1: Message[] = [];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan_sadaq',
    name: 'Sadaq',
    price: '0',
    period: 'FCFA / mois',
    description: 'Pour débuter votre démarche avec intention',
    features: [
      'Consultation de base des profils',
      '5 messages autorisés / semaine',
      'Filtres géographiques simples',
    ],
    ctaText: 'Formule Actuelle',
  },
  {
    id: 'plan_baraka',
    name: 'Baraka',
    price: '5,000',
    period: 'FCFA / mois',
    description: 'Visibilité renforcée & crédibilité totale',
    popular: true,
    features: [
      'Vérification NNI Incluse',
      'Messagerie illimitée et privée',
      'Filtres de recherche avancés',
      'Intégration & approbation du Wali',
    ],
    ctaText: 'Choisir Baraka',
  },
  {
    id: 'plan_iman',
    name: 'Iman',
    price: '15,000',
    period: 'FCFA / 6 mois',
    description: "L'expérience éthique complète sur le long terme",
    features: [
      'Tous les avantages de la formule Baraka',
      'Boost prioritaire du profil',
      'Accusés de lecture des messages',
      'Conseiller matrimonial dédié',
    ],
    ctaText: 'Choisir Iman',
  },
];

export const PAYMENT_METHODS = [
  { id: 'nita', name: 'Nita Money', icon: 'account_balance_wallet', desc: 'Payez directement via votre compte Nita' },
  { id: 'alizza', name: 'Al-Izza', icon: 'account_balance_wallet', desc: 'Transfert sécurisé via agences Al-Izza' },
  { id: 'flooz', name: 'Flooz (Moov)', icon: 'phone_android', desc: 'Paiement mobile instantané Flooz' },
  { id: 'airtel', name: 'Airtel Money', icon: 'smartphone', desc: 'Paiement mobile Airtel Money Niger' },
];
