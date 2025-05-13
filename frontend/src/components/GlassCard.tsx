"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  intensity?: "light" | "medium" | "heavy";
  hoverEffect?: boolean;
  glowEffect?: boolean;
  darkMode?: boolean;
  children: React.ReactNode;
}

export function GlassCard({ 
  intensity = "medium", 
  hoverEffect = true,
  glowEffect = false,
  darkMode = false,
  children,
  className,
  ...props
}: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getBackgroundOpacity = () => {
    switch (intensity) {
      case "light": return darkMode ? "rgba(17, 25, 40, 0.5)" : "rgba(255, 255, 255, 0.05)";
      case "medium": return darkMode ? "rgba(17, 25, 40, 0.7)" : "rgba(255, 255, 255, 0.1)";
      case "heavy": return darkMode ? "rgba(17, 25, 40, 0.85)" : "rgba(255, 255, 255, 0.15)";
      default: return darkMode ? "rgba(17, 25, 40, 0.7)" : "rgba(255, 255, 255, 0.1)";
    }
  };
  
  const getBlurIntensity = () => {
    switch (intensity) {
      case "light": return "5px";
      case "medium": return "10px";
      case "heavy": return "15px";
      default: return "10px";
    }
  };
  
  const getBorderOpacity = () => {
    switch (intensity) {
      case "light": return darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.1)";
      case "medium": return darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.18)";
      case "heavy": return darkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.25)";
      default: return darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.18)";
    }
  };
  
  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        hoverEffect && "hover:-translate-y-1 hover:shadow-lg",
        className
      )}
      style={{
        background: getBackgroundOpacity(),
        backdropFilter: `blur(${getBlurIntensity()})`,
        WebkitBackdropFilter: `blur(${getBlurIntensity()})`,
        border: `1px solid ${getBorderOpacity()}`,
        boxShadow: glowEffect && isHovered 
          ? `0 8px 32px 0 ${darkMode ? 'rgba(62, 76, 118, 0.3)' : 'rgba(31, 38, 135, 0.2)'}`
          : `0 8px 32px 0 ${darkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(31, 38, 135, 0.15)'}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </Card>
  );
}