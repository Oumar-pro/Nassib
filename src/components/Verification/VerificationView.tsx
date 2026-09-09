import React, { useState, useEffect, useRef } from 'react';
import { User, UserWaliInfo } from '../../types';
import {
  submitVerificationRequestInSupabase,
  fetchMyVerificationRequestInSupabase,
  VerificationRequestInfo,
  isSupabaseConfigured,
} from '../../lib/supabase';

interface VerificationViewProps {
  user: User;
  onUpdateWaliInfo: (waliInfo: UserWaliInfo) => void;
  onUploadNNI: () => void;
  onSubmitVerification?: (params: {
    documentType: string;
    documentNumber: string;
    fullName: string;
    expiryDate?: string;
    frontDocumentUrl?: string;
    backDocumentUrl?: string;
    autoVerify?: boolean;
  }) => Promise<boolean>;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  user,
  onUpdateWaliInfo,
  onUploadNNI,
  onSubmitVerification,
}) => {
  // Wali form state
  const [waliName, setWaliName] = useState<string>(user.waliInfo?.name || '');
  const [waliRelation, setWaliRelation] = useState<string>(user.waliInfo?.relation || 'Père');
  const [waliPhone, setWaliPhone] = useState<string>(user.waliInfo?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Identity verification state
  const [docType, setDocType] = useState<'nni' | 'passport' | 'residence'>('nni');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docFullName, setDocFullName] = useState<string>(user.name || '');
  const [docExpiry, setDocExpiry] = useState<string>('');
  const [honorPledge, setHonorPledge] = useState<boolean>(true);

  // Uploaded files & previews
  const [frontFileName, setFrontFileName] = useState<string | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFileName, setBackFileName] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  // Submission statuses
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<VerificationRequestInfo | null>(null);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing verification request from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    if (user.id) {
      fetchMyVerificationRequestInSupabase(user.id).then((req) => {
        if (isMounted && req) {
          setExistingRequest(req);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  // Handle file selection and preview conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Le fichier sélectionné dépasse la limite autorisée de 10 Mo.');
        return;
      }
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (side === 'front') {
          setFrontFileName(file.name);
          setFrontPreview(dataUrl);
        } else {
          setBackFileName(file.name);
          setBackPreview(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontFileName(null);
      setFrontPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else {
      setBackFileName(null);
      setBackPreview(null);
      if (backInputRef.current) backInputRef.current.value = '';
    }
  };

  // Complete identity verification submission logic for admin review
  const handleProcessSubmit = async () => {
    if (!docNumber.trim()) {
      setErrorMessage('Veuillez renseigner le numéro officiel de votre pièce.');
      return;
    }
    if (!docFullName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet tel qu’inscrit sur la pièce.');
      return;
    }
    if (!frontPreview && !frontFileName) {
      setErrorMessage('Veuillez téléverser la face avant (recto) de votre pièce d’identité.');
      return;
    }
    if (docType === 'nni' && !backPreview && !backFileName) {
      setErrorMessage('Pour la Carte Nationale d’Identité (NNI), veuillez joindre le verso (face arrière).');
      return;
    }
    if (!honorPledge) {
      setErrorMessage('Veuillez cocher la déclaration sur l’honneur.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (onSubmitVerification) {
        await onSubmitVerification({
          documentType: docType,
          documentNumber: docNumber.trim(),
          fullName: docFullName.trim(),
          expiryDate: docExpiry.trim() || undefined,
          frontDocumentUrl: frontPreview || frontFileName || undefined,
          backDocumentUrl: backPreview || backFileName || undefined,
          autoVerify: false,
        });
      } else {
        const docSummary = `${docType.toUpperCase()}: ${docNumber.trim()} (${docFullName.trim()})`;
        if (isSupabaseConfigured && user.id) {
          await submitVerificationRequestInSupabase({
            profileId: user.id,
            userId: user.id,
            verificationType: 'nni',
            documentPath: docSummary,
            adminNote: `Type: ${docType}, N°: ${docNumber.trim()}, Nom: ${docFullName.trim()}`,
            status: 'pending',
          });
        }
      }

      setSubmitSuccess(true);
      setExistingRequest({
        id: 'req-' + Date.now(),
        verificationType: 'nni',
        status: 'pending',
        documentPath: `${docType.toUpperCase()}: ${docNumber.trim()}`,
        submittedAt: new Date().toISOString(),
        adminNote: null,
      });
      setShowEditForm(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Une erreur est survenue lors de la transmission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWali = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWaliInfo({
      name: waliName,
      relation: waliRelation,
      phone: waliPhone,
    });
    setSaveSuccess(true);
    if (isSupabaseConfigured && user.id) {
      await submitVerificationRequestInSupabase({
        profileId: user.id,
        userId: user.id,
        verificationType: 'wali',
        adminNote: `${waliRelation} (${waliName}, +227 ${waliPhone})`,
      });
    }
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const isOfficiallyVerified = user.isVerifiedNNI || existingRequest?.status === 'approved';
  const isRequestPending = !isOfficiallyVerified && (submitSuccess || existingRequest?.status === 'pending' || existingRequest?.status === 'under_review');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Banner / Progress Header */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-[#E8E3D7] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#8BAE9F]/20 flex items-center justify-center text-[#0F5C4D]">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
          </div>
          <div>
            <h2 className="font-serif-display text-lg font-bold text-[#211E1A]">
              Vérification &amp; Validation du Wali
            </h2>
            <p className="font-body text-xs text-[#575147]">
              Renforcez la confiance de votre profil conformément aux valeurs islamiques
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <span className="font-body text-xs font-semibold text-[#575147]">
            {isOfficiallyVerified ? 'Étape 3 sur 3 (Complète)' : 'Étape 2 sur 3'}
          </span>
          <div className="w-32 h-2 bg-[#FAF8F2] border border-[#E8E3D7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A45C] rounded-full transition-all duration-500"
              style={{ width: isOfficiallyVerified ? '100%' : '66%' }}
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Trust Context */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h1 className="font-serif-display text-3xl font-bold text-[#0F5C4D]">
              Confiance &amp;<br />Vérification d'Identité
            </h1>
            <p className="font-body text-sm text-[#575147] leading-relaxed">
              Pour garantir un environnement serein, respectueux et authentique, nous demandons à chaque membre de vérifier son identité NNI et les coordonnées du Wali.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#8BAE9F]/20 flex items-center justify-center shrink-0 text-[#0F5C4D]">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#211E1A]">Sécurité Maximale Garantie</h3>
                <p className="font-body text-xs text-[#575147] leading-relaxed mt-0.5">
                  Vos documents d'identité sont strictement confidentiels et cryptés. Ils ne seront jamais affichés publiquement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#C9A45C]/15 flex items-center justify-center shrink-0 text-[#735619]">
                <span className="material-symbols-outlined text-xl text-[#C9A45C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  handshake
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#211E1A]">Démarche Éthique &amp; Claire</h3>
                <p className="font-body text-xs text-[#575147] leading-relaxed mt-0.5">
                  L'implication du Wali (Tuteur) témoigne de votre sérieux et instaure une atmosphère de respect mutuel dès les premiers échanges.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#8BAE9F]/20 flex items-center justify-center shrink-0 text-[#0F5C4D]">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#211E1A]">Badge de Visibilité Rehaussée</h3>
                <p className="font-body text-xs text-[#575147] leading-relaxed mt-0.5">
                  Les profils vérifiés par carte d'identité reçoivent le badge officiel sur l'en-tête et enregistrent 3 fois plus de contacts qualifiés.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Upload & Wali Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Pièce d'Identité (NNI / Passeport) */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-[#E8E3D7]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0F5C4D] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  badge
                </span>
                <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">
                  Pièce d'Identité (NNI / Passeport)
                </h2>
              </div>

              {isOfficiallyVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-display text-xs font-bold border border-[#0F5C4D]/20">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  Identité Certifiée
                </span>
              )}
            </div>

            <p className="font-body text-xs text-[#575147] mb-6 leading-relaxed">
              Vérifiez votre identité officielle pour obtenir le badge certifié et rassurer vos prétendant(e)s sur l'authenticité de votre démarche.
            </p>

            {/* Case A: Already Officially Verified */}
            {isOfficiallyVerified && !showEditForm ? (
              <div className="space-y-4">
                <div className="p-5 bg-[#8BAE9F]/15 border border-[#0F5C4D]/30 rounded-2xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-bold text-[#0F5C4D]">
                        Identité vérifiée avec succès par carte officielle
                      </h4>
                      <p className="font-body text-xs text-[#575147] mt-1 leading-relaxed">
                        Votre compte est authentifié. Le badge officiel <strong className="text-[#0F5C4D]">Vérifié</strong> est désormais affiché sur l'en-tête de l'application et sur votre profil public.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#575147] font-body">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#0F5C4D]">lock</span>
                          Cryptage sécurisé
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#0F5C4D]">check_circle</span>
                          Conformité NNI / CNI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(true)}
                    className="text-xs font-display font-semibold text-[#575147] hover:text-[#0F5C4D] underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit_document</span>
                    Mettre à jour ma pièce d'identité
                  </button>
                </div>
              </div>
            ) : isRequestPending && !showEditForm ? (
              /* Case B: Request Submitted / Under Review */
              <div className="space-y-4">
                <div className="p-5 bg-[#C9A45C]/15 border border-[#C9A45C]/40 rounded-2xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#C9A45C] text-[#211E1A] flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-xl">
                        hourglass_top
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-bold text-[#735619]">
                        Dossier de vérification d'identité en cours d'examen
                      </h4>
                      <p className="font-body text-xs text-[#575147] mt-1 leading-relaxed">
                        Votre pièce d'identité a été transmise de manière sécurisée. Notre équipe procède à la vérification d'authenticité (délai moyen constaté : 24h).
                      </p>
                      {existingRequest?.documentPath && (
                        <div className="mt-2.5 p-2 bg-white/70 rounded-lg text-xs font-mono text-[#575147]">
                          Référence : {existingRequest.documentPath}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(true)}
                    className="text-xs font-display font-semibold text-[#575147] hover:text-[#0F5C4D] underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Remplacer ou modifier le document
                  </button>
                </div>
              </div>
            ) : (
              /* Case C: Identity Verification Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessSubmit();
                }}
                className="space-y-5"
              >
                {/* 1. Document Type Selector */}
                <div className="space-y-2">
                  <label className="font-body text-xs font-semibold text-[#575147] block">
                    Type de document d'identité officiel
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'nni', label: 'Carte NNI (Niger)', icon: 'badge' },
                      { id: 'passport', label: 'Passeport', icon: 'menu_book' },
                      { id: 'residence', label: 'Titre de Séjour', icon: 'assignment_ind' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDocType(item.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-display font-semibold transition-all cursor-pointer ${
                          docType === item.id
                            ? 'bg-[#8BAE9F]/20 border-[#0F5C4D] text-[#0F5C4D] shadow-2xs'
                            : 'bg-[#FAF8F2] border-[#E8E3D7] text-[#575147] hover:border-[#8BAE9F]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Official Document Info Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-[#575147]">
                      Numéro du document (NNI / Passeport) <span className="text-[#964239]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder={docType === 'nni' ? 'Ex: 1234567890' : 'Ex: NE1234567'}
                      className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-[#575147]">
                      Nom et prénom sur la pièce <span className="text-[#964239]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={docFullName}
                      onChange={(e) => setDocFullName(e.target.value)}
                      placeholder="Identique à la pièce d'identité"
                      className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-body text-xs font-semibold text-[#575147]">
                    Date d'expiration de la pièce (Optionnel)
                  </label>
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
                  />
                </div>

                {/* 3. Document Photos Upload Areas */}
                <div className="space-y-3 pt-1">
                  <label className="font-body text-xs font-semibold text-[#575147] block">
                    Photos des documents originaux <span className="text-[#964239]">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Front Side (Recto) */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-display font-semibold text-[#575147] block">
                        Face avant (Recto) <span className="text-[#964239]">*</span>
                      </span>
                      {frontPreview ? (
                        <div className="relative rounded-2xl border border-[#0F5C4D]/30 p-2.5 bg-[#FAF8F2] flex items-center gap-3">
                          <img
                            src={frontPreview}
                            alt="Recto document"
                            className="w-16 h-12 object-cover rounded-lg border border-[#E8E3D7]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-display text-xs font-semibold text-[#211E1A] truncate block">
                              {frontFileName || 'Recto chargé'}
                            </span>
                            <span className="text-[10px] text-[#0F5C4D] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Prêt pour envoi
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('front')}
                            className="p-1 text-[#7D766C] hover:text-[#964239] cursor-pointer"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-[#E8E3D7] rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-[#0F5C4D] transition-colors cursor-pointer bg-[#FAF8F2] min-h-[110px]">
                          <span className="material-symbols-outlined text-2xl text-[#0F5C4D] mb-1">
                            add_photo_alternate
                          </span>
                          <span className="font-display text-xs font-bold text-[#211E1A]">
                            Téléverser le Recto
                          </span>
                          <span className="font-body text-[10px] text-[#7D766C] mt-0.5">
                            JPG, PNG ou PDF
                          </span>
                          <input
                            ref={frontInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, 'front')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Back Side (Verso) */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-display font-semibold text-[#575147] block">
                        Face arrière (Verso) {docType === 'nni' && <span className="text-[#964239]">*</span>}
                      </span>
                      {backPreview ? (
                        <div className="relative rounded-2xl border border-[#0F5C4D]/30 p-2.5 bg-[#FAF8F2] flex items-center gap-3">
                          <img
                            src={backPreview}
                            alt="Verso document"
                            className="w-16 h-12 object-cover rounded-lg border border-[#E8E3D7]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-display text-xs font-semibold text-[#211E1A] truncate block">
                              {backFileName || 'Verso chargé'}
                            </span>
                            <span className="text-[10px] text-[#0F5C4D] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Prêt pour envoi
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('back')}
                            className="p-1 text-[#7D766C] hover:text-[#964239] cursor-pointer"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-[#E8E3D7] rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-[#0F5C4D] transition-colors cursor-pointer bg-[#FAF8F2] min-h-[110px]">
                          <span className="material-symbols-outlined text-2xl text-[#575147] mb-1">
                            upload_file
                          </span>
                          <span className="font-display text-xs font-bold text-[#211E1A]">
                            Téléverser le Verso
                          </span>
                          <span className="font-body text-[10px] text-[#7D766C] mt-0.5">
                            {docType === 'nni' ? 'Requis pour CNI' : 'Optionnel'}
                          </span>
                          <input
                            ref={backInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, 'back')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Honor Pledge Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={honorPledge}
                    onChange={(e) => setHonorPledge(e.target.checked)}
                    className="mt-0.5 rounded border-[#E8E3D7] text-[#0F5C4D] focus:ring-[#0F5C4D] cursor-pointer"
                  />
                  <span className="font-body text-xs text-[#575147] leading-relaxed">
                    Je certifie sur l'honneur que ces pièces sont authentiques, lisibles et conformes aux valeurs islamiques de sincérité et d'honnêteté.
                  </span>
                </label>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 bg-[#964239]/10 border border-[#964239]/30 rounded-xl text-xs font-medium text-[#964239] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errorMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#0F5C4D] text-white font-display text-sm font-bold rounded-xl hover:bg-[#0c4a3e] transition-colors shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        <span>Transmission sécurisée en cours...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">send</span>
                        <span>Soumettre ma pièce d'identité pour vérification</span>
                      </>
                    )}
                  </button>
                </div>

                {isOfficiallyVerified && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="text-xs text-[#7D766C] hover:text-[#211E1A] underline cursor-pointer"
                    >
                      Annuler la modification
                    </button>
                  </div>
                )}
              </form>
            )}

            <div className="mt-4 flex items-center gap-2 text-[#0F5C4D] bg-[#8BAE9F]/20 p-3 rounded-xl border border-[#8BAE9F]/30">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              <span className="font-body text-xs font-semibold">
                Transmission sécurisée de bout en bout et cryptage des pièces
              </span>
            </div>
          </section>

          {/* Section 2: Wali / Mahram Details Card */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-[#E8E3D7]">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#C9A45C] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                family_restroom
              </span>
              <h2 className="font-serif-display text-xl font-bold text-[#211E1A]">
                Coordonnées du Wali (Tuteur)
              </h2>
            </div>

            <p className="font-body text-xs text-[#575147] mb-6 leading-relaxed">
              Renseignez les coordonnées de votre tuteur légal. Il recevra une notification lorsque les discussions arriveront à une étape sérieuse.
            </p>

            <form onSubmit={handleSaveWali} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-semibold text-[#575147]">
                    Nom complet du Wali
                  </label>
                  <input
                    type="text"
                    required
                    value={waliName}
                    onChange={(e) => setWaliName(e.target.value)}
                    placeholder="Ex: Elhadj Souley S."
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-body text-xs font-semibold text-[#575147]">
                    Lien de parenté
                  </label>
                  <select
                    value={waliRelation}
                    onChange={(e) => setWaliRelation(e.target.value)}
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl px-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D]"
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
                <label className="font-body text-xs font-semibold text-[#575147]">
                  Numéro de téléphone du Wali (Niger +227)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-body text-sm font-bold text-[#575147]">
                    +227
                  </span>
                  <input
                    type="tel"
                    required
                    value={waliPhone}
                    onChange={(e) => setWaliPhone(e.target.value)}
                    placeholder="90 12 34 56"
                    className="w-full h-11 bg-[#FAF8F2] border border-[#E8E3D7] rounded-xl pl-16 pr-3.5 text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D]"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-[#8BAE9F]/20 border border-[#0F5C4D] rounded-xl text-xs font-semibold text-[#0F5C4D] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Informations du Wali enregistrées avec succès !
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#0F5C4D] text-white font-display text-sm font-bold rounded-xl hover:bg-[#0c4a3e] transition-colors shadow-sm active:scale-95 cursor-pointer"
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
