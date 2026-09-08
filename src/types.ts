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
 * Aucune information obligatoire ou de projet de vie ne doit être manquante.
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

  // 7. Origine & Langue
  if (!p.ethnicity || typeof p.ethnicity !== 'string' || p.ethnicity.trim() === '') return false;
  if (!p.originCity || typeof p.originCity !== 'string' || p.originCity.trim() === '') return false;
  if (!p.motherTongue || typeof p.motherTongue !== 'string' || p.motherTongue.trim() === '') return false;

  // 8. Ville de résidence, Profession, Niveau d'études
  if (!p.city || typeof p.city !== 'string' || p.city.trim() === '') return false;
  if (!p.profession || typeof p.profession !== 'string' || p.profession.trim() === '') return false;
  if (!p.education || typeof p.education !== 'string' || p.education.trim() === '') return false;

  // 9. Présentation & Vision du mariage
  const bio = (p.bio || p.presentation || '').trim();
  if (bio.length < 20) return false;
  const familyVision = (p.familyImportance || '').trim();
  if (familyVision.length < 10) return false;

  // 10. Ce que la personne recherche chez son futur conjoint
  const criteria = (p.partnerCriteria || '').trim();
  if (criteria.length < 15) return false;

  // 11. Valeurs cardinales & Lignes rouges
  if (!Array.isArray(p.values) || p.values.length === 0) return false;
  if (!Array.isArray(p.dealBreakers) || p.dealBreakers.length === 0) return false;

  // 12. Pratique religieuse, Hijab ou Barbe, Coran
  const practice = (p.religiousPracticeDetails || p.religion || '').trim();
  if (practice === '') return false;
  if (p.gender === 'female' && (!p.hijabStatus || p.hijabStatus.trim() === '')) return false;
  if (p.gender === 'male' && (!p.beardStatus || p.beardStatus.trim() === '')) return false;
  if (!p.quranReading || p.quranReading.trim() === '') return false;
  if (!p.quranMemorization || p.quranMemorization.trim() === '') return false;

  // 13. Projet de vie (Enfants, Déménagement, Polygamie, Hijra)
  if (!p.hasChildren || p.hasChildren.trim() === '') return false;
  if (!p.wantsChildren || p.wantsChildren.trim() === '') return false;
  if (!p.relocation || p.relocation.trim() === '') return false;
  if (!p.polygamyOpinion || p.polygamyOpinion.trim() === '') return false;
  if (!p.hijraProject || p.hijraProject.trim() === '') return false;

  // 14. Tuteur légal (Wali) : pour une femme, le Wali doit être obligatoirement renseigné ou validé
  if (p.gender === 'female') {
    const hasWali = Boolean(p.isWaliApproved || (p.waliReference && p.waliReference.trim() !== ''));
    if (!hasWali) return false;
  }

  return true;
}

/**
 * Calcul du pourcentage de complétion du profil (0 à 100%)
 * Prend rigoureusement en compte TOUTES les informations demandées à l'utilisateur :
 * Photo, identité, mensurations, origine, situation, vision & projet de vie, religion & Coran, tuteur.
 * RÈGLE STRICTE : Ne renvoie 100% que si TOUTES les données et informations sont dûment renseignées.
 */
export function calculateProfileCompletion(p: Partial<Profile> | null | undefined): number {
  if (!p) return 0;
  let score = 0;

  // 1. Photo de profil (10 pts)
  const hasPhoto = Boolean(
    (typeof p.photoUrl === 'string' && p.photoUrl.trim() !== '') ||
    (Array.isArray(p.photos) && p.photos.some((ph) => typeof ph === 'string' && ph.trim() !== ''))
  );
  if (hasPhoto) score += 10;

  // 2. Identité : Nom (3 pts), Âge (4 pts), Civilité (3 pts) => 10 pts
  if (p.name && typeof p.name === 'string' && p.name.trim().length >= 2) score += 3;
  if (typeof p.age === 'number' && p.age >= 18) score += 4;
  if (p.gender === 'female' || p.gender === 'male') score += 3;

  // 3. Statut matrimonial (4 pts), Taille (3 pts), Poids (3 pts) => 10 pts
  if (p.maritalStatus && typeof p.maritalStatus === 'string' && p.maritalStatus.trim() !== '') score += 4;
  if (typeof p.height === 'number' && p.height > 0) score += 3;
  if (typeof p.weight === 'number' && p.weight > 0) score += 3;

  // 4. Origine & Langue : Ethnie (4 pts), Ville d'origine (3 pts), Langue maternelle (3 pts) => 10 pts
  if (p.ethnicity && typeof p.ethnicity === 'string' && p.ethnicity.trim() !== '') score += 4;
  if (p.originCity && typeof p.originCity === 'string' && p.originCity.trim() !== '') score += 3;
  if (p.motherTongue && typeof p.motherTongue === 'string' && p.motherTongue.trim() !== '') score += 3;

  // 5. Situation : Ville de résidence (4 pts), Profession (3 pts), Études (3 pts) => 10 pts
  if (p.city && typeof p.city === 'string' && p.city.trim() !== '') score += 4;
  if (p.profession && typeof p.profession === 'string' && p.profession.trim() !== '') score += 3;
  if (p.education && typeof p.education === 'string' && p.education.trim() !== '') score += 3;

  // 6. Présentation & Personnalité : Biographie (6 pts), Vision du mariage / Famille (4 pts) => 10 pts
  const bio = (p.bio || p.presentation || '').trim();
  if (bio.length >= 20) score += 6;
  else if (bio.length > 0) score += 3;
  if (p.familyImportance && p.familyImportance.trim().length >= 10) score += 4;

  // 7. Critères & Valeurs : Critères conjoint (4 pts), Valeurs (3 pts), Deal-breakers (3 pts) => 10 pts
  const criteria = (p.partnerCriteria || '').trim();
  if (criteria.length >= 15) score += 4;
  else if (criteria.length > 0) score += 2;
  if (Array.isArray(p.values) && p.values.length > 0) score += 3;
  if (Array.isArray(p.dealBreakers) && p.dealBreakers.length > 0) score += 3;

  // 8. Pratique religieuse & Coran (10 pts)
  const practice = (p.religiousPracticeDetails || p.religion || '').trim();
  if (practice !== '') score += 3;
  if ((p.gender === 'female' && p.hijabStatus && p.hijabStatus.trim() !== '') ||
      (p.gender === 'male' && p.beardStatus && p.beardStatus.trim() !== '')) {
    score += 3;
  }
  if (p.quranReading && p.quranReading.trim() !== '') score += 2;
  if (p.quranMemorization && p.quranMemorization.trim() !== '') score += 2;

  // 9. Projet de vie (10 pts : 2 pts par réponse)
  if (p.hasChildren && p.hasChildren.trim() !== '') score += 2;
  if (p.wantsChildren && p.wantsChildren.trim() !== '') score += 2;
  if (p.relocation && p.relocation.trim() !== '') score += 2;
  if (p.polygamyOpinion && p.polygamyOpinion.trim() !== '') score += 2;
  if (p.hijraProject && p.hijraProject.trim() !== '') score += 2;

  // 10. Tuteur légal (Wali) / Coordonnées (10 pts)
  if (p.gender === 'female') {
    const hasWali = Boolean(p.isWaliApproved || (p.waliReference && p.waliReference.trim().length >= 2));
    if (hasWali) score += 10;
  } else {
    // Pour un homme : confirmation des coordonnées ou tuteur référent
    score += 10;
  }

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
