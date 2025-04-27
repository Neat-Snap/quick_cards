"use client";

import React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Project, Skill, Contact, CustomLink } from "@/lib/api";
import { ExternalLink, Mail, Phone, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';

interface BusinessCardPreviewProps {
  user: User | null;
  contacts?: Contact[];
  projects?: Project[];
  skills?: Skill[];
  customLinks?: CustomLink[];
}

export const getAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath) return '';
  
  // If it's a Telegram avatar (contains t.me), use it directly
  if (avatarPath.includes('t.me')) {
    return avatarPath;
  }
  
  // If it starts with /files/, it's already a full path
  if (avatarPath.startsWith('/files/')) {
    return `${API_URL}/v1${avatarPath}`;
  }
  
  // If it's a relative path (e.g., profile/123.jpg)
  if (avatarPath.startsWith('profile/')) {
    return `${API_URL}/v1/files/${avatarPath}`;
  }
  
  // Otherwise, assume it's a complete URL
  return avatarPath;
};

export function BusinessCardPreview({ 
  user, 
  contacts = [], 
  projects = [], 
  skills = [],
  customLinks = []
}: BusinessCardPreviewProps) {
  // Default values for rendering if user is null
  // In business-card-preview.tsx, update these lines:
  const fullName = user?.name || "Your Name";
  const firstName = user?.first_name || (user?.name ? user.name.split(' ')[0] : "Your");
  const lastName = user?.last_name || (user?.name && user.name.split(' ').length > 1 ? user.name.split(' ')[1] : "Name");
  const username = user?.username || "username";
  const description = user?.description || "Your card description will appear here. Edit your profile to add a description about yourself.";
  
  // Set background based on user background_type and background_value
  const getBackgroundStyle = () => {
    if (!user) return { backgroundColor: "#1e293b" };
    
    if (user.background_type === "color") {
      return { backgroundColor: user.background_value || "#1e293b" };
    }
    
    if (user.background_type === "gradient" && user.background_value) {
      return { backgroundImage: user.background_value };
    }
    
    if (user.background_type === "image" && user.background_value) {
      return { 
        backgroundImage: `url(${user.background_value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    
    // Default to a dark color instead of using background_color which might be undefined
    return { backgroundColor: "#1e293b" };
  };

  // Helper to render contact icon based on type
  const getContactIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4 text-white/70" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-white/70" />;
      case 'telegram':
        return <MessageCircle className="h-4 w-4 text-white/70" />;
      default:
        return <MessageCircle className="h-4 w-4 text-white/70" />;
    }
  };

  return (
    <Card className="overflow-hidden" style={getBackgroundStyle()}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4 border-4 border-white">
            <AvatarImage 
              src={getAvatarUrl(user?.avatar_url)} 
              alt={`${fullName}`} 
            />
            <AvatarFallback>{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{fullName}</h2>
            {user?.badge && (
              <Badge variant="secondary">{user.badge}</Badge>
            )}
          </div>
          
          <p className="text-sm text-white/70 mb-4">@{username}</p>
          
          <p className="text-sm text-white/90 text-center mb-6">
            {description}
          </p>
          
          {/* Contacts Section */}
          {contacts.length > 0 && (
            <div className="w-full bg-white/10 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-medium text-white mb-2">Contact Info</h3>
              <div className="space-y-2">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-2">
                    {getContactIcon(contact.type)}
                    <span className="text-xs text-white/90">{contact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Custom Links Section */}
          {customLinks.length > 0 && (
            <div className="w-full bg-white/10 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-medium text-white mb-2">Links</h3>
              <div className="space-y-2">
                {customLinks.map(link => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/90 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-xs">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Skills and Projects in a grid */}
          <div className="grid grid-cols-1 gap-4 w-full">
            {/* Skills Section */}
            <div className="bg-white/10 rounded-lg p-3">
              <h3 className="text-sm font-medium text-white mb-2">Skills</h3>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <Badge key={skill.id} variant="outline" className="text-white border-white/30">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/70">No skills added yet</p>
              )}
            </div>
            
            {/* Projects Section */}
            <div className="bg-white/10 rounded-lg p-3">
              <h3 className="text-sm font-medium text-white mb-2">Projects</h3>
              {projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map(project => (
                    <div key={project.id} className="text-xs text-white/90">
                      <div className="font-semibold">{project.name}</div>
                      {project.role && <div className="text-white/70">{project.role}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/70">No projects added yet</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}