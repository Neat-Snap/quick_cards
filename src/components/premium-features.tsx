"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Sparkles, 
  Palette, 
  Image, 
  QrCode, 
  CheckCircle, 
  Link, 
  Video 
} from "lucide-react";

// Premium feature data
const premiumFeatures = [
  {
    id: 1,
    title: "Custom Themes",
    description: "Access to 10+ premium themes with custom color palettes",
    price: 5,
    icon: Palette,
  },
  {
    id: 2,
    title: "Animated Elements",
    description: "Add subtle animations to make your card stand out",
    price: 7,
    icon: Sparkles,
  },
  {
    id: 3,
    title: "HD Background Images",
    description: "Choose from our library of professional background images",
    price: 5,
    icon: Image,
  },
  {
    id: 4,
    title: "Custom QR Code",
    description: "Branded QR codes that link directly to your card",
    price: 10,
    icon: QrCode,
  },
  {
    id: 5,
    title: "Verified Badge",
    description: "Display a verification badge on your business card",
    price: 15,
    icon: CheckCircle,
  },
  {
    id: 6,
    title: "Multiple Links",
    description: "Add up to 10 custom links to your business card",
    price: 8,
    icon: Link,
  },
  {
    id: 7,
    title: "Video Introduction",
    description: "Add a short video introduction to your card",
    price: 20,
    icon: Video,
  },
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
          Unlock premium features using Telegram Stars to make your business card unique and professional.
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
            <Button variant="outline" size="sm" className="shrink-0 gap-1">
              {feature.price} <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
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
          45 <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Unlock All Features
        </Button>
        <p className="text-xs text-muted-foreground">
          Save 45% compared to buying each feature individually
        </p>
      </div>
    </div>
  );
} 