/**
 * Geocoding Provider Factory
 */

import type { GeocodeProvider, ProviderId } from './types';
import { googleProvider } from './providers/google';
import { mapboxProvider } from './providers/mapbox';
import { geoapifyProvider } from './providers/geoapify';
import { nominatimProvider } from './providers/nominatim';

const DEFAULT: ProviderId = (import.meta.env.VITE_GEOCODER as ProviderId) || 'geoapify';

export function getProvider(id: ProviderId = DEFAULT): GeocodeProvider {
  switch (id) {
    case 'google':
      return googleProvider();
    case 'mapbox':
      return mapboxProvider();
    case 'geoapify':
      return geoapifyProvider();
    case 'nominatim':
      return nominatimProvider();
  }
}

export type { ProviderId, Suggestion, GeocodeProvider } from './types';
