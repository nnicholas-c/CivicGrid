/**
 * useBackgroundCycle Hook
 * Manages deterministic background rotation with currentIndex/nextIndex model
 * Always starts with GGB (index 0) on mount, no randomness, no persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BG_SEQUENCE } from '../lib/backgrounds';

type ScrollDirection = 'up' | 'down';

export function useBackgroundCycle() {
  // Always start with GGB (index 0)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const lastAdvanceTime = useRef(0);
  const preloadedImages = useRef<Set<string>>(new Set());

  const currentSrc = BG_SEQUENCE[currentIndex].src;
  const nextSrc = BG_SEQUENCE[nextIndex].src;

  // Preload image helper
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.current.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        console.log(`✅ Preloaded: ${src}`);
        resolve();
      };
      img.onerror = (err) => {
        console.error(`❌ Failed to preload: ${src}`, err);
        reject(err);
      };
      img.src = src;
    });
  }, []);

  // Preload all images on mount
  useEffect(() => {
    console.log('🔄 Preloading all backgrounds...');
    BG_SEQUENCE.forEach((bg) => {
      preloadImage(bg.src).catch((err) => {
        console.warn(`Failed to preload image: ${bg.src}`, err);
      });
    });
  }, [preloadImage]);

  // Advance: swap current→next, then advance next
  const advance = useCallback(
    async (_direction: ScrollDirection) => {
      const now = Date.now();
      const debounceTime = 500; // ms

      // Debounce: prevent rapid consecutive advances
      if (now - lastAdvanceTime.current < debounceTime) {
        console.log('⏸️ Advance debounced (too soon)');
        return;
      }

      lastAdvanceTime.current = now;

      // Calculate next indices
      const newCurrentIndex = nextIndex;
      const newNextIndex = (nextIndex + 1) % BG_SEQUENCE.length;

      console.log(
        `🔄 Advancing: current ${currentIndex}→${newCurrentIndex}, next ${nextIndex}→${newNextIndex}`
      );

      const newCurrentBg = BG_SEQUENCE[newCurrentIndex];
      const newNextBg = BG_SEQUENCE[newNextIndex];

      try {
        // Ensure both images are preloaded
        await Promise.all([
          preloadImage(newCurrentBg.src),
          preloadImage(newNextBg.src),
        ]);

        // Swap indices
        setCurrentIndex(newCurrentIndex);
        setNextIndex(newNextIndex);

        console.log(`✅ Advanced: hero=${newCurrentBg.id}, final=${newNextBg.id}`);
      } catch (err) {
        console.error('Failed to advance backgrounds:', err);
      }
    },
    [currentIndex, nextIndex, preloadImage]
  );

  return {
    currentSrc,
    nextSrc,
    currentIndex,
    nextIndex,
    advance,
  };
}
