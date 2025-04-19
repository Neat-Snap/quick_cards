"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, validateUser } from '@/lib/api';
import { isTelegramWebApp, setAppReady, expandApp, getTelegramUser } from '@/lib/telegram';
import { FORCE_API_CALLS, isDevelopment } from '@/lib/dev-utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    setLoading(true);
    setError(null);
    console.log('Starting user authentication flow');

    try {
      // Always try the API call in development mode with FORCE_API_CALLS
      const shouldMakeAPICall = FORCE_API_CALLS || isTelegramWebApp();
      console.log('Should make API call:', shouldMakeAPICall);
      
      // Only use mock data as a fallback if we're in development and not forcing API calls
      if (!shouldMakeAPICall && isDevelopment) {
        console.log('Using mock data for development (not making API call)');
        // Simulate a delay for development testing
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

      console.log('Making validateUser API call');
      // Try to validate with backend
      const response = await validateUser();
      console.log('validateUser response:', response);

      if (response.success && response.user) {
        console.log('User authenticated successfully:', response.user);
        setUser(response.user);
      } else {
        console.error('Authentication failed:', response.error);
        setError(response.error || 'Failed to authenticate with Telegram');
        
        // In development, use mock data as fallback even if API call failed
        if (isDevelopment) {
          console.log('Falling back to mock data after API call failure');
          setUser({
            id: 1,
            telegram_id: '12345678',
            username: 'mock_user',
            first_name: 'Mock (Fallback)',
            last_name: 'User',
            avatar: '',
            background_color: '#f0f0f0',
            description: 'This is a fallback mock user after API failure',
            badge: 'Developer',
            is_premium: false
          });
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Error in authentication flow:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // In development, use mock data as fallback on error
      if (isDevelopment) {
        console.log('Falling back to mock data after error');
        setUser({
          id: 1,
          telegram_id: '12345678',
          username: 'mock_user',
          first_name: 'Mock (Error)',
          last_name: 'User',
          avatar: '',
          background_color: '#f0f0f0',
          description: 'This is a mock user shown after an error occurred',
          badge: 'Developer',
          is_premium: false
        });
      } else {
        setUser(null);
      }
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