"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BusinessCardPreview } from "@/components/business-card-preview";
import { BusinessCardForm } from "@/components/business-card-form";
import { PremiumFeatures } from "@/components/premium-features";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Search, CreditCard, Star, Edit, X } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { TelegramDebug } from "@/components/TelegramDebug";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("card");
  const [editSection, setEditSection] = useState<string | null>(null);
  
  // Function to handle section edit
  const handleEdit = (section: string) => {
    setEditSection(section);
  };
  
  // Function to handle save and return to preview
  const handleSave = () => {
    // In a real app, this would save the data to backend
    setEditSection(null);
  };
  
  // Function to cancel editing and return to preview
  const handleCancel = () => {
    setEditSection(null);
  };
  
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col items-center pb-16">
        <TelegramDebug />
        
        <div className="w-full max-w-md flex-1 overflow-y-auto">
          {activeTab === "card" && (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">
                {user ? `${user.first_name}'s Card` : 'Your Card'}
              </h1>
              
              {editSection === null ? (
                <div className="space-y-6">
                  {/* Preview Mode */}
                  <div className="mb-6 relative">
                    <BusinessCardPreview user={user} />
                    
                    {/* Edit Buttons for each section */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => handleEdit("profile")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => handleEdit("background")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Background
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => handleEdit("contact")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Contact Info
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2"
                        onClick={() => handleEdit("projects")}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Projects
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 col-span-2"
                        onClick={() => handleEdit("skills")}
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
                      onClick={handleCancel}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Render only the specific section of the form based on editSection */}
                  <Card>
                    <CardContent className="p-4">
                      {editSection === "profile" && (
                        <div className="space-y-6">
                          {/* Profile section from BusinessCardForm */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Profile Avatar</h3>
                              <p className="text-sm text-muted-foreground">
                                Upload your profile picture
                              </p>
                            </div>
                            {/* Avatar upload component would be here */}
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Personal Information</h3>
                              <p className="text-sm text-muted-foreground">
                                Enter your personal details
                              </p>
                            </div>
                            {/* Personal info form fields would be here */}
                          </div>
                        </div>
                      )}
                      
                      {editSection === "background" && (
                        <div className="space-y-6">
                          {/* Background section from BusinessCardForm */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Background</h3>
                              <p className="text-sm text-muted-foreground">
                                Customize your card background
                              </p>
                            </div>
                            {/* Background customization fields would be here */}
                          </div>
                        </div>
                      )}
                      
                      {editSection === "contact" && (
                        <div className="space-y-6">
                          {/* Contact section from BusinessCardForm */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Contact Information</h3>
                              <p className="text-sm text-muted-foreground">
                                Add your contact details
                              </p>
                            </div>
                            {/* Contact info form fields would be here */}
                          </div>
                        </div>
                      )}
                      
                      {editSection === "projects" && (
                        <div className="space-y-6">
                          {/* Projects section from BusinessCardForm */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Projects</h3>
                              <p className="text-sm text-muted-foreground">
                                Add your projects
                              </p>
                            </div>
                            {/* Projects form fields would be here */}
                          </div>
                        </div>
                      )}
                      
                      {editSection === "skills" && (
                        <div className="space-y-6">
                          {/* Skills section from BusinessCardForm */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Skills</h3>
                              <p className="text-sm text-muted-foreground">
                                Add skills to showcase your expertise
                              </p>
                            </div>
                            {/* Skills form fields would be here */}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "explore" && (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Explore</h1>
              <div className="rounded-lg border p-4 mb-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Search by name, skills..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button>Search</Button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Filter by:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline">Skills</Button>
                    <Button variant="outline">Projects</Button>
                    <Button variant="outline">Location</Button>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-muted-foreground">
                <p>Search for other users' cards</p>
              </div>
            </div>
          )}
          
          {activeTab === "premium" && (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Premium Features</h1>
              <PremiumFeatures user={user} />
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