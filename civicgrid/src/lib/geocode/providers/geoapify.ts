/**
 * Geoapify Geocoding Provider
 */

import type { GeocodeProvider, Suggestion } from '../types';

export function geoapifyProvider(): GeocodeProvider {
  const apiKey = import.meta.env.VITE_GEOAPIFY_KEY;

  return {
    async autocomplete(query, opts = {}) {
      if (!apiKey) {
        console.warn('VITE_GEOAPIFY_KEY not configured');
        return [];
      }

      const { limit = 5, bias, signal } = opts;

      // Build URL
      const params = new URLSearchParams({
        text: query,
        apiKey,
        limit: limit.toString(),
        format: 'json',
      });

      // Add bias
      if (bias) {
        params.append('bias', `proximity:${bias.lng},${bias.lat}`);
      }

      const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params}`;

      try {
        const response = await fetch(url, { signal });
        const data = await response.json();

        const results = data.results || [];

        const suggestions: Suggestion[] = results.map((result: any) => {
          const address: any = {};

          if (result.housenumber) address.number = result.housenumber;
          if (result.street) address.street = result.street;
          if (result.city) address.city = result.city;
          if (result.state) address.state = result.state;
          if (result.postcode) address.postalCode = result.postcode;
          if (result.country_code) address.country = result.country_code.toUpperCase();

          // Build secondary text
          const parts = [result.city, result.state, result.country].filter(Boolean);
          const secondary = parts.join(', ');

          return {
            id: result.place_id || `${result.lat},${result.lon}`,
            label: result.formatted || `${result.lat}, ${result.lon}`,
            lat: result.lat,
            lng: result.lon,
            secondary,
            address,
            source: 'geoapify' as const,
          };
        });

        return suggestions;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return [];
        }
        console.error('Geoapify autocomplete error:', error);
        return [];
      }
    },
  };
}
