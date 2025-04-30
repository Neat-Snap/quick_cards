"use client";

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
        openInvoice: (
          invoiceUrl: string, 
          callback?: (status: "paid" | "cancelled" | "failed" | string) => void
        ) => void;
      };
    };
  }
}

// Simplified Telegram WebApp detection as suggested
export const isTelegramWebApp = () => {
  if (typeof window === 'undefined') return false;
  // Check if we're running inside Telegram's WebApp environment
  return Boolean(window.Telegram && window.Telegram.WebApp);
};

export const getTelegramUser = () => {
  if (!isTelegramWebApp()) {
    return null;
  }
  
  return window.Telegram.WebApp.initDataUnsafe.user || null;
};

export const getInitData = (): string => {
  if (!isTelegramWebApp()) {
    return '';
  }
  
  return window.Telegram.WebApp.initData;
};

export const expandApp = (): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.expand();
  }
};

export const closeApp = (): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.close();
  }
};

export const setAppReady = (): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.ready();
  }
};

export const getColorScheme = (): 'light' | 'dark' => {
  if (!isTelegramWebApp()) {
    // Default to light mode if not in Telegram WebApp
    return 'light';
  }
  
  return window.Telegram.WebApp.colorScheme as 'light' | 'dark';
};

export const getThemeParams = () => {
  if (!isTelegramWebApp()) {
    return null;
  }
  
  return window.Telegram.WebApp.themeParams;
}; 