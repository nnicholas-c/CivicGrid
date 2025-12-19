/**
 * useScrollDirection Hook
 * Detects scroll direction with hysteresis to avoid jitter
 */

import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down';

export function useScrollDirection(threshold = 4): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('down');

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Pause direction tracking if reduced motion is preferred
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY;

      // Hysteresis: only update if movement exceeds threshold
      if (Math.abs(diff) >= threshold) {
        const newDirection: ScrollDirection = diff > 0 ? 'down' : 'up';
        if (newDirection !== direction) {
          setDirection(newDirection);
        }
        lastScrollY = scrollY;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [direction, threshold]);

  return direction;
}
