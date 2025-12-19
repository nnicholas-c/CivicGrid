/**
 * MapTiler Diagnostic Page
 * Tests if MapTiler API key is working
 */

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapTest() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const key = import.meta.env.VITE_MAPTILER_KEY;
    setApiKey(key || 'NOT SET');

    if (!key) {
      setStatus('❌ VITE_MAPTILER_KEY not found in environment');
      return;
    }

    if (!mapContainer.current) {
      setStatus('❌ Map container not found');
      return;
    }

    setStatus('Loading MapTiler...');

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`,
        center: [-122.4194, 37.7749],
        zoom: 12,
      });

      map.current.on('load', () => {
        setStatus('✅ MapTiler loaded successfully!');
      });

      map.current.on('error', (e) => {
        setStatus(`❌ MapTiler error: ${e.error?.message || 'Unknown error'}`);
        console.error('MapTiler error:', e);
      });

    } catch (err: any) {
      setStatus(`❌ Exception: ${err.message}`);
      console.error('Map initialization error:', err);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          MapTiler Diagnostic
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Status</h2>
          <div className="text-lg font-mono mb-4 p-4 bg-gray-100 dark:bg-gray-900 rounded">
            {status}
          </div>

          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">API Key</h3>
          <div className="text-sm font-mono p-3 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
            {apiKey}
          </div>

          <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white">Expected Key</h3>
          <div className="text-sm font-mono p-3 bg-gray-100 dark:bg-gray-900 rounded">
            kgYkjh663uOlJUEDvDA3
          </div>

          {apiKey !== 'kgYkjh663uOlJUEDvDA3' && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded">
              <p className="text-red-800 dark:text-red-200 font-bold">⚠️ API Key Mismatch!</p>
              <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                The API key in your environment doesn't match the expected key.
                <br />
                Make sure `.env` has: VITE_MAPTILER_KEY=kgYkjh663uOlJUEDvDA3
                <br />
                Then restart the dev server: npm run dev
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Map Preview</h2>
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg border-2 border-gray-300 dark:border-gray-700"
          />
        </div>

        <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Troubleshooting</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>If map doesn't load, check browser console (F12) for errors</li>
            <li>Verify .env file has VITE_MAPTILER_KEY=kgYkjh663uOlJUEDvDA3</li>
            <li>Restart dev server after changing .env</li>
            <li>Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)</li>
            <li>Check Network tab for failed requests to api.maptiler.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
