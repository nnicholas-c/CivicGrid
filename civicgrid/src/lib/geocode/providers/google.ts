/**
 * Google Places Autocomplete Provider
 */

import type { GeocodeProvider, Suggestion } from '../types';

export function googleProvider(): GeocodeProvider {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  return {
    async autocomplete(query, opts = {}) {
      if (!apiKey) {
        console.warn('VITE_GOOGLE_MAPS_KEY not configured');
        return [];
      }

      const { limit = 5, bias, signal } = opts;

      // Build URL with parameters
      const params = new URLSearchParams({
        input: query,
        key: apiKey,
        types: 'address',
      });

      // Add location bias if provided
      if (bias) {
        params.append('location', `${bias.lat},${bias.lng}`);
        if (bias.radius) {
          params.append('radius', bias.radius.toString());
        }
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;

      try {
        const response = await fetch(url, { signal });
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.error('Google Places API error:', data.status);
          return [];
        }

        const predictions = data.predictions || [];

        // Fetch place details to get lat/lng
        const suggestions: Suggestion[] = await Promise.all(
          predictions.slice(0, limit).map(async (pred: any) => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?${new URLSearchParams({
              place_id: pred.place_id,
              key: apiKey,
              fields: 'geometry,address_components,formatted_address',
            })}`;

            const detailsResp = await fetch(detailsUrl, { signal });
            const detailsData = await detailsResp.json();

            if (detailsData.status !== 'OK') {
              return null;
            }

            const result = detailsData.result;
            const location = result.geometry?.location;

            // Parse address components
            const components = result.address_components || [];
            const address: any = {};

            components.forEach((comp: any) => {
              if (comp.types.includes('street_number')) address.number = comp.long_name;
              if (comp.types.includes('route')) address.street = comp.long_name;
              if (comp.types.includes('locality')) address.city = comp.long_name;
              if (comp.types.includes('administrative_area_level_1')) address.state = comp.short_name;
              if (comp.types.includes('postal_code')) address.postalCode = comp.long_name;
              if (comp.types.includes('country')) address.country = comp.short_name;
            });

            return {
              id: pred.place_id,
              label: pred.description,
              lat: location.lat,
              lng: location.lng,
              secondary: pred.structured_formatting?.secondary_text,
              address,
              source: 'google' as const,
            };
          })
        );

        return suggestions.filter((s): s is Suggestion => s !== null);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return [];
        }
        console.error('Google autocomplete error:', error);
        return [];
      }
    },
  };
}
