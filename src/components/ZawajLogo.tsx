import React from 'react';
import zawajLogoImg from '../assets/images/zawaj_logo.png';

interface ZawajLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textColor?: string;
}

export const ZawajLogo: React.FC<ZawajLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const heightMap = {
    sm: 'h-10 sm:h-12',
    md: 'h-14 sm:h-16',
    lg: 'h-16 sm:h-20',
    xl: 'h-20 sm:h-28',
  };

  const logoHeight = heightMap[size] || heightMap.md;

  return (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src={zawajLogoImg}
        alt="Zawaj"
        referrerPolicy="no-referrer"
        className={`${logoHeight} w-auto object-contain rounded-xl shadow-xs transition-transform duration-200 hover:scale-[1.02]`}
      />
    </div>
  );
};

