/**
 * Deterministic background rotation sequence
 * Always starts with GGB (index 0) on mount
 * No randomness, no localStorage persistence
 */

export const BG_SEQUENCE = [
  { id: 'GGB', src: '/golden-gate-bridge.jpg' },
  { id: 'NYC', src: '/nyc.jpg' },
] as const;

export type BgId = (typeof BG_SEQUENCE)[number]['id'];
