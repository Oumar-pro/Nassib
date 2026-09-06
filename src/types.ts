export type TabType = 
  | 'dashboard' 
  | 'browse' 
  | 'messages' 
  | 'verification' 
  | 'settings' 
  | 'landing'
  | 'imam'
  | 'auth'
  | 'onboarding';

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
  id: string; // uuid
  userId?: string; // uuid -> auth.users(id)
  userEmail?: string;
  email?: string;
  name: string;
  age: number;
  profession: string;
  city: string;
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
  // Detailed Onboarding & Profile Criteria
  height?: number;
  weight?: number;
  ethnicity?: string;
  originCity?: string;
  hijabStatus?: string;
  religiousPracticeDetails?: string;
  values?: string[];
  partnerCriteria?: string;
  dealBreakers?: string[];
  completionPercentage?: number;
}

/**
 * Calcul du pourcentage de complétion du profil (0 à 100%)
 */
export function calculateProfileCompletion(p: Partial<Profile> | null | undefined): number {
  if (!p) return 0;
  let score = 0;

  // 1. Photo de profil (20 pts)
  const hasPhoto = Boolean(
    (p.photoUrl && p.photoUrl.trim() !== '') ||
    (p.photos && p.photos.some((ph) => Boolean(ph) && ph.trim() !== ''))
  );
  if (hasPhoto) score += 20;

  // 2. Présentation / Résumé de soi (15 pts)
  const bioText = p.bio || p.presentation || '';
  if (bioText.trim().length >= 20) score += 15;
  else if (bioText.trim().length > 0) score += 8;

  // 3. Ce que la personne cherche (15 pts)
  const criteria = p.partnerCriteria || p.interests || '';
  if (criteria.trim().length >= 15) score += 15;
  else if (criteria.trim().length > 0) score += 8;

  // 4. Attributs physiques (Taille / Poids) (10 pts)
  if (p.height && p.weight) score += 10;
  else if (p.height || p.weight) score += 6;

  // 5. Pratique religieuse & Tenue / Hijab (10 pts)
  if (p.hijabStatus || p.religiousPracticeDetails || p.religion) score += 10;

  // 6. Valeurs cardinales (10 pts)
  if (p.values && p.values.length > 0) score += 10;
  else if (p.familyImportance) score += 5;

  // 7. Ce qu'elle n'accepte pas / Lignes rouges (10 pts)
  if (p.dealBreakers && p.dealBreakers.length > 0) score += 10;

  // 8. Origine & Ethnie (5 pts)
  if (p.ethnicity || p.originCity) score += 5;

  // 9. Statut, Profession, Ville (5 pts)
  if (p.profession && p.city && p.maritalStatus) score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Règle de visibilité :
 * - Avoir au moins une photo de profil
 * - Avoir un taux de complétion >= 50%
 */
export function isProfileVisible(p: Partial<Profile> | null | undefined): boolean {
  if (!p) return false;
  const hasPhoto = Boolean(
    (p.photoUrl && p.photoUrl.trim() !== '') ||
    (p.photos && p.photos.some((ph) => Boolean(ph) && ph.trim() !== ''))
  );
  if (!hasPhoto) return false;

  const completion = p.completionPercentage ?? calculateProfileCompletion(p);
  return completion >= 50;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  isSupervised: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  candidateId?: string;
  suitorId?: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantCity: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isSupervised: boolean;
  isVerifiedNNI: boolean;
  onlineStatus: boolean;
}

export interface UserWaliInfo {
  name: string;
  relation: string;
  phone: string;
}

export interface User {
  id: string;
  profileId?: string; // profiles.id (distinct from auth id) — requis pour messages/conversations
  name: string;
  email: string;
  phone: string;
  role: 'candidate' | 'wali';
  isVerifiedNNI: boolean;
  isWaliApproved: boolean;
  isPremium: boolean;
  photoBlurringActive: boolean;
  photoUrl: string;
  planName: string;
  waliInfo: UserWaliInfo;
  stats?: UserStats;
  gender?: 'female' | 'male';
  photos?: string[];
  isAdmin?: boolean;
}

export * from './types/database';
