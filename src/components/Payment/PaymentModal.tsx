import React, { useState } from 'react';
import { PricingPlan } from '../../types';
import { PAYMENT_METHODS } from '../../data/mockData';
import { getCurrentUserSession } from '../../lib/auth';

interface PaymentModalProps {
  plan: PricingPlan | null;
  onClose: () => void;
  onConfirmSuccess: (planName: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  onClose,
  onConfirmSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('nita');
  const [phoneNumber, setPhoneNumber] = useState<string>('90123456');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Confirmation / Verification Code
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [ussdInstruction, setUssdInstruction] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [providerName, setProviderName] = useState<string>('');

  if (!plan) return null;

  const currentSession = getCurrentUserSession();

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 8) {
      setErrorMessage('Veuillez renseigner un numéro de téléphone valide au Niger (ex: 90 12 34 56).');
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: selectedMethod,
          phoneNumber: cleanPhone,
          userId: currentSession?.id || 'usr_anonymous',
          userEmail: currentSession?.email || 'client@zawaj.ne',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’initialisation de la transaction Mobile Money.');
      }

      setTransactionRef(data.transactionReference);
      setUssdInstruction(data.ussdInstruction || 'Veuillez valider la demande USSD sur votre téléphone.');
      setProviderName(data.paymentMethod || selectedMethod.toUpperCase());
      if (data.simulatedOtp) {
        setVerificationCode(data.simulatedOtp);
      }
      setStep('verify');
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setErrorMessage(err.message || 'Le service de paiement est temporairement indisponible.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionReference: transactionRef,
          userId: currentSession?.id || 'usr_anonymous',
          planId: plan.id,
          verificationCode: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Code de confirmation incorrect ou transaction expirée.');
      }

      setStep('success');
      setTimeout(() => {
        onConfirmSuccess(plan.name);
      }, 2000);
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setErrorMessage(err.message || 'La vérification du paiement a échoué.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151c27]/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#bec9c2]/50 bg-white">
        {/* Header */}
        <div className="p-5 border-b border-[#bec9c2]/30 flex justify-between items-center bg-[#f9f9ff]">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#745c00] tracking-wider block">
              Paiement Sécurisé Niger Mobile Money
            </span>
            <h3 className="font-display text-lg font-bold text-[#151c27]">
              Formule {plan.name} ({plan.price} {plan.period})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6f7973] hover:text-[#151c27] hover:bg-[#dce2f3]/50 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#065f46]/10 text-[#004532] rounded-full flex items-center justify-center mx-auto text-3xl">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
            </div>
            <h4 className="font-display text-xl font-bold text-[#004532]">
              Paiement Confirmé !
            </h4>
            <p className="font-body text-xs text-[#3f4944] leading-relaxed">
              Votre paiement a été validé et enregistré sous la référence{' '}
              <span className="font-mono font-bold text-[#151c27]">{transactionRef}</span>. Votre compte bénéficie désormais des fonctionnalités de la formule {plan.name}.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#065f46]/10 text-[#004532] text-xs font-bold">
                <span className="material-symbols-outlined text-sm">verified</span>
                Statut actif dans la base de données
              </span>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleConfirmPayment} className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-2">
              <div className="flex items-center gap-2 text-[#004532] font-display font-bold text-xs">
                <span className="material-symbols-outlined text-base">phonelink_ring</span>
                <span>Demande de paiement envoyée ({providerName})</span>
              </div>
              <p className="font-body text-xs text-[#166534]">
                {ussdInstruction}
              </p>
              <div className="pt-1 text-[11px] font-mono text-[#15803d]">
                Réf: {transactionRef}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-xs font-semibold text-[#3f4944] block">
                Code de validation SMS / PIN Mobile Money
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Ex: 849201"
                className="w-full h-12 bg-white border border-[#bec9c2]/60 rounded-xl px-4 text-center font-mono text-lg font-bold tracking-widest text-[#151c27] focus:outline-none focus:border-[#004532]"
              />
              <p className="text-[11px] text-[#6f7973] italic">
                Entrez le code SMS reçu ou le code de confirmation généré par votre opérateur.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-1/3 py-3 rounded-xl border border-[#bec9c2]/60 text-xs font-semibold text-[#3f4944] hover:bg-slate-50 transition-colors"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-3 bg-[#004532] text-white font-display text-xs font-bold rounded-xl hover:bg-[#065f46] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Vérification du code...
                  </>
                ) : (
                  'Confirmer le paiement'
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'form' && (
          <form onSubmit={handleInitiatePayment} className="p-6 space-y-6">
            {/* Method selection */}
            <div className="space-y-2">
              <label className="font-body text-xs font-semibold text-[#3f4944] block">
                Sélectionnez votre moyen de paiement au Niger
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PAYMENT_METHODS.map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                      selectedMethod === pm.id
                        ? 'border-[#004532] bg-[#065f46]/10 ring-1 ring-[#004532]'
                        : 'border-[#bec9c2]/40 bg-white hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[#004532] text-xl mb-1">
                      {pm.icon}
                    </span>
                    <span className="font-display text-xs font-bold text-[#151c27]">
                      {pm.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="font-body text-xs font-semibold text-[#3f4944]">
                Numéro de Téléphone associé (+227)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-body text-sm font-bold text-[#3f4944]">
                  +227
                </span>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="90 12 34 56"
                  className="w-full h-11 bg-white border border-[#bec9c2]/50 rounded-xl pl-16 pr-3.5 text-sm font-body text-[#151c27] focus:outline-none focus:border-[#004532]"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 bg-[#f0f3ff] rounded-2xl border border-[#bec9c2]/30 flex justify-between items-center text-xs">
              <span className="font-body font-medium text-[#3f4944]">Montant Total à débiter</span>
              <span className="font-display font-extrabold text-[#004532] text-sm">
                {plan.price} FCFA
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#004532] text-white font-display text-sm font-bold rounded-xl hover:bg-[#065f46] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion à la passerelle {selectedMethod.toUpperCase()}...
                </>
              ) : (
                `Initier le paiement (${plan.price} FCFA)`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
