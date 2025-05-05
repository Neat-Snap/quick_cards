"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getIsNewUser, updateIsNewUser } from "@/lib/api";

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run if we have user data
    if (user && user.id) {
      setIsLoading(true);
      getIsNewUser(user.id)
        .then((res) => {
          setShowOnboarding(!!res.is_new);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const completeOnboarding = async () => {
    setShowOnboarding(false);
    if (user && user.id) {
      await updateIsNewUser(user.id);
    }
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