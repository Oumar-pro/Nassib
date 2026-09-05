import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

interface ImamChatViewProps {
  user: User;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const ImamChatView: React.FC<ImamChatViewProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `As-salamu alaykum wa rahmatullah ${user.name ? user.name.split(' ')[0] : 'cher membre'}.
Je suis Imam Oumar, votre guide spirituel et conseiller matrimonial sur NASSIB. 

Que votre recherche soit personnelle ou au titre de tuteur (Wali), je suis à votre disposition pour éclairer vos questions sur le mariage islamique (Fiqh al-Nikah), la modération de la dot (Mahr), la courtoisie des échanges (Tâ'arof) et la bénédiction du foyer.

Comment puis-je vous guider aujourd'hui ?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

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

    try {
      const historyPayload = [...messages, userMsg].map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch('/api/imam-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          userRole: user.role,
          userName: user.name,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "As-salamu alaykum. Qu'Allah vous accorde la sérénité dans votre recherche.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error contacting Imam Oumar:', err);
      const fallbackMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: "As-salamu alaykum. Une petite interruption réseau s'est produite. Rappelez-vous ce précepte du Prophète (PBSL) : 'Le meilleur mariage est le plus simple et le plus béni'. N'hésitez pas à reposer votre question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Identity */}
      <div className="rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-xs border border-[#E8E3D7] bg-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="relative shrink-0">
            <div className="w-13 h-13 sm:w-18 sm:h-18 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center border-2 sm:border-4 border-white shadow-sm overflow-hidden">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-[#C9A45C]">auto_awesome</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#C9A45C] text-[#211E1A] text-[9px] font-bold p-0.5 sm:p-1 rounded-full border-2 border-white shadow-xs">
              <span className="material-symbols-outlined text-[12px] sm:text-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-[#0F5C4D] text-white font-body text-[9px] sm:text-[10px] font-bold tracking-wide uppercase">
                Conseiller Spirituel
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#C9A45C]/20 text-[#211E1A] font-body text-[9px] sm:text-[10px] font-bold uppercase border border-[#C9A45C]/40">
                Imam Oumar
              </span>
            </div>
            <h2 className="font-serif-display text-lg sm:text-2xl font-bold text-[#0F5C4D]">
              Guide Matrimonial Imam Oumar
            </h2>
            <p className="font-body text-xs text-[#575147] mt-0.5 max-w-xl leading-relaxed hidden sm:block">
              Posez toutes vos questions concernant les règles du mariage en Islam, le rôle du tuteur (Wali), la bénédiction de la dot (Mahr) et l'harmonie du foyer.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-[#FAF8F2] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-[#E8E3D7] shadow-2xs self-start md:self-center">
          <span className="material-symbols-outlined text-[#0F5C4D] text-lg sm:text-xl">mosque</span>
          <div className="text-left">
            <span className="font-body text-[9px] sm:text-[10px] text-[#7D766C] uppercase font-bold block">Spécialité</span>
            <span className="font-display text-xs font-bold text-[#211E1A]">Fiqh al-Nikah &amp; Coutumes Niger</span>
          </div>
        </div>
      </div>

      {/* Preset Suggestions Quick Chips */}
      <div className="space-y-1.5">
        <p className="font-body text-[11px] sm:text-xs font-bold text-[#575147] uppercase tracking-wider flex items-center gap-1.5 px-1">
          <span className="material-symbols-outlined text-sm text-[#0F5C4D]">lightbulb</span>
          <span>Questions fréquentes :</span>
        </p>
        <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-1 no-scrollbar -mx-1 px-1">
          {presetQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E3D7] text-[#0F5C4D] font-body text-xs font-semibold hover:border-[#0F5C4D] hover:bg-[#8BAE9F]/10 transition-all cursor-pointer disabled:opacity-50 text-left flex items-center gap-1.5 whitespace-nowrap sm:whitespace-normal shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-xs text-[#C9A45C]">help_outline</span>
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="rounded-2xl sm:rounded-[28px] border border-[#E8E3D7] shadow-xs sm:shadow-md overflow-hidden flex flex-col h-[55vh] sm:h-[520px] bg-white">
        {/* Chat Messages Body */}
        <div className="flex-grow p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-[#FAF8F2]/40">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <span className="material-symbols-outlined text-lg text-[#C9A45C]">auto_awesome</span>
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#0F5C4D] text-white rounded-br-none font-body'
                      : 'bg-white border border-[#E8E3D7] text-[#211E1A] rounded-bl-none font-body whitespace-pre-line'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#E8E3D7]">
                      <span className="font-display font-bold text-[#0F5C4D] text-xs">Imam Oumar</span>
                      <span className="text-[10px] text-[#7D766C] font-body">Guide Spirituel NASSIB</span>
                    </div>
                  )}

                  <p>{msg.text}</p>

                  <div className={`mt-2 text-[10px] ${isUser ? 'text-emerald-100 text-right' : 'text-[#7D766C] text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-1 border border-[#8BAE9F]/40">
                    {user.name ? user.name.charAt(0) : 'M'}
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
              <div className="w-9 h-9 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-lg animate-spin text-[#C9A45C]">sync</span>
              </div>
              <div className="bg-white border border-[#E8E3D7] rounded-2xl px-4 py-3 text-xs font-body text-[#575147] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-bounce delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-bounce delay-300"></span>
                <span className="ml-1 text-[#0F5C4D] font-semibold">Imam Oumar rédige sa réponse...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8E3D7] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Posez votre question à Imam Oumar (ex: dot, rôle du Wali, fiançailles)..."
            className="flex-grow h-12 bg-[#FAF8F2] border border-[#E8E3D7] rounded-2xl px-4 text-xs sm:text-sm font-body text-[#211E1A] focus:outline-none focus:border-[#0F5C4D] focus:ring-2 focus:ring-[#0F5C4D]/15"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="h-12 px-5 rounded-2xl bg-[#0F5C4D] text-white font-display font-bold text-xs sm:text-sm hover:bg-[#0c4a3e] disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
          >
            <span>Envoyer</span>
            <span className="material-symbols-outlined text-base text-[#C9A45C]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
