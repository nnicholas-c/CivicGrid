/**
 * Final Timeline Hook - Fast reveal animation (3.5s total)
 */

import { useAnimation, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { useUIStore } from '../store/ui';

export function useFinalTimeline() {
  const bgControls = useAnimation();
  const titleControls = useAnimation();
  const ctaControls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const hasPlayed = useRef(false);
  const setRevealPhase = useUIStore((state) => state.setRevealPhase);

  const start = async () => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;

    if (prefersReducedMotion) {
      // Reduced motion: simple fades only
      await Promise.all([
        bgControls.start({ opacity: 1, transition: { duration: 0.4 } }),
        titleControls.start({ opacity: 1, transition: { duration: 0.4, delay: 0.2 } }),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      setRevealPhase('fade-bars');

      await Promise.all([
        bgControls.start({ opacity: 0.55, transition: { duration: 0.5 } }),
        ctaControls.start({ opacity: 1, transition: { duration: 0.5 } }),
      ]);

      setRevealPhase('done');
      return;
    }

    // Fast animation timeline

    // t=0-0.5s: Background fades in with zoom
    bgControls.start({
      opacity: 1,
      scale: 1.04,
      transition: { duration: 0.5, ease: 'easeOut' },
    });

    // t=0.3-1.2s: Title blur to crisp with scale (faster)
    await new Promise((resolve) => setTimeout(resolve, 300));
    titleControls.start({
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1.02,
      transition: { duration: 0.9, ease: 'easeOut' },
    });

    // Hold vivid until t=2.0s (reduced from 3.6s)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // t=2.0s: Signal to fade bars
    setRevealPhase('fade-bars');

    // t=2.0-3.5s: Background softens, CTAs appear (faster)
    await Promise.all([
      bgControls.start({
        opacity: 0.55,
        transition: { duration: 1.5, ease: 'easeInOut' },
      }),
      new Promise((resolve) => setTimeout(resolve, 100)).then(() =>
        ctaControls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 1.2, ease: 'easeOut' },
        })
      ),
    ]);

    setRevealPhase('done');
  };

  return {
    bgControls,
    titleControls,
    ctaControls,
    start,
  };
}
