"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, validateUser } from '@/lib/api';
import { isTelegramWebApp, setAppReady, expandApp, getTelegramUser } from '@/lib/telegram';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if we're in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);

  // Initialize Telegram WebApp when the component mounts
  useEffect(() => {
    const initTelegramWebApp = () => {
      // Safety check to ensure we're in a browser environment
      if (typeof window === 'undefined') return;

      try {
        // Check if Telegram WebApp is available
        if (isTelegramWebApp()) {
          // Expand the WebApp to take the whole screen
          expandApp();
          // Mark the WebApp as ready
          setAppReady();
          console.log("Telegram WebApp initialized successfully");
        } else {
          console.log("Not running in Telegram WebApp environment");
          if (!isDevelopment) {
            setError("This app must be opened from Telegram");
          }
        }
      } catch (err) {
        console.error("Error initializing Telegram WebApp:", err);
        setError("Failed to initialize Telegram WebApp");
      } finally {
        // Mark initialization as complete, whether it succeeded or not
        setIsWebAppReady(true);
      }
    };

    // Execute initialization
    initTelegramWebApp();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    setError(null);

    try {
      // For development purposes, if not in Telegram WebApp and in development mode, use a mock user
      if (!isTelegramWebApp() && isDevelopment) {
        console.log('Not running in Telegram WebApp, using mock data');
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
        
        setUser(mockUser);
        setLoading(false);
        return;
      }

      // Try to validate with backend in all other cases
      console.log("Attempting to validate user with backend...");
      const response = await validateUser();

      if (response.success && response.user) {
        console.log("User validated successfully:", response.user.first_name);
        setUser(response.user);
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
  };

  // Only fetch user data after the WebApp is ready
  useEffect(() => {
    if (isWebAppReady) {
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