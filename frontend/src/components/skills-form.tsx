"use client";

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
  searchSkills, 
  addSkillToUser, 
  removeSkillFromUser, 
  getPremiumStatus, 
  createCustomSkill, 
  uploadSkillImage, 
  fileToDataUrl,
  getCurrentUser 
} from "@/lib/api";
import { X, Search, Plus, Check, ArrowRight, Upload, Loader2 } from "lucide-react";
import debounce from 'lodash/debounce';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import * as SimpleIcons from 'simple-icons';

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
          
          // Force-reload the user profile to get fresh skills data
          try {
            console.log("Fetching full user profile to get latest skills...");
            const userResponse = await getCurrentUser();
            
            // Get the skills from the full user response
            let loadedSkills: Skill[] = [];
            
            if (userResponse.success && userResponse.user && Array.isArray(userResponse.user.skills)) {
              loadedSkills = userResponse.user.skills;
              console.log(`Loaded ${loadedSkills.length} skills from user profile:`, loadedSkills);
            } else {
              // Fall back to direct skills endpoint
              console.log("No skills in user profile, trying dedicated skills endpoint...");
              loadedSkills = await getUserSkills();
              console.log(`Loaded ${loadedSkills.length} skills from dedicated endpoint:`, loadedSkills);
            }
            
            if (loadedSkills.length > 0) {
              setUserSkills(loadedSkills);
            } else {
              console.log("No skills found for user");
              setUserSkills([]);
            }
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

// eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      
      try {
        const results = await searchSkills(query.trim());
        console.log("Search results for", query, ":", results);
        
        // Filter out skills that user already has
        const filteredResults = results.filter(skill => 
          !userSkills.some(userSkill => {
            // Compare by ID if available, otherwise by name
            if (skill.id && userSkill.id) {
              return userSkill.id === skill.id;
            }
            return userSkill.name.toLowerCase() === skill.name.toLowerCase();
          })
        );
        
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
    setSearching(Boolean(query.trim()));
    debouncedSearch(query);
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
            description: `${skill.name} has been added to your profile`,
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
        description: `${skill.name} has been added to your profile`,
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
    
    try {
      const response = await removeSkillFromUser(skillId);
      
      if ('error' in response) {
        throw new Error(response.error || "Failed to remove skill");
      }
      
      // Remove skill from user skills
      setUserSkills(userSkills.filter(skill => skill.id !== skillId));
      
      toast({
        title: "Skill Removed",
        description: "Skill has been removed from your profile",
        variant: "default",
      });
    } catch (error) {
      console.error("Error removing skill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove skill",
        variant: "destructive",
      });
    }
  };

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
            onClick={onCancel}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

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
        
        {/* User Skills Display */}
        <div className="space-y-4">
          <h4 className="font-medium">Your Skills</h4>
          
          {userSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userSkills.map(skill => (
                <Badge 
                  // Use string for key to avoid null issues - combine id and name for uniqueness
                  key={`skill-${skill.id || ''}-${skill.name}`} 
                  variant="secondary" 
                  className="px-3 py-1 flex items-center gap-1"
                >
                  {skill.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/10"
                    onClick={() => {
                      // Only call removeSkill if ID is not null
                      if (skill.id !== null) {
                        handleRemoveSkill(skill.id);
                      } else {
                        toast({
                          title: "Cannot Remove",
                          description: "This skill cannot be removed because it has no ID",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills added yet. Search to add skills.
            </p>
          )}
        </div>
        
        {/* Search Skills */}
        <div className="space-y-4 pt-2">
          <h4 className="font-medium">Add Skills</h4>
          
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
                    {searchResults.map(skill => (
                      <div 
                        key={skill.id}
                        className="p-3 hover:bg-muted/30 flex justify-between items-center border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          {skill.description && (
                            <p className="text-xs text-muted-foreground">{skill.description}</p>
                          )}
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
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No skills found for "{searchQuery.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
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