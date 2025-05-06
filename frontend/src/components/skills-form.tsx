import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { 
  Skill, 
  getUserSkills,
  getCurrentUser,
  searchSkills, 
  addSkillToUser, 
  removeSkillFromUser, 
  getPremiumStatus, 
  createCustomSkill, 
  uploadSkillImage, 
  fileToDataUrl 
} from "@/lib/api";
import { X, Search, Plus, Check, ArrowRight, Upload, Loader2, Lock } from "lucide-react";
import debounce from 'lodash/debounce';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSkillIconUrl, SUGGESTED_SKILLS } from "@/lib/SkillIconHelper";


// Check if a skill is private (created by the user)
const isPrivateSkill = (skill: Skill): boolean => {
  return skill.is_predefined === false;
};


// Get displayable name (without prefix if viewing own skills)
const getDisplayName = (skill: Skill, isOwner: boolean = true): string => {
  return skill.name;
};


interface SkillsFormProps {
  userId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SkillsForm({ userId, onSuccess, onCancel }: SkillsFormProps) {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // New state for tracking deleting skills with animation
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  
  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Custom skill creation state
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState("");
  const [customSkillDescription, setCustomSkillDescription] = useState("");
  const [customSkillImage, setCustomSkillImage] = useState<File | null>(null);
  const [customSkillImageUrl, setCustomSkillImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creatingSkill, setCreatingSkill] = useState(false);
  
  // Check premium status and load skills on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Check premium status first
        const premiumStatus = await getPremiumStatus();
        console.log("Premium status for skills:", premiumStatus);

        // Consider user as premium if their tier is > 0
        const hasPremium = premiumStatus.premium_tier > 0;
        setIsPremium(hasPremium);

        if (hasPremium) {
          console.log("User has premium (tier:", premiumStatus.premium_tier, "), skills feature is enabled");

          // Only fetch skills, not the full user profile
          try {
            console.log("Fetching user skills only...");
            const loadedSkills = await getUserSkills();
            console.log(`Loaded ${loadedSkills.length} skills from dedicated endpoint:`, loadedSkills);

            setUserSkills(Array.isArray(loadedSkills) ? loadedSkills : []);
          } catch (skillsError) {
            console.error("Error loading skills:", skillsError);
            toast({
              title: "Error",
              description: "Failed to load your skills",
              variant: "destructive",
            });
            setUserSkills([]);
          }
        } else {
          console.log("User does not have premium, skills feature will be disabled");
          setUserSkills([]);
        }
      } catch (error) {
        console.error("Error loading premium status:", error);
        toast({
          title: "Error",
          description: "Failed to check premium status",
          variant: "destructive",
        });
        setIsPremium(false);
        setUserSkills([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Success animation handler
  useEffect(() => {
    if (successId !== null) {
      const timer = setTimeout(() => {
        setSuccessId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successId]);
  
  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      
      // Hide suggestions when searching
      setShowSuggestions(false);
      
      try {
        const results = await searchSkills(query.trim());
        console.log("Search results for", query, ":", results);
        
        // Filter out skills that user already has and private skills created by others
        const filteredResults = results.filter(skill => {
          // Skip if user already has this skill
          const userHasSkill = userSkills.some(userSkill => {
            // Compare by ID if available, otherwise by name
            if (skill.id && userSkill.id) {
              return userSkill.id === skill.id;
            }
            return userSkill.name.toLowerCase() === skill.name.toLowerCase();
          });
          
          if (userHasSkill) return false;
          
          // Skip private skills (created by other users)
          if (isPrivateSkill(skill)) return false;
          
          return true;
        });
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error searching skills:", error);
        toast({
          title: "Search Error",
          description: "Failed to search for skills",
          variant: "destructive",
        });
      } finally {
        setSearching(false);
      }
    }, 500),
    [userSkills]
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setSearching(true);
      debouncedSearch(query);
    } else {
      // Show suggestions when search is cleared
      setSearchResults([]);
      setShowSuggestions(true);
    }
  };
  
  // Handle adding a skill from suggestion
  const handleAddSuggestion = async (skillName: string) => {
    console.log("Adding suggested skill:", skillName);
    
    // Start search for this skill
    setSearchQuery(skillName);
    setSearching(true);
    
    try {
      // Search for the skill
      const results = await searchSkills(skillName);
      
      // Find the exact match (should be first result)
      const exactMatch = results.find(s => 
        s.name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (exactMatch) {
        // Add this skill
        await handleAddSkill(exactMatch);
      } else if (results.length > 0) {
        // Add the first result
        await handleAddSkill(results[0]);
      } else {
        // Create custom skill with this name
        setCustomSkillName(skillName);
        await handleCreateSkill();
      }
      
      // Hide suggestions after adding
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error adding suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to add suggested skill",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };
  
  // Handle adding a skill to user
  const handleAddSkill = async (skill: Skill) => {
    try {
      // Double-check premium status before adding
      const premiumStatus = await getPremiumStatus();
      const hasPremium = premiumStatus.premium_tier > 0;
      
      if (!hasPremium) {
        console.error("Cannot add skill - user does not have premium");
        toast({
          title: "Premium Required",
          description: "Skills are a premium feature. Please upgrade to add skills.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Adding skill:", skill.name, "with ID:", skill.id);
      
      // Check if skill has a valid ID (not null or undefined)
      if (skill.id === null || skill.id === undefined) {
        console.log("Skill has no ID - creating custom skill instead");
        // If skill has no ID, we need to create it first using createCustomSkill
        const createResponse = await createCustomSkill({
          name: skill.name,
          description: skill.description || "",
          image_url: skill.image_url || ""
        });
        
        if (!createResponse.success) {
          throw new Error(createResponse.error || "Failed to create skill");
        }
        
        console.log("Custom skill created successfully:", createResponse);
        
        // Use the newly created skill data from the 'skill' property, not 'user'
        if (createResponse.skill) {
          const newSkill = createResponse.skill as Skill;
          
          // Add skill to user skills
          setUserSkills([...userSkills, newSkill]);
          
          // Remove skill from search results
          setSearchResults(searchResults.filter(s => s.name !== skill.name));
          
          toast({
            title: "Skill Added",
            description: `${getDisplayName(skill)} has been added to your profile`,
            variant: "default",
          });
        } else {
          // Fallback handling if skill is not in the response
          console.error("Skill data missing from server response:", createResponse);
          
          // Create a skill object from the original data + response message
          const constructedSkill: Skill = {
            id: null, // We don't know the ID, but frontend can still display it
            name: skill.name,
            description: skill.description || "",
            image_url: skill.image_url || ""
          };
          
          // Add constructed skill to user skills list
          setUserSkills([...userSkills, constructedSkill]);
          
          toast({
            title: "Skill Added",
            description: "The skill was added but some data may be incomplete",
            variant: "default",
          });
        }
        
        return;
      }
      
      // Normal flow for skills with valid IDs
      const response = await addSkillToUser(skill.id);
      
      console.log("Server response for adding skill:", response);
      
      // Check for error in response
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Add skill to user skills
      setUserSkills([...userSkills, skill]);
      
      // Remove skill from search results
      setSearchResults(searchResults.filter(s => s.id !== skill.id));
      
      toast({
        title: "Skill Added",
        description: `${getDisplayName(skill)} has been added to your profile`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add skill",
        variant: "destructive",
      });
    }
  };
  
  // Handle removing a skill from user
  const handleRemoveSkill = async (skillId: number | null) => {
    // If skill ID is null, we can't remove it through the API
    if (skillId === null) {
      console.error("Cannot remove skill with null ID");
      toast({
        title: "Error",
        description: "Cannot remove this skill. It has no valid ID.",
        variant: "destructive",
      });
      return;
    }
    
    // First set the deleting state to show animation
    setDeletingId(skillId);
    
    // Immediately update the UI by removing the skill from state
    const skillToRemove = userSkills.find(skill => skill.id === skillId);
    setUserSkills(prev => prev.filter(skill => skill.id !== skillId));
    
    try {
      // Make the API call in the background
      await removeSkillFromUser(skillId);
      
      // Show success message
      toast({
        title: "Skill Removed",
        description: skillToRemove 
          ? `${getDisplayName(skillToRemove)} has been removed from your profile`
          : "Skill has been removed from your profile",
        variant: "default",
      });
    } catch (error) {
      console.error("Error removing skill:", error);
      
      // If the API call fails, add the skill back to the state
      if (skillToRemove) {
        setUserSkills(prev => [...prev, skillToRemove]);
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove skill",
        variant: "destructive",
      });
    } finally {
      // Clear the deleting state after a short delay
      setTimeout(() => {
        setDeletingId(null);
      }, 300);
    }
  };
  
  // Start creating a custom skill
  const startCreatingSkill = () => {
    setIsCreatingSkill(true);
    setCustomSkillName(searchQuery);
  }
  
  // Cancel creating a custom skill
  const cancelCreatingSkill = () => {
    setIsCreatingSkill(false);
    setCustomSkillName("");
    setCustomSkillDescription("");
    setCustomSkillImage(null);
    setCustomSkillImageUrl("");
  }
  
  // Handle skill image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCustomSkillImage(file);
    setIsUploadingImage(true);
    
    try {
      // First create a temporary preview
      const previewUrl = await fileToDataUrl(file);
      setCustomSkillImageUrl(previewUrl);
      
      // Now upload to server - pass skill_id if we're editing an existing skill
      const skillId: number | undefined = undefined; // No editing mode in current implementation
      const response = await uploadSkillImage(file, skillId);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to upload image");
      }
      
      // Update with the URL directly from our response
      if (response.image_url) {
        // Construct the full URL to the image
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
        const fullImageUrl = `${apiUrl}${response.image_url}`;
        
        console.log("Setting skill image URL to:", fullImageUrl);
        setCustomSkillImageUrl(fullImageUrl);
        
        toast({
          title: "Image Uploaded",
          description: "Skill image uploaded successfully",
          variant: "default",
        });
      } else {
        console.warn("Image uploaded but no URL returned:", response);
        toast({
          title: "Image Uploaded",
          description: "Image uploaded but using local preview",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error uploading skill image:", error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  }
  
  // Handle creating a custom skill
  const handleCreateSkill = async () => {
    if (!customSkillName.trim()) {
      toast({
        title: "Validation Error",
        description: "Skill name is required",
        variant: "destructive",
      });
      return;
    }
    
    setCreatingSkill(true);
    
    try {
      // Add the private prefix to the skill name to indicate it's a user-created custom skill
      const privateSkillName = customSkillName.trim();
      
      // Create the custom skill with private prefix
      const response = await createCustomSkill({
        name: privateSkillName,
        description: customSkillDescription.trim(),
        image_url: customSkillImageUrl
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to create skill");
      }
      
      // Add the new skill to the user's skills
      let newSkill: Skill;
      if (response.skill) {
        newSkill = response.skill as Skill;
      } else {
        // If skill is not in the response, construct it
        newSkill = {
          id: null,
          name: privateSkillName,
          description: customSkillDescription.trim(),
          image_url: customSkillImageUrl
        };
      }
      
      // Add to state and show success
      setUserSkills([...userSkills, newSkill]);
      setSuccessId(newSkill.id || 0); // Show success animation
      
      toast({
        title: "Skill Created",
        description: `${getDisplayName(newSkill)} has been added to your profile`,
        variant: "default",
      });
      
      // Reset the form
      cancelCreatingSkill();
      
    } catch (error) {
      console.error("Error creating custom skill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create skill",
        variant: "destructive",
      });
    } finally {
      setCreatingSkill(false);
    }
  }
  
  // Filter suggested skills to remove ones the user already has
  const filteredSuggestions = SUGGESTED_SKILLS.filter(suggestion => 
    !userSkills.some(skill => 
      skill.name.toLowerCase() === suggestion.toLowerCase() ||
      getDisplayName(skill).toLowerCase() === suggestion.toLowerCase()
    )
  );

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  // If user is not premium and has no skills, show upgrade prompt
  if (!isPremium && userSkills.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Skills</h3>
            <p className="text-sm text-muted-foreground">
              Showcase your expertise with skills
            </p>
          </div>
          <Separator />
          
          <div className="p-6 text-center border rounded-md bg-muted/30">
            <h4 className="font-medium mb-2">Premium Feature</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Skills are a premium feature. Upgrade to add skills to your profile.
            </p>
            <Button 
              onClick={() => window.location.href = '/#premium'}
              className="mb-2"
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              // Call onSuccess to refresh data before calling onCancel
              if (onSuccess) {
                onSuccess();
              }
              if (onCancel) {
                onCancel();
              }
            }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .skill-item {
          transition: all 0.3s ease;
        }
        .deleting {
          transform: translateX(100%);
          opacity: 0;
        }
        .success {
          background-color: rgba(132, 204, 22, 0.1);
          border-color: rgba(132, 204, 22, 0.5);
        }
        .skill-badge {
          transition: all 0.3s ease;
        }
      `}</style>
    
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Skills</h3>
            <p className="text-sm text-muted-foreground">
              Showcase your expertise with skills
            </p>
          </div>
          <Separator />
          
          {/* User Skills Display */}
          <div className="space-y-4">
            <h4 className="font-medium">Your Skills</h4>
            
            {userSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userSkills.map(skill => {
                  // Get icon for this skill
                  const iconUrl = getSkillIconUrl(skill);
                  const isPrivate = isPrivateSkill(skill);
                  const displayName = getDisplayName(skill);
                  
                  return (
                    <Badge 
                      // Use string for key to avoid null issues - combine id and name for uniqueness
                      key={`skill-${skill.id || ''}-${skill.name}`} 
                      variant="secondary" 
                      className={`skill-badge px-3 py-1 flex items-center gap-1 ${deletingId === skill.id ? 'deleting' : ''} ${successId === skill.id ? 'success' : ''}`}
                    >
                      {/* Add skill icon with white background */}
                      {iconUrl && (
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <img 
                            src={iconUrl} 
                            alt="" 
                            className="w-3 h-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {/* Show lock icon for private skills */}
                      {isPrivate && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      {displayName}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-destructive/10"
                        onClick={() => {
                          handleRemoveSkill(skill.id);
                        }}
                        disabled={deletingId === skill.id}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No skills added yet. Search or select from suggestions below.
              </p>
            )}
          </div>
          
          {/* Create Custom Skill Form */}
          {isCreatingSkill ? (
            <Card className="border-dashed border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Create Custom Skill</CardTitle>
                <CardDescription>
                  Add your own custom skill to your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="skill-name">Skill Name*</Label>
                  <Input
                    id="skill-name"
                    value={customSkillName}
                    onChange={e => setCustomSkillName(e.target.value)}
                    placeholder="e.g., 3D Rendering"
                    required
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="skill-description">Description</Label>
                  <Textarea
                    id="skill-description"
                    value={customSkillDescription}
                    onChange={e => setCustomSkillDescription(e.target.value)}
                    placeholder="Brief description of the skill"
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="skill-image">Skill Image</Label>
                  <div className="flex items-center gap-3">
                    {customSkillImageUrl ? (
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center overflow-hidden">
                        <img 
                          src={customSkillImageUrl} 
                          alt="Skill preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs">{customSkillName.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <Input
                        id="skill-image"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("skill-image")?.click()}
                        disabled={isUploadingImage}
                        className="w-full justify-start"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {customSkillImageUrl ? "Change Image" : "Upload Image"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-muted/30 rounded-md text-xs text-muted-foreground">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Custom skills you create are private and won't appear in search results for other users.
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelCreatingSkill}
                  disabled={creatingSkill}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateSkill}
                  disabled={!customSkillName.trim() || creatingSkill}
                >
                  {creatingSkill ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Skill
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              {/* Search Skills */}
              <div className="space-y-4 pt-2">
                <h4 className="font-medium">Add Skills</h4>
                
                {/* Skill Suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Suggested skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {filteredSuggestions.slice(0, 8).map((skill, index) => {
                        // Get icon for this suggested skill
                        const iconUrl = getSkillIconUrl({ name: skill });
                        
                        return (
                          <Badge 
                            key={`suggestion-${index}`}
                            variant="outline"
                            className="py-1 px-3 cursor-pointer hover:bg-accent"
                            onClick={() => handleAddSuggestion(skill)}
                          >
                            {/* Add skill icon */}
                            {iconUrl && (
                              <img 
                                src={iconUrl} 
                                alt="" 
                                className="w-3 h-3 mr-1"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            {skill}
                            <Plus className="h-3 w-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <div className="flex">
                    <div className="relative flex-grow">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search for skills..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9"
                        disabled={!isPremium}
                      />
                    </div>
                  </div>
                  
                  {/* Premium upgrade notice if needed */}
                  {!isPremium && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Skills are a premium feature. Upgrade to add skills.
                    </p>
                  )}
                  
                  {/* Search results */}
                  {searchQuery.trim() && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      {searching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          {searchResults.map(skill => {
                            // Get icon for this skill
                            const iconUrl = getSkillIconUrl(skill);
                            const displayName = getDisplayName(skill);
                            
                            return (
                              <div 
                                key={`search-${skill.id || skill.name}`}
                                className="p-3 hover:bg-muted/30 flex justify-between items-center border-b last:border-0"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    {iconUrl ? (
                                      <AvatarImage src={iconUrl} />
                                    ) : null}
                                    <AvatarFallback>
                                      {displayName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{displayName}</p>
                                    {skill.description && (
                                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleAddSkill(skill)}
                                  disabled={!isPremium}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            No skills found for "{searchQuery.trim()}"
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={startCreatingSkill}
                            className="mx-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create "{searchQuery.trim()}" Skill
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            // variant="outline"
            className="w-full sm:w-auto" 
            onClick={() => {
              // Call onSuccess to refresh data before calling onCancel
              if (onSuccess) {
                onSuccess();
              }
              if (onCancel) {
                onCancel();
              }
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}