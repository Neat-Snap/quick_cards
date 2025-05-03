"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  hoverEffect?: "lift" | "glow" | "scale" | "border" | "none";
  clickEffect?: "pulse" | "bounce" | "none";
  children: React.ReactNode;
}

export function AnimatedCard({ 
  hoverEffect = "lift", 
  clickEffect = "pulse",
  children,
  className,
  ...props
}: AnimatedCardProps) {
  const [isClicked, setIsClicked] = useState(false);
  
  // Handle click animation
  const handleClick = () => {
    if (clickEffect === "none") return;
    
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
  };
  
  // Determine hover and click effect classes
  const getHoverClass = () => {
    switch (hoverEffect) {
      case "lift":
        return "hover:shadow-lg hover:-translate-y-1";
      case "glow":
        return "hover:shadow-lg hover:shadow-primary/20";
      case "scale":
        return "hover:scale-[1.02]";
      case "border":
        return "hover:border-primary";
      case "none":
        return "";
      default:
        return "hover:shadow-lg hover:-translate-y-1";
    }
  };
  
  const getClickClass = () => {
    if (!isClicked) return "";
    
    switch (clickEffect) {
      case "pulse":
        return "animate-pulse-once";
      case "bounce":
        return "animate-small-bounce";
      case "none":
        return "";
      default:
        return "animate-pulse-once";
    }
  };
  
  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-in-out",
        getHoverClass(),
        getClickClass(),
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Card>
  );
}