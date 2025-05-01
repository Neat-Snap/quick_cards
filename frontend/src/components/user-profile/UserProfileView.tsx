// components/user-profile/UserProfileView.tsx
import { useState, useEffect } from "react";
import { User, Contact, Project, Skill, CustomLink, getUserById } from "@/lib/api";
import { BusinessCardPreview } from "@/components/business-card-preview";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface UserProfileViewProps {
  userId: string | number;
  initialData?: User | null;
  onBack?: () => void;
  showBackButton?: boolean;
  loadImmediately?: boolean;
}

export function UserProfileView({ 
  userId, 
  initialData = null,
  onBack,
  showBackButton = true,
  loadImmediately = true
}: UserProfileViewProps) {
  const [user, setUser] = useState<User | null>(initialData);
  const [loading, setLoading] = useState(loadImmediately);
  const [error, setError] = useState<string | null>(null);
  
  // Load full user data
  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading full user data for ID:", userId);
      const response = await getUserById(userId.toString());
      
      if (!response.success) {
        throw new Error(response.error || "Failed to load user profile");
      }
      
      // Check if user data is in the response
      if (response.user) {
        console.log("User data loaded successfully:", response.user);
        setUser(response.user);
      } else {
        // If there's no user in the response but it was "successful"
        console.warn("API returned success but no user data");
        setError("User data not found");
        
        // Keep initial data if we have it
        if (!initialData) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError(error instanceof Error ? error.message : "Failed to load user profile");
      
      // Keep initial data if we have it, since something is better than nothing
      if (!initialData) {
        setUser(null);
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
  
  return (
    <div className="space-y-4">
      {/* Back button */}
      {showBackButton && onBack && (
        <Button 
          variant="ghost" 
          className="flex items-center gap-1" 
          onClick={onBack}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back
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