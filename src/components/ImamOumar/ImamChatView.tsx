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
Je suis Imam Oumar, votre guide spirituel et conseiller matrimonial sur Zawaj. 

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
      <div className="glass-card rounded-[28px] p-6 sm:p-8 ambient-shadow border border-[#004532]/20 bg-gradient-to-r from-[#004532]/10 via-white to-[#004532]/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#004532] text-white flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">auto_awesome</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#fed65b] text-[#574500] text-[10px] font-bold p-1 rounded-full border-2 border-white shadow-xs">
              <span className="material-symbols-outlined text-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#004532] text-white font-body text-[10px] font-bold tracking-wide uppercase">
                Assistant IA Éthique &amp; Fiqh
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fed65b]/30 text-[#745c00] font-body text-[10px] font-bold uppercase border border-[#fed65b]/50">
                Imam Oumar
              </span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#004532]">
              Conseil Matrimonial par Imam Oumar
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#3f4944] mt-1 max-w-xl leading-relaxed">
              Posez toutes vos questions concernant les règles du mariage en Islam, le rôle du tuteur (Wali), la bénédiction de la dot (Mahr) et l'harmonie du foyer.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#bec9c2]/40 shadow-xs">
          <span className="material-symbols-outlined text-[#004532] text-xl">mosque</span>
          <div className="text-left">
            <span className="font-body text-[10px] text-[#6f7973] uppercase font-bold block">Spécialité</span>
            <span className="font-display text-xs font-bold text-[#151c27]">Fiqh al-Nikah &amp; Traditions Niger</span>
          </div>
        </div>
      </div>

      {/* Preset Suggestions Quick Chips */}
      <div className="space-y-2">
        <p className="font-body text-xs font-bold text-[#3f4944] uppercase tracking-wider flex items-center gap-1.5 px-1">
          <span className="material-symbols-outlined text-sm text-[#004532]">lightbulb</span>
          <span>Questions fréquentes &amp; Sujets clés :</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-2xl bg-white border border-[#bec9c2]/40 text-[#004532] font-body text-xs font-semibold hover:border-[#004532] hover:bg-[#004532]/5 hover:shadow-xs transition-all cursor-pointer disabled:opacity-50 text-left flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm text-[#745c00]">help_outline</span>
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="glass-card rounded-[28px] border border-[#bec9c2]/30 shadow-xl overflow-hidden flex flex-col h-[520px] bg-gradient-to-b from-white via-[#f9f9ff] to-white">
        {/* Chat Messages Body */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
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
                  <div className="w-9 h-9 rounded-full bg-[#004532] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#004532] text-white rounded-br-none font-body'
                      : 'bg-white border border-[#bec9c2]/40 text-[#151c27] rounded-bl-none font-body whitespace-pre-line'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#bec9c2]/20">
                      <span className="font-display font-bold text-[#004532] text-xs">Imam Oumar</span>
                      <span className="text-[10px] text-[#6f7973] font-body">Guide Spirituel Zawaj</span>
                    </div>
                  )}

                  <p>{msg.text}</p>

                  <div className={`mt-2 text-[10px] ${isUser ? 'text-emerald-100 text-right' : 'text-[#6f7973] text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-[#dce2f3] text-[#004532] font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-1">
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
              <div className="w-9 h-9 rounded-full bg-[#004532] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
              </div>
              <div className="bg-white border border-[#bec9c2]/40 rounded-2xl px-4 py-3 text-xs font-body text-[#3f4944] flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#004532] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#004532] animate-bounce delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-[#004532] animate-bounce delay-300"></span>
                <span className="ml-1 text-[#004532] font-semibold">Imam Oumar rédige sa réponse...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#bec9c2]/30 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Posez votre question à Imam Oumar (ex: dot, rôle du Wali, fiançailles)..."
            className="flex-grow h-12 bg-[#f0f3ff] border border-[#bec9c2]/40 rounded-2xl px-4 text-xs sm:text-sm font-body text-[#151c27] focus:outline-none focus:border-[#004532] focus:ring-2 focus:ring-[#004532]/15"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="h-12 px-5 rounded-2xl bg-[#004532] text-white font-display font-bold text-xs sm:text-sm hover:bg-[#065f46] disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
          >
            <span>Envoyer</span>
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
