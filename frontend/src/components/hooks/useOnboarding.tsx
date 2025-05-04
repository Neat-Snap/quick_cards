"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Only run if we have user data
    if (user) {
      // Check if user is newly registered
      // This relies on your API returning an is_new_user flag
      console.log("is showing onboarding", user.name === "")
      setShowOnboarding(user.name === "");
      setIsLoading(false);
    } else {
      console.log("NOT USER")
    }
  }, [user]);
  
  const completeOnboarding = () => {
    // Simply hide the onboarding
    setShowOnboarding(false);
    
    // You might want to call an API here to update the user's status
    // so they don't see onboarding next time
  };
  
  // This is mainly for development/testing
  const resetOnboarding = () => {
    setShowOnboarding(true);
  };
  
  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding
  };
}