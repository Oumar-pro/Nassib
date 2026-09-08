import React from 'react';
import { Profile, User, PhotoAccessRelationshipState } from '../../types';
import { ProfileDetailViewV2 } from './ProfileDetailViewV2';

interface Props {
  profile: Profile | null; currentUser?: User; onClose: () => void; onStartMessage?: (p: Profile) => void;
  onRequestPhotoAccess?: (p: Profile) => void; photoAccessState?: PhotoAccessRelationshipState; isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void; onReport?: (p: Profile, reason: string, description?: string) => void;
  onBlock?: (p: Profile, reason?: string) => void; hasUploadedPhoto?: boolean; onRequestPhotoUpload?: () => void;
}
export const ProfileDetailModalV2: React.FC<Props> = ({profile,...props}) => {
  if (!profile) return null;
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-[#211E1A]/50 backdrop-blur-sm p-2 sm:p-6"><div className="min-h-full flex items-start justify-center"><div className="w-full max-w-3xl relative"><button type="button" onClick={props.onClose} className="absolute right-3 top-3 z-50 w-10 h-10 rounded-full bg-white shadow-md text-[#211E1A]" aria-label="Fermer"><span className="material-symbols-outlined">close</span></button><ProfileDetailViewV2 profile={profile} currentUser={props.currentUser} onBack={props.onClose} onStartMessage={props.onStartMessage} onRequestPhotoAccess={props.onRequestPhotoAccess} photoAccessState={props.photoAccessState} isFavorited={props.isFavorited} onToggleFavorite={props.onToggleFavorite} onReport={props.onReport} onBlock={props.onBlock} hasUploadedPhoto={props.hasUploadedPhoto} onRequestPhotoUpload={props.onRequestPhotoUpload}/></div></div></div>;
};
