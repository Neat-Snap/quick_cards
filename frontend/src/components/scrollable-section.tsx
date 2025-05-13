"use client";

import React from "react";

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
          <div 
            className="overflow-x-auto hide-scrollbar pb-2"
            ref={scrollContainerRef}
          >
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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