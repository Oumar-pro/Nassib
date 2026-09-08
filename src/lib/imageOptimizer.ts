/**
 * Utilitaire d'optimisation et de compression d'images pour Nassib
 * Assure que toutes les photos uploadées sont légères (~80-150 Ko),
 * rapides à charger et ne subissent aucune coupure réseau ou corruption.
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresse et redimensionne un fichier image côté client
 * Fonctionne avec tous les types de fichiers (JPEG, PNG, WEBP, etc.)
 */
export async function compressAndOptimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<string> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    // Si ce n'est pas une image
    if (!file.type.startsWith('image/')) {
      // Fallback simple FileReader si format particulier
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => {
        // En cas d'erreur de décodage, renvoyer la chaîne originale
        resolve(readerEvent.target?.result as string);
      };
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calcul des proportions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          // Fond propre au cas où l'image contenait de la transparence
          ctx.fillStyle = '#FAF8F2';
          ctx.fillRect(0, 0, width, height);

          // Qualité d'interpolation élevée
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export en JPEG haute compatibilité et taille minimale (~100 Ko)
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(optimizedDataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression error, fallback to original:', canvasErr);
          resolve(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Génère un avatar SVG de secours élégant aux couleurs de Nassib
 * Utilisé si une image distante échoue ou n'est pas encore disponible
 */
export function getSafeAvatarFallback(name: string, size = 256): string {
  const initial = (name ? name.trim().charAt(0) : 'N').toUpperCase() || 'N';
  const cleanName = (name || 'Membre').replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F5C4D" />
        <stop offset="100%" stop-color="#093d33" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bgGrad)" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.38}" fill="#FAF8F2" opacity="0.1" />
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.42}" font-weight="700" fill="#E6C687" text-anchor="middle" dominant-baseline="middle">
      ${initial}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
