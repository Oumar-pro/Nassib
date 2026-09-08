import React, { useState } from 'react';
import { Profile } from '../../types';

interface MessageIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSelectIdea?: (text: string) => void;
}

export const MessageIdeasModal: React.FC<MessageIdeasModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSelectIdea,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const targetName = profile.name ? profile.name.split(' ')[0] : 'vous';

  const ideas = [
    {
      title: 'Salutation sobre & respectueuse',
      desc: 'Idéal pour briser la glace avec courtoisie et adab.',
      text: `As-salamu alaykum ${targetName}, votre profil m'a particulièrement touché(e) par sa sincérité et vos valeurs. Si vous êtes également ouvert(e) à faire connaissance dans le respect de notre éthique, ce sera un plaisir d'échanger avec vous.`,
    },
    {
      title: 'Affinité sur la foi & le projet de vie',
      desc: 'Met en avant vos points communs spirituels et vos objectifs.',
      text: `As-salamu alaykum ${targetName}, j'ai beaucoup apprécié votre vision du mariage et vos principes de vie. Nous partageons des repères communs importants pour bâtir un foyer serein. Seriez-vous d'accord pour échanger quelques mots ?`,
    },
    {
      title: 'Démarche sérieuse & familiale',
      desc: 'Précise immédiatement une intention claire orientée mariage.',
      text: `As-salamu alaykum ${targetName}, je suis dans une démarche sincère et orientée vers le mariage selon nos valeurs. Votre profil correspond à ce que je recherche en termes de piété et de caractère. Qu'Allah bénisse nos démarches.`,
    },
    {
      title: 'Approche conviviale & bienveillante',
      desc: 'Simple, chaleureux et respectueux.',
      text: `As-salamu alaykum wa rahmatullah, j'espère que vous vous portez bien. Votre présentation m'a beaucoup plu. Seriez-vous disponible pour faire plus ample connaissance dans le cadre sécurisé de l'application ?`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    if (onSelectIdea) {
      onSelectIdea(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211E1A]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E8E3D7] max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-[#E8E3D7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAF5F2] text-[#0F5C4D] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">lightbulb</span>
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#211E1A]">
                Idées de premier message
              </h3>
              <p className="text-xs text-[#7D766C]">
                Modèles courtois, halal et prêts à l'emploi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#7D766C] hover:text-[#211E1A] hover:bg-[#FAF8F2] rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-[#E8E3D7] bg-[#FAF8F2]/60 hover:bg-[#FAF8F2] transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-xs font-bold text-[#211E1A]">
                    {idea.title}
                  </h4>
                  <p className="text-[11px] text-[#7D766C]">{idea.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(idea.text, idx)}
                  className={`px-3 py-1.5 rounded-xl font-display text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copiedIndex === idx
                      ? 'bg-[#0F5C4D] text-white'
                      : 'bg-white border border-[#E8E3D7] text-[#0F5C4D] hover:bg-[#EAF5F2]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedIndex === idx ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedIndex === idx ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              <p className="text-xs text-[#575147] leading-relaxed italic bg-white p-3 rounded-xl border border-[#E8E3D7]/80">
                "{idea.text}"
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0F5C4D] text-white font-display text-xs font-bold hover:bg-[#0c4a3e] transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageIdeasModal;
