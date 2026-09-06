import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Conversation, User } from '../../types';

interface MessagesViewProps {
  user: User;
  conversations: Conversation[];
  activeMessages: Message[];
  activeConvId?: string | null;
  onSelectConversation?: (convId: string | null) => void;
  onSendMessage: (text: string, convId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user,
  conversations,
  activeMessages,
  activeConvId = null,
  onSelectConversation,
  onSendMessage
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConvId);
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'supervised'>('all');

  // Sync selectedConvId when activeConvId prop changes
  React.useEffect(() => {
    setSelectedConvId(activeConvId || null);
  }, [activeConvId]);

  const handleSelectConv = (id: string | null) => {
    setSelectedConvId(id);
    onSelectConversation?.(id);
  };

  const currentConv = conversations.find((c) => c.id === selectedConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;
    onSendMessage(inputText.trim(), selectedConvId);
    setInputText('');
  };

  const conversationMessages = activeMessages.filter(
    (msg) => msg.conversationId === selectedConvId
  );

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participantCity.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'unread') return conv.unreadCount > 0;
    if (filterTab === 'supervised') return conv.isSupervised;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn min-h-[calc(100vh-6rem)]">
      <AnimatePresence mode="wait">
        {selectedConvId === null || !currentConv ? (
          /* VIEW 1: CONVERSATIONS LIST ONLY */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col space-y-4"
          >
            {/* Conversations Header (directly on background) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0F5C4D]">
                    Mes Discussions & Messages
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-[#575147] mt-0.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#C9A45C]">security</span>
                    Échanges éthiques sous la supervision de votre Wali ({user.waliInfo?.name || 'Tuteur'})
                  </p>
                </div>

                {/* Status indicator */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8BAE9F]/20 text-[#0F5C4D] border border-[#8BAE9F]/30 font-body text-xs font-semibold self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-[#0F5C4D] animate-pulse"></span>
                  {conversations.length} conversation{conversations.length > 1 ? 's' : ''} active{conversations.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D766C] text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, ville ou message..."
                    className="w-full bg-white border border-[#E8E3D7] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-body text-[#211E1A] focus:ring-2 focus:ring-[#0F5C4D]/20 focus:border-[#0F5C4D] transition-all placeholder:text-[#7D766C] shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D766C] hover:text-[#211E1A]"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white p-1 rounded-2xl border border-[#E8E3D7] shrink-0 shadow-2xs">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all cursor-pointer ${
                      filterTab === 'all'
                        ? 'bg-[#0F5C4D] text-white shadow-xs'
                        : 'text-[#575147] hover:text-[#0F5C4D]'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setFilterTab('supervised')}
                    className={`px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all cursor-pointer ${
                      filterTab === 'supervised'
                        ? 'bg-[#0F5C4D] text-white shadow-xs'
                        : 'text-[#575147] hover:text-[#0F5C4D]'
                    }`}
                  >
                    Supervisées
                  </button>
                  <button
                    onClick={() => setFilterTab('unread')}
                    className={`px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all cursor-pointer ${
                      filterTab === 'unread'
                        ? 'bg-[#0F5C4D] text-white shadow-xs'
                        : 'text-[#575147] hover:text-[#0F5C4D]'
                    }`}
                  >
                    Non lues
                  </button>
                </div>
              </div>
            </div>

            {/* Conversations List Items */}
            <div className="space-y-3 pt-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#8BAE9F]/20 text-[#0F5C4D] flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                  </div>
                  <h3 className="font-serif-display text-xl font-bold text-[#0F5C4D] mb-1">
                    Aucune conversation trouvée
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-[#575147] max-w-md mx-auto">
                    {searchQuery
                      ? 'Aucun contact ne correspond à votre recherche.'
                      : 'Vos futurs échanges sérieux avec vos prétendants apparaîtront ici.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  return (
                    <motion.div
                      key={conv.id}
                      whileHover={{ scale: 1.008, y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectConv(conv.id)}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E3D7] hover:border-[#0F5C4D]/40 shadow-xs hover:shadow-md cursor-pointer flex items-center gap-4 transition-all"
                    >
                      <div className="relative flex-shrink-0">
                        {conv.participantAvatar ? (
                          <img
                            src={conv.participantAvatar}
                            alt={conv.participantName}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#E8E3D7]"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#8BAE9F]/20 text-[#0F5C4D] border-2 border-[#E8E3D7] flex items-center justify-center font-display font-bold text-lg">
                            {conv.participantName ? conv.participantName.charAt(0).toUpperCase() : 'M'}
                          </div>
                        )}
                        {conv.onlineStatus && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0F5C4D] border-2 border-white shadow-xs"></span>
                        )}
                        {conv.isVerifiedNNI && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                            <span
                              className="material-symbols-outlined text-xs text-[#0F5C4D]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              verified
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="flex items-center gap-2 truncate">
                            <h3 className="font-display text-base sm:text-lg font-bold text-[#211E1A] truncate">
                              {conv.participantName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF8F2] border border-[#E8E3D7] text-[#575147] font-body text-[11px] font-medium shrink-0">
                              {conv.participantCity}
                            </span>
                          </div>
                          <span className="font-body text-xs text-[#0F5C4D] font-semibold shrink-0 ml-2">
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        <p className="font-body text-xs sm:text-sm text-[#575147] line-clamp-1 mb-2">
                          {conv.lastMessage}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          {conv.isSupervised && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#735619] text-[11px] font-bold">
                              <span className="material-symbols-outlined text-[13px] text-[#C9A45C]">security</span>
                              Supervisé par Wali
                            </span>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0F5C4D] text-white text-[10px] font-bold">
                              {conv.unreadCount} nouveau{conv.unreadCount > 1 ? 'x' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF8F2] border border-[#E8E3D7] text-[#0F5C4D] shrink-0">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          /* VIEW 2: ACTIVE CHAT INTERFACE ONLY (Directly on page background) */
          <motion.div
            key="chat-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-grow min-h-[calc(100vh-9rem)] relative"
          >
            {/* Chat Top Navigation Bar (Integrated directly on background) */}
            <div className="py-2.5 px-1 sm:px-2 flex justify-between items-center z-10 border-b border-[#E8E3D7] sticky top-0 bg-[#FAF8F2]/95 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                {/* BACK BUTTON TO RETURN TO CONVERSATIONS LIST */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectConv(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white text-[#0F5C4D] font-display text-xs sm:text-sm font-bold border border-[#E8E3D7] hover:bg-[#0F5C4D] hover:text-white transition-all cursor-pointer shrink-0 shadow-2xs"
                  title="Retour à la liste des conversations"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span className="hidden sm:inline">Conversations</span>
                </motion.button>

                <div className="h-6 w-px bg-[#E8E3D7] mx-0.5 shrink-0"></div>

                {currentConv.participantAvatar ? (
                  <img
                    src={currentConv.participantAvatar}
                    alt={currentConv.participantName}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-[#E8E3D7] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#8BAE9F]/20 text-[#0F5C4D] border border-[#8BAE9F]/30 flex items-center justify-center font-display font-bold text-sm shrink-0">
                    {currentConv.participantName ? currentConv.participantName.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <h2 className="font-display text-sm sm:text-base font-bold text-[#211E1A] leading-tight truncate">
                    {currentConv.participantName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#0F5C4D]"></span>
                    <span className="font-body text-xs text-[#575147] truncate">
                      En ligne • {currentConv.participantCity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supervision Badge (No audio/video call buttons) */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-2 bg-[#C9A45C]/15 border border-[#C9A45C]/30 px-3 py-1.5 rounded-2xl">
                  <span
                    className="material-symbols-outlined text-[#C9A45C] text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    security
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body text-[10px] font-bold text-[#735619] uppercase tracking-wider">
                      SUPERVISÉ PAR WALI
                    </span>
                    <span className="font-body text-[11px] text-[#575147]">
                      {user.waliInfo?.name || 'Tuteur légal'} {user.waliInfo?.relation ? `(${user.waliInfo.relation})` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Supervision Notice */}
            <div className="sm:hidden bg-[#C9A45C]/15 py-1.5 px-3 flex justify-center items-center gap-1.5 border-b border-[#C9A45C]/30 rounded-xl my-2">
              <span
                className="material-symbols-outlined text-[#C9A45C] text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
              <span className="font-body text-xs text-[#735619] font-semibold">
                Supervisé par le Wali ({user.waliInfo?.name || 'Tuteur'})
              </span>
            </div>

            {/* Messages Stream (Directly on app background) */}
            <div className="flex-grow py-4 px-1 sm:px-2 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
              <div className="flex justify-center my-1">
                <span className="bg-white text-[#575147] text-[11px] font-semibold px-3 py-1 rounded-full border border-[#E8E3D7] shadow-2xs">
                  Aujourd'hui
                </span>
              </div>

              {/* System Notice (Wali Joined) */}
              <div className="flex justify-center my-1">
                <div className="bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 max-w-lg text-center shadow-2xs">
                  <span className="material-symbols-outlined text-[#C9A45C] text-base shrink-0">security</span>
                  <p className="font-body text-xs text-[#575147] leading-relaxed">
                    Votre Wali désigné (<strong>{user.waliInfo?.name || 'Tuteur'}</strong>) assiste à cette session pour garantir un cadre d'échange éthique et serein.
                  </p>
                </div>
              </div>

              {/* Message List or Initial Empty State */}
              {conversationMessages.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0F5C4D]/10 text-[#0F5C4D] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
                  </div>
                  <h3 className="font-serif-display text-lg font-bold text-[#0F5C4D] mb-1">
                    Démarrez votre échange
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-[#575147] max-w-sm">
                    Que vos paroles soient empreintes de respect, de sincérité et de bienveillance. Rédigez votre premier message ci-dessous.
                  </p>
                </div>
              ) : (
                conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                      msg.isMine ? 'self-end flex-row-reverse' : 'self-start'
                    }`}
                  >
                    {!msg.isMine && (
                      msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-xl object-cover self-end mb-1 border border-[#E8E3D7] shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#8BAE9F]/20 text-[#0F5C4D] border border-[#8BAE9F]/30 flex items-center justify-center font-display font-bold text-xs self-end mb-1 shrink-0">
                          {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'M'}
                        </div>
                      )
                    )}

                    <div className={`flex flex-col gap-1 ${msg.isMine ? 'items-end' : 'items-start'}`}>
                      <span className="font-body text-[10px] text-[#7D766C] px-1">
                        {msg.senderName} • {msg.timestamp}
                      </span>
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl shadow-2xs text-xs sm:text-sm leading-relaxed font-body ${
                          msg.isMine
                            ? 'bg-[#0F5C4D] text-white rounded-br-xs'
                            : 'bg-white text-[#211E1A] rounded-bl-xs border border-[#E8E3D7]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input Form (Docked at bottom of viewport) */}
            <div className="sticky bottom-0 pt-2 pb-2 bg-[#FAF8F2]/95 backdrop-blur-md border-t border-[#E8E3D7]">
              <form onSubmit={handleSend} className="flex gap-2 sm:gap-3 items-center max-w-4xl mx-auto">
                <button
                  type="button"
                  className="p-2.5 text-[#7D766C] hover:text-[#0F5C4D] hover:bg-white rounded-2xl transition-colors shrink-0 cursor-pointer"
                  title="Joindre un fichier"
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>

                <div className="flex-grow bg-white border border-[#E8E3D7] rounded-2xl overflow-hidden focus-within:border-[#0F5C4D] focus-within:ring-2 focus-within:ring-[#0F5C4D]/20 transition-all shadow-2xs">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Rédigez un message respectueux..."
                    rows={1}
                    className="w-full bg-transparent border-none resize-none p-3 text-xs sm:text-sm font-body focus:ring-0 text-[#211E1A] placeholder:text-[#7D766C]"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-11 h-11 bg-[#0F5C4D] text-white rounded-2xl flex items-center justify-center hover:bg-[#0c4a3e] disabled:opacity-40 transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    send
                  </span>
                </motion.button>
              </form>

              <div className="text-center mt-1.5">
                <span className="font-body text-[10px] text-[#7D766C]">
                  Les échanges sont modérés afin d'assurer la sécurité et le respect des règles éthiques.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

