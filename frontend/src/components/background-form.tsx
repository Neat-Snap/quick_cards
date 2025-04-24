"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { User, updateUserProfile, getPremiumStatus } from "@/lib/api";

interface BackgroundFormProps {
  user: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Predefined colors
const COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#dc2626", // red
  "#ca8a04", // yellow
  "#0f172a", // slate
  "#1e293b", // slate-800
  "#334155", // slate-700
];

export function BackgroundForm({ user, onSuccess, onCancel }: BackgroundFormProps) {
  const [backgroundType, setBackgroundType] = useState<string>(user?.background_type || "color");
  const [selectedColor, setSelectedColor] = useState<string>(
    (user?.background_type === "color" && user?.background_value) || 
    user?.background_color || 
    "#1e293b"
  );
  const [useGradient, setUseGradient] = useState<boolean>(backgroundType === "gradient");
  const [gradientEndColor, setGradientEndColor] = useState<string>("#334155");
  const [customBackground, setCustomBackground] = useState<File | null>(null);
  const [customBackgroundPreview, setCustomBackgroundPreview] = useState<string | null>(
    backgroundType === "image" ? (user?.background_value || null) : null
  );
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
  
  // Handle toggling gradient
  useEffect(() => {
    if (useGradient) {
      setBackgroundType("gradient");
    } else if (customBackground || customBackgroundPreview) {
      setBackgroundType("image");
    } else {
      setBackgroundType("color");
    }
  }, [useGradient, customBackground, customBackgroundPreview]);
  
  // Handle custom background file selection
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isPremium) {
      setCustomBackground(file);
      setBackgroundType("image");
      setUseGradient(false);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCustomBackgroundPreview(previewUrl);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      let backgroundValue = selectedColor;
      
      if (backgroundType === "gradient") {
        backgroundValue = `linear-gradient(135deg, ${selectedColor}, ${gradientEndColor})`;
      } else if (backgroundType === "image") {
        // For image, we'd typically upload it first, but for now we'll just use the preview URL
        // In a real implementation, you'd upload the image to a server and get a URL back
        backgroundValue = customBackgroundPreview || "";
        
        // Check if user has premium for custom background image
        if (!isPremium) {
          throw new Error("Premium subscription required for custom background images");
        }
      }
      
      const updateData: Partial<User> = {
        background_type: backgroundType,
        background_value: backgroundValue,
      };
      
      const response = await updateUserProfile(updateData);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to update background");
      }
      
      toast({
        title: "Background Updated",
        description: "Your card background has been successfully updated.",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating background:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update background",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate gradient preview
  const getGradientStyle = () => {
    if (backgroundType === "gradient") {
      return {
        backgroundImage: `linear-gradient(135deg, ${selectedColor}, ${gradientEndColor})`,
      };
    }
    return { backgroundColor: selectedColor };
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Background</h3>
          <p className="text-sm text-muted-foreground">
            Customize your card background
          </p>
        </div>
        <Separator />
        
        {/* Color Selection */}
        <div className="space-y-4">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <Button
                key={color}
                type="button"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full"
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color);
                  if (!useGradient) {
                    setBackgroundType("color");
                  }
                }}
                aria-label={`Select ${color} color`}
              />
            ))}
            
            {/* Custom color input */}
            <Input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="h-8 w-16 p-1"
              aria-label="Custom color"
            />
          </div>
        </div>
        
        {/* Background Preview */}
        <div 
          className="h-20 w-full rounded-md overflow-hidden border"
          style={
            backgroundType === "image" && customBackgroundPreview
              ? { backgroundImage: `url(${customBackgroundPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : getGradientStyle()
          }
        />
        
        {/* Gradient Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="gradient"
            checked={useGradient}
            onCheckedChange={setUseGradient}
          />
          <Label htmlFor="gradient">Use Gradient</Label>
        </div>
        
        {/* Gradient End Color (only show if gradient is enabled) */}
        {useGradient && (
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="gradientEndColor">Gradient End Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="gradientEndColor"
                type="color"
                value={gradientEndColor}
                onChange={(e) => setGradientEndColor(e.target.value)}
                className="h-8 w-16 p-1"
              />
              <div 
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: gradientEndColor }}
              />
            </div>
          </div>
        )}
        
        {/* Custom Background Image */}
        <div className="grid grid-cols-1 gap-3">
          <Label htmlFor="customBackground">
            Upload Custom Photo {!isPremium && "(Premium)"}
          </Label>
          <div className="flex items-center gap-2">
            <Input 
              id="customBackground" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleBackgroundChange}
              disabled={!isPremium}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById("customBackground")?.click()}
              disabled={!isPremium}
            >
              Choose File
            </Button>
          </div>
          {!isPremium && (
            <p className="text-xs text-muted-foreground">
              Custom background photos are available with Premium
            </p>
          )}
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