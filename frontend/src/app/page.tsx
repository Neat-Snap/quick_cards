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
import { botUsername as bus} from "@/constants/constants";

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

const BOTUSERNAME = bus()

export default function Home() {
  const { user, refreshUser, sharedUserId } = useAuth();
  const { appLoading, startDataLoading, finishDataLoading } = useLoading();
  const [activeTab, setActiveTab] = useState("card");
  const [editSection, setEditSection] = useState<string | null>(null);
  
  const [userData, setUserData] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  
  const [pageTransition, setPageTransition] = useState(false);

  const { showOnboarding, completeOnboarding, isLoading: onboardingLoading } = useOnboarding();

  
  const [loading, setLoading] = useState(true);

  const loadingRef = useRef(false);
  
  useEffect(() => {
    if (user && !loadingRef.current) {
      const loadData = async () => {
        loadingRef.current = true;
        startDataLoading();

        try {
          console.log("Fetching user data...");
          const userResponse = await getCurrentUser();

          if (!userResponse.success || !userResponse.user) {
            throw new Error(userResponse.error || "Failed to load user data");
          }

          const userData = userResponse.user;
          setUserData(userData);

          setProjects(Array.isArray(userData.projects) ? userData.projects as Project[] : []);
          setContacts(Array.isArray(userData.contacts) ? userData.contacts as Contact[] : []);
          setSkills(Array.isArray(userData.skills) ? userData.skills as Skill[] : []);
          setCustomLinks(Array.isArray(userData.custom_links) ? userData.custom_links as CustomLink[] : []);

          console.log("All data loaded successfully");
        } catch (error) {
          console.error("Error loading user data:", error);
          toast({
            title: "Error",
            description: "Failed to load your profile data.",
            variant: "destructive",
          });
        } finally {
          loadingRef.current = false;
          setLoading(false);
          finishDataLoading();
        }
      };

      loadData();
    }
  }, [user]);

  if (appLoading) {
    return <LoadingScreen />;
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    
    setPageTransition(true);
    
    setTimeout(() => {
      setActiveTab(tabId);
      
      setTimeout(() => {
        setPageTransition(false);
      }, 50);
    }, 200);
  };

  const loadUserData = async () => {
    setLoading(true);

    try {
      console.log("Fetching fresh user data from server...");
      const userResponse = await getCurrentUser();

      console.log("User response:", userResponse);

      if (!userResponse.success) {
        throw new Error(userResponse.error || "Failed to load user data");
      }

      const userData = userResponse.user;

      if (!userData) {
        throw new Error("User data is undefined");
      }

      console.log("User data:", userData);

      setUserData(userData);

      setContacts(Array.isArray(userData.contacts) ? userData.contacts as Contact[] : []);
      setProjects(Array.isArray(userData.projects) ? userData.projects as Project[] : []);
      setSkills(Array.isArray(userData.skills) ? userData.skills as Skill[] : []);
      setCustomLinks(Array.isArray(userData.custom_links) ? userData.custom_links as CustomLink[] : []);

      console.log("User data loaded successfully:", userData);
      console.log("Contacts state:", userData.contacts);
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
  
  const handleEditSuccess = async () => {
    try {
      console.log("Edit success triggered, reloading user data...");
      
      setEditSection(null);
      
      await loadUserData();
      
      console.log("User data reloaded successfully");
    } catch (error) {
      console.error("Error refreshing data after edit:", error);
      setEditSection(null);
    }
  };
  
  const debugInfo = () => {
    console.log("Current contacts:", contacts);
    console.log("Current projects:", projects);
    console.log("Current skills:", skills);
    console.log("Current links:", customLinks);
  };

  console.log("Current projects:", projects);
  
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
          onBack={() => window.location.href = `https://t.me/${BOTUSERNAME}`}
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
                
                {!editSection && (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
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
                          <ShareCardButton userId={userData.id} botUsername={bus()} />
                        </div>
                      )}
                      
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
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <div>
                      <h1 className="text-2xl font-bold">Explore</h1>
                      <p className="text-sm text-muted-foreground">
                        Discover other business cards
                      </p>
                    </div>
                  </div>
                </motion.div>
                <ExploreSection />
              </div>
            )}
            
            {activeTab === "premium" && (
              <div className="p-4 overflow-y-auto hide-scrollbar">
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <div>
                      <h1 className="text-2xl font-bold">Premium</h1>
                      <p className="text-sm text-muted-foreground">
                        Upgrade your business card
                      </p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <PremiumFeatures 
                    user={userData} 
                    onSubscribed={() => {
                      refreshUser();
                      loadUserData();
                    }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>
        
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