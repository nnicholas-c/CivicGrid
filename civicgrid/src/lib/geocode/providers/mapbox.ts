/**
 * Mapbox Geocoding Provider
 */

import type { GeocodeProvider, Suggestion } from '../types';

export function mapboxProvider(): GeocodeProvider {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  return {
    async autocomplete(query, opts = {}) {
      if (!token) {
        console.warn('VITE_MAPBOX_TOKEN not configured');
        return [];
      }

      const { limit = 5, bias, signal } = opts;

      // Build URL
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: token,
        limit: limit.toString(),
        types: 'address,poi',
      });

      // Add proximity bias
      if (bias) {
        params.append('proximity', `${bias.lng},${bias.lat}`);
      }

      const url = `${endpoint}?${params}`;

      try {
        const response = await fetch(url, { signal });
        const data = await response.json();

        const features = data.features || [];

        const suggestions: Suggestion[] = features.map((feature: any) => {
          const [lng, lat] = feature.center;
          const context = feature.context || [];

          // Parse address from context
          const address: any = {};
          context.forEach((ctx: any) => {
            const [type] = ctx.id.split('.');
            if (type === 'postcode') address.postalCode = ctx.text;
            if (type === 'place') address.city = ctx.text;
            if (type === 'region') address.state = ctx.short_code?.split('-')[1];
            if (type === 'country') address.country = ctx.short_code;
          });

          // Extract street info from place_name
          const parts = feature.place_name.split(',');
          if (parts.length > 0) {
            const streetPart = parts[0].trim();
            const match = streetPart.match(/^(\d+)\s+(.+)$/);
            if (match) {
              address.number = match[1];
              address.street = match[2];
            } else {
              address.street = streetPart;
            }
          }

          return {
            id: feature.id,
            label: feature.place_name,
            lat,
            lng,
            secondary: parts.slice(1).join(',').trim(),
            address,
            source: 'mapbox' as const,
          };
        });

        return suggestions;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return [];
        }
        console.error('Mapbox autocomplete error:', error);
        return [];
      }
    },
  };
}
