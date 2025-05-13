"use client";

import React from "react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading your business card...</p>
    </div>
  );
}