"use client";

import { BusinessCardPreview } from "@/components/business-card-preview";
import { ProfileForm } from "@/components/profile-form";
import { BackgroundForm } from "@/components/background-form";
import { ContactForm } from "@/components/contact-form";
import { ProjectsForm } from "@/components/projects-form";
import { SkillsForm } from "@/components/skills-form";
import { PremiumFeatures } from "@/components/premium-features";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { Edit, Image, MessageCircle, Briefcase, Code } from "lucide-react";
import { User as UserIcon } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { ExploreSection } from "@/components/explore/ExploreSection";
import { AnimatedBottomNav } from "@/components/AnimatedBottomNav";
import { AnimatedForm } from "@/components/AnimatedForm";
import { motion } from "framer-motion";
import { ShareCardButton } from "@/components/ShareCardButton";
import { UserProfileView } from "@/components/user-profile/UserProfileView";
import { useOnboarding } from "@/components/hooks/useOnboarding";
import { OnboardingFlow } from "@/components/OnboardingFlow";
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
  getUserLinks
} from "@/lib/api";
import { useLoading } from "@/context/LoadingContext";
import { LoadingScreen } from "@/components/LoadingScreen";

// Animation variants for content transitions
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut" 
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { 
      duration: 0.2,
      ease: "easeIn" 
    }
  }
};

const BOTUSERNAME = "face_cards_bot"

export default function Home() {
  const { user, refreshUser, sharedUserId } = useAuth();
  const { appLoading, startDataLoading, finishDataLoading } = useLoading();
  const [activeTab, setActiveTab] = useState("card");
  const [editSection, setEditSection] = useState<string | null>(null);
  
  // User data states
  const [userData, setUserData] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  
  // Animation states
  const [pageTransition, setPageTransition] = useState(false);

  const { showOnboarding, completeOnboarding, isLoading: onboardingLoading } = useOnboarding();

  
  // Loading states
  const [loading, setLoading] = useState(true);

  const loadingRef = useRef(false);
  
  // Load user data on mount and when user changes
  useEffect(() => {
    // Only proceed if we have a user and aren't already loading
    if (user && !loadingRef.current) {
      const loadData = async () => {
        // Set our ref flag to prevent duplicate loading
        loadingRef.current = true;
        startDataLoading();
        
        try {
          // STEP 1: First get current user with full data
          console.log("Fetching user data...");
          const userResponse = await getCurrentUser();
          
          if (!userResponse.success || !userResponse.user) {
            throw new Error(userResponse.error || "Failed to load user data");
          }
          
          // Update userData state immediately
          const userData = userResponse.user;
          setUserData(userData);
          
          // STEP 2: Check if user data already has the collections we need
          let projectsLoaded = false;
          
          // Set projects from user data if available
          if (userData.projects && Array.isArray(userData.projects) && userData.projects.length > 0) {
            console.log(`Setting ${userData.projects.length} projects from user data`);
            setProjects(userData.projects as Project[]);
            projectsLoaded = true;
          }
          
          // Set contacts if available
          if (userData.contacts && Array.isArray(userData.contacts)) {
            console.log(`Setting ${userData.contacts.length} contacts from user data`);
            setContacts(userData.contacts as Contact[]);
          }
          
          // Set skills if available
          if (userData.skills && Array.isArray(userData.skills)) {
            console.log(`Setting ${userData.skills.length} skills from user data`);
            setSkills(userData.skills as Skill[]);
          }
          
          // Set custom links if available
          if (userData.custom_links && Array.isArray(userData.custom_links)) {
            console.log(`Setting ${userData.custom_links.length} custom links from user data`);
            setCustomLinks(userData.custom_links as CustomLink[]);
          }
          
          // STEP 3: Only make additional API calls for data we don't already have
          console.log("Fetching additional user data as needed...");
          
          // Only fetch projects if we didn't already get them above
          if (!projectsLoaded) {
            console.log("Projects not found in user data, fetching separately...");
            const projectsData = await getUserProjects();
            if (projectsData && projectsData.length > 0) {
              console.log(`Setting ${projectsData.length} projects from dedicated endpoint`);
              setProjects(projectsData);
            } else {
              console.log("No projects found from dedicated endpoint");
            }
          }
          
          // Fetch other data as needed
          const [contactsData, skillsData, linksData] = await Promise.all([
            (!userData.contacts || !userData.contacts.length) ? getUserContacts() : null,
            (!userData.skills || !userData.skills.length) ? getUserSkills() : null,
            (!userData.custom_links || !userData.custom_links.length) ? getUserLinks() : null
          ]);
          
          // Update state with any additional fetched data
          if (contactsData && contactsData.length > 0) {
            setContacts(contactsData);
          }
          if (skillsData && skillsData.length > 0) {
            setSkills(skillsData);
          }
          if (linksData && linksData.length > 0) {
            setCustomLinks(linksData);
          }
          
          console.log("All data loaded successfully");
        } catch (error) {
          console.error("Error loading user data:", error);
          toast({
            title: "Error",
            description: "Failed to load your profile data.",
            variant: "destructive",
          });
        } finally {
          // Important: Reset the loading flag BEFORE finishing data loading
          loadingRef.current = false;
          setLoading(false);
          finishDataLoading();
        }
      };
      
      loadData();
    }
    // Only depend on user - not on the loading functions
  }, [user]);

  if (appLoading) {
    return <LoadingScreen />;
  }

  // Handle tab changes with animation
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    
    // Start exit animation
    setPageTransition(true);
    
    // Change tab after a short delay for animation
    setTimeout(() => {
      setActiveTab(tabId);
      
      // Reset animation state
      setTimeout(() => {
        setPageTransition(false);
      }, 50);
    }, 200);
  };

  // Function to load user data (contacts, projects, skills, links)
  const loadUserData = async () => {
    setLoading(true);
    
    try {
      // Get current user with full data - force refresh from server
      console.log("Fetching fresh user data from server...");
      const userResponse = await getCurrentUser();
      
      console.log("User response:", userResponse);
      
      if (!userResponse.success) {
        throw new Error(userResponse.error || "Failed to load user data");
      }
      
      // Access the user data correctly, handling both response formats
      const userData = userResponse.user;
      
      if (!userData) {
        throw new Error("User data is undefined");
      }
      
      console.log("User data:", userData);
      
      // Update all state with the fresh data
      setUserData(userData);
      
      // Check if user data contains nested objects and set them
      if (userData.contacts) {
        console.log("Setting contacts from user data:", userData.contacts);
        setContacts(userData.contacts as Contact[]);
      }

      console.log("projects from loaduserdata", userData.projects)

      if (userData.projects) setProjects(userData.projects as Project[]);
      if (userData.skills) setSkills(userData.skills as Skill[]);
      if (userData.custom_links) setCustomLinks(userData.custom_links as CustomLink[]);
      
      // Also get separate endpoints data to ensure we have everything
      console.log("Fetching additional user data...");
      const [contactsData, projectsData, skillsData, linksData] = await Promise.all([
        getUserContacts(),
        getUserProjects(),
        getUserSkills(),
        getUserLinks()
      ]);
      
      console.log("Contacts data from dedicated endpoint:", contactsData);
      
      // Only update state if data exists and wasn't already set from user object
      if (contactsData && contactsData.length > 0 && (!userData.contacts || userData.contacts.length === 0)) {
        console.log("Setting contacts from dedicated endpoint");
        setContacts(contactsData);
      }
      if (projectsData && projectsData.length > 0 && (!userData.projects || userData.projects.length === 0)) {
        setProjects(projectsData);
      }
      if (skillsData && skillsData.length > 0 && (!userData.skills || userData.skills.length === 0)) {
        setSkills(skillsData);
      }
      if (linksData && linksData.length > 0 && (!userData.custom_links || userData.custom_links.length === 0)) {
        setCustomLinks(linksData);
      }
      
      console.log("User data loaded successfully:", userData);
      console.log("Contacts state:", contacts);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle successful edit
  const handleEditSuccess = async () => {
    try {
      console.log("Edit success triggered, reloading user data...");
      
      // First close the edit section to provide immediate feedback
      setEditSection(null);
      
      // Then reload user data in the background
      await loadUserData();
      
      console.log("User data reloaded successfully");
    } catch (error) {
      console.error("Error refreshing data after edit:", error);
      setEditSection(null); // Ensure we still close the edit section even if reload fails
    }
  };
  
  // Debug function to check contacts data
  const debugInfo = () => {
    console.log("Current contacts:", contacts);
    console.log("Current projects:", projects);
    console.log("Current skills:", skills);
    console.log("Current links:", customLinks);
  };

  console.log("Current projects:", projects);
  
  // Get form title based on edit section
  const getFormTitle = () => {
    switch(editSection) {
      case "profile": return "Edit Profile";
      case "background": return "Edit Background";
      case "contact": return "Edit Contact Info";
      case "projects": return "Edit Projects";
      case "skills": return "Edit Skills";
      default: return "";
    }
  };

  if (sharedUserId) {
    return (
      <div className="p-4">
        <UserProfileView 
          userId={sharedUserId} 
          fullScreen={true}
          sourceContext="backlink" 
          showBackButton={true} 
          onBack={() => window.location.href = `https://t.me/face_cards_bot`}
        />
      </div>
    );
  }
  
  return (
    <ProtectedRoute>
      {showOnboarding && !appLoading && (
        <OnboardingFlow onComplete={completeOnboarding} />
      )}
      <main className="flex min-h-screen flex-col items-center pb-16">
        <div className="w-full max-w-md flex-1 overflow-y-auto hide-scrollbar">
          <div 
            className={`transition-opacity duration-200 ${pageTransition ? 'opacity-0' : 'opacity-100'}`}
          >
            {activeTab === "card" && (
              <div className="p-4 overflow-y-auto hide-scrollbar">
                <motion.h1 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {userData ? `${userData.name}'s Card` : 'Your Card'}
                </motion.h1>
                
                {/* Show card preview and edit buttons only when not editing */}
                {!editSection && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    {/* Preview section */}
                    <div className="mb-6 relative">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          duration: 0.5,
                          type: "spring",
                          stiffness: 300,
                          damping: 25
                        }}
                      >
                        <BusinessCardPreview 
                          user={userData} 
                          contacts={contacts}
                          projects={projects}
                          skills={skills}
                          customLinks={customLinks}
                        />
                      </motion.div>

                      {userData && (
                        <div className="mt-4 mb-4">
                          <ShareCardButton userId={userData.id} botUsername="face_cards_bot" />
                        </div>
                      )}
                      
                      {/* Edit Buttons */}
                      <motion.div 
                        className="grid grid-cols-2 gap-3 mt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 0.3,
                          staggerChildren: 0.1,
                          delayChildren: 0.3
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                        >
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center gap-2 w-full"
                            onClick={() => setEditSection("profile")}
                          >
                            <UserIcon className="h-4 w-4" />
                            Profile
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                        >
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center gap-2 w-full"
                            onClick={() => setEditSection("background")}
                          >
                            <Image className="h-4 w-4" />
                            Background
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                        >
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center gap-2 w-full"
                            onClick={() => {
                              setEditSection("contact");
                              debugInfo();
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                            Contacts
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                        >
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center gap-2 w-full"
                            onClick={() => setEditSection("projects")}
                          >
                            <Briefcase className="h-4 w-4" />
                            Projects
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                          className="col-span-2"
                        >
                          <Button 
                            variant="outline" 
                            className="flex items-center justify-center gap-2 w-full"
                            onClick={() => setEditSection("skills")}
                          >
                            <Code className="h-4 w-4" />
                            Skills
                          </Button>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
                
                
                {/* Animated Form Section */}
                <AnimatedForm 
                  isOpen={editSection === "profile"}
                  onClose={() => setEditSection(null)}
                  title="Edit Profile"
                >
                  {userData && (
                    <ProfileForm 
                      user={userData}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditSection(null)}
                    />
                  )}
                </AnimatedForm>
                
                <AnimatedForm 
                  isOpen={editSection === "background"}
                  onClose={() => setEditSection(null)}
                  title="Edit Background"
                >
                  {userData && (
                    <BackgroundForm 
                      user={userData}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditSection(null)}
                    />
                  )}
                </AnimatedForm>
                
                <AnimatedForm 
                  isOpen={editSection === "contact"}
                  onClose={() => setEditSection(null)}
                  title="Edit Contact Info"
                >
                  {userData && (
                    <ContactForm 
                      userId={userData.id}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditSection(null)}
                    />
                  )}
                </AnimatedForm>
                
                <AnimatedForm 
                  isOpen={editSection === "projects"}
                  onClose={() => setEditSection(null)}
                  title="Edit Projects"
                >
                  {userData && (
                    <ProjectsForm 
                      userId={userData.id}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditSection(null)}
                    />
                  )}
                </AnimatedForm>
                
                <AnimatedForm 
                  isOpen={editSection === "skills"}
                  onClose={() => setEditSection(null)}
                  title="Edit Skills"
                >
                  {userData && (
                    <SkillsForm 
                      userId={userData.id}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditSection(null)}
                    />
                  )}
                </AnimatedForm>
              </div>
            )}
            
            {activeTab === "explore" && (
              <div className="p-4 overflow-y-auto hide-scrollbar">
                <ExploreSection />
              </div>
            )}
            
            {activeTab === "premium" && (
              <div className="p-4 overflow-y-auto hide-scrollbar">
                <motion.h1 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Premium Features
                </motion.h1>
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <PremiumFeatures 
                    user={userData} 
                    onSubscribed={() => {
                      // Refresh user data after subscription
                      refreshUser();
                      loadUserData();
                    }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>
        
        {/* Only show the bottom nav when onboarding is not visible */}
        {!showOnboarding && (
          <AnimatedBottomNav 
            activeTab={activeTab} 
            onChange={handleTabChange} 
          />
        )}
      </main>
    </ProtectedRoute>
  );
}