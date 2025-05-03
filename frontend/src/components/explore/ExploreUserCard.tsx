"use client";

import { User } from "@/lib/api";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl } from "@/components/business-card-preview";
import { GlassCard } from "@/components/GlassCard";
import { useState } from "react";

interface ExploreUserCardProps {
  user: User;
  onClick: () => void;
}

export function ExploreUserCard({ user, onClick }: ExploreUserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Safely get initials from name or first_name/last_name
  const getInitials = () => {
    if (user.first_name || user.last_name) {
      return `${(user.first_name || '').charAt(0)}${(user.last_name || '').charAt(0)}`;
    }
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
      }
      return user.name.charAt(0);
    }
    return user.username?.charAt(0) || '?';
  };

  // Calculate background style based on background_type
  const getBackgroundStyle = () => {
    if (user.background_type === "color" && user.background_value) {
      // Use background_value as color for solid backgrounds
      return { backgroundColor: user.background_value };
    } else if (user.background_type === "gradient" && user.background_value) {
      // Use background_value as gradient for gradient backgrounds
      return { backgroundImage: user.background_value };
    } else if (user.background_type === "image" && user.background_value) {
      // Use background_value as image URL for image backgrounds
      return { 
        backgroundImage: `url(${user.background_value})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      };
    }
    // Default background
    return { backgroundColor: "#f0f0f0" };
  };

  return (
    <GlassCard 
      className="overflow-hidden cursor-pointer"
      intensity="light"
      hoverEffect={true}
      glowEffect={true}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="h-24 w-full transition-transform duration-500 ease-out relative"
        style={{
          ...getBackgroundStyle(),
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        {/* Glass overlay on hover */}
        {isHovered && (
          <div 
            className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300"
            style={{ opacity: isHovered ? 0.5 : 0 }}
          />
        )}
      </div>
      <CardContent className="pt-0 relative">
        <div className="flex items-center gap-3 -mt-6">
          <div className={`transition-all duration-300 ${isHovered ? 'translate-y-[-2px]' : ''}`}>
            <Avatar className={`h-12 w-12 border-2 border-white/20 shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
              <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name || user.username} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-6">
            <h3 className={`font-medium transition-all duration-300 ${isHovered ? 'text-primary translate-y-[-1px]' : ''}`}>
              {user.name || user.username}
            </h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        
        {user.description && (
          <p className="text-sm mt-3 line-clamp-2 text-muted-foreground">
            {user.description}
          </p>
        )}
        
        {user.badge && (
          <div className="mt-3">
            <Badge 
              variant="secondary" 
              className="transition-all duration-300 bg-white/10 backdrop-blur-sm"
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isHovered ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {user.badge}
            </Badge>
          </div>
        )}
        
        {user.skills && user.skills.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {user.skills.slice(0, 3).map((skill, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-xs transition-all duration-300 bg-white/10 backdrop-blur-sm"
                  style={{
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transitionDelay: `${i * 50}ms`,
                    boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {typeof skill === 'string' ? skill : skill.name}
                </Badge>
              ))}
              {user.skills.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs transition-all duration-300"
                  style={{
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transitionDelay: '150ms',
                    boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  +{user.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}