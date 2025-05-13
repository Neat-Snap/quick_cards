"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isTelegramWebApp } from '@/lib/telegram';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, error, refreshUser } = useAuth();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading && !user && !error) {
      console.warn('User not authenticated');
    }
  }, [user, loading, error, router]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refreshUser();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-medium">Authentication Error</h2>
        <p className="mb-2 text-center text-sm text-muted-foreground">{error}</p>
        
        <div className="mb-6 mt-4 max-w-md rounded-md bg-muted p-3 text-xs">
          <h3 className="mb-1 font-semibold">Troubleshooting:</h3>
          <ul className="space-y-1 pl-4">
            <li>• Check if you opened the app from Telegram</li>
            <li>• The backend server might be offline: {isTelegramWebApp() ? 'Yes' : 'No'}</li>
            <li>• Try reloading the app in Telegram</li>
            <li>• Current retry count: {retryCount}</li>
          </ul>
        </div>
        
        <button 
          onClick={handleRetry}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
} 