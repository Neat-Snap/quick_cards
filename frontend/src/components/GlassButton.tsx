"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  glowColor?: string;
  darkMode?: boolean;
  intensity?: "light" | "medium" | "heavy";
  ripple?: boolean;
  children: React.ReactNode;
}

export function GlassButton({
  glowColor = "rgba(31, 38, 135, 0.4)",
  darkMode = false,
  intensity = "medium",
  ripple = true,
  children,
  className,
  disabled,
  onClick,
  ...props
}: GlassButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [rippleStyle, setRippleStyle] = useState({
    left: "0%",
    top: "0%",
    display: "none"
  });
  
  // Define background opacity based on intensity
  const getBackgroundOpacity = () => {
    switch (intensity) {
      case "light": return darkMode ? "rgba(17, 25, 40, 0.5)" : "rgba(255, 255, 255, 0.05)";
      case "medium": return darkMode ? "rgba(17, 25, 40, 0.7)" : "rgba(255, 255, 255, 0.1)";
      case "heavy": return darkMode ? "rgba(17, 25, 40, 0.85)" : "rgba(255, 255, 255, 0.15)";
      default: return darkMode ? "rgba(17, 25, 40, 0.7)" : "rgba(255, 255, 255, 0.1)";
    }
  };
  
  // Define blur intensity based on intensity level
  const getBlurIntensity = () => {
    switch (intensity) {
      case "light": return "5px";
      case "medium": return "10px";
      case "heavy": return "15px";
      default: return "10px";
    }
  };
  
  // Define border opacity based on intensity
  const getBorderOpacity = () => {
    switch (intensity) {
      case "light": return darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.1)";
      case "medium": return darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.18)";
      case "heavy": return darkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.25)";
      default: return darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.18)";
    }
  };
  
  // Handle ripple effect
  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (disabled) return;
    
    // Scale press effect
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 300);
    
    if (ripple) {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      
      // Calculate ripple position relative to button
      const left = ((event.clientX - rect.left) / rect.width) * 100;
      const top = ((event.clientY - rect.top) / rect.height) * 100;
      
      setRippleStyle({
        left: `${left}%`,
        top: `${top}%`,
        display: "block"
      });
      
      // Remove ripple after animation completes
      setTimeout(() => {
        setRippleStyle(prev => ({ ...prev, display: "none" }));
      }, 600);
    }
    
    // Call original click handler
    onClick?.(event);
  };
  
  return (
    <Button
      className={cn(
        "relative overflow-hidden border rounded-lg",
        "transition-all duration-300",
        isHovered && !disabled && "shadow-lg",
        isPressed && !disabled && "scale-95",
        className
      )}
      style={{
        background: getBackgroundOpacity(),
        backdropFilter: `blur(${getBlurIntensity()})`,
        WebkitBackdropFilter: `blur(${getBlurIntensity()})`,
        border: `1px solid ${getBorderOpacity()}`,
        boxShadow: isHovered && !disabled 
          ? `0 5px 15px ${glowColor}`
          : "none",
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      {...props}
    >
      <div className={`relative z-10 transition-transform duration-200 ${isPressed ? 'scale-95' : 'scale-100'}`}>
        {children}
      </div>
      
      {/* Ripple effect */}
      {ripple && (
        <span
          className="absolute rounded-full bg-white/20 animate-ripple pointer-events-none"
          style={{
            left: rippleStyle.left,
            top: rippleStyle.top,
            display: rippleStyle.display,
            width: "500%",
            height: "500%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </Button>
  );
}