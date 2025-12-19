// Configuration file
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true', // Default to false - use real Firebase data
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL || '',
};

export default config;
