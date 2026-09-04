import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from '../../types';
import { ZawajLogo } from '../ZawajLogo';

interface LandingViewProps {
  onEnterApp: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateTab: (tab: TabType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onEnterApp,
  onOpenAuth,
  onNavigateTab
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqList = [
    {
      q: "L'inscription est-elle gratuite ?",
      a: "Oui. Vous pouvez créer votre profil gratuitement et découvrir la plateforme."
    },
    {
      q: "Qui peut s'inscrire ?",
      a: "La plateforme s'adresse aux musulmans majeurs qui recherchent une relation sérieuse avec l'objectif de construire un mariage."
    },
    {
      q: "Mes informations sont-elles publiques ?",
      a: "Nous accordons une grande importance à la confidentialité. Vous gardez le contrôle sur les informations que vous partagez."
    },
    {
      q: "Puis-je rechercher quelqu'un dans ma ville ?",
      a: "Oui. Vous pourrez découvrir des profils selon différents critères, notamment la localisation."
    },
    {
      q: "Est-ce une application de rencontres classique ?",
      a: "Non. La plateforme est conçue autour d'une démarche sérieuse et respectueuse, avec le mariage comme finalité."
    }
  ];

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#151c27] font-body selection:bg-[#065f46]/20 selection:text-[#004532]">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f9f9ff]/90 backdrop-blur-xl border-b border-[#bec9c2]/30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex justify-between items-center">
          <div 
            onClick={() => onOpenAuth('register')}
            className="cursor-pointer"
          >
            <ZawajLogo size="lg" />
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-[#3f4944]">
            <button onClick={() => scrollToSection('accueil')} className="hover:text-[#004532] transition-colors cursor-pointer">Accueil</button>
            <button onClick={() => scrollToSection('comment-ca-marche')} className="hover:text-[#004532] transition-colors cursor-pointer">Comment ça marche</button>
            <button onClick={() => scrollToSection('valeurs')} className="hover:text-[#004532] transition-colors cursor-pointer">Nos Engagements</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#004532] transition-colors cursor-pointer">FAQ</button>
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('login')}
              className="text-[#3f4944] hover:text-[#004532] font-display text-sm font-semibold px-4 py-2 transition-colors cursor-pointer"
            >
              Connexion
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#065f46' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#004532] text-white rounded-full px-6 py-2.5 font-display text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Créer mon profil
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 overflow-hidden">
        {/* Hero Section */}
        <section id="accueil" className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#065f46]/10 text-[#004532] border border-[#004532]/20 font-body text-xs sm:text-sm font-semibold mb-8"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            Plateforme Matrimoniale Éthique &amp; Respectueuse
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-4xl sm:text-6xl md:text-7xl font-semibold text-[#004532] leading-tight tracking-tight mb-8"
          >
            Trouvez la personne avec qui construire votre avenir
          </motion.h1>

          {/* Quranic Verse Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="max-w-3xl mx-auto mb-10 p-6 sm:p-8 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-sm text-center relative overflow-hidden transition-shadow hover:shadow-md"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-[#735c00]">
              <span className="material-symbols-outlined text-8xl">menu_book</span>
            </div>
            
            <p dir="rtl" className="font-arabic text-xl sm:text-2xl text-[#004532] font-semibold mb-4 leading-relaxed">
              وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
            </p>

            <p className="font-serif-display text-base sm:text-lg md:text-xl italic font-medium text-[#5c4a00] leading-relaxed mb-3">
              « Et parmi Ses signes, Il a créé de vous, pour vous, des épouses afin que vous trouviez auprès d’elles tranquillité… »
            </p>
            <p className="font-body text-xs sm:text-sm font-bold tracking-widest text-[#8a7200] uppercase">
              Sourate Ar-Rum — 21
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body text-base sm:text-lg text-[#3f4944] max-w-3xl mx-auto mb-6 leading-relaxed"
          >
            Vous recherchez une personne sérieuse, partageant vos valeurs et votre vision du mariage ?
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="font-body text-base sm:text-lg font-medium text-[#151c27] max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Notre plateforme vous permet de faire des rencontres <strong className="text-[#004532]">respectueuses, confidentielles et orientées vers le mariage</strong>, au Niger et au-delà.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="font-serif-display text-xl sm:text-2xl italic font-semibold text-[#065f46] mb-8"
          >
            Votre histoire peut commencer par une simple rencontre.
          </motion.p>

          {/* Hero CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#065f46', boxShadow: '0 12px 24px -6px rgba(0, 69, 50, 0.3)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#004532] text-white rounded-full px-9 py-4 font-display text-base sm:text-lg font-bold transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
            >
              Créer mon profil gratuitement
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </motion.button>
            
            <p className="font-body text-xs sm:text-sm text-[#5a6560] font-medium flex flex-wrap justify-center gap-2 sm:gap-4">
              <span>• Inscription gratuite</span>
              <span>• Profils sérieux</span>
              <span>• Respect de la vie privée</span>
            </p>
          </motion.div>
        </section>

        {/* Section: Une rencontre qui a du sens */}
        <section className="bg-white border-y border-[#bec9c2]/30 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#004532] mb-6"
            >
              Une rencontre qui a du sens
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-body text-base sm:text-lg text-[#3f4944] max-w-3xl mx-auto leading-relaxed mb-12"
            >
              Nous croyons qu'une rencontre ne devrait pas être basée uniquement sur une photo ou un simple « swipe ».
              C'est pourquoi notre plateforme vous permet de découvrir des personnes qui correspondent réellement à <strong>vos valeurs, vos attentes et votre projet de vie</strong>.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
                className="p-8 rounded-3xl bg-[#f9f9ff] border border-[#bec9c2]/30 shadow-sm text-center flex flex-col items-center transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#004532]">Des intentions sérieuses</h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
                className="p-8 rounded-3xl bg-[#f9f9ff] border border-[#bec9c2]/30 shadow-sm text-center flex flex-col items-center transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    handshake
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#004532]">Des valeurs communes</h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35 }}
                whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
                className="p-8 rounded-3xl bg-[#f9f9ff] border border-[#bec9c2]/30 shadow-sm text-center flex flex-col items-center transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    home
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#004532]">Un objectif : construire</h3>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section: Comment ça marche ? */}
        <section id="comment-ca-marche" className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#004532] mb-4">
              Comment ça marche ?
            </h2>
            <p className="font-body text-base text-[#3f4944] max-w-xl mx-auto">
              Un processus simple, clair et transparent guidé par le respect de chacun.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.12)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex flex-col justify-between transition-all relative cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#065f46]/30 mb-4 block">01</span>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-3">Créez votre profil</h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Présentez-vous simplement et indiquez ce que vous recherchez chez votre futur(e) partenaire.
                </p>
              </div>
            </motion.div>

            {/* Step 02 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.12)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex flex-col justify-between transition-all relative cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#065f46]/30 mb-4 block">02</span>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-3">Découvrez des profils compatibles</h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Consultez des profils de personnes partageant vos valeurs et recherchant elles aussi une relation sérieuse.
                </p>
              </div>
            </motion.div>

            {/* Step 03 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.12)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex flex-col justify-between transition-all relative cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#065f46]/30 mb-4 block">03</span>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-3">Échangez avec respect</h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Prenez le temps de faire connaissance dans un environnement conçu pour favoriser des échanges respectueux.
                </p>
              </div>
            </motion.div>

            {/* Step 04 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -6, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.12)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex flex-col justify-between transition-all relative cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#065f46]/30 mb-4 block">04</span>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-3">Faites avancer votre relation</h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Lorsque les intentions sont claires et que la compatibilité est réelle, vous pouvez avancer vers une démarche plus sérieuse, avec le mariage comme objectif.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Banner Section: On ne cherche pas simplement quelqu'un */}
        <section className="bg-[#004532] text-white py-16 sm:py-20 my-8 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10"
          >
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold mb-3 text-emerald-100">
              Ici, on ne cherche pas simplement quelqu'un.
            </h2>
            <p className="font-serif-display text-2xl sm:text-4xl italic font-semibold mb-8 text-[#fed65b]">
              On cherche la bonne personne.
            </p>

            <p className="font-body text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
              Que vous soyez à <strong>Niamey, Maradi, Zinder, Tahoua, Agadez, Dosso ou Diffa</strong>, vous pouvez rencontrer des personnes sérieuses qui souhaitent elles aussi construire leur avenir.
            </p>

            <p className="font-body text-base font-semibold text-white/95 mb-8">
              Votre futur(e) partenaire est peut-être plus proche que vous ne le pensez.
            </p>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#fde047', boxShadow: '0 10px 25px -5px rgba(254, 214, 91, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#fed65b] text-[#004532] rounded-full px-8 py-3.5 font-display text-base font-bold transition-all shadow-lg cursor-pointer"
            >
              Commencer gratuitement
            </motion.button>
          </motion.div>
        </section>

        {/* Section: Pensé pour les musulmans qui recherchent le mariage */}
        <section id="valeurs" className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#004532] mb-6"
            >
              Pensé pour les musulmans qui recherchent le mariage
            </motion.h2>

            {/* Rejections list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8"
            >
              <span className="px-4 py-2 rounded-full bg-red-50 text-red-800 border border-red-200 font-body text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">close</span> Pas de rencontres sans lendemain
              </span>
              <span className="px-4 py-2 rounded-full bg-red-50 text-red-800 border border-red-200 font-body text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">close</span> Pas de profils créés uniquement pour discuter
              </span>
              <span className="px-4 py-2 rounded-full bg-red-50 text-red-800 border border-red-200 font-body text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">close</span> Pas besoin de perdre votre temps
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="font-body text-base sm:text-lg text-[#3f4944] max-w-2xl mx-auto leading-relaxed"
            >
              Notre plateforme est conçue pour les personnes qui souhaitent faire une rencontre avec <strong>une intention claire et sérieuse</strong>.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confidentialité */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-2 flex items-center gap-2">
                  🔒 Confidentialité
                </h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Vos informations personnelles sont protégées et votre vie privée reste une priorité.
                </p>
              </div>
            </motion.div>

            {/* Respect */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">handshake</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-2 flex items-center gap-2">
                  🤝 Respect
                </h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Chaque membre s'engage à respecter les autres utilisateurs et les valeurs de la plateforme.
                </p>
              </div>
            </motion.div>

            {/* Une intention sérieuse */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-2 flex items-center gap-2">
                  💍 Une intention sérieuse
                </h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  La plateforme est pensée autour d'un objectif : faciliter les rencontres pouvant mener à un mariage.
                </p>
              </div>
            </motion.div>

            {/* Pensé pour le Niger */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5, boxShadow: '0 15px 30px -10px rgba(0, 69, 50, 0.1)' }}
              className="bg-white rounded-3xl p-8 border border-[#bec9c2]/30 shadow-sm flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#065f46]/10 text-[#004532] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">flag</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#004532] mb-2 flex items-center gap-2">
                  🇳🇪 Pensé pour le Niger
                </h3>
                <p className="font-body text-sm text-[#3f4944] leading-relaxed">
                  Une expérience adaptée aux réalités, aux habitudes et aux valeurs des utilisateurs nigériens.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section: Et si votre moitié était déjà ici ? */}
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-amber-50/90 border border-amber-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center"
          >
            <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#5c4a00] mb-4">
              Et si votre moitié était déjà ici ?
            </h2>

            <p className="font-body text-base text-[#3f4944] max-w-xl mx-auto leading-relaxed mb-6">
              Vous n'avez pas besoin de savoir où cette rencontre vous mènera. Vous avez simplement besoin de faire <strong>le premier pas</strong>.
            </p>

            <p className="font-display text-lg font-semibold text-[#004532] mb-6">
              Créez votre profil gratuitement et commencez à faire des rencontres sérieuses.
            </p>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#065f46' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#004532] text-white rounded-full px-8 py-3.5 font-display text-base font-bold transition-all shadow-md mb-6 cursor-pointer"
            >
              Créer mon profil
            </motion.button>

            <p className="font-display text-sm italic font-medium text-[#735c00]">
              Que votre rencontre soit belle, respectueuse et porteuse de bien.
            </p>
          </motion.div>
        </section>

        {/* Section: Questions fréquentes (FAQ) */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#004532] mb-3">
              Questions fréquentes
            </h2>
            <p className="font-body text-sm sm:text-base text-[#3f4944]">
              Tout ce que vous devez savoir avant d'entamer votre démarche.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqList.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="bg-white rounded-2xl border border-[#bec9c2]/30 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-6 font-display text-base sm:text-lg font-semibold text-[#004532] flex justify-between items-center gap-4 hover:bg-[#f9f9ff] transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <motion.span 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="material-symbols-outlined text-[#065f46]"
                    >
                      expand_more
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 pt-1 font-body text-sm sm:text-base text-[#3f4944] leading-relaxed border-t border-[#bec9c2]/20">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#004532] text-white rounded-3xl p-10 sm:p-14 shadow-xl text-center space-y-6"
          >
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold text-white">
              Commencez votre nouvelle histoire.
            </h2>

            <p className="font-serif-display text-xl sm:text-2xl italic font-semibold text-[#fed65b] max-w-xl mx-auto">
              Une intention sincère. Une rencontre sérieuse. Peut-être un mariage.
            </p>

            <div>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#fde047', boxShadow: '0 12px 25px -5px rgba(254, 214, 91, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenAuth('register')}
                className="bg-[#fed65b] text-[#004532] rounded-full px-9 py-4 font-display text-base font-bold transition-all shadow-md cursor-pointer"
              >
                Créer mon profil gratuitement
              </motion.button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#bec9c2]/30 pt-16 pb-12 text-[#3f4944] font-body text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <ZawajLogo size="lg" />
            <p className="text-xs text-[#5a6560] leading-relaxed">
              Plateforme matrimoniale éthique, sécurisée et respectueuse dédiée aux personnes recherchant une union sérieuse.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-display text-sm font-bold text-[#004532] uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#3f4944]">
              <li><button onClick={() => scrollToSection('accueil')} className="hover:text-[#004532] transition-colors">Accueil</button></li>
              <li><button onClick={() => scrollToSection('comment-ca-marche')} className="hover:text-[#004532] transition-colors">Comment ça marche</button></li>
              <li><button onClick={() => onOpenAuth('register')} className="hover:text-[#004532] transition-colors">Créer un profil</button></li>
              <li><button onClick={onEnterApp} className="hover:text-[#004532] transition-colors">Découvrir l'application</button></li>
              <li><button onClick={() => scrollToSection('faq')} className="hover:text-[#004532] transition-colors">FAQ</button></li>
              <li><button onClick={() => scrollToSection('valeurs')} className="hover:text-[#004532] transition-colors">Nos Engagements</button></li>
            </ul>
          </div>

          {/* Col 3: Rencontres */}
          <div>
            <h4 className="font-display text-sm font-bold text-[#004532] uppercase tracking-wider mb-4">
              Rencontres
            </h4>
            <ul className="space-y-2 text-xs text-[#3f4944] flex flex-col">
              <span>Rencontre au Niger</span>
              <span>Rencontre Niamey</span>
              <span>Rencontre Maradi</span>
              <span>Rencontre Zinder</span>
              <span>Rencontre Tahoua</span>
              <span>Rencontre Agadez</span>
              <span>Rencontre musulmane</span>
              <span>Mariage halal</span>
            </ul>
          </div>

          {/* Col 4: Informations */}
          <div>
            <h4 className="font-display text-sm font-bold text-[#004532] uppercase tracking-wider mb-4">
              Informations
            </h4>
            <ul className="space-y-2.5 text-xs text-[#3f4944]">
              <li><span className="hover:text-[#004532] cursor-pointer">Confidentialité</span></li>
              <li><span className="hover:text-[#004532] cursor-pointer">Conditions d'utilisation</span></li>
              <li><span className="hover:text-[#004532] cursor-pointer">Mentions légales</span></li>
              <li><span className="hover:text-[#004532] cursor-pointer">Règlement de la plateforme</span></li>
              <li><span className="hover:text-[#004532] cursor-pointer">Contact</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 border-t border-[#bec9c2]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6f7973]">
          <p>© 2026 — Zawaj. Tous droits réservés.</p>
          <p className="font-medium text-[#004532]">Mariage Éthique &amp; Respectueux</p>
        </div>
      </footer>
    </div>
  );
};
