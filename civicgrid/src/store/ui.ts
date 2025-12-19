/**
 * UI Store - Manages reveal phase and one-shot header/phone fade behavior
 */

import { create } from 'zustand';

export type RevealPhase = 'pre' | 'fade-bars' | 'done';

interface UIState {
  // Original reveal phase
  revealPhase: RevealPhase;
  setRevealPhase: (phase: RevealPhase) => void;

  // One-shot first reveal tracking
  firstRevealDone: boolean;
  markFirstRevealDone: () => void;

  // Opacity states for header, phone, and CTAs
  headerOpacity: number;
  phoneOpacity: number;
  ctasOpacity: number;

  // Opacity setters
  setHeaderOpacity: (opacity: number) => void;
  setPhoneOpacity: (opacity: number) => void;
  setCTAsOpacity: (opacity: number) => void;

  // Dev helper to reset state
  resetForDev: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Original state
  revealPhase: 'pre',
  setRevealPhase: (phase) => set({ revealPhase: phase }),

  // One-shot reveal state - starts false, becomes true after 5s reappear
  firstRevealDone: false,
  markFirstRevealDone: () => {
    console.log('🎬 First reveal done - header/phone will stay visible on future scrolls');
    set({ firstRevealDone: true });
  },

  // Opacity states - start at 1 (visible)
  headerOpacity: 1,
  phoneOpacity: 1,
  ctasOpacity: 1,

  // Opacity setters
  setHeaderOpacity: (opacity) => set({ headerOpacity: Math.max(0, Math.min(1, opacity)) }),
  setPhoneOpacity: (opacity) => set({ phoneOpacity: Math.max(0, Math.min(1, opacity)) }),
  setCTAsOpacity: (opacity) => set({ ctasOpacity: Math.max(0, Math.min(1, opacity)) }),

  // Dev helper
  resetForDev: () => {
    console.log('🔄 Resetting UI state for dev testing');
    set({
      firstRevealDone: false,
      headerOpacity: 1,
      phoneOpacity: 1,
      ctasOpacity: 1,
      revealPhase: 'pre',
    });
  },
}));
