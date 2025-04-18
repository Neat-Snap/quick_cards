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

export function PremiumFeatures() {
  // This would come from a user's profile in a real app
  const [userSubscription, setUserSubscription] = useState<number | null>(null);
  
  // For demo purposes - toggle subscription
  const toggleSubscription = () => {
    if (userSubscription === null) {
      setUserSubscription(1); // Set to Basic tier
    } else if (userSubscription < 3) {
      setUserSubscription(userSubscription + 1); // Upgrade
    } else {
      setUserSubscription(null); // Cancel subscription
    }
  };
  
  // Helper to render the current subscription icon
  const renderCurrentIcon = () => {
    if (userSubscription === null) return null;
    
    const CurrentIcon = subscriptionTiers[userSubscription - 1].icon;
    return <CurrentIcon className="h-5 w-5 text-primary" />;
  };
  
  return (
    <div className="space-y-6">
      {userSubscription === null ? (
        // User has no subscription - show all tiers
        <>
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Telegram Stars Subscription</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a subscription tier to enhance your card with premium features
            </p>
          </div>

          <div className="grid gap-4">
            {subscriptionTiers.map((tier) => (
              <div 
                key={tier.id} 
                className={`flex flex-col p-4 rounded-lg border ${tier.popular ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                {tier.popular && (
                  <div className="self-end px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-2">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  {React.createElement(tier.icon, { className: "h-5 w-5 text-primary" })}
                  <h3 className="font-semibold">{tier.name}</h3>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {tier.description}
                </p>
                
                <div className="mb-4 space-y-2">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-auto pt-4">
                  <div className="flex items-baseline mb-3">
                    <span className="text-2xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">Telegram Stars / month</span>
                  </div>
                  
                  <Button className="w-full">
                    Subscribe to {tier.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        // User has a subscription - show current tier and upgrade options
        <>
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              {renderCurrentIcon()}
              <h3 className="font-semibold">
                Current Plan: {subscriptionTiers[userSubscription - 1].name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your subscription renews on July 15, 2023
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Your Benefits</h3>
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              {subscriptionTiers[userSubscription - 1].features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {userSubscription < 3 && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">Upgrade Your Plan</h3>
                
                <div className="grid gap-4">
                  {subscriptionTiers.slice(userSubscription).map((tier) => (
                    <div key={tier.id} className="flex justify-between items-center p-4 rounded-lg border">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {React.createElement(tier.icon, { className: "h-5 w-5 text-primary" })}
                          <h4 className="font-medium">{tier.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tier.price} Telegram Stars / month
                        </p>
                      </div>
                      
                      <Button>Upgrade</Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-center">
            {/* For demo purposes - toggle subscription state */}
            <Button onClick={toggleSubscription}>
              {userSubscription < 3 ? "Demo: Upgrade Plan" : "Demo: Cancel Subscription"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 