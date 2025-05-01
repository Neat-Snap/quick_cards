// components/explore/ExploreSection.tsx
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  X, 
  Users, 
  Code, 
  Briefcase, 
  ChevronRight, 
  Sparkles 
} from "lucide-react";
import { User, Skill, searchUsers } from "@/lib/api";
import { ExploreUserCard } from "./ExploreUserCard";
import { SkillSelector } from "./SkillSelector";
import { FeaturedUsers } from "./FeaturedUsers";
import { BusinessCardPreview } from "@/components/business-card-preview";

export function ExploreSection() {
  // State management
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedSkills.length === 0) return;
    
    setIsSearching(true);
    
    try {
      // Create skill filter if skills are selected
      const skillFilter = selectedSkills.length > 0 
        ? selectedSkills.map(s => s.name).join(",") 
        : undefined;
      
      // Make direct API request to ensure we get the raw response
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
      let endpoint = `/v1/users?q=${encodeURIComponent(searchQuery)}&limit=10&offset=0`;
      if (skillFilter) {
        endpoint += `&skill=${encodeURIComponent(skillFilter)}`;
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
      
      // Get the raw JSON response
      const data = await response.json();
      console.log("Raw API response:", data);
      
      // Process the response - it should be an array directly
      const resultsArray = Array.isArray(data) ? data : [];
      
      console.log("Processed search results:", resultsArray);
      setSearchResults(resultsArray);
      setActiveTab("search"); // Switch to search tab to show results
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle filter toggle
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  // Handle skill selection
  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkills(prev => {
      // Check if already selected
      if (prev.some(s => s.id === skill.id)) {
        return prev.filter(s => s.id !== skill.id);
      }
      // Add to selected skills
      return [...prev, skill];
    });
  };
  
  // Clear filters
  const clearFilters = () => {
    setSelectedSkills([]);
  };
  
  // View user card
  const viewUserCard = (user: User) => {
    setSelectedUser(user);
  };
  
  // Back to search results
  const backToResults = () => {
    setSelectedUser(null);
  };

  // Debugging output for search results - this will help troubleshoot
  useEffect(() => {
    console.log("Current search results state:", searchResults);
    console.log("Search results length:", searchResults?.length || 0);
  }, [searchResults]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Explore</h1>
      
      {/* Search Bar */}
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
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        
        {/* Filters Section */}
        {isFilterOpen && (
          <div className="mt-2 rounded-md border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
            
            <div className="space-y-3">
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
      
      <Separator className="my-4" />
      
      {/* Tabs for Discover/Search Results */}
      {!selectedUser && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="discover" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Search Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="mt-4 space-y-6">
            <FeaturedUsers onSelectUser={viewUserCard} />
          </TabsContent>
          
          <TabsContent value="search" className="mt-4">
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
          </TabsContent>
        </Tabs>
      )}
      
      {/* User Detail View */}
      {selectedUser && (
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            className="flex items-center gap-1" 
            onClick={backToResults}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to results
          </Button>
          
          <BusinessCardPreview user={selectedUser} />
        </div>
      )}
    </div>
  );
}