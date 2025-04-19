"use client";

// Function to check if the URL includes Telegram WebApp parameters
const isUrlFromTelegram = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const url = window.location.search;
  return url.includes('tgWebAppData') || 
         url.includes('tgWebAppVersion') || 
         url.includes('tgWebAppPlatform');
};

// Function to check if we're in a frame that likely comes from Telegram
const isInsideTelegramFrame = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if we're in an iframe
    const isInIframe = window !== window.parent;
    // Check if we have a referrer from Telegram domains
    const referrer = document.referrer || '';
    const hasTelegramReferrer = referrer.includes('telegram.org') || 
                               referrer.includes('t.me') ||
                               referrer.includes('telegram.me');
    
    return isInIframe || hasTelegramReferrer;
  } catch (e) {
    console.error('Error checking if inside Telegram frame:', e);
    return false;
  }
};

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          auth_date?: string;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        onEvent: (event: string, callback: Function) => void;
        offEvent: (event: string, callback: Function) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: Function) => void;
          offClick: (callback: Function) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: Function) => void;
          offClick: (callback: Function) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        isVersionAtLeast: (version: string) => boolean;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        openLink: (url: string) => void;
        platform: string;
        version: string;
        colorScheme: string;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
      };
    };
  }
}

// Improved Telegram WebApp detection with multiple checks
export const isTelegramWebApp = (): boolean => {
  // Primary check: WebApp object exists
  const hasWebAppObject = typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp);
  
  // Secondary checks based on URL and frame
  const hasWebAppUrl = isUrlFromTelegram();
  const isInTelegramFrame = isInsideTelegramFrame();
  
  // For detection in production, we use multiple factors
  const isInTelegram = hasWebAppObject || hasWebAppUrl || isInTelegramFrame;
  
  console.log('Telegram detection:', { 
    hasWebAppObject, 
    hasWebAppUrl, 
    isInTelegramFrame,
    isInTelegram,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unavailable',
    initDataAvailable: hasWebAppObject ? Boolean(window.Telegram.WebApp.initData) : false
  });
  
  return isInTelegram;
};

export const getTelegramUser = () => {
  if (!isTelegramWebApp()) {
    return null;
  }
  
  try {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
    if (user) {
      console.log('Telegram user detected:', user.id, user.first_name);
    } else {
      console.log('No Telegram user found in initDataUnsafe');
      // Try to get user info via URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      if (userParam) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userParam));
          console.log('Found user info in URL parameters', parsedUser);
          return parsedUser;
        } catch (e) {
          console.error('Failed to parse user from URL parameters:', e);
        }
      }
    }
    return user;
  } catch (e) {
    console.error('Error getting Telegram user:', e);
    return null;
  }
};

export const getInitData = (): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    // Try to get from Telegram WebApp object
    if (window.Telegram?.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      console.log('InitData from WebApp object, length:', initData?.length || 0);
      if (initData) return initData;
    }
    
    // Fallback: try to get from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tgWebAppData = urlParams.get('tgWebAppData');
    if (tgWebAppData) {
      console.log('InitData from URL, length:', tgWebAppData.length);
      return tgWebAppData;
    }
    
    console.log('No initData found');
    return '';
  } catch (e) {
    console.error('Error getting initData:', e);
    return '';
  }
};

export const expandApp = (): void => {
  if (isTelegramWebApp() && window.Telegram?.WebApp?.expand) {
    console.log('Expanding Telegram WebApp');
    try {
      window.Telegram.WebApp.expand();
    } catch (e) {
      console.error('Error expanding WebApp:', e);
    }
  }
};

export const closeApp = (): void => {
  if (isTelegramWebApp() && window.Telegram?.WebApp?.close) {
    try {
      window.Telegram.WebApp.close();
    } catch (e) {
      console.error('Error closing WebApp:', e);
    }
  }
};

export const setAppReady = (): void => {
  if (isTelegramWebApp() && window.Telegram?.WebApp?.ready) {
    console.log('Setting Telegram WebApp as ready');
    try {
      window.Telegram.WebApp.ready();
    } catch (e) {
      console.error('Error setting WebApp ready:', e);
    }
  }
};

export const getColorScheme = (): 'light' | 'dark' => {
  if (!isTelegramWebApp() || !window.Telegram?.WebApp?.colorScheme) {
    // Default to dark mode if not in Telegram WebApp
    return 'dark';
  }
  
  return window.Telegram.WebApp.colorScheme as 'light' | 'dark';
};

export const getThemeParams = () => {
  if (!isTelegramWebApp() || !window.Telegram?.WebApp?.themeParams) {
    return null;
  }
  
  return window.Telegram.WebApp.themeParams;
}; 