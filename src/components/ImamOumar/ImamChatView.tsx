import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from '../../types';

interface ImamChatViewProps {
  user: User;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const ImamChatView: React.FC<ImamChatViewProps> = ({ user, onBack }) => {
  const getInitialWelcomeMessage = (): ChatMessage => ({
    id: 'welcome-msg',
    sender: 'assistant',
    text: `As-salamu alaykum wa rahmatullah ${user.name ? user.name.split(' ')[0] : 'cher membre'}.\n\nJe suis l'Imam Oumar, votre guide spirituel et conseiller matrimonial sur NASSIB.\n\nQue votre démarche soit personnelle ou au titre de tuteur (Wali), je suis à votre disposition pour vous éclairer sur le mariage islamique (Fiqh al-Nikah), la modération de la dot (Mahr), les règles des échanges (Tâ'arof) et l'harmonie du foyer.\n\nComment puis-je vous aider aujourd'hui ?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialWelcomeMessage()]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    "Quel est le rôle du Wali (tuteur) et pourquoi est-il essentiel ?",
    "Comment fixer une dot (Mahr) bénie et raisonnable ?",
    "Règles et éthique de la période de courtoisie (Tâ'arof)",
    "Comment aborder le projet financier et la vie de foyer ?",
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = textToSend || input.trim();
    if (!promptText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    // Réponse automatique de l'Imam Oumar
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: "As-salamu alaykum. Le service de l'Imam Oumar est indisponible pour le moment. Il sera très bientôt disponible in sha Allah.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([getInitialWelcomeMessage()]);
  };

  const isInitialState = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2.5rem)] max-w-4xl mx-auto w-full">
      {/* AI Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D7] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton Retour pour quitter l'IA */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E3D7] bg-white text-[#0F5C4D] hover:bg-[#8BAE9F]/15 font-display text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95 mr-0.5"
            title="Retour"
            aria-label="Retour"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Retour</span>
          </button>

          <div className="relative">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center shadow-xs border border-[#8BAE9F]/40">
              <span className="material-symbols-outlined text-lg sm:text-xl text-[#C9A45C]">auto_awesome</span>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#FAF8F2] rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-sm sm:text-base text-[#0F5C4D]">
                Imam Oumar IA
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0F5C4D]/10 text-[#0F5C4D] text-[10px] font-bold">
                <span className="material-symbols-outlined text-xs text-[#0F5C4D]">verified</span>
                Guide Spirituel
              </span>
            </div>
            <p className="text-[11px] text-[#7D766C] font-body flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>En ligne • Fiqh al-Nikah &amp; Famille</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E3D7] bg-white text-[#575147] hover:text-[#0F5C4D] hover:border-[#0F5C4D]/50 text-xs font-medium shadow-2xs transition-all cursor-pointer"
          title="Nouvelle conversation"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span className="hidden sm:inline">Nouvelle discussion</span>
        </button>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto py-4 px-1 sm:px-3 space-y-6">
        {/* If first screen, show welcome hero suggestions */}
        {isInitialState && (
          <div className="pt-4 sm:pt-6 pb-4 space-y-5">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center mx-auto mb-3 border border-[#8BAE9F]/30">
                <span className="material-symbols-outlined text-3xl text-[#0F5C4D]">mosque</span>
              </div>
              <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#0F5C4D]">
                Que puis-je éclairer pour vous ?
              </h2>
              <p className="text-xs sm:text-sm text-[#575147] leading-relaxed font-body">
                Posez vos questions sur la démarche du mariage en Islam, les devoirs mutuels, la modération de la dot ou l'intervention du tuteur légal.
              </p>
            </div>

            <div className="space-y-2 max-w-2xl mx-auto pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D766C] flex items-center gap-1.5 px-1">
                <span className="material-symbols-outlined text-sm text-[#C9A45C]">lightbulb</span>
                <span>Suggestions de questions fréquentes</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="p-3 rounded-2xl bg-white border border-[#E8E3D7] hover:border-[#0F5C4D] hover:shadow-sm text-left text-xs font-medium text-[#211E1A] flex items-start gap-2.5 transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-base text-[#0F5C4D] shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      chat_bubble
                    </span>
                    <span className="leading-snug">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                    <span className="material-symbols-outlined text-base text-[#C9A45C]">auto_awesome</span>
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#0F5C4D] text-white rounded-2xl rounded-tr-xs shadow-xs font-body'
                        : 'bg-white border border-[#E8E3D7] text-[#211E1A] rounded-2xl rounded-tl-xs shadow-xs font-body whitespace-pre-line'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#E8E3D7]">
                        <span className="font-display font-bold text-xs text-[#0F5C4D]">Imam Oumar</span>
                        <span className="text-[10px] text-[#7D766C]">Conseiller Matrimonial</span>
                      </div>
                    )}

                    <p>{msg.text}</p>
                  </div>

                  <span className={`text-[10px] text-[#7D766C] mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-display font-bold text-xs flex items-center justify-center shrink-0 border border-[#8BAE9F]/40 mt-1">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-base animate-spin text-[#C9A45C]">sync</span>
              </div>
              <div className="bg-white border border-[#E8E3D7] rounded-2xl rounded-tl-xs px-4 py-3 text-xs font-body text-[#575147] flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-bounce delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-bounce delay-300"></span>
                <span className="ml-1 text-[#0F5C4D] font-semibold text-xs">Imam Oumar formule sa réponse...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Sticky Bottom Prompt Bar */}
      <div className="pt-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))] shrink-0 bg-[#FAF8F2]">
        <div className="relative flex items-center bg-white border border-[#E8E3D7] rounded-2xl sm:rounded-full p-1.5 sm:p-2 shadow-md focus-within:border-[#0F5C4D] focus-within:ring-2 focus-within:ring-[#0F5C4D]/15 transition-all">
          <div className="pl-3 pr-2 text-[#0F5C4D] shrink-0">
            <span className="material-symbols-outlined text-xl text-[#0F5C4D]">auto_awesome</span>
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Posez votre question à l'Imam Oumar (ex: dot, rôle du Wali, fiançailles)..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#211E1A] placeholder-[#7D766C] focus:outline-none px-1 py-2"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl sm:rounded-full bg-[#0F5C4D] text-white flex items-center justify-center hover:bg-[#0c4a3e] disabled:opacity-30 transition-all shrink-0 cursor-pointer shadow-xs"
            title="Envoyer"
          >
            <span className="material-symbols-outlined text-lg">arrow_upward</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-[#7D766C] mt-1">
          L'Imam Oumar IA est un guide consultatif fondé sur le Fiqh al-Nikah et les coutumes musulmanes nigériennes.
        </p>
      </div>
    </div>
  );
};
