import { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronDown,
} from "lucide-react";
import { User, Skill, searchUsers } from "@/lib/api";
import { ExploreUserCard } from "./ExploreUserCard";
import { SkillSelector } from "./SkillSelector";
import { UserProfileView } from "@/components/user-profile/UserProfileView";
import { toast } from "@/components/ui/use-toast";


export function ExploreSection() {
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
    
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      loadRecommendedUsers();
    }, []);
    
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
        const limit = 10;
        
        const response = await fetch(`${API_URL}/v1/users?limit=${limit}&offset=${offset}`, {
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
        
        const usersArray = Array.isArray(data) ? data : [];
        
        if (reset) {
          setRecommendedUsers(usersArray);
        } else {
          setRecommendedUsers(prev => [...prev, ...usersArray]);
        }
        
        setRecommendationOffset(offset + usersArray.length);
        setHasMoreRecommendations(usersArray.length === limit);
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
    
    const loadMoreRecommendations = () => {
      if (loadingMoreRecommendations || !hasMoreRecommendations) return;
      loadRecommendedUsers(false);
    };
  
  const handleSearch = async () => {
    if (!searchQuery.trim() && !projectQuery.trim() && selectedSkills.length === 0) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const skillFilter = selectedSkills.length > 0 
        ? selectedSkills.map(s => s.name).join(",") 
        : undefined;
      
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
      
      let endpoint = `/v1/users?limit=10&offset=0`;
      
      if (searchQuery.trim()) {
        endpoint += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }
      
      if (projectQuery.trim()) {
        endpoint += `&project=${encodeURIComponent(projectQuery.trim())}`;
      }
      
      if (projectQuery.trim()) {
        endpoint += `&project=${encodeURIComponent(projectQuery.trim())}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw API response:", data);
      
      const resultsArray = Array.isArray(data) ? data : [];
      
      console.log("Processed search results:", resultsArray);
      setSearchResults(resultsArray);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
      toast({
        title: "Search Error",
        description: "Failed to search for users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkills(prev => {
      if (prev.some(s => s.id === skill.id)) {
        return prev.filter(s => s.id !== skill.id);
      }
      return [...prev, skill];
    });
  };
  
  const clearFilters = () => {
    setSelectedSkills([]);
    setProjectQuery("");
  };
  
  const viewUserCard = async (user: User) => {
    setSelectedUser(user);
  };
  
  const backToResults = () => {
    setSelectedUser(null);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setProjectQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSelectedSkills([]);
  };

  return (
    <>
      {selectedUser ? (
        <UserProfileView 
          userId={selectedUser.id} 
          initialData={selectedUser} 
          onBack={backToResults}
          showBackButton={true}
          fullScreen={true}
          sourceContext="explore"
        />
      ) : (
        <div className="space-y-4" ref={containerRef}>
          
          <div className="sticky top-0 z-10 bg-background pt-2 pb-4">
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 pr-4"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleFilter}
                  className={isFilterOpen ? "bg-primary/10" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : "Search"}
                </Button>
              </div>
              
              {isFilterOpen && (
                <div className="mt-2 rounded-md border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Filter by project</label>
                      <div className="flex items-center mt-1 gap-2">
                        <div className="relative flex-grow">
                          <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Project name..."
                            value={projectQuery}
                            onChange={(e) => setProjectQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Filter by skills</label>
                      <SkillSelector 
                        selectedSkills={selectedSkills} 
                        onSelect={handleSkillSelect} 
                      />
                    </div>
                    
                    {selectedSkills.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Selected skills</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedSkills.map(skill => (
                            <Badge key={skill.id || Math.random()} variant="secondary" className="flex items-center gap-1">
                              {skill.name}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 p-0 hover:bg-muted" 
                                onClick={() => handleSkillSelect(skill)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-6">
            {hasSearched && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Search Results</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSearch}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                </div>
                
                {searchResults && searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.map(user => (
                      <ExploreUserCard 
                        key={user.id} 
                        user={user} 
                        onClick={() => viewUserCard(user)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <h3 className="text-lg font-medium mb-1">No users found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters to find more users
                    </p>
                  </div>
                )}
              </>
            )}
            
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
        </div>
      )}
    </>
  );
}