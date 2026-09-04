import React, { useState } from 'react';
import { User, TabType } from '../../types';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onNavigateTab: (tab: TabType) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onNavigateTab,
  onLogout
}) => {
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [phone, setPhone] = useState<string>(user.phone);
  const [photos, setPhotos] = useState<string[]>(
    user.photos && user.photos.length > 0
      ? [user.photos[0] || user.photoUrl || '', user.photos[1] || '', user.photos[2] || '']
      : [user.photoUrl || '', '', '']
  );
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handlePhotoFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const nextPhotos = [...photos];
        nextPhotos[index] = dataUrl;
        setPhotos(nextPhotos);

        const primaryPhoto = nextPhotos[0] || nextPhotos.find((p) => Boolean(p) && p.trim() !== '') || '';
        onUpdateUser({
          photos: nextPhotos.filter((p) => Boolean(p) && p.trim() !== ''),
          photoUrl: primaryPhoto
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    const nextPhotos = [...photos];
    nextPhotos[index] = '';
    setPhotos(nextPhotos);

    const primaryPhoto = nextPhotos[0] || nextPhotos.find((p) => Boolean(p) && p.trim() !== '') || '';
    onUpdateUser({
      photos: nextPhotos.filter((p) => Boolean(p) && p.trim() !== ''),
      photoUrl: primaryPhoto
    });
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (index === 0 || !photos[index]) return;
    const nextPhotos = [...photos];
    const selected = nextPhotos[index];
    nextPhotos.splice(index, 1);
    nextPhotos.unshift(selected);
    while (nextPhotos.length < 3) {
      nextPhotos.push('');
    }
    setPhotos(nextPhotos);
    onUpdateUser({
      photos: nextPhotos.filter((p) => Boolean(p) && p.trim() !== ''),
      photoUrl: selected
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryPhoto = photos[0] || photos.find((p) => Boolean(p) && p.trim() !== '') || '';
    onUpdateUser({
      name,
      email,
      phone,
      photoUrl: primaryPhoto,
      photos: photos.filter((p) => Boolean(p) && p.trim() !== '')
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const validPhotosCount = photos.filter((p) => Boolean(p) && p.trim() !== '').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-[#151c27]">
          Paramètres du Compte &amp; Photos
        </h2>
        <p className="font-body text-xs sm:text-sm text-[#575147] mt-1">
          Gérez vos photos de profil, vos informations personnelles, votre sécurité et la visibilité de votre compte.
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 border border-[#E8E3D7]">
        {/* Profile Avatar Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#E8E3D7]">
          {user.photoUrl || photos[0] ? (
            <img
              src={user.photoUrl || photos[0]}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#0F5C4D]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] border-2 border-[#8BAE9F]/40 flex items-center justify-center font-display font-bold text-xl shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h3 className="font-display text-lg font-bold text-[#211E1A]">{user.name}</h3>
            <p className="font-body text-xs text-[#575147]">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.isVerifiedNNI ? (
                <span className="bg-[#8BAE9F]/20 text-[#0F5C4D] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#8BAE9F]/30">
                  <span className="material-symbols-outlined text-xs">verified</span> Vérifié NNI
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateTab('verification')}
                  className="bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 hover:bg-[#C9A45C]/25 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">pending</span> NNI Non Vérifié
                </button>
              )}
              <span className="bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Accès Total Gratuit
              </span>
            </div>
          </div>
        </div>

        {/* SECTION: Gestion des Photos de Profil */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="font-display text-base font-bold text-[#211E1A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F5C4D] text-xl">photo_library</span>
                Photos de votre profil ({validPhotosCount}/3)
              </h3>
              <p className="font-body text-xs text-[#575147] mt-0.5">
                Vous pouvez ajouter jusqu'à 3 photos. La première photo sert de photo principale.
              </p>
            </div>
            {validPhotosCount === 0 && (
              <span className="text-xs bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 font-bold px-2.5 py-1 rounded-full self-start">
                Profil masqué sans photo
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => {
              const photo = photos[idx];
              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <div className="w-full h-48 rounded-2xl border-2 border-dashed border-[#E8E3D7] bg-[#FAF8F2] overflow-hidden flex flex-col items-center justify-center relative hover:border-[#0F5C4D]/50 transition-colors">
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#211E1A]/80 text-white flex items-center justify-center shadow-md hover:bg-[#211E1A] cursor-pointer transition-colors"
                          title="Supprimer la photo"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        {/* Primary Badge or Set Primary Action */}
                        {idx === 0 ? (
                          <span className="absolute bottom-2 left-2 bg-[#0F5C4D] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            Principale
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryPhoto(idx)}
                            className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs text-[#0F5C4D] hover:bg-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs cursor-pointer border border-[#0F5C4D]/20"
                            title="Définir comme photo principale"
                          >
                            Mettre en principale
                          </button>
                        )}
                      </>
                    ) : (
                      <label
                        htmlFor={`settings-photo-${idx}`}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center hover:bg-[#8BAE9F]/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center mb-1.5">
                          <span className="material-symbols-outlined text-xl">
                            add_a_photo
                          </span>
                        </div>
                        <span className="font-display text-xs font-bold text-[#0F5C4D]">
                          {idx === 0 ? 'Photo 1 (Principale)' : `Photo ${idx + 1}`}
                        </span>
                        <span className="font-body text-[10px] text-[#7D766C] mt-0.5">
                          Cliquez pour téléverser
                        </span>
                        <input
                          id={`settings-photo-${idx}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoFileChange(idx, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="font-body text-[11px] text-[#7D766C]">
            Format acceptés : JPG, PNG, WEBP. Les photos restent sous votre contrôle et peuvent être masquées avec le Mode Floutage.
          </p>
        </div>

        {/* Form: Account Info */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t border-[#E8E3D7]">
          <h3 className="font-display text-base font-bold text-[#211E1A]">
            Informations Personnelles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-body text-xs font-semibold text-[#575147]">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-body text-xs font-semibold text-[#575147]">Adresse E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-body text-xs font-semibold text-[#575147]">Téléphone (+227)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
            />
          </div>

          {savedNotice && (
            <div className="p-3 bg-[#8BAE9F]/20 text-[#0F5C4D] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#8BAE9F]/30">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Vos modifications et photos ont été enregistrées avec succès.
            </div>
          )}

          <button
            type="submit"
            className="bg-[#0F5C4D] text-white font-display text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#0c4a3e] transition-colors cursor-pointer"
          >
            Enregistrer les modifications
          </button>
        </form>

        {/* Privacy & Photo Blurring Controls */}
        <div className="pt-6 border-t border-[#E8E3D7] space-y-4">
          <h3 className="font-display text-base font-bold text-[#211E1A]">
            Sécurité &amp; Visibilité des Photos
          </h3>

          <div className="flex items-center justify-between p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7]">
            <div>
              <p className="font-display text-sm font-bold text-[#211E1A]">Mode Floutage de Photo</p>
              <p className="font-body text-xs text-[#575147]">
                Masque automatiquement votre photo de profil auprès des utilisateurs non vérifiés.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onUpdateUser({ photoBlurringActive: !user.photoBlurringActive })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                user.photoBlurringActive ? 'bg-[#0F5C4D]' : 'bg-[#E8E3D7]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  user.photoBlurringActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Wali Info Summary */}
        <div className="pt-6 border-t border-[#E8E3D7] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-base font-bold text-[#211E1A]">Tuteur Légal (Wali)</h3>
            <button
              onClick={() => onNavigateTab('verification')}
              className="text-[#0F5C4D] font-display text-xs font-bold hover:underline cursor-pointer"
            >
              {user.isWaliApproved ? 'Modifier les coordonnées Wali' : 'Ajouter / Valider un Wali'}
            </button>
          </div>

          <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#E8E3D7] flex justify-between items-center text-xs">
            {user.isWaliApproved && user.waliInfo?.name ? (
              <>
                <div>
                  <p className="font-bold text-[#211E1A]">{user.waliInfo.name}</p>
                  <p className="text-[#575147]">{user.waliInfo.relation} • {user.waliInfo.phone}</p>
                </div>
                <span className="bg-[#8BAE9F]/20 text-[#0F5C4D] font-bold px-2.5 py-1 rounded-full border border-[#8BAE9F]/30">
                  Wali Confirmé
                </span>
              </>
            ) : (
              <>
                <div>
                  <p className="font-bold text-[#211E1A]">Aucun tuteur validé</p>
                  <p className="text-[#575147]">Ajoutez un Wali pour renforcer la confiance et la sécurité de votre profil.</p>
                </div>
                <button
                  onClick={() => onNavigateTab('verification')}
                  className="bg-[#C9A45C]/15 text-[#735619] border border-[#C9A45C]/30 font-bold px-3 py-1 rounded-full shrink-0 hover:bg-[#C9A45C]/25 cursor-pointer"
                >
                  Ajouter
                </button>
              </>
            )}
          </div>
        </div>

        {/* Déconnexion */}
        {onLogout && (
          <div className="pt-6 border-t border-[#E8E3D7] flex justify-between items-center">
            <div>
              <p className="font-display text-sm font-bold text-[#211E1A]">Déconnexion du compte</p>
              <p className="font-body text-xs text-[#7D766C]">
                Se déconnecter de cette session sécurisée sur cet appareil.
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 bg-[#FAF8F2] hover:bg-[#E8E3D7] text-[#211E1A] border border-[#E8E3D7] font-display text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

