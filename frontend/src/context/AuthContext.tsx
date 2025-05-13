"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, validateUser, getUserById } from '@/lib/api';
import { isTelegramWebApp, setAppReady, expandApp, getTelegramUser, getInitData } from '@/lib/telegram';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  logout: () => void;
  refreshUser: () => Promise<void>;
  sharedUserId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDevelopment = process.env.NODE_ENV === 'development';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const [sharedUserId, setSharedUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (storedToken) {
      console.log("Found stored token on initialization");
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const initTelegramWebApp = () => {
      if (typeof window === 'undefined') return;

      try {
        console.log("Window Telegram object:", typeof window.Telegram);
        console.log("Window Telegram WebApp:", typeof window.Telegram?.WebApp);
        
        if (isTelegramWebApp()) {
          expandApp();
          setAppReady();
          console.log("Telegram WebApp initialized successfully");
          console.log("Init data available:", Boolean(getInitData()));
          console.log("User data available:", Boolean(getTelegramUser()));
        } else {
          console.log("Not running in Telegram WebApp environment");
          if (!isDevelopment) {
            setError("This app must be opened from Telegram");
          }
        }
      } catch (err) {
        console.error("Error initializing Telegram WebApp:", err);
        setError("Failed to initialize Telegram WebApp. Please try again.");
      } finally {
        setIsWebAppReady(true);
      }
    };

    const timer = setTimeout(() => {
      initTelegramWebApp();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkForSharedCard = () => {
      if (isTelegramWebApp() && window.Telegram?.WebApp?.initDataUnsafe) {
        const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
        console.log("Start param detected:", startParam);
        
        if (startParam && startParam.startsWith('id')) {
          const userId = startParam.substring(2);
          console.log("Shared user ID detected:", userId);
          setSharedUserId(userId);
        }
      }
    };
    
    setTimeout(checkForSharedCard, 500);
  }, []);

  const refreshUser = async () => {
    setLoading(true);
  
    try {
      if (!isTelegramWebApp() && isDevelopment) {
        console.log('Using mock data for development');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser: User = {
          id: 1,
          telegram_id: '12345678',
          username: 'mock_user',
          first_name: 'Mock',
          last_name: 'User',
          avatar_url: '',
          background_color: '#f0f0f0',
          description: 'This is a mock user for development',
          badge: 'Developer',
          is_premium: false
        };
        
        localStorage.setItem('authToken', 'mock-auth-token-for-development');
        
        setUser(mockUser);
        setError(null);
        return;
      }
  
      console.log("Attempting to validate user with backend...");
      
      const initData = getInitData();
      console.log("InitData retrieved, length:", initData?.length || 0);
      
      if (!initData && !isDevelopment) {
        console.error("No init data available after Telegram WebApp initialization");
        setError("Missing Telegram authentication data. Please try opening the app again from Telegram.");
        setLoading(false);
        return;
      }
      
      console.log("Making authentication request to: /v1/auth/init");
      
      const response = await validateUser();
      console.log("Auth response:", response);
  
      if (response.success && response.user) {
        console.log("User validated successfully:", response.user);
        setUser(response.user);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (token) {
          console.log("JWT token is available for authenticated requests");
        } else {
          console.warn("No JWT token found after successful authentication");
        }
      } else {
        console.error("Failed to validate user:", response.error);
        setError(response.error || 'Failed to authenticate with Telegram');
        setUser(null);
        
        setInitAttempts(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error during user validation:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setUser(null);
      setInitAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  useEffect(() => {
    if (isWebAppReady) {
      console.log("WebApp is ready, attempting to fetch user data...");
      refreshUser();
    }
  }, [isWebAppReady]);

  useEffect(() => {
    if (initAttempts > 0 && initAttempts < 3 && error) {
      console.log(`Retrying authentication (attempt ${initAttempts + 1})...`);
      const timer = setTimeout(() => {
        refreshUser();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [initAttempts, error]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading: loading && initAttempts < 3,
        error: initAttempts >= 3 ? error : null,
        logout,
        refreshUser,
        sharedUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};