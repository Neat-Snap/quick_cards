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
  const [indicatorStyles, setIndicatorStyles] = useState({
    width: 0,
    left: 0,
    opacity: 0
  });
  
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Update the indicator position when active tab changes
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      
      const activeIndex = items.findIndex(item => item.id === activeTab);
      if (activeIndex === -1) return;
      
      const activeItem = itemRefs.current[activeIndex];
      if (!activeItem) return;
      
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      // Calculate relative position to the nav container
      const left = itemRect.left - navRect.left;
      
      setIndicatorStyles({
        width: itemRect.width,
        left: left,
        opacity: 1
      });
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 50);
    
    return () => clearTimeout(timer);
  }, [activeTab, items]);
  
  // Update indicator on resize
  useEffect(() => {
    const handleResize = () => {
      const timer = setTimeout(() => {
        const activeIndex = items.findIndex(item => item.id === activeTab);
        if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
          const navRect = navRef.current?.getBoundingClientRect();
          const itemRect = itemRefs.current[activeIndex]?.getBoundingClientRect();
          
          if (navRect && itemRect) {
            const left = itemRect.left - navRect.left;
            
            setIndicatorStyles(prev => ({
              ...prev,
              width: itemRect.width,
              left: left
            }));
          }
        }
      }, 50);
      
      return () => clearTimeout(timer);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, items]);
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around"
      ref={navRef}
    >
      {/* Moving Indicator */}
      <div 
        className="absolute h-1 bg-primary rounded-full bottom-0 transition-all duration-300 ease-in-out"
        style={{ 
          width: `${indicatorStyles.width}px`, 
          left: `${indicatorStyles.left}px`,
          opacity: indicatorStyles.opacity,
          transform: "translateY(-4px)"
        }}
      />
      
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={el => { itemRefs.current[index] = el; }}
          className={cn(
            "flex flex-col items-center justify-center p-2 relative transition-all duration-300",
            "hover:bg-accent/30 active:scale-95 rounded-md",
            "w-full max-w-[80px] h-full",
            activeTab === item.id 
              ? "text-primary" 
              : "text-muted-foreground"
          )}
          onClick={() => onChange(item.id)}
        >
          <div className={cn(
            "transition-transform duration-300",
            activeTab === item.id ? "scale-110" : "scale-100"
          )}>
            {item.icon}
          </div>
          <span className={cn(
            "text-xs mt-1 transition-opacity duration-300",
            activeTab === item.id ? "opacity-100" : "opacity-70"
          )}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}