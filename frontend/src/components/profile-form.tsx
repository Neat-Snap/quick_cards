"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, updateUserProfile, getPremiumStatus, uploadAvatar } from "@/lib/api";
import { getAvatarUrl } from "@/components/business-card-preview";
import { AlertCircle, Info } from "lucide-react";

// Validation constants from backend
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_BADGE_LENGTH = 20;
const MIN_BADGE_LENGTH = 2;
const MAX_DESCRIPTION_LENGTH = 1000;
const DISALLOWED_CHARS = ['"', '/', '\\', ';', '|', '`', '$', '!', '=', '+', '-'];

// Helper function to check for disallowed characters
const containsDisallowedChars = (value: string): boolean => {
  return DISALLOWED_CHARS.some(char => value.includes(char));
};

interface ProfileFormProps {
  user: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileForm({ user, onSuccess, onCancel }: ProfileFormProps) {
  const [name, setName] = useState(user?.name || "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [description, setDescription] = useState(user?.description || "");
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [badge, setBadge] = useState(user?.badge || "");
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // Validate inputs on change
  useEffect(() => {
    // Validate name
    if (name.length > 0 && name.length < MIN_NAME_LENGTH) {
      setNameError(`Name must be longer than ${MIN_NAME_LENGTH} characters`);
    } else if (name.length > MAX_NAME_LENGTH) {
      setNameError(`Name must be ${MAX_NAME_LENGTH} characters or less`);
    } else if (containsDisallowedChars(name)) {
      setNameError(`Name contains disallowed characters: ${DISALLOWED_CHARS.join(' ')}`);
    } else {
      setNameError(null);
    }
    
    // Validate description
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setDescriptionError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
    } else if (containsDisallowedChars(description)) {
      setDescriptionError(`Description contains disallowed characters: ${DISALLOWED_CHARS.join(' ')}`);
    } else {
      setDescriptionError(null);
    }
    
    // Validate badge
    if (badge.length > 0 && badge.length < MIN_BADGE_LENGTH && badge.length > 0) {
      setBadgeError(`Badge must be longer than ${MIN_BADGE_LENGTH} characters`);
    } else if (badge.length > MAX_BADGE_LENGTH) {
      setBadgeError(`Badge must be ${MAX_BADGE_LENGTH} characters or less`);
    } else if (containsDisallowedChars(badge)) {
      setBadgeError(`Badge contains disallowed characters: ${DISALLOWED_CHARS.join(' ')}`);
    } else {
      setBadgeError(null);
    }
  }, [name, description, badge]);
  
  // Check premium status on mount
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus.is_active);
      } catch (error) {
        console.error("Failed to check premium status:", error);
        setIsPremium(false);
      }
    };
    
    checkPremiumStatus();
  }, []);
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for validation errors before submitting
    if (nameError || descriptionError || badgeError) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // First handle avatar upload if a new file was selected
      let newAvatarUrl = undefined;
      
      if (avatar) {
        console.log("Uploading avatar file...");
        const avatarResponse = await uploadAvatar(avatar);
        
        if (!avatarResponse.success) {
          throw new Error(avatarResponse.error || "Failed to upload avatar");
        }
        
        // Get the new avatar URL from the response
        if (avatarResponse.user && avatarResponse.user.avatar_url) {
          newAvatarUrl = avatarResponse.user.avatar_url;
          console.log("Avatar uploaded successfully:", newAvatarUrl);
        }
      }
      
      // Then update the user profile with all changes
      const updateData: Partial<User> = {
        name,
        description
      };
      
      // Only include avatar if we uploaded a new one
      if (newAvatarUrl) {
        updateData.avatar_url = newAvatarUrl;
      }
      
      // Only include badge if premium or badge was already set
      if (isPremium || user.badge) {
        updateData.badge = badge;
      }
      
      console.log("Updating profile with data:", updateData);
      const response = await updateUserProfile(updateData);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to update profile");
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });
      
      // Call onSuccess to close the edit form and refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Profile Avatar</h3>
          <p className="text-sm text-muted-foreground">
            Upload your profile picture
          </p>
        </div>
        <Separator />
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={avatarPreview || getAvatarUrl(user?.avatar_url)} alt="Profile" />
            <AvatarFallback>
              {user?.first_name?.charAt(0) || ""}
              {user?.last_name?.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Input 
              id="avatar" 
              type="file" 
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("avatar")?.click()}
            >
              Upload Avatar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Personal Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Edit your personal details
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="fullName">Full Name*</Label>
              <span className={`text-xs ${name.length > MAX_NAME_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <Input 
              id="fullName" 
              placeholder="Your Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? "border-destructive" : ""}
              required
              maxLength={MAX_NAME_LENGTH}
            />
            {nameError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{nameError}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>{MIN_NAME_LENGTH}-{MAX_NAME_LENGTH} regular characters</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="description">Description</Label>
              <span className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <Textarea 
              id="description" 
              placeholder="Write a brief description about yourself"
              className={`min-h-[100px] ${descriptionError ? "border-destructive" : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            {descriptionError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{descriptionError}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Under {MAX_DESCRIPTION_LENGTH} regular characters</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="badge">Badge {!isPremium && user?.badge === "" && "(Premium)"}</Label>
              <span className={`text-xs ${badge.length > MAX_BADGE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {badge.length}/{MAX_BADGE_LENGTH}
              </span>
            </div>
            <Input 
              id="badge" 
              placeholder="e.g., Pro, Verified, Expert" 
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              disabled={!isPremium && user?.badge === ""}
              className={badgeError ? "border-destructive" : ""}
              maxLength={MAX_BADGE_LENGTH}
            />
            {badgeError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{badgeError}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>{MIN_BADGE_LENGTH}-{MAX_BADGE_LENGTH} regular characters</span>
            </div>
            {!isPremium && user?.badge === "" && (
              <p className="text-xs text-muted-foreground">
                Custom badges are available with Premium
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <Button 
          type="submit"
          className="w-full"
          disabled={isSubmitting || !!nameError || !!descriptionError || !!badgeError}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}