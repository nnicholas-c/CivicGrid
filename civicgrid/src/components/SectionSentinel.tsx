/**
 * SectionSentinel Component
 * Detects when a section re-enters the viewport
 */

import { useEffect, useRef } from 'react';

type ScrollDirection = 'up' | 'down';

interface SectionSentinelProps {
  position: 'top' | 'bottom';
  onEnter: (direction: ScrollDirection) => void;
  threshold?: number;
}

export default function SectionSentinel({ position, onEnter, threshold = 0.1 }: SectionSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Determine direction based on sentinel position
            let direction: ScrollDirection;

            if (position === 'top') {
              // Top sentinel visible means scrolling up into section
              direction = 'up';
            } else {
              // Bottom sentinel visible means scrolling down into section
              direction = 'down';
            }

            // Only fire on re-entry (not initial mount)
            if (hasEnteredRef.current) {
              console.log(`🎯 Section re-entered from ${direction}`);
              onEnter(direction);
            } else {
              hasEnteredRef.current = true;
            }
          }
        });
      },
      {
        threshold,
        rootMargin: '0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [position, onEnter, threshold]);

  return (
    <div
      ref={sentinelRef}
      className="absolute pointer-events-none"
      style={{
        [position]: 0,
        left: 0,
        right: 0,
        height: '1px',
        opacity: 0,
      }}
      aria-hidden="true"
    />
  );
}
