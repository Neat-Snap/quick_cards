"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonProps } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonProps {
  ripple?: boolean;
  bounce?: boolean;
  hoverScale?: boolean;
  children: React.ReactNode;
}

export function AnimatedButton({
  ripple = true,
  bounce = true,
  hoverScale = true,
  children,
  className,
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const [rippleStyle, setRippleStyle] = useState({
    left: "0%",
    top: "0%",
    display: "none"
  });
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle ripple effect
  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (disabled) return;
    
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
    
    if (bounce) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    
    // Call original click handler
    onClick?.(event);
  };
  
  return (
    <Button
      className={cn(
        "relative overflow-hidden transition-transform",
        hoverScale && !disabled && "hover:scale-[1.02] active:scale-[0.98]",
        isAnimating && bounce && "animate-small-bounce",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
      
      {/* Ripple effect */}
      {ripple && (
        <span
          className="absolute rounded-full bg-white/20 animate-ripple pointer-events-none"
          style={{
            left: rippleStyle.left,
            top: rippleStyle.top,
            display: rippleStyle.display,
            width: "500%", // Large enough to cover the button
            height: "500%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </Button>
  );
}
