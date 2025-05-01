// components/explore/ExploreSection.tsx
// Only showing the relevant changes - replacing infinite scroll with a Show More button

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  X, 
  Users, 
  Sparkles,
  Loader2,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { User, Skill, searchUsers } from "@/lib/api";
import { ExploreUserCard } from "./ExploreUserCard";
import { SkillSelector } from "./SkillSelector";
import { UserProfileView } from "@/components/user-profile/UserProfileView";
import { toast } from "@/components/ui/use-toast";

export function ExploreSection() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [loadingMoreRecommendations, setLoadingMoreRecommendations] = useState(false);
  const [recommendationOffset, setRecommendationOffset] = useState(0);
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true);
  
  // Ref for container - keep this for possible future use
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load recommended users on mount
  useEffect(() => {
    loadRecommendedUsers();
  }, []);
  
  // Function to load recommended/random users
  const loadRecommendedUsers = async (reset = true) => {
    if (reset) {
      setLoadingRecommendations(true);
      setRecommendationOffset(0);
    } else {
      setLoadingMoreRecommendations(true);
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
      const offset = reset ? 0 : recommendationOffset;
      
      const response = await fetch(`${API_URL}/v1/users?limit=10&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load recommendations: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Recommended users response:", data);
      
      // Set recommended users
      const usersArray = Array.isArray(data) ? data : [];
      
      if (reset) {
        setRecommendedUsers(usersArray);
      } else {
        setRecommendedUsers(prev => [...prev, ...usersArray]);
      }
      
      // Update status for pagination
      setRecommendationOffset(offset + usersArray.length);
      setHasMoreRecommendations(usersArray.length === 10); // If we got less than 10, we're at the end
    } catch (error) {
      console.error("Error loading recommended users:", error);
      if (reset) {
        setRecommendedUsers([]);
      }
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive",
      });
    } finally {
      if (reset) {
        setLoadingRecommendations(false);
      } else {
        setLoadingMoreRecommendations(false);
      }
    }
  };
  
  // Function to load more recommendations
  const loadMoreRecommendations = () => {
    if (loadingMoreRecommendations || !hasMoreRecommendations) return;
    loadRecommendedUsers(false);
  };
  
  // Rest of the component remains the same...
  
  return (
    <>
      {selectedUser ? (
        // User Detail View - Full screen mode
        <UserProfileView 
          userId={selectedUser.id} 
          initialData={selectedUser} 
          onBack={backToResults}
          showBackButton={true}
          fullScreen={true}
        />
      ) : (
        // Main Explore View
        <div className="space-y-4" ref={containerRef}>
          {/* Search bar and filters section remains the same */}
          
          {/* Recommendations section - only changes at the bottom */}
          {!hasSearched && (
            <>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Recommended Profiles</h2>
              </div>
              
              {loadingRecommendations ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Loading recommended profiles...
                  </p>
                </div>
              ) : recommendedUsers.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recommendedUsers.map(user => (
                      <ExploreUserCard 
                        key={user.id} 
                        user={user} 
                        onClick={() => viewUserCard(user)} 
                      />
                    ))}
                  </div>
                  
                  {/* Show More button */}
                  {hasMoreRecommendations ? (
                    <div className="flex justify-center py-4">
                      <Button 
                        variant="outline" 
                        onClick={loadMoreRecommendations}
                        disabled={loadingMoreRecommendations}
                        className="w-full max-w-[200px]"
                      >
                        {loadingMoreRecommendations ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Show More
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        You've reached the end of recommendations
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="text-lg font-medium mb-1">No recommendations available</h3>
                  <p className="text-sm text-muted-foreground">
                    Try searching for specific users instead
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}