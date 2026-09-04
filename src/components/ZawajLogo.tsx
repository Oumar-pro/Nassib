import React from 'react';
import { NasibaLogo } from './NasibaLogo';

interface ZawajLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textColor?: string;
}

export const ZawajLogo: React.FC<ZawajLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  return (
    <NasibaLogo
      size={size}
      showText={showText}
      className={className}
    />
  );
};


