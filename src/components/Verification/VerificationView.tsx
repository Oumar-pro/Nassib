import React, { useState } from 'react';
import { User, UserWaliInfo } from '../../types';

interface VerificationViewProps {
  user: User;
  onUpdateWaliInfo: (waliInfo: UserWaliInfo) => void;
  onUploadNNI: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  user,
  onUpdateWaliInfo,
  onUploadNNI
}) => {
  const [waliName, setWaliName] = useState<string>(user.waliInfo.name || '');
  const [waliRelation, setWaliRelation] = useState<string>(user.waliInfo.relation || 'Père');
  const [waliPhone, setWaliPhone] = useState<string>(user.waliInfo.phone || '');
  const [uploadedDocument, setUploadedDocument] = useState<boolean>(user.isVerifiedNNI);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleDocumentSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedDocument(true);
      onUploadNNI();
    }
  };

  const handleSaveWali = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWaliInfo({
      name: waliName,
      relation: waliRelation,
      phone: waliPhone
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Banner / Progress Header */}
      <div className="flex justify-between items-center bg-white/70 glass-card px-6 py-4 rounded-2xl border border-[#bec9c2]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#065f46]/10 flex items-center justify-center text-[#004532]">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#151c27]">
              Vérification &amp; Validation du Wali
            </h2>
            <p className="font-body text-xs text-[#3f4944]">
              Renforcez la confiance de votre profil conformément aux valeurs islamiques
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <span className="font-body text-xs font-semibold text-[#3f4944]">Étape 2 sur 3</span>
          <div className="w-32 h-2 bg-[#dce2f3] rounded-full overflow-hidden">
            <div className="h-full bg-[#fed65b] w-2/3 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Trust Context */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-extrabold text-[#004532]">
              Confiance &amp;<br />Vérification d'Identité
            </h1>
            <p className="font-body text-sm text-[#3f4944] leading-relaxed">
              Pour garantir un environnement serein, respectueux et authentique, nous demandons à chaque membre de vérifier son identité NNI et les coordonnées du Wali.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#065f46]/10 flex items-center justify-center shrink-0 text-[#004532]">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#151c27]">Sécurité Maximale Garantis</h3>
                <p className="font-body text-xs text-[#3f4944] leading-relaxed mt-0.5">
                  Vos documents d'identité sont strictement confidentiels et cryptés. Ils ne seront jamais affichés publiquement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#fed65b]/20 flex items-center justify-center shrink-0 text-[#745c00]">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  handshake
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#151c27]">Démarche Éthique &amp; Claire</h3>
                <p className="font-body text-xs text-[#3f4944] leading-relaxed mt-0.5">
                  L'implication du Wali (Tuteur) témoigne de votre sérieux et instaure une atmosphère de respect mutuel dès les premiers échanges.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#065f46]/10 flex items-center justify-center shrink-0 text-[#004532]">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#151c27]">Badge de Visibilité Rehaussée</h3>
                <p className="font-body text-xs text-[#3f4944] leading-relaxed mt-0.5">
                  Les profils vérifiés NNI reçoivent le badge officiel et enregistrent 3 fois plus de contacts qualifiés.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Upload & Wali Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* NNI Document Card */}
          <section className="glass-panel rounded-3xl p-6 sm:p-8 ambient-shadow relative overflow-hidden border border-[#bec9c2]/40">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#004532] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                badge
              </span>
              <h2 className="font-display text-xl font-bold text-[#151c27]">
                Pièce d'Identité (NNI / Passeport)
              </h2>
            </div>
            <p className="font-body text-xs text-[#3f4944] mb-6 leading-relaxed">
              Veuillez télécharger une photo lisible de votre Carte d'Identité Nationale Nigérienne (NNI) ou de votre Passeport.
            </p>

            <label className="border-2 border-dashed border-[#bec9c2] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#004532] transition-colors cursor-pointer group bg-white/50">
              <div className="w-14 h-14 rounded-full bg-[#dce2f3] flex items-center justify-center mb-3 group-hover:bg-[#065f46]/20 transition-colors text-[#004532]">
                <span className="material-symbols-outlined text-2xl">
                  {uploadedDocument ? 'task_alt' : 'upload_file'}
                </span>
              </div>
              
              {uploadedDocument ? (
                <div className="text-center">
                  <span className="font-display text-sm font-bold text-[#004532] block">
                    Document NNI Transmis avec Succès !
                  </span>
                  <span className="font-body text-xs text-[#3f4944] mt-1 block">
                    Statut : En cours de validation rapide par l'équipe
                  </span>
                </div>
              ) : (
                <>
                  <span className="font-display text-sm font-bold text-[#151c27] mb-1">
                    Cliquez ici pour téléverser votre NNI
                  </span>
                  <span className="font-body text-xs text-[#6f7973]">
                    Formats acceptés : JPG, PNG, PDF (Max. 5 Mo)
                  </span>
                </>
              )}
              
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleDocumentSimulatedUpload}
                className="hidden"
              />
            </label>

            <div className="mt-4 flex items-center gap-2 text-[#004532] bg-[#065f46]/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              <span className="font-body text-xs font-semibold">
                Transmission sécurisée de bout en bout
              </span>
            </div>
          </section>

          {/* Wali / Mahram Details Card */}
          <section className="glass-panel rounded-3xl p-6 sm:p-8 ambient-shadow relative overflow-hidden border border-[#bec9c2]/40">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#745c00] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                family_restroom
              </span>
              <h2 className="font-display text-xl font-bold text-[#151c27]">
                Coordonnées du Wali (Tuteur)
              </h2>
            </div>

            <p className="font-body text-xs text-[#3f4944] mb-6 leading-relaxed">
              Renseignez les coordonnées de votre tuteur légal. Il recevra une notification lorsque les discussions arriveront à une étape sérieuse.
            </p>

            <form onSubmit={handleSaveWali} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-semibold text-[#3f4944]">
                    Nom complet du Wali
                  </label>
                  <input
                    type="text"
                    required
                    value={waliName}
                    onChange={(e) => setWaliName(e.target.value)}
                    placeholder="Ex: Elhadj Souley S."
                    className="w-full h-11 bg-white border border-[#bec9c2]/50 rounded-xl px-3.5 text-sm font-body text-[#151c27] focus:outline-none focus:border-[#004532] focus:ring-1 focus:ring-[#004532]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-body text-xs font-semibold text-[#3f4944]">
                    Lien de parenté
                  </label>
                  <select
                    value={waliRelation}
                    onChange={(e) => setWaliRelation(e.target.value)}
                    className="w-full h-11 bg-white border border-[#bec9c2]/50 rounded-xl px-3.5 text-sm font-body text-[#151c27] focus:outline-none focus:border-[#004532]"
                  >
                    <option value="Père">Père</option>
                    <option value="Frère">Frère Aîné</option>
                    <option value="Oncle">Oncle Paternel / Maternel</option>
                    <option value="Grand-père">Grand-père</option>
                    <option value="Autre tuteur">Autre tuteur légal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-xs font-semibold text-[#3f4944]">
                  Numéro de téléphone du Wali (Niger +227)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-body text-sm font-bold text-[#3f4944]">
                    +227
                  </span>
                  <input
                    type="tel"
                    required
                    value={waliPhone}
                    onChange={(e) => setWaliPhone(e.target.value)}
                    placeholder="90 12 34 56"
                    className="w-full h-11 bg-white border border-[#bec9c2]/50 rounded-xl pl-16 pr-3.5 text-sm font-body text-[#151c27] focus:outline-none focus:border-[#004532] focus:ring-1 focus:ring-[#004532]"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-[#065f46]/10 border border-[#004532] rounded-xl text-xs font-semibold text-[#004532] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Informations du Wali enregistrées avec succès !
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#004532] text-white font-display text-sm font-bold rounded-xl hover:bg-[#065f46] transition-colors shadow-sm active:scale-95"
              >
                Enregistrer &amp; Valider le Profil Wali
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
