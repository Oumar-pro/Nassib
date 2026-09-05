import React from 'react';

interface NasibaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  lightMode?: boolean;
}

export const NasibaLogo: React.FC<NasibaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  // Dimensions for the vector emblem & typographic logo
  const dimMap = {
    sm: { icon: 28, title: 'text-[17px]' },
    md: { icon: 34, title: 'text-xl' },
    lg: { icon: 44, title: 'text-2xl' },
    xl: { icon: 56, title: 'text-3xl' },
  };

  const currentDim = dimMap[size] || dimMap.md;

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 shrink-0 select-none group ${className}`}>
      {/* Pristine Emerald & Champagne Gold Vector Emblem */}
      <div 
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: currentDim.icon, height: currentDim.icon }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Subtle Outer Soft Glow */}
          <circle cx="50" cy="50" r="46" fill="#0F5C4D" fillOpacity="0.08" />
          
          {/* Main Emerald Outer Medallion */}
          <rect
            x="14"
            y="14"
            width="72"
            height="72"
            rx="22"
            fill="#0F5C4D"
            stroke="#C9A45C"
            strokeWidth="2"
            strokeOpacity="0.45"
          />

          {/* Delicate Champagne Gold Inner Ring */}
          <rect
            x="20"
            y="20"
            width="60"
            height="60"
            rx="16"
            stroke="#C9A45C"
            strokeWidth="1.2"
            strokeDasharray="4 2"
            strokeOpacity="0.6"
          />

          {/* Interlocking Halal Union Motif */}
          {/* Ring 1 - Left Partner */}
          <circle
            cx="44"
            cy="47"
            r="17"
            stroke="#FAF8F2"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Ring 2 - Right Partner */}
          <circle
            cx="56"
            cy="53"
            r="17"
            stroke="#FAF8F2"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Gold Crescent Accent */}
          <path
            d="M54 33C57.5 35 60 39 60 43.5C60 50.4 54.4 56 47.5 56C44.5 56 41.8 54.9 39.7 53C41.8 56.5 45.6 59 50 59C56.6 59 62 53.6 62 47C62 40.9 57.5 35.8 54 33Z"
            fill="#C9A45C"
          />

          {/* Precious Champagne Gold Center Spark */}
          <path
            d="M50 26L51.8 31.2L57 33L51.8 34.8L50 40L48.2 34.8L43 33L48.2 31.2L50 26Z"
            fill="#C9A45C"
          />

          {/* Fine Gold Dot Accents */}
          <circle cx="50" cy="74" r="2.2" fill="#C9A45C" />
          <circle cx="28" cy="50" r="1.5" fill="#C9A45C" fillOpacity="0.8" />
          <circle cx="72" cy="50" r="1.5" fill="#C9A45C" fillOpacity="0.8" />
        </svg>
      </div>

      {/* Refined Brand Text Logo (Title Case, Clean Serif & Dot, No Clutter) */}
      {showText && (
        <div className="flex items-center gap-1 leading-none">
          <span
            className={`font-serif-display font-bold text-[#0F5C4D] ${currentDim.title} tracking-normal`}
          >
            Nassib
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C] shrink-0 translate-y-[-1px]"></span>
        </div>
      )}
    </div>
  );
};
