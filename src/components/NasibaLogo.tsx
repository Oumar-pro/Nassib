import React from 'react';

export interface NasibaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  lightMode?: boolean;
}

/**
 * Pure SVG Vector Emblem of the Official Nassib Logo
 * Two stylized figures (man in deep emerald, woman in bronze gold) forming the letter 'N'
 * with a 4-point central blessing star.
 */
export const NassibLogoIcon: React.FC<{ size?: number | string; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  const idPrefix = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="85 30 316 316"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Logo NASSIB"
    >
      <defs>
        {/* Deep Emerald Green Gradient for Male Figure */}
        <linearGradient
          id={`${idPrefix}-maleBody`}
          x1="120"
          y1="100"
          x2="290"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#042C24" />
          <stop offset="30%" stopColor="#073B30" />
          <stop offset="65%" stopColor="#0B4E40" />
          <stop offset="100%" stopColor="#062E25" />
        </linearGradient>

        {/* Male Arm Inner Specular Silk Sheen */}
        <linearGradient
          id={`${idPrefix}-maleSheen`}
          x1="184"
          y1="102"
          x2="235"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#84C6B8" stopOpacity="0.95" />
          <stop offset="20%" stopColor="#52A595" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#216D60" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0B4E40" stopOpacity="0" />
        </linearGradient>

        {/* Male Head Radial Gradient */}
        <radialGradient
          id={`${idPrefix}-maleHead`}
          cx="38%"
          cy="34%"
          r="62%"
        >
          <stop offset="0%" stopColor="#115E4F" />
          <stop offset="50%" stopColor="#083D32" />
          <stop offset="100%" stopColor="#03201A" />
        </radialGradient>

        {/* Bronze Champagne Gold Gradient for Female Figure */}
        <linearGradient
          id={`${idPrefix}-femaleBody`}
          x1="275"
          y1="135"
          x2="375"
          y2="335"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#E5C38D" />
          <stop offset="25%" stopColor="#CF9F63" />
          <stop offset="55%" stopColor="#B78448" />
          <stop offset="85%" stopColor="#8C5A28" />
          <stop offset="100%" stopColor="#6B4219" />
        </linearGradient>

        {/* Female Head Radial Gradient */}
        <radialGradient
          id={`${idPrefix}-femaleHead`}
          cx="38%"
          cy="34%"
          r="62%"
        >
          <stop offset="0%" stopColor="#E8C692" />
          <stop offset="45%" stopColor="#C79557" />
          <stop offset="85%" stopColor="#96632D" />
          <stop offset="100%" stopColor="#6F451B" />
        </radialGradient>

        {/* Central Blessing Star Gradient */}
        <linearGradient
          id={`${idPrefix}-star`}
          x1="220"
          y1="245"
          x2="270"
          y2="315"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#E5C38D" />
          <stop offset="45%" stopColor="#C49356" />
          <stop offset="100%" stopColor="#8A5826" />
        </linearGradient>
      </defs>

      {/* ==================== LEFT FIGURE (MALE - DEEP EMERALD) ==================== */}
      {/* Male Head */}
      <circle cx="191" cy="69" r="26" fill={`url(#${idPrefix}-maleHead)`} />

      {/* Male Left Torso / Column (Left Stem of 'N') */}
      <path
        d="M 183.5 102
           C 172 103, 140 121, 124 154
           C 113 178, 113 214, 113 250
           L 113 327
           C 113 333, 116 335, 120 332
           C 136 322, 168 288, 183.5 268
           L 183.5 102
           Z"
        fill={`url(#${idPrefix}-maleBody)`}
      />

      {/* Male Diagonal Arm (Diagonal Stroke of 'N') */}
      <path
        d="M 183.5 102
           C 185 130, 205 200, 302 280
           C 303 277, 303 268, 296 258
           C 246 195, 204 142, 183.5 102
           Z"
        fill={`url(#${idPrefix}-maleBody)`}
      />

      {/* High-Precision Sheen / Highlight on the Arm Crest */}
      <path
        d="M 183.5 102
           C 184.5 128, 195 175, 226 215
           C 216 195, 198 145, 186.5 104
           Z"
        fill={`url(#${idPrefix}-maleSheen)`}
      />

      {/* ==================== RIGHT FIGURE (FEMALE - WARM BRONZE GOLD) ==================== */}
      {/* Female Head */}
      <circle cx="316.5" cy="103" r="23" fill={`url(#${idPrefix}-femaleHead)`} />

      {/* Female Body (Right Stem of 'N') */}
      <path
        d="M 316.5 133
           C 328 133, 360 155, 373 185
           L 373 328
           C 373 333, 370 335, 366 332
           C 350 322, 324 290, 316.5 268
           L 316.5 212
           C 313 185, 298 168, 281 174
           C 277 175, 274 170, 276 166
           C 286 145, 305 133, 316.5 133
           Z"
        fill={`url(#${idPrefix}-femaleBody)`}
      />

      {/* ==================== CENTRAL STAR (BLESSING SPARKLE) ==================== */}
      <path
        d="M 245 248
           C 245 265, 233 281, 217 281
           C 233 281, 245 297, 245 314
           C 245 297, 257 281, 273 281
           C 257 281, 245 265, 245 248
           Z"
        fill={`url(#${idPrefix}-star)`}
      />
    </svg>
  );
};

export const NasibaLogo: React.FC<NasibaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  lightMode = false,
}) => {
  // Dimensions for the vector emblem & typographic logo
  const dimMap = {
    xs: { icon: 26, title: 'text-[17px] font-bold' },
    sm: { icon: 34, title: 'text-[22px] font-extrabold' },
    md: { icon: 42, title: 'text-[26px] font-extrabold' },
    lg: { icon: 50, title: 'text-2xl font-extrabold' },
    xl: { icon: 62, title: 'text-3xl font-extrabold' },
    '2xl': { icon: 78, title: 'text-4xl font-extrabold' },
  };

  const currentDim = dimMap[size] || dimMap.md;

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 shrink-0 select-none group ${className}`}>
      {/* Official Vector Logo Emblem */}
      <div className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <NassibLogoIcon size={currentDim.icon} />
      </div>

      {/* Refined Brand Text Logo (Nassib with warm gold accent dot) */}
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-serif-display font-bold tracking-tight ${
              lightMode ? 'text-white' : 'text-[#0F5C4D]'
            } ${currentDim.title}`}
          >
            Nassib
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C99355] shrink-0 translate-y-[-1px]"></span>
        </div>
      )}
    </div>
  );
};
