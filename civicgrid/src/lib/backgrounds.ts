/**
 * Deterministic background rotation sequence
 * Always starts with GGB (index 0) on mount
 * No randomness, no localStorage persistence
 */

import { assetUrl } from './assetUrl';

export const BG_SEQUENCE = [
  { id: 'GGB', src: assetUrl('/golden-gate-bridge.jpg') },
  { id: 'NYC', src: assetUrl('/nyc.jpg') },
] as const;

export type BgId = (typeof BG_SEQUENCE)[number]['id'];
