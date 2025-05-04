"use client";

import { useState, useEffect } from "react";
import { User, Contact, Project, Skill, CustomLink } from "@/lib/api";
import { BusinessCardPreview } from "@/components/business-card-preview";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type ViewSourceContext = 'backlink' | 'explore' | 'default';

interface UserProfileViewProps {
  userId: string | number;
  initialData?: User | null;
  onBack?: () => void;
  showBackButton?: boolean;
  loadImmediately?: boolean;
  fullScreen?: boolean;
  sourceContext?: ViewSourceContext;
}

export function UserProfileView({ 
  userId, 
  initialData = null,
  onBack,
  showBackButton = true,
  loadImmediately = true,
  fullScreen = false,
  sourceContext = 'default'
}: UserProfileViewProps) {
  const [user, setUser] = useState<User | null>(initialData);
  const [loading, setLoading] = useState(loadImmediately);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const navigateToMainCard = () => {
    // Navigate to the main page
    router.push('/');
  };

  const getBackButtonText = () => {
    switch(sourceContext) {
      case 'backlink':
        return "Back to My Card";
      case 'explore':
        return "Back to Explore";
      default:
        return "Back";
    }
  };

  const handleBackClick = () => {
    if (sourceContext === 'backlink') {
      navigateToMainCard();
    } else if (onBack) {
      onBack();
    }
  };
  
  // Load full user data with direct API call to handle different response formats
  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading full user data for ID:", userId);
      
      // Make direct API request to ensure we properly handle the response format
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
      
      const response = await fetch(`${API_URL}/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load user profile: ${response.status}`);
      }
      
      // Parse the raw JSON response
      const data = await response.json();
      console.log("Raw user profile API response:", data);
      
      // Handle different response formats
      let userData: User | null = null;
      
      // Case 1: Response is the user object directly
      if (data && typeof data === 'object' && 'id' in data) {
        userData = data as User;
      } 
      // Case 2: Response has a 'user' property
      else if (data && typeof data === 'object' && 'user' in data) {
        userData = data.user as User;
      }
      // Case 3: Response is an array with a single user (unlikely but possible)
      else if (Array.isArray(data) && data.length > 0) {
        userData = data[0] as User;
      }
      
      if (userData) {
        console.log("User data extracted successfully:", userData);
        setUser(userData);
      } else {
        // Couldn't extract user data
        console.warn("Could not extract user data from API response:", data);
        setError("Invalid user data format from server");
        
        // Keep initial data if we have it
        if (initialData) {
          setUser(initialData);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError(error instanceof Error ? error.message : "Failed to load user profile");
      
      // Keep initial data if we have it, since something is better than nothing
      if (initialData) {
        setUser(initialData);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on mount if loadImmediately is true
  useEffect(() => {
    if (loadImmediately) {
      loadUserData();
    }
  }, [userId, loadImmediately]);
  
  // Function to manually load data
  const handleLoadProfile = () => {
    if (!loading) {
      loadUserData();
    }
  };

  // If fullScreen mode is enabled, render a full-screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        <div className="max-w-md mx-auto py-4 px-4 pb-28"> {/* Added extra bottom padding (pb-28) */}
          {showBackButton && onBack && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button 
                variant="ghost" 
                onClick={handleBackClick} 
                className="mb-4 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {getBackButtonText()}
              </Button>
            </motion.div>
          )}
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading user profile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 border rounded-md">
              <p className="text-destructive mb-2">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadProfile}
                className="mt-2"
              >
                Retry
              </Button>
              {initialData && (
                <div className="mt-6 px-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing preview data instead:
                  </p>
                  <BusinessCardPreview user={initialData} />
                </div>
              )}
            </div>
          ) : user ? (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <BusinessCardPreview 
                user={user} 
                contacts={user.contacts as Contact[]} 
                projects={user.projects as Project[]} 
                skills={user.skills as Skill[]} 
                customLinks={user.custom_links as CustomLink[]} 
              />
            </motion.div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <p className="text-muted-foreground">User profile not found</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Regular, non-fullscreen view with bottom padding
  return (
    <div className="space-y-4 pb-20"> {/* Added bottom padding */}
      {/* Back button */}
      {showBackButton && onBack && (
        <Button 
          variant="ghost" 
          className="flex items-center gap-1" 
          onClick={handleBackClick}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          {getBackButtonText()}
        </Button>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading user profile...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-8 border rounded-md">
          <p className="text-destructive mb-2">{error}</p>
          
          {/* Show retry button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLoadProfile}
            className="mt-2"
          >
            Retry
          </Button>
          
          {/* If we have initial data, show it */}
          {initialData && (
            <div className="mt-6 px-4">
              <p className="text-sm text-muted-foreground mb-4">
                Showing preview data instead:
              </p>
              <BusinessCardPreview user={initialData} />
            </div>
          )}
        </div>
      )}
      
      {/* User profile display */}
      {!loading && !error && user && (
        <BusinessCardPreview 
          user={user} 
          contacts={user.contacts as Contact[]} 
          projects={user.projects as Project[]} 
          skills={user.skills as Skill[]} 
          customLinks={user.custom_links as CustomLink[]} 
        />
      )}
      
      {/* Empty state - no user found */}
      {!loading && !error && !user && (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">User profile not found</p>
        </div>
      )}
    </div>
  );
}