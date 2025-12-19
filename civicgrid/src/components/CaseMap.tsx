/**
 * MapLibre Case Map Component
 * Uses MapTiler for vector tiles (no watermarks, free tier available)
 * Color-coded markers for civic issue status
 */

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion } from 'framer-motion';
import type { Case, CaseStatus } from '../types';

interface CaseMapProps {
  cases: Case[];
  className?: string;
}

// Color coding for different case statuses
const STATUS_COLORS: Record<CaseStatus, string> = {
  created: '#f59e0b',      // Amber - Reported
  routed: '#f59e0b',       // Amber - Reported
  accepted: '#3b82f6',     // Blue - In Progress
  in_progress: '#3b82f6', // Blue - In Progress
  verification: '#3b82f6', // Blue - In Progress
  resolved: '#10b981',     // Green - Completed
  paid: '#10b981',         // Green - Completed
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

export default function CaseMap({ cases, className = '' }: CaseMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard against double initialization (React 18 StrictMode)
    if (!mapContainer.current || map.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_KEY;

    // Debug logging
    console.log('🗺️ MapTiler key present?', !!apiKey);
    console.log('🗺️ MapTiler key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');

    if (!apiKey) {
      const errorMsg = 'MapTiler API key not configured. Set VITE_MAPTILER_KEY in your environment.';
      setError(errorMsg);
      console.error('❌ VITE_MAPTILER_KEY is not set');
      return;
    }

    // San Francisco coordinates
    const sfCenter: [number, number] = [-122.4194, 37.7749];

    try {
      console.log('🗺️ Initializing MapLibre with MapTiler streets-v2...');

      // Initialize MapLibre with MapTiler style
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: sfCenter,
        zoom: 12,
        attributionControl: true, // Keep attribution visible (required)
      });

      map.current.on('load', () => {
        console.log('✅ MapLibre loaded successfully!');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('❌ MapLibre error:', e);
        console.error('❌ Error details:', e.error);
        setError(`Failed to load map: ${e.error?.message || 'Unknown error'}`);
      });

      // Add navigation controls (zoom in/out, compass)
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Add scale control
      map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      console.log('🗺️ Map controls added');

    } catch (err) {
      console.error('❌ Error initializing map:', err);
      setError('Failed to initialize map. Please refresh the page.');
    }

    return () => {
      // Cleanup
      console.log('🗺️ Cleaning up map instance');
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when cases change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log(`🗺️ Updating ${cases.length} markers on map`);

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each case
    cases.forEach((caseItem) => {
      if (!caseItem.location || !caseItem.location.lat || !caseItem.location.lng) return;

      const color = STATUS_COLORS[caseItem.status] || '#6b7280';
      const statusLabel = STATUS_LABELS[caseItem.status] || caseItem.status;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'case-marker';
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup content with better styling
      const popupContent = `
        <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #111;">
            ${caseItem.category || 'Civic Issue'} #${caseItem.id}
          </div>
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background-color: ${color}; color: white;">
              ${statusLabel}
            </span>
          </div>
          ${caseItem.description ? `
            <div style="color: #666; font-size: 14px; margin-top: 8px; line-height: 1.4;">
              ${caseItem.description.substring(0, 150)}${caseItem.description.length > 150 ? '...' : ''}
            </div>
          ` : ''}
          ${caseItem.location.address ? `
            <div style="color: #999; font-size: 12px; margin-top: 8px;">
              📍 ${caseItem.location.address}
            </div>
          ` : `
            <div style="color: #999; font-size: 11px; margin-top: 8px; font-family: monospace;">
              📍 ${caseItem.location.lat.toFixed(4)}, ${caseItem.location.lng.toFixed(4)}
            </div>
          `}
          ${caseItem.reporter ? `
            <div style="color: #999; font-size: 12px; margin-top: 6px;">
              Reported by: ${caseItem.reporter}
            </div>
          ` : ''}
        </div>
      `;

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
      }).setHTML(popupContent);

      // Create and add marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([caseItem.location.lng, caseItem.location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (cases.length > 0 && cases.some((c) => c.location)) {
      const bounds = new maplibregl.LngLatBounds();

      cases.forEach((caseItem) => {
        if (caseItem.location) {
          bounds.extend([caseItem.location.lng, caseItem.location.lat]);
        }
      });

      map.current!.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
      });

      console.log('🗺️ Map bounds fitted to markers');
    }
  }, [cases, mapLoaded]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl ${className}`} style={{ minHeight: '600px' }}>
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-red-600 dark:text-red-400 font-bold text-lg mb-3">Map Error</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{error}</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-4">
            Check your VITE_MAPTILER_KEY environment variable and ensure the dev server was restarted after setting it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '600px' }}>
      {/* Map Container - Explicit height ensures proper rendering */}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ minHeight: '600px', height: '100%' }}
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {mapLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-6 left-6 glass-strong p-4 rounded-xl border border-white/30 shadow-lg"
        >
          <h4 className="text-sm font-bold text-white mb-3">Status Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b', border: '2px solid white' }}></div>
              <span className="text-xs text-white font-semibold">Reported</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6', border: '2px solid white' }}></div>
              <span className="text-xs text-white font-semibold">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981', border: '2px solid white' }}></div>
              <span className="text-xs text-white font-semibold">Completed</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Overlay */}
      {mapLoaded && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute top-6 right-6 glass-strong p-4 rounded-xl border border-white/30 shadow-lg"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white gradient-text">{cases.length}</div>
            <div className="text-xs text-white font-semibold mt-1">Active Cases</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
