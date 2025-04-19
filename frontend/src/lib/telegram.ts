"use client";

import { FORCE_API_CALLS, DEBUG_TELEGRAM, MOCK_INIT_DATA, isDevelopment } from './dev-utils';

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

// Improved Telegram WebApp detection
export const isTelegramWebApp = (): boolean => {
  const hasWebApp = typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp);
  if (DEBUG_TELEGRAM) {
    console.log('Telegram WebApp detection:', hasWebApp);
    if (hasWebApp) {
      console.log('InitData available:', Boolean(window.Telegram.WebApp.initData));
      console.log('User data available:', Boolean(window.Telegram.WebApp.initDataUnsafe?.user));
    }
  }
  
  // In development with FORCE_API_CALLS, always return true
  if (isDevelopment && FORCE_API_CALLS) {
    console.log('FORCED Telegram WebApp detection in development mode');
    return true;
  }
  
  return hasWebApp;
};

export const getTelegramUser = () => {
  if (!isTelegramWebApp() && !(isDevelopment && FORCE_API_CALLS)) {
    return null;
  }
  
  // In forced mode for development, return a mock user
  if (isDevelopment && FORCE_API_CALLS && (!window.Telegram?.WebApp)) {
    console.log('Returning MOCK user data for development');
    return {
      id: 12345678,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      language_code: "en"
    };
  }
  
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  if (DEBUG_TELEGRAM) {
    if (user) {
      console.log('Telegram user data:', user);
    } else {
      console.log('No Telegram user found in initDataUnsafe');
    }
  }
  return user;
};

export const getInitData = (): string => {
  // In forced mode for development, return mock init data
  if (isDevelopment && FORCE_API_CALLS && (!window.Telegram?.WebApp || !window.Telegram.WebApp.initData)) {
    console.log('Returning MOCK initData for development');
    return MOCK_INIT_DATA;
  }
  
  if (!isTelegramWebApp()) {
    console.log('Cannot get initData - not in Telegram WebApp');
    return '';
  }
  
  const initData = window.Telegram.WebApp.initData;
  if (DEBUG_TELEGRAM) {
    console.log('InitData length:', initData?.length || 0);
    if (initData) {
      console.log('InitData:', initData.substring(0, 50) + '...');
    }
  }
  return initData;
};

export const expandApp = (): void => {
  if (isTelegramWebApp() && window.Telegram?.WebApp?.expand) {
    if (DEBUG_TELEGRAM) console.log('Expanding Telegram WebApp');
    window.Telegram.WebApp.expand();
  }
};

export const closeApp = (): void => {
  if (isTelegramWebApp() && window.Telegram?.WebApp?.close) {
    if (DEBUG_TELEGRAM) console.log('Closing Telegram WebApp');
    window.Telegram.WebApp.close();
  }
};

export const setAppReady = (): void => {
  if (isTelegramWebApp() && window.Telegram?.WebApp?.ready) {
    if (DEBUG_TELEGRAM) console.log('Setting Telegram WebApp as ready');
    window.Telegram.WebApp.ready();
  }
};

export const getColorScheme = (): 'light' | 'dark' => {
  if (!isTelegramWebApp() || !window.Telegram?.WebApp) {
    // Default to light mode if not in Telegram WebApp
    return 'light';
  }
  
  return window.Telegram.WebApp.colorScheme as 'light' | 'dark';
};

export const getThemeParams = () => {
  if (!isTelegramWebApp() || !window.Telegram?.WebApp) {
    return null;
  }
  
  return window.Telegram.WebApp.themeParams;
}; 