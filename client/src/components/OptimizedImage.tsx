import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  publicId: string;
  width?: number;
  height?: number;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Premium Optimized Image Component.
 * Automatically handles Cloudinary optimizations, lazy loading, and smooth transitions.
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  publicId,
  width,
  height,
  alt,
  className = '',
  priority = false,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedUrl = getOptimizedImageUrl(publicId, width, height);
  const placeholderUrl = getOptimizedImageUrl(publicId, 20, 20); // Very tiny low-res version

  useEffect(() => {
    if (priority) {
      const img = new Image();
      img.src = optimizedUrl;
      img.onload = () => setLoaded(true);
    }
  }, [optimizedUrl, priority]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`} style={{ width, height }}>
      {/* Tiny placeholder for blur-up effect */}
      {!loaded && !error && (
        <img
          src={placeholderUrl}
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          alt={alt}
        />
      )}

      {/* Main image */}
      <img
        src={optimizedUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`
          absolute inset-0 w-full h-full object-cover transition-opacity duration-500
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
        {...props}
      />

      {/* Loading indicator for slow connections */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs">
          Failed to load
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
