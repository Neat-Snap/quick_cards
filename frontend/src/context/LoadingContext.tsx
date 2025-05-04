// LoadingContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface LoadingContextType {
  appLoading: boolean;
  startDataLoading: () => void;
  finishDataLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  
  // Track both auth loading and data loading
  useEffect(() => {
    // App is loading if either auth is loading or data is loading
    setAppLoading(authLoading || dataLoading);
  }, [authLoading, dataLoading]);
  
  const startDataLoading = () => setDataLoading(true);
  const finishDataLoading = () => setDataLoading(false);
  
  return (
    <LoadingContext.Provider 
      value={{ 
        appLoading,
        startDataLoading,
        finishDataLoading
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}