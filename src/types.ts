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
