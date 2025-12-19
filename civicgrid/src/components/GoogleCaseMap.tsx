/**
 * Google Maps Component with Civic Issue Markers
 * Replaces MapLibre with Google Maps JavaScript API
 */

import { useEffect, useRef, useState } from 'react';
import type { Case, CaseStatus } from '../types';

interface GoogleCaseMapProps {
  cases: Case[];
  className?: string;
}

// Color coding for different case statuses
const STATUS_COLORS: Record<CaseStatus, string> = {
  created: '#f59e0b',      // Amber - Reported
  routed: '#f59e0b',
  accepted: '#3b82f6',     // Blue - In Progress
  in_progress: '#3b82f6',
  verification: '#3b82f6',
  resolved: '#10b981',     // Green - Completed
  paid: '#10b981',
  disputed: '#ef4444',     // Red - Disputed
};

const STATUS_LABELS: Record<string, string> = {
  created: 'Reported',
  routed: 'Reported',
  accepted: 'In Progress',
  in_progress: 'In Progress',
  verification: 'In Progress',
  resolved: 'Completed',
  paid: 'Completed',
  disputed: 'Disputed',
};

// Load Google Maps script dynamically
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function GoogleCaseMap({ cases, className = '' }: GoogleCaseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured. Set VITE_GOOGLE_MAPS_KEY in your environment.');
      console.error('VITE_GOOGLE_MAPS_KEY is not set');
      return;
    }

    if (!mapRef.current) return;

    // Initialize map
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map centered on San Francisco
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 12,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Add markers for cases
        updateMarkers(map, cases);
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please refresh the page.');
      });

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Update markers when cases change
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(mapInstanceRef.current, cases);
    }
  }, [cases]);

  const updateMarkers = (map: google.maps.Map, cases: Case[]) => {
    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    cases.forEach((caseItem) => {
      if (!caseItem.location) return;

      const color = STATUS_COLORS[caseItem.status] || '#6b7280';
      const statusLabel = STATUS_LABELS[caseItem.status] || caseItem.status;

      // Create custom marker icon with SVG
      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 10,
      };

      const marker = new google.maps.Marker({
        position: { lat: caseItem.location.lat, lng: caseItem.location.lng },
        map,
        icon,
        title: `Case #${caseItem.id}`,
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #111;">
              Case #${caseItem.id}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background-color: ${color}; color: white;">
                ${statusLabel}
              </span>
            </div>
            ${caseItem.description ? `<div style="color: #666; font-size: 14px; margin-top: 8px;">${caseItem.description}</div>` : ''}
            ${caseItem.reporter ? `<div style="color: #999; font-size: 12px; margin-top: 6px;">Reported by: ${caseItem.reporter}</div>` : ''}
          </div>
        `,
      });

      // Show info window on marker click
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (cases.length > 0 && cases.some((c) => c.location)) {
      const bounds = new google.maps.LatLngBounds();
      cases.forEach((caseItem) => {
        if (caseItem.location) {
          bounds.extend({
            lat: caseItem.location.lat,
            lng: caseItem.location.lng,
          });
        }
      });
      map.fitBounds(bounds);

      // Ensure minimum zoom
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl ${className}`}>
        <div className="text-center p-8">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ Map Error</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`w-full h-full rounded-2xl shadow-lg overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
