"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Image, 
  BadgeCheck, 
  Briefcase,
  Code,
  Check,
  Star,
  Crown,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { User, PremiumTier, PremiumStatus, getPremiumStatus, getPremiumTiers, subscribeToPremium } from "@/lib/api";
import { closeApp } from "@/lib/telegram";

interface PremiumFeaturesProps {
  user: User | null;
  onSubscribed?: () => void;
}

export function PremiumFeatures({ user, onSubscribed }: PremiumFeaturesProps) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [premiumTiers, setPremiumTiers] = useState<PremiumTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  
  // Format premium features from API into UI-friendly format
  const premiumFeatures = [
    {
      name: "Custom Background Image",
      description: "Upload your own background image for your card",
      tier: 1,
      icon: Image
    },
    {
      name: "Custom Badge",
      description: "Add a special badge next to your name",
      tier: 1,
      icon: BadgeCheck
    },
    {
      name: "Skills",
      description: "Add and display your skills with custom images",
      tier: 1,
      icon: Code
    },
    {
      name: "Extended Projects",
      description: "Add up to 5 projects to your profile (up from 3)",
      tier: 2,
      icon: Briefcase
    },
    {
      name: "Animated Elements",
      description: "Add beautiful animations to your card",
      tier: 2,
      icon: Sparkles
    },
    {
      name: "Custom Links",
      description: "Add external links to your profile",
      tier: 2,
      icon: BadgeCheck
    },
    {
      name: "Verified Badge",
      description: "Show a verified badge on your card",
      tier: 3,
      icon: BadgeCheck
    },
    {
      name: "Video Support",
      description: "Add video presentations to your card",
      tier: 3,
      icon: Image
    }
  ];
  
  // Load premium status and tiers on mount
  useEffect(() => {
    const loadPremiumData = async () => {
      try {
        // Load premium status
        const status = await getPremiumStatus();
        setPremiumStatus(status);
        
        // Load premium tiers
        const tiers = await getPremiumTiers();
        setPremiumTiers(tiers);
      } catch (error) {
        console.error("Error loading premium data:", error);
        toast({
          title: "Error",
          description: "Failed to load premium information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPremiumData();
  }, []);
  
  // Handle subscription
  const handleSubscribe = async (tier: number) => {
    setSubscribing(true);
    
    try {
      const response = await subscribeToPremium(tier, "telegram");
      
      if (!response.success) {
        throw new Error(response.error || "Failed to subscribe");
      }
      
      // If there's a payment URL, open it in Telegram
      if (response.payment_url) {
        // Open Telegram payment
        window.Telegram.WebApp.openTelegramLink(response.payment_url);
        
        // Close WebApp after initiating payment
        setTimeout(() => {
          closeApp();
        }, 1000);
      }
      
      // Update premium status
      setPremiumStatus({
        premium_tier: tier,
        tier_name: ["Basic", "Premium", "Ultimate"][tier - 1],
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        is_active: true
      });
      
      toast({
        title: "Subscription Initiated",
        description: "You will be redirected to complete your subscription",
        variant: "default",
      });
      
      if (onSubscribed) {
        onSubscribed();
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Failed to subscribe",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };
  
  // Format expiration date
  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading premium information...</div>;
  }

  const isPremium = premiumStatus?.is_active || false;
  const currentTier = premiumStatus?.premium_tier || 0;

  return (
    <div className="space-y-6">
      {/* Premium Status Banner */}
      {isPremium ? (
        <div className="text-center">
          <div className="mb-6">
            <Badge variant="default" className="bg-yellow-400 text-black px-3 py-1 text-sm">
              Active Premium Subscription
            </Badge>
            <h2 className="text-xl font-bold mt-4 mb-2">
              {premiumStatus.tier_name} Plan
            </h2>
            <p className="text-sm text-muted-foreground flex justify-center items-center gap-1">
              <Calendar className="h-4 w-4" />
              Expires: {formatExpirationDate(premiumStatus.expires_at)}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center mb-8">
          <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Get access to exclusive features to customize your business card and stand out from the crowd.
          </p>
        </div>
      )}
      
      {/* Premium Tiers */}
      <div className="grid grid-cols-1 gap-4">
        {premiumTiers.map((tier) => {
          const TierIcon = tier.tier === 1 ? Star : tier.tier === 2 ? Sparkles : Crown;
          const isCurrentTier = currentTier === tier.tier;
          const canUpgrade = tier.tier > currentTier;
          
          return (
            <Card 
              key={tier.tier} 
              className={`${isCurrentTier ? 'border-2 border-yellow-400/50' : ''}`}
            >
              <CardHeader className={`${isCurrentTier ? 'bg-yellow-400/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TierIcon className={`h-5 w-5 ${isCurrentTier ? 'text-yellow-400' : ''}`} />
                    {tier.name} Plan
                  </CardTitle>
                  <Badge variant={isCurrentTier ? "default" : "outline"}>
                    {isCurrentTier ? "Current" : `${tier.price} Stars`}
                  </Badge>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {premiumFeatures
                    .filter(feature => feature.tier <= tier.tier)
                    .map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium">{feature.name}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
              
              <CardFooter>
                {isPremium ? (
                  isCurrentTier ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button 
                      className="w-full"
                      onClick={() => handleSubscribe(tier.tier)}
                      disabled={subscribing}
                    >
                      Upgrade for {tier.price} Stars
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Higher Tier
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(tier.tier)}
                    disabled={subscribing}
                  >
                    Subscribe for {tier.price} Stars
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}