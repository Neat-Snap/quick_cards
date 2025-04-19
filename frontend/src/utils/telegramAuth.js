/**
 * Telegram Authentication Utilities
 * Functions to help with Telegram Mini App authentication
 */

// Import the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';

/**
 * Gets the Telegram WebApp object from the window
 * @returns {Object|null} Telegram WebApp object or null if not available
 */
export const getTelegramWebApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

/**
 * Extract init data from the Telegram WebApp or URL
 * @returns {string|null} Init data string or null if not available
 */
export const getInitData = () => {
  // First check if we have access to the Telegram WebApp
  const webApp = getTelegramWebApp();
  if (webApp && webApp.initData) {
    return webApp.initData;
  }

  // If not, try to get it from the URL
  const url = window.location.href;
  if (url.includes('tgWebAppData=')) {
    try {
      const tgWebAppDataParam = url.split('tgWebAppData=')[1];
      // Extract just the tgWebAppData part (until the next & if present)
      const initData = tgWebAppDataParam.split('&')[0];
      return decodeURIComponent(initData);
    } catch (error) {
      console.error('Error extracting tgWebAppData from URL:', error);
    }
  }

  return null;
};

/**
 * Extract theme params from the Telegram WebApp or URL
 * @returns {Object|null} Theme params object or null if not available
 */
export const getThemeParams = () => {
  // First check if we have access to the Telegram WebApp
  const webApp = getTelegramWebApp();
  if (webApp && webApp.themeParams) {
    return webApp.themeParams;
  }

  // If not, try to get it from the URL
  const url = window.location.href;
  if (url.includes('tgWebAppThemeParams=')) {
    try {
      const themeParamsParam = url.split('tgWebAppThemeParams=')[1];
      // Extract just the theme params part (until the next & if present)
      const themeParamsStr = themeParamsParam.split('&')[0];
      return JSON.parse(decodeURIComponent(themeParamsStr));
    } catch (error) {
      console.error('Error extracting theme params from URL:', error);
    }
  }

  return null;
};

/**
 * Authenticate with the backend using Telegram init data
 * @returns {Promise<Object>} Response from the auth endpoint
 */
export const authenticateWithTelegram = async () => {
  const initData = getInitData();
  
  if (!initData) {
    throw new Error('No Telegram init data available');
  }
  
  try {
    // Construct URL properly with API_URL
    const response = await fetch(`${API_URL}/v1/auth/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData,
      },
      body: JSON.stringify({ initData }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }
    
    const data = await response.json();
    
    // Store the token in localStorage for future use
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Add Telegram init data to API requests
 * @param {Object} options - Fetch options
 * @returns {Object} Updated fetch options with Telegram auth headers
 */
export const addTelegramAuthToRequest = (options = {}) => {
  const initData = getInitData();
  const token = localStorage.getItem('authToken');
  
  const headers = options.headers || {};
  
  // Add token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add init data if available
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }
  
  return {
    ...options,
    headers,
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * Logout user by removing auth token
 */
export const logout = () => {
  localStorage.removeItem('authToken');
}; 