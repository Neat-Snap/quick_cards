"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScrollableSectionProps {
  title: string;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollableSection({ 
  title, 
  emptyMessage = "No items to display", 
  children, 
  className = ""
}: ScrollableSectionProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = React.useState(false);
  const [showRightScroll, setShowRightScroll] = React.useState(false);

  // Check if scrolling is needed
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    // Show left scroll button if we've scrolled to the right
    setShowLeftScroll(scrollLeft > 0);
    
    // Show right scroll button if there's more content to the right
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5); // 5px buffer
  };

  // Scroll left
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    
    scrollContainerRef.current.scrollBy({
      left: -200,
      behavior: 'smooth'
    });
  };

  // Scroll right
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    
    scrollContainerRef.current.scrollBy({
      left: 200,
      behavior: 'smooth'
    });
  };

  // Check scroll buttons on mount and when children change
  React.useEffect(() => {
    checkScrollButtons();
    
    // Add window resize listener
    window.addEventListener('resize', checkScrollButtons);
    
    // Add scroll event listener to the container
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollButtons);
    }
    
    return () => {
      window.removeEventListener('resize', checkScrollButtons);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScrollButtons);
      }
    };
  }, [children]);

  // Check if the children are empty (React.Children.count(children) === 0)
  const isEmpty = React.Children.count(children) === 0;

  return (
    <div className={`w-full relative ${className}`}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      
      {isEmpty ? (
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <p className="text-xs text-white/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Left scroll button */}
          {showLeftScroll && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Scrollable container */}
          <div 
            className="overflow-x-auto hide-scrollbar pb-2"
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
          >
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {children}
            </div>
          </div>
          
          {/* Right scroll button */}
          {showRightScroll && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Add a style to hide scrollbars but keep functionality
export const ScrollableStyles = () => (
  <style jsx global>{`
    .hide-scrollbar {
      -ms-overflow-style: none;  /* Internet Explorer and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  `}
  </style>
);