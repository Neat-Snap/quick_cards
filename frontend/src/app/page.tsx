"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BusinessCardPreview } from "@/components/business-card-preview";
import { ProfileForm } from "@/components/profile-form";
import { BackgroundForm } from "@/components/background-form";
import { ContactForm } from "@/components/contact-form";
import { ProjectsForm } from "@/components/projects-form";
import { SkillsForm } from "@/components/skills-form";
import { PremiumFeatures } from "@/components/premium-features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Search, CreditCard, Star, Edit, X } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { 
  User, 
  Contact, 
  Project, 
  Skill, 
  CustomLink,
  getCurrentUser,
  getUserContacts,
  getUserProjects,
  getUserSkills,
  getUserLinks,
  searchUsers
} from "@/lib/api";

export default function Home() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("card");
  const [editSection, setEditSection] = useState<string | null>(null);
  
  // User data states
  const [userData, setUserData] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // Load user data on mount and when user changes
  useEffect(() => {
    if (user) {
      setUserData(user);
      loadUserData();
    }
  }, [user]);
  
  // Function to load user data (contacts, projects, skills, links)
  const loadUserData = async () => {
    setLoading(true);
    
    try {
      // Get current user with full data
      const userResponse = await getCurrentUser();

      console.log("User response:", userResponse);

      if (userResponse.success && userResponse.user) {
        setUserData(userResponse.user as User);
      }
      
      // Load contacts
      const userContacts = await getUserContacts();
      setContacts(userContacts);
      
      // Load projects
      const userProjects = await getUserProjects();
      setProjects(userProjects);
      
      // Load skills
      const userSkills = await getUserSkills();
      setSkills(userSkills);
      
      // Load custom links
      const userLinks = await getUserLinks();
      setCustomLinks(userLinks);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle successful edit
  const handleEditSuccess = async () => {
    try {
      // Reload user data
      await loadUserData();
      
      // Close edit section
      setEditSection(null);
    } catch (error) {
      console.error("Error refreshing data after edit:", error);
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // View user card
  const viewUserCard = (user: User) => {
    setSelectedUser(user);
  };
  
  // Back to search results
  const backToSearch = () => {
    setSelectedUser(null);
  };
  
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col items-center pb-16">
        <div className="w-full max-w-md flex-1 overflow-y-auto">
          {activeTab === "card" && (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">
                {userData ? `${userData.first_name}'s Card` : 'Your Card'}
              </h1>
              
              {editSection === null ? (
                <div className="space-y-6">
                  {/* Preview Mode */}
                  <div className="mb-6 relative">
                    <BusinessCardPreview 
                      user={userData} 
                      contacts={contacts}
                      projects={projects}
                      skills={skills}
                      customLinks={customLinks}
                    />
                    
                    {/* Edit Buttons for each section */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => setEditSection("profile")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => setEditSection("background")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Background
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => setEditSection("contact")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Contact Info
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => setEditSection("projects")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Projects
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 col-span-2"
                        onClick={() => setEditSection("skills")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Skills
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Edit Mode */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      {editSection === "profile" && "Edit Profile"}
                      {editSection === "background" && "Edit Background"}
                      {editSection === "contact" && "Edit Contact Info"}
                      {editSection === "projects" && "Edit Projects"}
                      {editSection === "skills" && "Edit Skills"}
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditSection(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    {userData ? `User data loaded: ${userData.first_name}` : 'User data not available'}
                  </div>
                  
                  {/* Render only the specific section of the form based on editSection */}
                  <Card>
                    <CardContent className="p-4 pt-6">
                      {editSection === "profile" && userData && (
                        <ProfileForm 
                          user={userData}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditSection(null)}
                        />
                      )}
                      
                      {editSection === "background" && userData && (
                        <BackgroundForm 
                          user={userData}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditSection(null)}
                        />
                      )}
                      
                      {editSection === "contact" && userData && (
                        <ContactForm 
                          userId={userData.id}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditSection(null)}
                        />
                      )}
                      
                      {editSection === "projects" && userData && (
                        <ProjectsForm 
                          userId={userData.id}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditSection(null)}
                        />
                      )}
                      
                      {editSection === "skills" && userData && (
                        <SkillsForm 
                          userId={userData.id}
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditSection(null)}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "explore" && (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Explore</h1>
              
              {selectedUser ? (
                // User Card View
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={backToSearch}
                    className="mb-2"
                  >
                    Back to Search
                  </Button>
                  
                  <BusinessCardPreview user={selectedUser} />
                </div>
              ) : (
                // Search Interface
                <>
                  <div className="rounded-lg border p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Input 
                        type="text" 
                        placeholder="Search by name, username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Filter by:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline">Skills</Button>
                        <Button variant="outline">Projects</Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">Results</h2>
                      {searchResults.map(user => (
                        <div 
                          key={user.id} 
                          className="p-3 border rounded-md flex items-center justify-between hover:bg-muted/30 cursor-pointer"
                          onClick={() => viewUserCard(user)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                              ) : (
                                <span>{user.first_name.charAt(0)}{user.last_name?.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery && !isSearching ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Search for other users' cards</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === "premium" && (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Premium Features</h1>
              <PremiumFeatures 
                user={userData} 
                onSubscribed={() => {
                  // Refresh user data after subscription
                  refreshUser();
                  loadUserData();
                }}
              />
            </div>
          )}
        </div>
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around">
          <button
            className={`flex flex-col items-center justify-center p-2 ${
              activeTab === "card" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("card")}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs">Card</span>
          </button>
          
          <button
            className={`flex flex-col items-center justify-center p-2 ${
              activeTab === "explore" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("explore")}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs">Explore</span>
          </button>
          
          <button
            className={`flex flex-col items-center justify-center p-2 ${
              activeTab === "premium" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("premium")}
          >
            <Star className="h-5 w-5" />
            <span className="text-xs">Premium</span>
          </button>
        </div>
      </main>
    </ProtectedRoute>
  );
}