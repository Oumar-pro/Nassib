import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from '../../types';
import { NasibaLogo } from '../NasibaLogo';

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
      a: "Oui. L'application est 100% gratuite pour tous. Toutes les fonctionnalités (recherche, profils, messagerie éthique, accompagnement IA) sont accessibles sans aucun frais, sans abonnement ni carte bancaire."
    },
    {
      q: "Qui peut s'inscrire sur NASSIB ?",
      a: "La plateforme s'adresse aux musulmans majeurs qui recherchent une relation sérieuse avec l'objectif sacré de construire un foyer et un mariage pérenne."
    },
    {
      q: "Mes informations sont-elles protégées et confidentielles ?",
      a: "Absolument. Nous accordons une importance primordiale à la pudeur et à la confidentialité. Vous gardez le contrôle complet sur vos photos (floutage activable) et vos coordonnées personnelles."
    },
    {
      q: "Puis-je rechercher quelqu'un dans ma ville au Niger ?",
      a: "Oui. Vous pouvez découvrir des profils selon la localisation (Niamey, Maradi, Zinder, Tahoua, Agadez, Dosso, etc.) et des critères d'affinité spirituelle et culturelle."
    },
    {
      q: "En quoi NASSIB se distingue d'une application de rencontres classique ?",
      a: "NASSIB proscrit les dérives des applications de drague éphémère. Chaque compte est orienté vers le mariage halal, avec accompagnement bienveillant et supervision possible du tuteur légal (Wali)."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#211E1A] font-body selection:bg-[#8BAE9F]/25 selection:text-[#0F5C4D]">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F2]/90 backdrop-blur-xl border-b border-[#E8E3D7] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex justify-between items-center">
          <div 
            onClick={() => onOpenAuth('register')}
            className="cursor-pointer"
          >
            <NasibaLogo size="md" />
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-[#575147]">
            <button onClick={() => scrollToSection('accueil')} className="hover:text-[#0F5C4D] transition-colors cursor-pointer">Accueil</button>
            <button onClick={() => scrollToSection('comment-ca-marche')} className="hover:text-[#0F5C4D] transition-colors cursor-pointer">Comment ça marche</button>
            <button onClick={() => scrollToSection('valeurs')} className="hover:text-[#0F5C4D] transition-colors cursor-pointer">Nos Engagements</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#0F5C4D] transition-colors cursor-pointer">FAQ</button>
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('login')}
              className="text-[#575147] hover:text-[#0F5C4D] font-display text-sm font-semibold px-4 py-2 transition-colors cursor-pointer"
            >
              Connexion
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#0c4a3e' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#0F5C4D] text-white rounded-full px-6 py-2.5 font-display text-sm font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Créer mon profil</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]"></span>
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8BAE9F]/15 text-[#0F5C4D] border border-[#8BAE9F]/35 font-body text-xs sm:text-sm font-semibold mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#C9A45C]"></span>
            <span>Matrimonial Éthique &amp; Moderne</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif-display text-5xl sm:text-7xl md:text-8xl font-bold text-[#0F5C4D] leading-none tracking-tight mb-4"
          >
            NASSIB
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-[#211E1A] font-medium tracking-normal mb-8 max-w-3xl mx-auto"
          >
            Des rencontres avec une intention sérieuse.
          </motion.p>

          {/* Quranic Verse Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -3 }}
            className="max-w-3xl mx-auto mb-10 p-6 sm:p-8 rounded-3xl bg-white border border-[#C9A45C]/40 shadow-sm text-center relative overflow-hidden transition-all hover:shadow-md"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-[#C9A45C]">
              <span className="material-symbols-outlined text-8xl">menu_book</span>
            </div>
            
            <p dir="rtl" className="font-arabic text-xl sm:text-2xl text-[#0F5C4D] font-semibold mb-4 leading-relaxed">
              وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
            </p>

            <p className="font-serif-display text-base sm:text-lg md:text-xl italic font-medium text-[#211E1A] leading-relaxed mb-3">
              « Et parmi Ses signes, Il a créé de vous, pour vous, des épouses afin que vous trouviez auprès d’elles tranquillité… »
            </p>
            <p className="font-body text-xs sm:text-sm font-bold tracking-widest text-[#C9A45C] uppercase">
              Sourate Ar-Rum — Verset 21
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body text-base sm:text-lg text-[#575147] max-w-3xl mx-auto mb-4 leading-relaxed"
          >
            Vous recherchez une personne intègre, partageant vos valeurs spirituelles et votre vision du mariage ?
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="font-body text-base sm:text-lg font-medium text-[#211E1A] max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            <strong className="text-[#0F5C4D]">NASSIB</strong> vous permet de réaliser des rencontres <strong className="text-[#0F5C4D]">pudiques, confidentielles et orientées vers le mariage</strong>, au Niger et en Afrique de l'Ouest.
          </motion.p>

          {/* Hero CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#0c4a3e', boxShadow: '0 12px 24px -6px rgba(15, 92, 77, 0.25)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#0F5C4D] text-white rounded-full px-9 py-4 font-display text-base sm:text-lg font-bold transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Créer mon profil gratuitement</span>
              <span className="material-symbols-outlined text-xl text-[#C9A45C]">arrow_forward</span>
            </motion.button>
            
            <div className="font-body text-xs sm:text-sm text-[#7D766C] font-medium flex flex-wrap justify-center items-center gap-3 sm:gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8BAE9F]"></span>
                Plateforme 100% Gratuite
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]"></span>
                Profils vérifiés &amp; sérieux
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8BAE9F]"></span>
                Pudeur &amp; Confidentialité
              </span>
            </div>
          </motion.div>
        </section>

        {/* Section: Une démarche qui a du sens */}
        <section className="bg-white border-y border-[#E8E3D7] py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#0F5C4D] mb-6"
            >
              Une démarche qui a du sens
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-body text-base sm:text-lg text-[#575147] max-w-3xl mx-auto leading-relaxed mb-12"
            >
              Nous croyons qu'une rencontre sincère ne devrait pas dépendre d'un algorithme superficiel ou d'un défilement compulsif.
              <strong className="text-[#211E1A]"> NASSIB</strong> met l'accent sur ce qui compte vraiment : <strong>vos valeurs religieuses, votre caractère et votre vision du foyer</strong>.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-[#FAF8F2] border border-[#E8E3D7] shadow-xs text-center flex flex-col items-center transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#C9A45C]">
                    verified
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D]">Des intentions sincères</h3>
                <p className="font-body text-xs text-[#7D766C] mt-2">Chaque membre confirme sa volonté de construire un mariage dans le respect mutuel.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-[#FAF8F2] border border-[#E8E3D7] shadow-xs text-center flex flex-col items-center transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#0F5C4D]">
                    handshake
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D]">Des valeurs partagées</h3>
                <p className="font-body text-xs text-[#7D766C] mt-2">Affinité spirituelle, éducation et projet de vie au cœur de chaque profil.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-[#FAF8F2] border border-[#E8E3D7] shadow-xs text-center flex flex-col items-center transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#C9A45C]">
                    home
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D]">Un objectif : bâtir un foyer</h3>
                <p className="font-body text-xs text-[#7D766C] mt-2">Faire aboutir la démarche avec la bénédiction familiale et spirituelle.</p>
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
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#0F5C4D] mb-4">
              Comment ça marche ?
            </h2>
            <p className="font-body text-base text-[#575147] max-w-xl mx-auto">
              Un parcours noble, transparent et guidé par la bienséance islamique.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex flex-col justify-between transition-all cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#8BAE9F]/40 mb-4 block">01</span>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-3">Créez votre profil</h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Présentez-vous avec pudeur et définissez les qualités et vertus que vous espérez chez votre futur(e) époux(se).
                </p>
              </div>
            </motion.div>

            {/* Step 02 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex flex-col justify-between transition-all cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#8BAE9F]/40 mb-4 block">02</span>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-3">Découvrez des profils</h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Consultez des profils sérieux partageant votre pratique, vos aspirations familiales et votre secteur géographique.
                </p>
              </div>
            </motion.div>

            {/* Step 03 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex flex-col justify-between transition-all cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#8BAE9F]/40 mb-4 block">03</span>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-3">Échangez avec pudeur</h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Discutez en toute sérénité dans un cadre sain, avec l'intégration et la supervision optionnelle de votre Wali.
                </p>
              </div>
            </motion.div>

            {/* Step 04 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex flex-col justify-between transition-all cursor-default"
            >
              <div>
                <span className="font-display text-3xl font-extrabold text-[#8BAE9F]/40 mb-4 block">04</span>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-3">Concrétisez l'union</h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Lorsque la confiance et l'accord mutuel sont scellés, passez à la rencontre formelle avec les familles pour le mariage.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Banner Section: On ne cherche pas simplement quelqu'un */}
        <section className="bg-[#0F5C4D] text-white py-16 sm:py-20 my-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#C9A45C_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10"
          >
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold mb-3 text-[#FAF8F2]">
              Ici, on ne cherche pas simplement quelqu'un.
            </h2>
            <p className="font-serif-display text-2xl sm:text-4xl italic font-semibold mb-8 text-[#C9A45C]">
              On cherche la bonne personne.
            </p>

            <p className="font-body text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
              Que vous soyez à <strong>Niamey, Maradi, Zinder, Tahoua, Agadez, Dosso ou Diffa</strong>, vous pouvez rencontrer des cœurs sincères qui souhaitent bâtir une vie de foi et de paix.
            </p>

            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#D6B26A' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenAuth('register')}
              className="bg-[#C9A45C] text-[#211E1A] rounded-full px-8 py-3.5 font-display text-base font-bold transition-all shadow-md cursor-pointer"
            >
              Commencer gratuitement
            </motion.button>
          </motion.div>
        </section>

        {/* Section: Engagements éthiques */}
        <section id="valeurs" className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#0F5C4D] mb-6"
            >
              Pensé pour les musulmans qui recherchent le mariage
            </motion.h2>

            {/* Dignified ethics tags (no harsh red dating cliches) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8"
            >
              <span className="px-4 py-2 rounded-full bg-white text-[#575147] border border-[#E8E3D7] font-body text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4D]"></span> Pas de rencontres futiles sans lendemain
              </span>
              <span className="px-4 py-2 rounded-full bg-white text-[#575147] border border-[#E8E3D7] font-body text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4D]"></span> Pas de profils créés uniquement pour bavarder
              </span>
              <span className="px-4 py-2 rounded-full bg-white text-[#575147] border border-[#E8E3D7] font-body text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4D]"></span> Respect absolu du temps et de la dignité
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="font-body text-base sm:text-lg text-[#575147] max-w-2xl mx-auto leading-relaxed"
            >
              <strong className="text-[#0F5C4D]">NASSIB</strong> est conçue pour les personnes qui abordent le mariage avec <strong>une intention claire, sincère et responsable</strong>.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confidentialité */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">lock</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-2 flex items-center gap-2">
                  Confidentialité &amp; Floutage
                </h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Vos informations et photos sont protégées selon votre volonté. Vous décidez qui peut voir votre portrait.
                </p>
              </div>
            </motion.div>

            {/* Respect */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">handshake</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-2 flex items-center gap-2">
                  Bienséance &amp; Respect
                </h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Chaque membre s'engage sur l'honneur à respecter les règles de politesse et les valeurs islamiques.
                </p>
              </div>
            </motion.div>

            {/* Une intention sérieuse */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-[#C9A45C]">verified_user</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-2 flex items-center gap-2">
                  Intention Matrimoniale
                </h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  L'unique finalité de la plateforme est de favoriser l'union sacrée du mariage, loin des dérives éphémères.
                </p>
              </div>
            </motion.div>

            {/* Pensé pour le Niger */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-[#E8E3D7] shadow-xs flex items-start gap-5 transition-all cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">public</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F5C4D] mb-2 flex items-center gap-2">
                  Adapté à nos réalités
                </h3>
                <p className="font-body text-sm text-[#575147] leading-relaxed">
                  Conçu pour le Niger et l'Afrique de l'Ouest, avec prise en compte des coutumes et de l'implication des familles.
                </p>
              </div>
            </motion.div>
          </div>
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
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#0F5C4D] mb-3">
              Questions fréquentes
            </h2>
            <p className="font-body text-sm sm:text-base text-[#575147]">
              Tout ce que vous devez savoir avant d'entamer votre démarche sur NASSIB.
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
                  className="bg-white rounded-2xl border border-[#E8E3D7] shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-6 font-display text-base sm:text-lg font-semibold text-[#0F5C4D] flex justify-between items-center gap-4 hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <motion.span 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="material-symbols-outlined text-[#8BAE9F]"
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
                        <div className="px-6 pb-6 pt-1 font-body text-sm sm:text-base text-[#575147] leading-relaxed border-t border-[#E8E3D7]/60">
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
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#0F5C4D] text-white rounded-3xl p-10 sm:p-14 shadow-lg text-center space-y-6"
          >
            <h2 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#FAF8F2]">
              Commencez votre nouvelle histoire.
            </h2>

            <p className="font-serif-display text-xl sm:text-2xl italic font-semibold text-[#C9A45C] max-w-xl mx-auto">
              Une intention sincère. Une rencontre sérieuse. Un mariage béni.
            </p>

            <div>
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: '#D6B26A' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenAuth('register')}
                className="bg-[#C9A45C] text-[#211E1A] rounded-full px-9 py-4 font-display text-base font-bold transition-all shadow-md cursor-pointer"
              >
                Créer mon profil gratuitement
              </motion.button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E3D7] pt-16 pb-12 text-[#575147] font-body text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <NasibaLogo size="md" />
            <p className="text-xs text-[#7D766C] leading-relaxed">
              Plateforme matrimoniale éthique, pudique et moderne au Niger. Des rencontres avec une intention sérieuse.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-display text-sm font-bold text-[#0F5C4D] uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#575147]">
              <li><button onClick={() => scrollToSection('accueil')} className="hover:text-[#0F5C4D] transition-colors">Accueil</button></li>
              <li><button onClick={() => scrollToSection('comment-ca-marche')} className="hover:text-[#0F5C4D] transition-colors">Comment ça marche</button></li>
              <li><button onClick={() => onOpenAuth('register')} className="hover:text-[#0F5C4D] transition-colors">Créer un profil</button></li>
              <li><button onClick={onEnterApp} className="hover:text-[#0F5C4D] transition-colors">Découvrir l'application</button></li>
              <li><button onClick={() => scrollToSection('faq')} className="hover:text-[#0F5C4D] transition-colors">FAQ</button></li>
              <li><button onClick={() => scrollToSection('valeurs')} className="hover:text-[#0F5C4D] transition-colors">Nos Engagements</button></li>
            </ul>
          </div>

          {/* Col 3: Rencontres */}
          <div>
            <h4 className="font-display text-sm font-bold text-[#0F5C4D] uppercase tracking-wider mb-4">
              Rencontres
            </h4>
            <ul className="space-y-2 text-xs text-[#575147] flex flex-col">
              <span>Rencontre au Niger</span>
              <span>Rencontre Niamey</span>
              <span>Rencontre Maradi</span>
              <span>Rencontre Zinder</span>
              <span>Rencontre Tahoua</span>
              <span>Rencontre Agadez</span>
              <span>Mariage musulman éthique</span>
              <span>Foyer béni</span>
            </ul>
          </div>

          {/* Col 4: Informations */}
          <div>
            <h4 className="font-display text-sm font-bold text-[#0F5C4D] uppercase tracking-wider mb-4">
              Informations
            </h4>
            <ul className="space-y-2.5 text-xs text-[#575147]">
              <li><span className="hover:text-[#0F5C4D] cursor-pointer">Confidentialité</span></li>
              <li><span className="hover:text-[#0F5C4D] cursor-pointer">Conditions d'utilisation</span></li>
              <li><span className="hover:text-[#0F5C4D] cursor-pointer">Mentions légales</span></li>
              <li><span className="hover:text-[#0F5C4D] cursor-pointer">Charte Éthique NASSIB</span></li>
              <li><span className="hover:text-[#0F5C4D] cursor-pointer">Contact</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 border-t border-[#E8E3D7] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#7D766C]">
          <p>© 2026 — NASSIB. Tous droits réservés.</p>
          <p className="font-medium text-[#0F5C4D]">Des rencontres avec une intention sérieuse.</p>
        </div>
      </footer>
    </div>
  );
};

