"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { User, updateUserProfile, getPremiumStatus } from "@/lib/api";
import { Info, AlertCircle, Lock } from "lucide-react";

interface BackgroundFormProps {
  user: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ALLOWED_BACKGROUND_TYPES = ["color", "gradient", "image"];
const MAX_BACKGROUND_VALUE_LENGTH = 255;
const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{6})$/;

const COLORS = [
  "#f0f9ff",
  "#e0f2fe",
  "#bae6fd",
  "#0891b2",
  "#0284c7",
  "#2563eb",
  "#0e7490",
  "#14b8a6",
  "#16a34a",
  "#22c55e",
  "#65a30d",
  "#ca8a04",
  "#fde68a",
  "#f97316",
  "#fb923c",
  "#dc2626",
  "#fca5a5",
  "#db2777",
  "#fbcfe8",
  "#9333ea",
  "#c084fc",
  "#6d28d9",
  "#818cf8",
  "#0f172a",
  "#1e293b",
  "#334155",
  "#94a3b8",
  "#111827",
  "#f5f5f5",
  "#e2e8f0",
];


export function BackgroundForm({ user, onSuccess, onCancel }: BackgroundFormProps) {
  const findClosestColor = (colorValue: string): string => {
    if (!colorValue || typeof colorValue !== 'string') return COLORS[0];
    
    if (COLORS.includes(colorValue)) return colorValue;
    
    return COLORS[0];
  };
  
  const [backgroundType, setBackgroundType] = useState<string>(user?.background_type || "color");
  const [selectedColor, setSelectedColor] = useState<string>(
    (user?.background_type === "color" && user?.background_value) 
      ? findClosestColor(user.background_value)
      : COLORS[0]
  );
  const [useGradient, setUseGradient] = useState<boolean>(backgroundType === "gradient");
  const [gradientEndColor, setGradientEndColor] = useState<string>(
    backgroundType === "gradient" && user?.background_value 
      ? (user.background_value.includes("linear-gradient") 
          ? findClosestColor(extractEndColor(user.background_value) || COLORS[7])
          : COLORS[7])
      : COLORS[7]
  );
  const [customBackground, setCustomBackground] = useState<File | null>(null);
  const [customBackgroundPreview, setCustomBackgroundPreview] = useState<string | null>(
    backgroundType === "image" ? (user?.background_value || null) : null
  );
  const [backgroundValueError, setBackgroundValueError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);
  
  function extractEndColor(gradientString: string): string | null {
    try {
      const match = gradientString.match(/linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
      if (match && match[2]) {
        return match[2].trim();
      }
    } catch (e) {
      console.error("Error extracting gradient end color:", e);
    }
    return null;
  }
  
  useEffect(() => {
    setBackgroundValueError(null);
    
    if (backgroundType === "color") {
      if (!HEX_COLOR_REGEX.test(selectedColor)) {
        setBackgroundValueError("Invalid color format. Must be a valid hex color (e.g., #RRGGBB)");
      }
    } else if (backgroundType === "gradient") {
      if (!HEX_COLOR_REGEX.test(selectedColor) || !HEX_COLOR_REGEX.test(gradientEndColor)) {
        setBackgroundValueError("Invalid gradient colors. Both must be valid hex colors");
      }
      
      const gradientString = `linear-gradient(135deg, ${selectedColor}, ${gradientEndColor})`;
      if (gradientString.length > MAX_BACKGROUND_VALUE_LENGTH) {
        setBackgroundValueError(`Gradient value exceeds maximum length of ${MAX_BACKGROUND_VALUE_LENGTH} characters`);
      }
      
      if (!isPremium) {
        setBackgroundValueError("Premium subscription required for gradient backgrounds");
      }
    } else if (backgroundType === "image") {
      if (!customBackgroundPreview) {
        setBackgroundValueError("Please select an image for the background");
      } else if (customBackgroundPreview.length > MAX_BACKGROUND_VALUE_LENGTH) {
        setBackgroundValueError(`Image URL exceeds maximum length of ${MAX_BACKGROUND_VALUE_LENGTH} characters`);
      }
      
      if (!isPremium) {
        setBackgroundValueError("Premium subscription required for custom background images");
      }
    }
  }, [backgroundType, selectedColor, gradientEndColor, customBackgroundPreview, isPremium]);
  
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const premiumStatus = await getPremiumStatus();
        console.log("got premium status from functions", premiumStatus)
        setIsPremium(premiumStatus.is_active);
      } catch (error) {
        console.error("Failed to check premium status:", error);
        setIsPremium(false);
      } finally {
        setIsPremiumLoading(false);
      }
    };
    
    checkPremiumStatus();
  }, []);
  
  useEffect(() => {
    if (isPremiumLoading) return;
    if (useGradient && !isPremium) {
      console.log("isPremium", isPremium, "useGradient", useGradient)
      toast({
        title: "Premium Feature",
        description: "Gradient backgrounds are available with Premium",
        variant: "default",
      });
      setBackgroundType("color");
      return;
    }
    
    if (useGradient) {
      setBackgroundType("gradient");
    } else if (customBackground || customBackgroundPreview) {
      setBackgroundType("image");
    } else {
      setBackgroundType("color");
    }
  }, [useGradient, customBackground, customBackgroundPreview, isPremium, isPremiumLoading]);
  
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isPremium) {
      setCustomBackground(file);
      setBackgroundType("image");
      setUseGradient(false);
      
      const previewUrl = URL.createObjectURL(file);
      setCustomBackgroundPreview(previewUrl);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user) return;
  
    if (backgroundValueError) {
      toast({
        title: "Validation Error",
        description: backgroundValueError,
        variant: "destructive",
      });
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      let backgroundValue = selectedColor;
  
      if (backgroundType === "gradient") {
        if (!isPremium) {
          throw new Error("Premium subscription required for gradient backgrounds");
        }
        backgroundValue = `linear-gradient(135deg, ${selectedColor}, ${gradientEndColor})`;
      } else if (backgroundType === "image") {
        backgroundValue = customBackgroundPreview || "";
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
        
        <div className="space-y-4">
          <Label>Select Background Color</Label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <Button
                key={color}
                type="button"
                variant="outline"
                className={`h-10 w-10 p-0 rounded-full cursor-pointer ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
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
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Background Preview</Label>
          <div 
            className="h-24 w-full rounded-md overflow-hidden border"
            style={
              backgroundType === "image" && customBackgroundPreview
                ? { backgroundImage: `url(${customBackgroundPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : getGradientStyle()
            }
          />
          {backgroundValueError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{backgroundValueError}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4 pt-2">
          <div className="flex items-center">
            <Label className="font-medium">Premium Features</Label>
            {!isPremium && <Lock className="h-4 w-4 ml-2 text-muted-foreground" />}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="gradient"
              checked={useGradient}
              onCheckedChange={setUseGradient}
              disabled={!isPremium || isPremiumLoading}
            />
            <Label htmlFor="gradient" className={!isPremium ? "text-muted-foreground" : ""}>
              Use Gradient
              {!isPremium && <span className="ml-2 text-xs">(Premium)</span>}
            </Label>
          </div>
          
          {useGradient && isPremium && (
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="gradientEndColor">Gradient End Color</Label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <Button
                    key={`end-${color}`}
                    type="button"
                    variant="outline"
                    className={`h-10 w-10 p-0 rounded-full cursor-pointer ${gradientEndColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setGradientEndColor(color)}
                    aria-label={`Select ${color} as gradient end color`}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="customBackground" className={!isPremium ? "text-muted-foreground" : ""}>
              Upload Custom Photo
              {!isPremium && <span className="ml-2 text-xs">(Premium)</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input 
                id="customBackground" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleBackgroundChange}
                disabled={!isPremium || isPremiumLoading}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("customBackground")?.click()}
                disabled={!isPremium || isPremiumLoading}
              >
                Choose File
              </Button>
            </div>
            {customBackgroundPreview && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground truncate" style={{ maxWidth: "300px" }}>
                  {customBackgroundPreview.substring(0, 50)}
                  {customBackgroundPreview.length > 50 ? "..." : ""}
                </span>
              </div>
            )}
          </div>
          
          {!isPremium && (
            <div className="pt-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Upgrade to Premium for gradients and custom backgrounds
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <Button 
          type="submit"
          className="w-full"
          disabled={isSubmitting || !!backgroundValueError}
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