"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getIsNewUser, updateIsNewUser } from "@/lib/api";

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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