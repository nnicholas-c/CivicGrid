// API Configuration - easily switchable between dev and prod

const config = {
  // Base API URL - change this when backend is deployed
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',

  // Enable mock mode for development without backend
  useMockData: process.env.REACT_APP_USE_MOCK === 'true' || true,

  // Image upload settings
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],

  // Polling interval for status updates (ms)
  pollingInterval: 30000, // 30 seconds
};

export default config;
