"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Skill, getUserSkills, searchSkills, addSkillToUser, removeSkillFromUser, getPremiumStatus } from "@/lib/api";
import { X, Search, Plus } from "lucide-react";
import debounce from 'lodash/debounce';

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
  
  // Check premium status on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user skills
        const skills = await getUserSkills();
        setUserSkills(skills);
        
        // Check premium status
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus.is_active);
      } catch (error) {
        console.error("Error loading skills data:", error);
        toast({
          title: "Error",
          description: "Failed to load your skills",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Debounced search function
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
        
        // Filter out skills that user already has
        const filteredResults = results.filter(skill => 
          !userSkills.some(userSkill => userSkill.id === skill.id)
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
    if (!isPremium) {
      toast({
        title: "Premium Required",
        description: "Skills are a premium feature. Please upgrade to add skills.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await addSkillToUser(skill.id);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to add skill");
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
  const handleRemoveSkill = async (skillId: number) => {
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
                <Badge key={skill.id} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                  {skill.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/10"
                    onClick={() => handleRemoveSkill(skill.id)}
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
          onClick={onCancel}
        >
          Back
        </Button>
      </div>
    </div>
  );
}