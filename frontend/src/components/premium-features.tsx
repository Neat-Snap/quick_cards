"use client";

import React, { useState } from "react";
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
  Crown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/api";

// Define subscription tiers
const subscriptionTiers = [
  {
    id: 1,
    name: "Basic",
    price: 15,
    description: "Essential premium features for your card",
    features: [
      "Custom background color",
      "Basic badge options",
      "Up to 3 projects"
    ],
    icon: Star
  },
  {
    id: 2,
    name: "Pro",
    price: 25,
    description: "Advanced features for professionals",
    features: [
      "Custom background photo upload",
      "Custom badge creation",
      "Skills section (up to 5 skills)",
      "Up to 5 projects",
      "Verified badge"
    ],
    popular: true,
    icon: Sparkles
  },
  {
    id: 3,
    name: "Ultimate",
    price: 40,
    description: "All premium features with no limits",
    features: [
      "All Pro features",
      "Unlimited projects",
      "Unlimited skills",
      "Animated elements",
      "Custom links",
      "Video uploads"
    ],
    icon: Crown
  }
];

interface PremiumFeaturesProps {
  user: User | null;
}

export function PremiumFeatures({ user }: PremiumFeaturesProps) {
  const isPremium = user?.is_premium || false;
  
  // Array of premium feature information
  const premiumFeatures = [
    {
      name: "Custom Background Image",
      description: "Upload your own background image for your card",
      included: true
    },
    {
      name: "Custom Badge",
      description: "Add a special badge next to your name",
      included: true
    },
    {
      name: "Skill Showcase",
      description: "Add and display your skills with custom images",
      included: true
    },
    {
      name: "Unlimited Projects",
      description: "Add unlimited number of projects to your profile",
      included: true
    },
    {
      name: "Animated Elements",
      description: "Add beautiful animations to your card",
      included: true
    },
    {
      name: "Custom Links",
      description: "Add custom links to your profile",
      included: true
    },
    {
      name: "Verified Badge",
      description: "Show a verified badge on your card",
      included: true
    },
    {
      name: "Video Support",
      description: "Add video presentations to your card",
      included: true
    },
  ];

  return (
    <div className="space-y-6">
      {!isPremium ? (
        <>
          <div className="text-center mb-8">
            <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Upgrade to Premium</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Get access to exclusive features to customize your business card and stand out from the crowd.
            </p>
          </div>
          
          <Card className="border-2 border-yellow-400/30">
            <CardHeader className="bg-yellow-400/10">
              <CardTitle className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Premium Plan
                <Star className="h-5 w-5 text-yellow-400" />
              </CardTitle>
              <CardDescription className="text-center">All premium features included</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">{feature.name}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg">
                Subscribe for 9.99 Telegram Stars
              </Button>
            </CardFooter>
          </Card>
        </>
      ) : (
        <div className="text-center">
          <div className="mb-8">
            <Badge variant="default" className="bg-yellow-400 text-black px-3 py-1 text-sm">
              Active Premium Subscription
            </Badge>
            <h2 className="text-xl font-bold mt-4 mb-2">You have Premium access</h2>
            <p className="text-sm text-muted-foreground">
              You have access to all premium features. Enjoy customizing your business card!
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Premium Features</CardTitle>
              <CardDescription>Check out all the premium features you have access to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">{feature.name}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 