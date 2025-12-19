/**
 * Geocoding Types
 * Provider-agnostic types for address/place autocomplete
 */

export type ProviderId = 'google' | 'mapbox' | 'geoapify' | 'nominatim';

export type Suggestion = {
  id: string;              // provider place id
  label: string;           // full formatted label
  lat: number;
  lng: number;
  secondary?: string;      // neighborhood/city for 2-line display
  address?: Partial<{
    street: string;
    number: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
  source: ProviderId;
};

export type GeocodeProvider = {
  autocomplete: (q: string, opts?: {
    limit?: number;
    bias?: { lat: number; lng: number; radius?: number };
    signal?: AbortSignal;
  }) => Promise<Suggestion[]>;
};
