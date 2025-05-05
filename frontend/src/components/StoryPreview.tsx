"use client";

import React from "react";
import { User } from "@/lib/api";
import { motion } from "framer-motion";

interface StoryPreviewProps {
  user: User;
  logoUrl: string;
}

export function StoryPreview({ user, logoUrl = "/static/images/logo.svg" }: StoryPreviewProps) {
  // Get the background color from user settings
  const getBackgroundGradient = () => {
    if (!user) return { background: "linear-gradient(to bottom, #000000 0%, #1e293b 100%)" };
    
    if (user.background_type === "color") {
      const bgColor = user.background_value || "#1e293b";
      return { 
        background: `linear-gradient(to bottom, #000000 0%, ${bgColor} 100%)`
      };
    }
    
    if (user.background_type === "gradient" && user.background_value) {
      // For a gradient, we'll start with black and blend into their gradient
      return { 
        background: `linear-gradient(to bottom, #000000 0%, transparent 50%), ${user.background_value}`
      };
    }
    
    if (user.background_type === "image" && user.background_value) {
      // For an image, we'll use a dark overlay that fades out
      return { 
        backgroundImage: `linear-gradient(to bottom, #000000 0%, rgba(0,0,0,0) 50%), url(${user.background_value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    
    // Default fallback
    return { background: "linear-gradient(to bottom, #000000 0%, #1e293b 100%)" };
  };

  return (
    <div 
      className="w-full aspect-[9/16] rounded-lg overflow-hidden relative"
      style={getBackgroundGradient()}
    >
      {/* Logo at the top with cross-origin attribute for html2canvas */}
      <div className="absolute top-0 left-0 right-0 pt-8 pb-12 px-4 flex justify-center">
        <img 
          src={logoUrl} 
          alt="QuickCard Logo" 
          className="h-12 w-12 drop-shadow-lg"
          crossOrigin="anonymous"
        />
      </div>
      
      {/* User info in the middle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">{user.name || "My Business Card"}</h2>
          <p className="text-sm text-white/90 mb-4">
            {user.description ? 
              (user.description.length > 80 ? 
                user.description.substring(0, 80) + '...' : 
                user.description) : 
              "Check out my digital business card"}
          </p>
          <div className="mt-4 bg-primary/80 text-white px-4 py-2 rounded-full inline-block font-medium text-sm">
            View My Card
          </div>
        </div>
      </div>
      
      {/* "QuickCard" branding at the bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="text-white/80 text-sm font-medium">
          QuickCard
        </div>
      </div>
    </div>
  );
}