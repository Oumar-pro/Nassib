import React, { useState, useEffect } from 'react';
import { getSafeAvatarFallback } from '../../lib/imageOptimizer';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  fallbackName?: string;
  className?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Photo de profil',
  fallbackName = 'Membre',
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || undefined);

  useEffect(() => {
    setHasError(false);
    setCurrentSrc(src || undefined);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(getSafeAvatarFallback(fallbackName));
    }
  };

  if (!currentSrc || hasError) {
    return (
      <img
        src={getSafeAvatarFallback(fallbackName)}
        alt={alt}
        className={className}
        loading="lazy"
        {...props}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};

export default SafeImage;
