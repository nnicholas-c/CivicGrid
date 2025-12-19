/**
 * Nominatim (OpenStreetMap) Geocoding Provider
 * Free/OSS provider - respect usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

import type { GeocodeProvider, Suggestion } from '../types';

export function nominatimProvider(): GeocodeProvider {
  return {
    async autocomplete(query, opts = {}) {
      const { limit = 5, bias, signal } = opts;

      // Build URL
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: limit.toString(),
      });

      // Add viewbox bias if provided
      if (bias && bias.radius) {
        const r = bias.radius / 111000; // rough deg conversion
        const viewbox = [
          bias.lng - r,
          bias.lat + r,
          bias.lng + r,
          bias.lat - r,
        ].join(',');
        params.append('viewbox', viewbox);
        params.append('bounded', '1');
      }

      const url = `https://nominatim.openstreetmap.org/search?${params}`;

      try {
        const response = await fetch(url, {
          signal,
          headers: {
            'User-Agent': 'CivicGrid/1.0', // Required by Nominatim policy
          },
        });
        const data = await response.json();

        const suggestions: Suggestion[] = data.map((result: any) => {
          const addr = result.address || {};
          const address: any = {};

          if (addr.house_number) address.number = addr.house_number;
          if (addr.road) address.street = addr.road;
          if (addr.city || addr.town || addr.village) {
            address.city = addr.city || addr.town || addr.village;
          }
          if (addr.state) address.state = addr.state;
          if (addr.postcode) address.postalCode = addr.postcode;
          if (addr.country_code) address.country = addr.country_code.toUpperCase();

          // Build secondary text
          const parts = [address.city, address.state, addr.country].filter(Boolean);
          const secondary = parts.join(', ');

          return {
            id: result.place_id?.toString() || result.osm_id?.toString(),
            label: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            secondary,
            address,
            source: 'nominatim' as const,
          };
        });

        return suggestions;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return [];
        }
        console.error('Nominatim autocomplete error:', error);
        return [];
      }
    },
  };
}
