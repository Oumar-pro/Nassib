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
  professionCategory?: string;
  city: string;
  country?: string;
  neighborhood?: string;
  maritalStatus: MaritalStatus;
  marriageHorizon?: string;
  religion: string;
  education: string;
  matchPercentage: number; // Compatibilité entre profils (calculée dynamiquement)
  isVerifiedNNI: boolean;
  isWaliApproved: boolean;
  isPremium: boolean;
  planName?: string;
  photoUrl: string;
  photoPrivate: boolean;
  bio: string;
  waliReference?: string; // Donnée privée (accessible uniquement au titulaire du compte)
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

  // Données détaillées du profil réelles (Onboarding & Paramètres)
  height?: number;
  weight?: number;
  bodyType?: string;
  ethnicity?: string;
  originCity?: string;
  motherTongue?: string;
  hijabStatus?: string;
  religiousPracticeDetails?: string;
  quranPractice?: string;
  values?: string[];
  partnerCriteria?: string;
  preferredAgeRange?: string;
  dealBreakers?: string[];
  hasChildren?: boolean | string;
  childrenCount?: number;
  phone?: string;
  completionPercentage?: number;
  boostsCount?: number;
  boostedUntil?: string;
  premiumExpiresAt?: string;
  dailyContactsCount?: number;
  dailyContactsDate?: string;

  // Champs dépréciés conservés optionnellement pour compatibilité descendante
  /** @deprecated Non demandé dans le produit actuel */
  beardStatus?: string;
  /** @deprecated Non demandé dans le produit actuel */
  quranReading?: string;
  /** @deprecated Non demandé dans le produit actuel */
  quranMemorization?: string;
  /** @deprecated Non demandé dans le produit actuel */
  wantsChildren?: string;
  /** @deprecated Non demandé dans le produit actuel */
  relocation?: string;
  /** @deprecated Non demandé dans le produit actuel */
  polygamyOpinion?: string;
  /** @deprecated Non demandé dans le produit actuel */
  hijraProject?: string;
}

/**
 * Vérifie rigoureusement si TOUTES les données et informations du profil sont bien renseignées.
 * Seuls les champs réellement demandés à l'utilisateur sont évalués.
 * Un profil complet ne peut être validé à 100% que si cette fonction retourne true.
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

  // 3. Âge (adulte entre 18 et 100 ans)
  if (typeof p.age !== 'number' || p.age < 18 || p.age > 100) return false;

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

  // 8. Ville de résidence, Profession, Niveau d'études
  if (!p.city || typeof p.city !== 'string' || p.city.trim() === '') return false;
  if (!p.profession || typeof p.profession !== 'string' || p.profession.trim() === '') return false;
  if (!p.education || typeof p.education !== 'string' || p.education.trim() === '') return false;

  // 9. Présentation / Bio (au moins 20 caractères)
  const bio = (p.bio || p.presentation || '').trim();
  if (bio.length < 20) return false;

  // 10. Vision familiale & priorité
  const familyVision = (p.familyImportance || '').trim();
  if (familyVision.length < 5) return false;

  // 11. Ce que la personne recherche chez son futur conjoint (au moins 15 caractères)
  const criteria = (p.partnerCriteria || '').trim();
  if (criteria.length < 15) return false;

  // 12. Valeurs cardinales & Lignes rouges
  if (!Array.isArray(p.values) || p.values.length === 0) return false;
  if (!Array.isArray(p.dealBreakers) || p.dealBreakers.length === 0) return false;

  // 13. Pratique religieuse
  const practice = (p.religiousPracticeDetails || p.religion || '').trim();
  if (practice === '') return false;

  // 14. Spécificités pour les femmes (Hijab et Tuteur Wali)
  if (p.gender === 'female') {
    if (!p.hijabStatus || p.hijabStatus.trim() === '') return false;
    const hasWali = Boolean(p.isWaliApproved || (p.waliReference && p.waliReference.trim().length >= 2));
    if (!hasWali) return false;
  }

  return true;
}

/**
 * Calcul déterministe du pourcentage de complétion du profil (0 à 100%).
 * Basé rigoureusement sur les 10 domaines réellement demandés lors de l'onboarding et des paramètres :
 * 1. Photo (10 pts)
 * 2. Identité : Nom (4), Âge (3), Civilité (3) => 10 pts
 * 3. Mensurations : Taille (5), Poids (5) => 10 pts
 * 4. Origine & Résidence : Ville (4), Ville d'origine (3), Ethnie (3) => 10 pts
 * 5. Situation & Formation : Profession (5), Études (5) => 10 pts
 * 6. Statut & Projet de mariage : Statut matrimonial (5), Horizon (5) => 10 pts
 * 7. Présentation personnelle : Bio >= 20 car. (10 pts) => 10 pts
 * 8. Vision familiale & Critères : Priorité famille (5), Critères conjoint (5) => 10 pts
 * 9. Valeurs & Lignes rouges : Valeurs (5), Deal-breakers (5) => 10 pts
 * 10. Pratique religieuse & Cadre éthique :
 *     - Femme : Pratique (4), Hijab (3), Wali (3) => 10 pts
 *     - Homme : Pratique (10) => 10 pts
 * Total maximum = 100 points.
 * RÈGLE ABSOLUE : 100% n'est accordé que si isProfileFullyComplete(p) est true.
 * Tant qu'une donnée obligatoire est manquante, le score est plafonné à 95% maximum.
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

  // 2. Identité : Nom (4 pts), Âge (3 pts), Civilité (3 pts) => 10 pts
  if (p.name && typeof p.name === 'string' && p.name.trim().length >= 2) score += 4;
  if (typeof p.age === 'number' && p.age >= 18 && p.age <= 100) score += 3;
  if (p.gender === 'female' || p.gender === 'male') score += 3;

  // 3. Mensurations : Taille (5 pts), Poids (5 pts) => 10 pts
  if (typeof p.height === 'number' && p.height > 0) score += 5;
  if (typeof p.weight === 'number' && p.weight > 0) score += 5;

  // 4. Origine & Résidence : Ville (4 pts), Ville d'origine (3 pts), Ethnie (3 pts) => 10 pts
  if (p.city && typeof p.city === 'string' && p.city.trim() !== '') score += 4;
  if (p.originCity && typeof p.originCity === 'string' && p.originCity.trim() !== '') score += 3;
  if (p.ethnicity && typeof p.ethnicity === 'string' && p.ethnicity.trim() !== '') score += 3;

  // 5. Situation & Formation : Profession (5 pts), Études (5 pts) => 10 pts
  if (p.profession && typeof p.profession === 'string' && p.profession.trim() !== '') score += 5;
  if (p.education && typeof p.education === 'string' && p.education.trim() !== '') score += 5;

  // 6. Statut & Projet de mariage (10 pts)
  if (p.maritalStatus && typeof p.maritalStatus === 'string' && p.maritalStatus.trim() !== '') score += 5;
  if (p.marriageHorizon && typeof p.marriageHorizon === 'string' && p.marriageHorizon.trim() !== '') {
    score += 5;
  } else if (p.maritalStatus && typeof p.maritalStatus === 'string' && p.maritalStatus.trim() !== '') {
    // Si horizon non précisé mais statut matrimonial explicite
    score += 2;
  }

  // 7. Présentation personnelle : Bio >= 20 car. (10 pts), ébauche (5 pts)
  const bio = (p.bio || p.presentation || '').trim();
  if (bio.length >= 20) score += 10;
  else if (bio.length > 0) score += 5;

  // 8. Vision familiale & Critères : Vision famille (5 pts), Critères conjoint (5 pts)
  if (p.familyImportance && p.familyImportance.trim().length >= 5) score += 5;
  const criteria = (p.partnerCriteria || '').trim();
  if (criteria.length >= 15) score += 5;
  else if (criteria.length > 0) score += 2;

  // 9. Valeurs cardinales & Lignes rouges : Valeurs (5 pts), Deal-breakers (5 pts)
  if (Array.isArray(p.values) && p.values.length > 0) score += 5;
  if (Array.isArray(p.dealBreakers) && p.dealBreakers.length > 0) score += 5;

  // 10. Pratique religieuse & Cadre éthique (10 pts)
  const practice = (p.religiousPracticeDetails || p.religion || '').trim();
  if (p.gender === 'female') {
    if (practice !== '') score += 4;
    if (p.hijabStatus && p.hijabStatus.trim() !== '') score += 3;
    const hasWali = Boolean(p.isWaliApproved || (p.waliReference && p.waliReference.trim().length >= 2));
    if (hasWali) score += 3;
  } else {
    // Pour un homme : pratique religieuse (10 pts)
    if (practice !== '') score += 10;
  }

  // RÈGLE ABSOLUE : Seule la validation intégrale permet d'obtenir 100%
  if (isProfileFullyComplete(p)) {
    return 100;
  }

  // Tant qu'il manque ne serait-ce qu'une donnée requise, on plafonne à 95% maximum
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
