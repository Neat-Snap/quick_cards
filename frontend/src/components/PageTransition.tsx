"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  show: boolean;
  children: React.ReactNode;
  slideDirection?: "left" | "right" | "up" | "down";
  duration?: number;
}

export function PageTransition({ 
  show, 
  children, 
  slideDirection = "left",
  duration = 300 
}: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (show) {
      setMounted(true);
    }
    
    // If hiding, wait for animation to complete before unmounting
    let timer: NodeJS.Timeout;
    if (!show && mounted) {
      timer = setTimeout(() => {
        setMounted(false);
      }, duration);
    }
    
    return () => clearTimeout(timer);
  }, [show, duration, mounted]);
  
  // Don't render anything if not mounted and not showing
  if (!mounted && !show) {
    return null;
  }
  
  // Define transform based on direction
  const getTransform = (isEntering: boolean) => {
    if (!isEntering) {
      // Exit transforms
      switch (slideDirection) {
        case "left": return "translateX(-100%)";
        case "right": return "translateX(100%)";
        case "up": return "translateY(-100%)";
        case "down": return "translateY(100%)";
        default: return "translateX(-100%)";
      }
    }
    return "translate(0)"; // Default position when visible
  };
  
  const getInitialTransform = () => {
    // Entry transforms (starting position)
    switch (slideDirection) {
      case "left": return "translateX(100%)";
      case "right": return "translateX(-100%)";
      case "up": return "translateY(100%)";
      case "down": return "translateY(-100%)";
      default: return "translateX(100%)";
    }
  };
  
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        show ? "opacity-100" : "opacity-0"
      )}
      style={{
        transform: show ? getTransform(true) : getTransform(false),
        transitionDuration: `${duration}ms`,
        // Initial state before animation starts
        ...(mounted && !show ? {} : { transform: getInitialTransform() })
      }}
    >
      {children}
    </div>
  );
}