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
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  const refreshUser = async () => {
    if (initializationAttempted) {
      console.log('Skipping duplicate initialization');
      return;
    }
    
    setInitializationAttempted(true);
    setLoading(true);
    setError(null);

    try {
      console.log('Starting user authentication...');
      console.log('Is in Telegram WebApp:', isTelegramWebApp());
      console.log('Is development mode:', isDevelopment);
      
      // For development purposes only, if not in Telegram WebApp and in development mode, use a mock user
      if (!isTelegramWebApp() && isDevelopment) {
        console.warn('Using mock data for development');
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

      // Try to get user data from Telegram WebApp
      console.log('Attempting to validate user with backend');
      const response = await validateUser();

      if (response.success && response.user) {
        console.log('User validated successfully');
        setUser(response.user);
      } else {
        console.error('Backend validation failed:', response.error);
        setError(response.error || 'Failed to authenticate with Telegram');
        
        // If backend validation fails, try to get basic info from Telegram directly
        const telegramUser = getTelegramUser();
        if (telegramUser) {
          console.log('Using basic user info from Telegram WebApp');
          // Create a minimal user object from the Telegram data
          const basicUser: User = {
            id: 0, // We don't know the backend ID yet
            telegram_id: String(telegramUser.id),
            username: telegramUser.username || '',
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || '',
            avatar: '',
            background_color: '#1e293b',
            description: 'Your card description will appear here.',
            badge: '',
            is_premium: Boolean(telegramUser.is_premium)
          };
          
          setUser(basicUser);
          setError(null); // Clear error since we have basic user info
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
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
      console.log('Initializing Telegram WebApp');
      expandApp();
      setAppReady();
    }

    // Start authentication process
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