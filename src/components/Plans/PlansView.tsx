import React from 'react';
import { PricingPlan, User } from '../../types';
import { PRICING_PLANS, PAYMENT_METHODS } from '../../data/mockData';

interface PlansViewProps {
  user: User;
  onSelectPlanForPayment: (plan: PricingPlan) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ user, onSelectPlanForPayment }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn pb-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-3.5 py-1 bg-[#fed65b]/30 text-[#745c00] text-xs font-bold rounded-full uppercase tracking-wider">
          Transparence &amp; Éthique
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#004532]">
          Investissez dans votre Avenir
        </h2>
        <p className="font-body text-sm sm:text-base text-[#3f4944] leading-relaxed">
          Choisissez la formule qui correspond à votre démarche. Notre plateforme garantit des profils authentifiés et un cadre sécurisé pour votre recherche matrimoniale.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const isCurrent =
            (user.isPremium && plan.id === 'plan_baraka') ||
            (!user.isPremium && plan.id === 'plan_sadaq') ||
            (user.planName && user.planName.toLowerCase().includes(plan.name.toLowerCase()));

          return (
            <div
              key={plan.id}
              className={`glass-panel rounded-3xl p-8 flex flex-col ambient-shadow relative overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-[#fed65b] md:-translate-y-2 shadow-lg'
                  : 'border border-[#bec9c2]/40 hover:border-[#004532]/40'
              }`}
            >
              {/* Most Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 gold-gradient text-[#574500] px-4 py-1.5 rounded-bl-2xl font-body text-[10px] font-bold tracking-wider uppercase shadow-xs">
                  PLUS POPULAIRE
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-[#151c27] flex items-center gap-2">
                  {plan.name}
                  {plan.popular && (
                    <span className="material-symbols-outlined text-[#745c00] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                  )}
                </h3>
                <p className="font-body text-xs text-[#3f4944] mt-1">{plan.description}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-[#004532]">
                    {plan.price}
                  </span>
                  <span className="font-body text-xs text-[#3f4944] font-medium">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3.5 mb-8 flex-1">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#151c27] font-body">
                    <span className="material-symbols-outlined text-[#004532] text-lg shrink-0">
                      check_circle
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-[#dce2f3] text-[#3f4944] rounded-2xl font-display text-sm font-semibold cursor-default mt-auto"
                >
                  Formule Actuelle
                </button>
              ) : (
                <button
                  onClick={() => onSelectPlanForPayment(plan)}
                  className={`w-full py-3 px-4 rounded-2xl font-display text-sm font-semibold transition-all mt-auto shadow-sm active:scale-95 ${
                    plan.popular
                      ? 'gold-gradient text-[#574500] hover:opacity-90 shadow-md shadow-[#fed65b]/20'
                      : 'bg-[#004532] text-white hover:bg-[#065f46]'
                  }`}
                >
                  {plan.ctaText}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Local Payment Methods Info Panel */}
      <div className="glass-panel rounded-3xl p-8 ambient-shadow max-w-4xl mx-auto w-full border border-[#bec9c2]/30">
        <div className="text-center mb-6">
          <h4 className="font-display text-lg font-bold text-[#151c27]">
            Paiements Locaux Sécurisés
          </h4>
          <p className="font-body text-xs text-[#3f4944] mt-1">
            Soutenez le développement local et payez facilement par Mobile Money au Niger.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          {PAYMENT_METHODS.map((pm) => (
            <div
              key={pm.id}
              className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-[#bec9c2]/20 shadow-xs hover:border-[#004532]/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[#004532] text-2xl mb-1">
                {pm.icon}
              </span>
              <span className="font-display text-xs font-bold text-[#151c27] text-center">
                {pm.name}
              </span>
              <span className="font-body text-[10px] text-[#6f7973] text-center mt-0.5">
                Valide au Niger
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
