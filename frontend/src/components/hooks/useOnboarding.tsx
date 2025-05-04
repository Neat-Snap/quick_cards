"use client";

import { useState, useEffect } from "react";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem("onboardingCompleted") === "true";
      
      // If this is a new user (hasn't completed onboarding), show onboarding
      setShowOnboarding(!hasCompletedOnboarding);
      setIsLoading(false);
    }
  }, []);
  
  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true");
    setShowOnboarding(false);
  };
  
  const resetOnboarding = () => {
    localStorage.removeItem("onboardingCompleted");
    setShowOnboarding(true);
  };
  
  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding
  };
}