/**
 * BackgroundRotator Component
 * Crossfades between background images with optional zoom
 * Uses mode="wait" to prevent overlay glitches (only one image fully visible at a time)
 */

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface BackgroundRotatorProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function BackgroundRotator({ src, alt = '', className = '' }: BackgroundRotatorProps) {
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is loaded (handles both cached and fresh images)
  useEffect(() => {
    setImageLoaded(false);

    // Check if image is already loaded from cache
    if (imgRef.current?.complete) {
      console.log(`🖼️ Background already cached: ${src}`);
      setImageLoaded(true);
    }
  }, [src]);

  // Animation variants
  const variants = {
    enter: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1,
    },
    center: {
      opacity: 1,
      scale: prefersReducedMotion ? 1 : 1.04,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 0.6,
        ease: 'easeInOut',
      },
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1.02,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 0.6,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={src}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        className={`absolute inset-0 ${className}`}
        style={{ willChange: 'opacity, transform', pointerEvents: 'none' }}
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${src}')`,
            // Remove opacity check - images are preloaded by useBackgroundCycle
            // Framer Motion handles the opacity animation
          }}
        >
          {/* Hidden img for onLoad detection and preload verification */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="hidden"
            onLoad={() => {
              console.log(`🖼️ Background loaded: ${src}`);
              setImageLoaded(true);
            }}
            onError={() => {
              console.error(`❌ Failed to load background image: ${src}`);
              setImageLoaded(true); // Show anyway to avoid infinite loading
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
