"use client";

import React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/api";

interface BusinessCardPreviewProps {
  user: User | null;
}

export function BusinessCardPreview({ user }: BusinessCardPreviewProps) {
  // Default values for rendering if user is null
  const firstName = user?.first_name || "Your";
  const lastName = user?.last_name || "Name";
  const username = user?.username || "username";
  const description = user?.description || "Your card description will appear here. Edit your profile to add a description about yourself.";
  const backgroundColor = user?.background_color || "#1e293b"; // default background color
  const badge = user?.badge;

  return (
    <Card className="overflow-hidden" style={{ backgroundColor }}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4 border-4 border-white">
            <AvatarImage src={user?.avatar || ""} alt={`${firstName} ${lastName}`} />
            <AvatarFallback>{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{firstName} {lastName}</h2>
            {badge && (
              <Badge variant="secondary">{badge}</Badge>
            )}
          </div>
          
          <p className="text-sm text-white/70 mb-4">@{username}</p>
          
          <p className="text-sm text-white/90 text-center mb-6">
            {description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/10 rounded-lg p-3">
              <h3 className="text-sm font-medium text-white mb-2">Skills</h3>
              <p className="text-xs text-white/70">No skills added yet</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3">
              <h3 className="text-sm font-medium text-white mb-2">Projects</h3>
              <p className="text-xs text-white/70">No projects added yet</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 