"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Sparkles, 
  Image, 
  BadgeCheck, 
  Briefcase,
  Code
} from "lucide-react";

// Premium feature data based on rules.md
const premiumFeatures = [
  {
    id: 1,
    title: "Background Image Upload",
    description: "Upload your own photo as a custom background for your card",
    price: 10,
    icon: Image,
  },
  {
    id: 2,
    title: "Custom Badge",
    description: "Create and display a personalized badge next to your name",
    price: 8,
    icon: BadgeCheck,
  },
  {
    id: 3,
    title: "Skills Section",
    description: "Add a dedicated skills section to showcase your expertise",
    price: 12,
    icon: Code,
  },
  {
    id: 4,
    title: "Unlimited Projects",
    description: "Add more than 3 projects to your profile (free users limited to 3)",
    price: 15,
    icon: Briefcase,
  }
];

export function PremiumFeatures() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-muted">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Telegram Stars Benefits</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Unlock premium features using Telegram Stars to enhance your card with advanced customization options.
        </p>
      </div>

      <div className="grid gap-4">
        {premiumFeatures.map((feature) => (
          <div key={feature.id} className="flex items-start justify-between p-4 rounded-lg border">
            <div className="flex gap-3">
              <feature.icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
            <Button className="shrink-0 gap-1">
              {feature.price} <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-2 items-center text-center p-4">
        <p className="text-sm font-medium">
          Get all premium features with the All-Access Bundle
        </p>
        <Button className="gap-1">
          35 <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Unlock All Features
        </Button>
        <p className="text-xs text-muted-foreground">
          Save 30% compared to buying each feature individually
        </p>
      </div>
    </div>
  );
} 