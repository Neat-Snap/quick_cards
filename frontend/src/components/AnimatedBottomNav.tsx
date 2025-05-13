"use client";

import React, { useRef } from "react";
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
      className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-50"
      ref={navRef}
      style={{
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={el => { itemRefs.current[index] = el; }}
          className={cn(
            "flex flex-col items-center justify-center p-2 relative transition-all duration-300",
            "w-full h-full",
            activeTab === item.id 
              ? "text-primary" 
              : "text-muted-foreground"
          )}
          onClick={() => onChange(item.id)}
        >
          <div className={cn(
            "transition-all duration-300 relative",
            activeTab === item.id ? "scale-125 brightness-125" : "scale-100"
          )}>
            {item.icon}
            
            {activeTab === item.id && (
              <div className="absolute inset-0 bg-primary/10 blur-md rounded-full -z-10"></div>
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