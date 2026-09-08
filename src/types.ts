export type TabType = 
  | 'dashboard' 
  | 'browse' 
  | 'messages' 
  | 'requests'
  | 'profile-detail'
  | 'verification' 
  | 'settings' 
  | 'landing'
  | 'imam'
  | 'auth'
  | 'onboarding'
  | 'subscription';

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
  phone?: string;
  completionPercentage?: number;
  boostsCount?: number;
  boostedUntil?: string;
  premiumExpiresAt?: string;
  dailyContactsCount?: number;
  dailyContactsDate?: string;
}

/**
 * Vérifie rigoureusement si TOUTES les données et informations du profil sont bien renseignées.
 * Aucune information obligatoire ne doit être manquante.
 */
export function isProfileFullyComplete(p: Partial<Profile> | null | undefined): boolean {
  if (!p) return false;

  // 1. Photo de profil (au moins une photo valide)
  const hasPhoto = Boolean(
    (typeof p.photoUrl === 'string' && p.photoUrl.trim() !== '') ||
    (Array.isArray(p.photos) && p.photos.some((ph) => typeof ph === 'string' && ph.trim() !== ''))
  );
  if (!hasPhoto) return false;

  // 2. Nom complet (au moins 2 caractères)
  if (!p.name || typeof p.name !== 'string' || p.name.trim().length < 2) return false;

  // 3. Âge (au moins 18 ans)
  if (typeof p.age !== 'number' || p.age < 18) return false;

  // 4. Civilité / Genre
  if (!p.gender || (p.gender !== 'female' && p.gender !== 'male')) return false;

  // 5. Statut matrimonial
  if (!p.maritalStatus || typeof p.maritalStatus !== 'string' || p.maritalStatus.trim() === '') return false;

  // 6. Mensurations : Taille (> 0) et Poids (> 0)
  if (typeof p.height !== 'number' || p.height <= 0) return false;
  if (typeof p.weight !== 'number' || p.weight <= 0) return false;

  // 7. Origine & Ethnie
  if (!p.ethnicity || typeof p.ethnicity !== 'string' || p.ethnicity.trim() === '') return false;
  if (!p.originCity || typeof p.originCity !== 'string' || p.originCity.trim() === '') return false;

  // 8. Ville de résidence
  if (!p.city || typeof p.city !== 'string' || p.city.trim() === '') return false;

  // 9. Profession
  if (!p.profession || typeof p.profession !== 'string' || p.profession.trim() === '') return false;

  // 10. Niveau d'études
  if (!p.education || typeof p.education !== 'string' || p.education.trim() === '') return false;

  // 11. Présentation & Biographie de soi (au moins 20 caractères)
  const bio = (p.bio || p.presentation || '').trim();
  if (bio.length < 20) return false;

  // 12. Ce que la personne recherche chez son futur conjoint / Vision du mariage (au moins 15 caractères)
  const criteria = (p.partnerCriteria || '').trim();
  if (criteria.length < 15) return false;

  // 13. Valeurs cardinales (au moins 1 valeur sélectionnée)
  if (!Array.isArray(p.values) || p.values.length === 0) return false;

  // 14. Lignes rouges / Deal-breakers (au moins 1 sélectionné)
  if (!Array.isArray(p.dealBreakers) || p.dealBreakers.length === 0) return false;

  // 15. Pratique religieuse
  const practice = (p.religiousPracticeDetails || p.religion || '').trim();
  if (practice === '') return false;

  // 16. Tenue vestimentaire / Hijab
  if (!p.hijabStatus || typeof p.hijabStatus !== 'string' || p.hijabStatus.trim() === '') return false;

  // 17. Tuteur légal (Wali) : pour une femme, le Wali doit être obligatoirement renseigné ou validé
  if (p.gender === 'female') {
    const hasWali = Boolean(p.isWaliApproved || (p.waliReference && p.waliReference.trim() !== ''));
    if (!hasWali) return false;
  }

  return true;
}

/**
 * Calcul du pourcentage de complétion du profil (0 à 100%)
 * RÈGLE STRICTE : Ne renvoie 100% que si TOUTES les données et informations sont dûment renseignées.
 */
export function calculateProfileCompletion(p: Partial<Profile> | null | undefined): number {
  if (!p) return 0;
  let score = 0;

  // 1. Photo de profil (15 pts)
  const hasPhoto = Boolean(
    (typeof p.photoUrl === 'string' && p.photoUrl.trim() !== '') ||
    (Array.isArray(p.photos) && p.photos.some((ph) => typeof ph === 'string' && ph.trim() !== ''))
  );
  if (hasPhoto) score += 15;

  // 2. Nom complet (5 pts)
  if (p.name && typeof p.name === 'string' && p.name.trim().length >= 2) score += 5;

  // 3. Âge (5 pts)
  if (typeof p.age === 'number' && p.age >= 18) score += 5;

  // 4. Statut matrimonial (5 pts)
  if (p.maritalStatus && typeof p.maritalStatus === 'string' && p.maritalStatus.trim() !== '') score += 5;

  // 5. Attributs physiques : Taille & Poids (10 pts : 5 pts chacun)
  if (typeof p.height === 'number' && p.height > 0) score += 5;
  if (typeof p.weight === 'number' && p.weight > 0) score += 5;

  // 6. Origine & Ethnie (10 pts : 5 pts chacun)
  if (p.ethnicity && typeof p.ethnicity === 'string' && p.ethnicity.trim() !== '') score += 5;
  if (p.originCity && typeof p.originCity === 'string' && p.originCity.trim() !== '') score += 5;

  // 7. Ville de résidence (5 pts)
  if (p.city && typeof p.city === 'string' && p.city.trim() !== '') score += 5;

  // 8. Profession (5 pts)
  if (p.profession && typeof p.profession === 'string' && p.profession.trim() !== '') score += 5;

  // 9. Niveau d'études (5 pts)
  if (p.education && typeof p.education === 'string' && p.education.trim() !== '') score += 5;

  // 10. Présentation & Biographie de soi (10 pts)
  const bio = (p.bio || p.presentation || '').trim();
  if (bio.length >= 20) score += 10;
  else if (bio.length > 0) score += 5;

  // 11. Ce que la personne cherche / Vision du mariage (10 pts)
  const criteria = (p.partnerCriteria || '').trim();
  if (criteria.length >= 15) score += 10;
  else if (criteria.length > 0) score += 5;

  // 12. Valeurs cardinales (5 pts)
  if (Array.isArray(p.values) && p.values.length > 0) score += 5;

  // 13. Lignes rouges / Deal-breakers (5 pts)
  if (Array.isArray(p.dealBreakers) && p.dealBreakers.length > 0) score += 5;

  // 14. Pratique religieuse & Tenue / Hijab (10 pts : 5 pts chacun)
  const practice = (p.religiousPracticeDetails || p.religion || '').trim();
  if (practice !== '') score += 5;
  if (p.hijabStatus && typeof p.hijabStatus === 'string' && p.hijabStatus.trim() !== '') score += 5;

  // Vérification de complétude intégrale
  const fullyComplete = isProfileFullyComplete(p);
  if (fullyComplete) {
    return 100;
  }

  // RÈGLE STRICTE : Avant de dire que le profil est complet à 100%,
  // il faut impérativement que TOUTES les données et informations soient renseignées.
  // Tant qu'il manque ne serait-ce qu'une seule donnée, on plafonne à 95% maximum.
  return Math.min(95, Math.max(0, score));
}

/**
 * Règle stricte : Tout profil qui n'a téléversé aucune photo ne doit pas être visible dans l'application.
 */
export function hasUploadedPhoto(p: Partial<Profile> | null | undefined): boolean {
  if (!p) return false;
  const hasPhotoUrl = Boolean(p.photoUrl && typeof p.photoUrl === 'string' && p.photoUrl.trim() !== '');
  const hasPhotos = Array.isArray(p.photos) && p.photos.some((ph) => Boolean(ph) && typeof ph === 'string' && ph.trim() !== '');
  return hasPhotoUrl || hasPhotos;
}

export function isProfileVisible(p: Partial<Profile> | null | undefined): boolean {
  return hasUploadedPhoto(p);
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

export type ConversationStatus = 'pending' | 'accepted' | 'rejected';

export interface Conversation {
  id: string;
  candidateId?: string;
  suitorId?: string;
  requesterId?: string;
  status: ConversationStatus;
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
  createdAt?: string;
}

export interface PhotoAccessRequest {
  id: string;
  requesterProfileId: string;
  targetProfileId: string;
  requesterUserId?: string;
  targetUserId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  note?: string;
  createdAt: string;
  updatedAt?: string;
  requesterProfile?: Profile;
  targetProfile?: Profile;
}

export type ContactRelationshipState =
  | 'NO_REQUEST'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED';

export type PhotoAccessRelationshipState =
  | 'PUBLIC'
  | 'LOCKED'
  | 'REQUESTED_SENT'
  | 'REQUESTED_RECEIVED'
  | 'GRANTED';

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
  boostsCount?: number;
  boostedUntil?: string;
  premiumExpiresAt?: string;
  dailyContactsCount?: number;
  dailyContactsDate?: string;
}

export * from './types/database';
