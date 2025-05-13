const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';


export const getTelegramWebApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};


export const getInitData = () => {
  const webApp = getTelegramWebApp();
  if (webApp && webApp.initData) {
    return webApp.initData;
  }

  const url = window.location.href;
  if (url.includes('tgWebAppData=')) {
    try {
      const tgWebAppDataParam = url.split('tgWebAppData=')[1];
      const initData = tgWebAppDataParam.split('&')[0];
      return decodeURIComponent(initData);
    } catch (error) {
      console.error('Error extracting tgWebAppData from URL:', error);
    }
  }

  return null;
};


export const getThemeParams = () => {
  const webApp = getTelegramWebApp();
  if (webApp && webApp.themeParams) {
    return webApp.themeParams;
  }

  const url = window.location.href;
  if (url.includes('tgWebAppThemeParams=')) {
    try {
      const themeParamsParam = url.split('tgWebAppThemeParams=')[1];
      const themeParamsStr = themeParamsParam.split('&')[0];
      return JSON.parse(decodeURIComponent(themeParamsStr));
    } catch (error) {
      console.error('Error extracting theme params from URL:', error);
    }
  }

  return null;
};


export const authenticateWithTelegram = async () => {
  const initData = getInitData();
  
  if (!initData) {
    throw new Error('No Telegram init data available');
  }
  
  try {
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
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};


export const addTelegramAuthToRequest = (options = {}) => {
  const initData = getInitData();
  const token = localStorage.getItem('authToken');
  
  const headers = options.headers || {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }
  
  return {
    ...options,
    headers,
  };
};


export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};


export const logout = () => {
  localStorage.removeItem('authToken');
}; 