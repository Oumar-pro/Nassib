import { Profile, Conversation, Message, User } from '../types';

// Default empty structures and dynamic constants (No fake/mock profile records)

export const INITIAL_USER: User = {
  id: '',
  name: 'Membre NASIBA',
  email: '',
  phone: '',
  role: 'candidate',
  isVerifiedNNI: false,
  isWaliApproved: false,
  isPremium: true,
  photoBlurringActive: true,
  photoUrl: '',
  planName: 'Accès Gratuit & Illimité',
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

