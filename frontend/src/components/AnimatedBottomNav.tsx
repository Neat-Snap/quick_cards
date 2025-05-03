"use client";

import React, { useRef, useEffect, useState } from "react";
import { CreditCard, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
};

interface AnimatedBottomNavProps {
  activeTab: string;
  onChange: (tabId: string) => void;
  items?: NavItem[];
}

export function AnimatedBottomNav({ 
  activeTab, 
  onChange,
  items = [
    { id: "card", icon: <CreditCard className="h-5 w-5" />, label: "Card" },
    { id: "explore", icon: <Search className="h-5 w-5" />, label: "Explore" },
    { id: "premium", icon: <Star className="h-5 w-5" />, label: "Premium" }
  ]
}: AnimatedBottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  return (
    <div 
      className="fixed bottom-4 left-4 right-4 h-16 bg-background/60 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-around shadow-lg z-50"
      ref={navRef}
      style={{
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={el => { itemRefs.current[index] = el; }}
          className={cn(
            "flex flex-col items-center justify-center p-2 relative transition-all duration-300",
            "rounded-lg w-full max-w-[80px] h-full",
            activeTab === item.id 
              ? "text-primary" 
              : "text-muted-foreground"
          )}
          onClick={() => onChange(item.id)}
          style={{
            backdropFilter: activeTab === item.id ? "blur(8px)" : "none",
            background: activeTab === item.id ? "rgba(255, 255, 255, 0.05)" : "transparent",
          }}
        >
          {/* Glass effect for active item */}
          {activeTab === item.id && (
            <div className="absolute inset-0 rounded-lg bg-primary/5 border border-primary/20 -z-10"></div>
          )}
          
          <div className={cn(
            "transition-all duration-300 relative",
            activeTab === item.id ? "scale-125" : "scale-100",
          )}>
            {item.icon}
            
            {/* Subtle glow for active icon */}
            {activeTab === item.id && (
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10"></div>
            )}
          </div>
          <span className={cn(
            "text-xs mt-1 transition-all duration-300",
            activeTab === item.id ? "opacity-100 font-medium" : "opacity-70"
          )}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}