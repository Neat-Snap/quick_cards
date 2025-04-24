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
import { User, updateUserProfile, getPremiumStatus } from "@/lib/api";

interface ProfileFormProps {
  user: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileForm({ user, onSuccess, onCancel }: ProfileFormProps) {
  const [name, setName] = useState(user?.name || "");
  const [description, setDescription] = useState(user?.description || "");
  const [badge, setBadge] = useState(user?.badge || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
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
    
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // First, update the user profile
      const updateData: Partial<User> = {
        name,
        description,
      };
      
      // Only include badge if premium or badge was already set
      if (isPremium || user.badge) {
        updateData.badge = badge;
      }
      
      const response = await updateUserProfile(updateData);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to update profile");
      }
      
      // TODO: Handle avatar upload separately if needed
      // For now, we'll assume avatar is handled separately
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });
      
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
            <AvatarImage src={avatarPreview} alt="Profile" />
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
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              placeholder="Your Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Write a brief description about yourself"
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="badge">Badge {!isPremium && user?.badge === "" && "(Premium)"}</Label>
            <Input 
              id="badge" 
              placeholder="e.g., Pro, Verified, Expert" 
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              disabled={!isPremium && user?.badge === ""}
            />
            {!isPremium && user?.badge === "" && (
              <p className="text-xs text-muted-foreground">
                Custom badges are available with Premium
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}