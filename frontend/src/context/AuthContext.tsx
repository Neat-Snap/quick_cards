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

  const refreshUser = async () => {
    setLoading(true);
    setError(null);

    try {
      // For development purposes, if not in Telegram WebApp and in development mode, use a mock user
      if (!isTelegramWebApp() && isDevelopment) {
        console.warn('Not running in Telegram WebApp, using mock data');
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
      const response = await validateUser();

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setError(response.error || 'Failed to authenticate with Telegram');
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  useEffect(() => {
    // Initialize Telegram WebApp
    if (isTelegramWebApp()) {
      expandApp();
      setAppReady();
    }

    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
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