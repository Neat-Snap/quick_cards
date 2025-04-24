"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, validateUser } from '@/lib/api';
import { isTelegramWebApp, setAppReady, expandApp, getTelegramUser, getInitData } from '@/lib/telegram';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null; // Add token to context
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if we're in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // State for token
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);

  // Load token from localStorage on mount
  useEffect(() => {
    // Try to load token from localStorage
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (storedToken) {
      console.log("Found stored token on initialization");
      setToken(storedToken);
    }
  }, []);

  // Initialize Telegram WebApp when the component mounts
  useEffect(() => {
    const initTelegramWebApp = () => {
      // Safety check to ensure we're in a browser environment
      if (typeof window === 'undefined') return;

      try {
        console.log("Window Telegram object:", typeof window.Telegram);
        console.log("Window Telegram WebApp:", typeof window.Telegram?.WebApp);
        
        // Check if Telegram WebApp is available
        if (isTelegramWebApp()) {
          // Expand the WebApp to take the whole screen
          expandApp();
          // Mark the WebApp as ready
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
        // Mark initialization as complete, whether it succeeded or not
        setIsWebAppReady(true);
      }
    };

    // Short delay to ensure Telegram script is fully loaded
    const timer = setTimeout(() => {
      initTelegramWebApp();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Improved refreshUser function with token handling
  const refreshUser = async () => {
    setLoading(true);

    try {
      // For development purposes, if not in Telegram WebApp and in development mode, use a mock user
      if (!isTelegramWebApp() && isDevelopment) {
        console.log('Using mock data for development');
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser: User = {
          id: 1,
          telegram_id: '12345678',
          username: 'mock_user',
          first_name: 'Mock',
          last_name: 'User',
          avatar: '',
          background_color: '#f0f0f0',
          description: 'This is a mock user for development',
          badge: 'Developer',
          is_premium: false
        };
        
        // Set mock token for development
        const mockToken = "dev_mock_token_123456";
        localStorage.setItem('authToken', mockToken);
        setToken(mockToken);
        
        setUser(mockUser);
        setError(null);
        return;
      }

      // Try to validate with backend in all other cases
      console.log("Attempting to validate user with backend...");
      
      // Check again that we have init data
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
        
        // Set token in state if present in response
        if (response.token) {
          console.log("Setting token in state");
          setToken(response.token);
        }
        
        setError(null);
      } else {
        console.error("Failed to validate user:", response.error);
        setError(response.error || 'Failed to authenticate with Telegram');
        setUser(null);
        
        // Increment validation attempts if there was an error
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

  // Only fetch user data after the WebApp is ready
  useEffect(() => {
    if (isWebAppReady) {
      console.log("WebApp is ready, attempting to fetch user data...");
      refreshUser();
    }
  }, [isWebAppReady]);

  // Add retry logic for failed initializations
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
        token, // Provide token in context
        loading: loading && initAttempts < 3, // Only show loading if we're still within retry attempts
        error: initAttempts >= 3 ? error : null, // Only show error after all retry attempts
        logout,
        refreshUser,
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