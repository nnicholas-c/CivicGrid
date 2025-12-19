/**
 * Final Reveal Component - One-shot header/phone fade behavior
 *
 * On first scroll into this section:
 * 1. Header & Phone fade out as you approach (scroll-driven, 1 → 0)
 * 2. Once in view, wait 3 seconds
 * 3. Fade them back in (0 → 1) and mark firstRevealDone
 * 4. Never auto-hide again on future scrolls
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useFinalTimeline } from '../hooks/useFinalTimeline';
import { useUIStore } from '../store/ui';
import BackgroundRotator from './BackgroundRotator';

interface FinalRevealProps {
  bgSrc?: string;
  title?: string;
  showCTAs?: boolean;
}

export default function FinalReveal({
  bgSrc = '/nyc.jpg',
  title = 'Ready to Fix Your City?',
  showCTAs = true,
}: FinalRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedTimerRef = useRef(false); // Prevent double timer in StrictMode

  // UI Store
  const firstRevealDone = useUIStore((state) => state.firstRevealDone);
  const setHeaderOpacity = useUIStore((state) => state.setHeaderOpacity);
  const setPhoneOpacity = useUIStore((state) => state.setPhoneOpacity);
  const setCTAsOpacity = useUIStore((state) => state.setCTAsOpacity);
  const markFirstRevealDone = useUIStore((state) => state.markFirstRevealDone);

  const prefersReducedMotion = useReducedMotion();

  // Detect when section is in view (first time only)
  const isInView = useInView(containerRef, {
    once: false, // We need to monitor it
    amount: 0.4 // 40% visible
  });

  // Scroll progress for this section (for scroll-driven fade)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 90%', 'start 20%'], // Tune these offsets for your layout
  });

  // Map scroll progress to opacity (only while !firstRevealDone)
  // progress 0 → 1 maps to opacity 1 → 0
  const scrollDrivenOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Original timeline controls for title/CTA animations
  const { titleControls, ctaControls, start } = useFinalTimeline();

  // ONE-SHOT SEQUENCE: Scroll-driven hide, then 5s reappear
  useEffect(() => {
    if (firstRevealDone) {
      // Already done - ensure everything is visible
      setHeaderOpacity(1);
      setPhoneOpacity(1);
      setCTAsOpacity(1);
      return;
    }

    // Subscribe to scroll progress and update header/phone opacity
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (!firstRevealDone) {
        const opacity = 1 - latest; // Invert: 0 → 1, 1 → 0
        setHeaderOpacity(opacity);
        setPhoneOpacity(opacity);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [firstRevealDone, scrollYProgress, setHeaderOpacity, setPhoneOpacity, setCTAsOpacity]);

  // 3-second timer: when section first comes into view
  useEffect(() => {
    if (isInView && !firstRevealDone && !hasStartedTimerRef.current) {
      console.log('🎬 Final Reveal is in view - starting 3s timer...');
      hasStartedTimerRef.current = true;

      // Start the timeline for title/CTAs
      start();

      // Start 3-second timer for header/phone reappear
      timerRef.current = setTimeout(() => {
        console.log('⏰ 3s elapsed - fading header/phone back in and marking done');

        // Fade back to 1
        setHeaderOpacity(1);
        setPhoneOpacity(1);
        setCTAsOpacity(1);

        // Mark as done (one-shot complete)
        markFirstRevealDone();
      }, 3000);
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isInView,
    firstRevealDone,
    setHeaderOpacity,
    setPhoneOpacity,
    setCTAsOpacity,
    markFirstRevealDone,
    start,
  ]);

  return (
    <div ref={containerRef} className="relative h-[140vh] w-full overflow-hidden">
      {/* Background Rotator - No fixed positioning to prevent overlay */}
      <div className="absolute inset-0 w-full h-full -z-10">
        <BackgroundRotator src={bgSrc} />
        {/* Cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 pointer-events-none" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* Content Container - Centered */}
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          {/* Title Card */}
          <motion.div
            className="text-center max-w-6xl mx-auto mb-12"
            initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
            animate={titleControls}
          >
            <div className="glass rounded-3xl border border-white/20 bg-white/20 dark:bg-neutral-900/30 backdrop-blur-2xl shadow-xl p-12 md:p-16">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-tight">
                {title.split(' ').slice(0, -2).join(' ')} <br />
                <span className="gradient-text text-6xl md:text-8xl lg:text-9xl block mt-4">
                  {title.split(' ').slice(-2).join(' ')}
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mt-8 font-medium">
                Join thousands of residents making their community better, one report at a time.
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          {showCTAs && (
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 12 }}
              animate={ctaControls}
            >
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="gradient-primary text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl border-2 border-white/60 glow-orange backdrop-blur-xl"
                >
                  Get Started Free
                </motion.button>
              </Link>
              <Link to="/cases">
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-strong px-12 py-6 rounded-2xl font-bold text-xl border-2 border-white/70 shadow-2xl text-white backdrop-blur-xl hover:border-white/90 transition-all"
                >
                  View Active Cases
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
