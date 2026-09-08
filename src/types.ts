export type TabType = 'dashboard' | 'browse' | 'messages' | 'requests' | 'profile-detail' | 'verification' | 'settings' | 'landing' | 'imam' | 'auth' | 'onboarding' | 'subscription';
export type MaritalStatus = 'Jamais marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve' | string;

export interface UserStats {
  profileViews: number;
  profileConsultations: number;
  photoRequests: number;
  photoRequestsApproved: number;
  matchesCount: number;
  favoritesCount: number;
  compatibilityRateAvg: number;
  weeklyGrowthPercentage: number;
}

export interface Profile {
  id: string;
  userId?: string;
  userEmail?: string;
  email?: string;
  name: string;
  age: number;
  profession: string;
  professionCategory?: string;
  city: string;
  country?: string;
  neighborhood?: string;
  maritalStatus: MaritalStatus;
  religion: string;
  education: string;
  matchPercentage: number;
  isVerifiedNNI: boolean;
  isWaliApproved: boolean;
  isPremium: boolean;
  photoUrl: string;
  photoPrivate: boolean;
  bio: string;
  waliReference?: string;
  viewsCount?: number;
  likesCount?: number;
  gender: 'female' | 'male';
  photos?: string[];
  hobbies?: string;
  interests?: string;
  drinksAlcohol?: boolean;
  smokes?: boolean;
  presentation?: string;
  personality?: string;
  familyImportance?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  height?: number;
  weight?: number;
  bodyType?: string;
  ethnicity?: string;
  originCity?: string;
  motherTongue?: string;
  hijabStatus?: string;
  beardStatus?: string;
  religiousPracticeDetails?: string;
  quranReading?: string;
  quranMemorization?: string;
  hasChildren?: string;
  wantsChildren?: string;
  relocation?: string;
  polygamyOpinion?: string;
  hijraProject?: string;
  preferredAgeRange?: string;
  marriageHorizon?: string;
  values?: string[];
  partnerCriteria?: string;
  dealBreakers?: string[];
  phone?: string;
  completionPercentage?: number;
  boostsCount?: number;
  boostedUntil?: string;
  premiumExpiresAt?: string;
  dailyContactsCount?: number;
  dailyContactsDate?: string;
}

const nonBlank = (value: unknown): boolean => typeof value === 'string' ? value.trim().length > 0 : false;
const positiveNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value) && value > 0;
const validAge = (value: unknown): boolean => typeof value === 'number' && Number.isInteger(value) && value >= 18 && value <= 100;
const nonEmptyArray = (value: unknown): boolean => Array.isArray(value) && value.some(v => typeof v === 'string' && v.trim().length > 0);

/**
 * Champs de profil réellement proposés par l'onboarding actif (OnboardingPageV2)
 * et par l'éditeur de profil. Les données système, privées et les champs non demandés
 * ne contribuent pas à la complétion.
 */
export const PROFILE_COMPLETION_FIELDS = [
  'photoUrl', 'name', 'age', 'gender', 'country', 'city', 'neighborhood',
  'originCity', 'ethnicity', 'height', 'weight', 'bodyType', 'religion',
  'religiousPracticeDetails', 'hijabStatus', 'bio', 'education', 'professionCategory',
  'profession', 'personality', 'familyImportance', 'values', 'partnerCriteria',
  'preferredAgeRange', 'dealBreakers', 'maritalStatus', 'polygamyOpinion', 'marriageHorizon',
] as const;

export function isProfileFieldComplete(field: typeof PROFILE_COMPLETION_FIELDS[number], p: Partial<Profile>): boolean {
  switch (field) {
    case 'photoUrl': return nonBlank(p.photoUrl) || nonEmptyArray(p.photos);
    case 'name': return nonBlank(p.name) && p.name.trim().length >= 2;
    case 'age': return validAge(p.age);
    case 'gender': return p.gender === 'male' || p.gender === 'female';
    case 'height': return positiveNumber(p.height);
    case 'weight': return positiveNumber(p.weight);
    case 'values': return nonEmptyArray(p.values);
    case 'dealBreakers': return nonEmptyArray(p.dealBreakers);
    case 'bio': return nonBlank(p.bio) && p.bio.trim().length >= 20;
    case 'partnerCriteria': return nonBlank(p.partnerCriteria) && p.partnerCriteria.trim().length >= 15;
    default: return nonBlank(p[field]);
  }
}

export function calculateProfileCompletion(p: Partial<Profile> | null | undefined): number {
  if (!p) return 0;
  const completed = PROFILE_COMPLETION_FIELDS.filter(field => isProfileFieldComplete(field, p)).length;
  return Math.round((completed / PROFILE_COMPLETION_FIELDS.length) * 100);
}

export function isProfileFullyComplete(p: Partial<Profile> | null | undefined): boolean {
  if (!p) return false;
  return PROFILE_COMPLETION_FIELDS.every(field => isProfileFieldComplete(field, p));
}

export function hasUploadedPhoto(p: Partial<Profile> | null | undefined): boolean {
  if (!p) return false;
  return isProfileFieldComplete('photoUrl', p);
}

export function isProfileVisible(p: Partial<Profile> | null | undefined): boolean {
  return hasUploadedPhoto(p);
}

export interface Message {
  id: string; conversationId: string; senderId: string; senderName: string; senderAvatar: string;
  text: string; timestamp: string; isMine: boolean; isSupervised: boolean;
  status?: 'sent' | 'delivered' | 'read';
}
export type ConversationStatus = 'pending' | 'accepted' | 'rejected';
export interface Conversation {
  id: string; candidateId?: string; suitorId?: string; requesterId?: string; status: ConversationStatus;
  participantId: string; participantName: string; participantAvatar: string; participantCity: string;
  lastMessage: string; lastMessageTime: string; unreadCount: number; isSupervised: boolean;
  isVerifiedNNI: boolean; onlineStatus: boolean; createdAt?: string;
}
export interface PhotoAccessRequest {
  id: string; requesterProfileId: string; targetProfileId: string; requesterUserId?: string; targetUserId?: string;
  status: 'pending' | 'accepted' | 'rejected'; note?: string; createdAt: string; updatedAt?: string;
  requesterProfile?: Profile; targetProfile?: Profile;
}
export type ContactRelationshipState = 'NO_REQUEST' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'REJECTED';
export type PhotoAccessRelationshipState = 'PUBLIC' | 'LOCKED' | 'REQUESTED_SENT' | 'REQUESTED_RECEIVED' | 'GRANTED';
export interface UserWaliInfo { name: string; relation: string; phone: string; }
export interface User {
  id: string; profileId?: string; name: string; email: string; phone: string; role: 'candidate' | 'wali';
  isVerifiedNNI: boolean; isWaliApproved: boolean; isPremium: boolean; photoBlurringActive: boolean;
  photoUrl: string; planName: string; waliInfo: UserWaliInfo; stats?: UserStats;
  gender?: 'female' | 'male'; photos?: string[]; isAdmin?: boolean; boostsCount?: number;
  boostedUntil?: string; premiumExpiresAt?: string; dailyContactsCount?: number; dailyContactsDate?: string;
}
export * from './types/database';
