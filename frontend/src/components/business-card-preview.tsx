"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Project, Skill, Contact, CustomLink } from "@/lib/api";
import { ExternalLink, Mail, Phone, MessageCircle, Info } from "lucide-react";
import { ScrollableSection, ScrollableStyles } from "@/components/scrollable-section";
import { ItemDetailView } from "@/components/item-detail-view";
import { getSkillIconUrl } from "@/lib/SkillIconHelper";

const API_URL = 'https://face-cards.ru/api';

interface BusinessCardPreviewProps {
  user: User | null;
  contacts?: Contact[];
  projects?: Project[];
  skills?: Skill[];
  customLinks?: CustomLink[];
}

export const getAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath) return '';
  
  if (avatarPath.includes('t.me')) {
    return avatarPath;
  }
  
  if (avatarPath.startsWith('/files/')) {
    console.log("api url is", API_URL, "avatar path is", avatarPath, "final path is", `${API_URL}/v1${avatarPath}`)
    return `${API_URL}/v1${avatarPath}`;
  }
  
  if (avatarPath.startsWith('profile/')) {
    return `${API_URL}/v1/files/${avatarPath}`;
  }
  
  return avatarPath;
};

export function BusinessCardPreview({ 
  user, 
  contacts = [], 
  projects = [], 
  skills = [],
  customLinks = []
}: BusinessCardPreviewProps) {
  const [activeDetail, setActiveDetail] = useState<{
    type: 'contact' | 'project' | 'skill';
    data: any;
  } | null>(null);

  const fullName = user?.name || "Your Name";
  const firstName = user?.first_name || (user?.name ? user.name.split(' ')[0] : "Your");
  const lastName = user?.last_name || (user?.name && user.name.split(' ').length > 1 ? user.name.split(' ')[1] : "Name");
  const username = user?.username || "username";
  const description = user?.description || "Your card description will appear here. Edit your profile to add a description about yourself.";

  console.log("projects debug: ", projects)
  
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
    
    return { backgroundColor: "#1e293b" };
  };

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

  const openDetail = (type: 'contact' | 'project' | 'skill', data: any) => {
    setActiveDetail({ type, data });
  };

  const closeDetail = () => {
    setActiveDetail(null);
  };

  const renderContactCard = (contact: Contact) => (
    <div 
      key={contact.id} 
      className="bg-white/10 rounded-lg p-3 min-w-[120px] cursor-pointer hover:bg-white/20 transition-colors"
      onClick={() => openDetail('contact', contact)}
    >
      <div className="flex flex-col items-center text-center">
        {getContactIcon(contact.type)}
        <p className="mt-2 text-xs font-medium text-white capitalize">{contact.type}</p>
        <p className="text-xs text-white/80 truncate max-w-[100px]">{contact.value}</p>
      </div>
    </div>
  );

  const renderLinkCard = (link: CustomLink) => (
    <a
      key={link.id}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/10 rounded-lg p-3 min-w-[120px] hover:bg-white/20 transition-colors"
    >
      <div className="flex flex-col items-center text-center">
        <ExternalLink className="h-4 w-4 text-white/70" />
        <p className="mt-2 text-xs font-medium text-white truncate max-w-[100px]">{link.title}</p>
      </div>
    </a>
  );

  const renderSkillCard = (skill: Skill) => {
    const iconUrl = getSkillIconUrl(skill);
    
    return (
      <div 
        key={skill.id} 
        className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[120px] cursor-pointer hover:bg-white/30 transition-colors"
        onClick={() => openDetail('skill', skill)}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm">
            {iconUrl ? (
              <img 
                src={iconUrl} 
                alt={skill.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = 
                    `<span class="text-xs font-medium">${skill.name.charAt(0).toUpperCase()}</span>`;
                }}
              />
            ) : (
              <span className="text-xs font-medium">{skill.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <p className="mt-2 text-xs font-medium text-white">{skill.name}</p>
        </div>
      </div>
    );
  };

  const renderProjectCard = (project: Project) => (
    <div 
      key={project.id} 
      className="bg-white/10 rounded-lg p-3 min-w-[160px] max-w-[220px] w-[220px] flex-shrink-0 cursor-pointer hover:bg-white/20 transition-colors"
      onClick={() => openDetail('project', project)}
    >
      <div className="flex flex-col h-full">
        {project.avatar_url && (
          <div className="mb-2 flex justify-center">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-white/20">
              <img 
                src={project.avatar_url} 
                alt={project.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
        <p className="text-xs font-semibold font-medium text-white">{project.name}</p>
        {project.role && (
          <p className="text-xs text-white/70 mt-1">{project.role}</p>
        )}
        {project.description && (
          <p className="text-xs text-white/80 mt-2 line-clamp-2 overflow-hidden">{project.description}</p>
        )}
        <div className="flex justify-end mt-auto pt-2">
          <Info className="h-4 w-4 text-white/50" />
        </div>
      </div>
    </div>
  )

  console.log("Rendering card with contacts:", contacts);

  return (
    <>
      <ScrollableStyles />
      <div className="space-y-6">
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
              
              {contacts && contacts.length > 0 && (
                <div className="w-full mb-4">
                  <ScrollableSection 
                    title="Contacts" 
                    emptyMessage="No contacts added yet"
                  >
                    {contacts.map(contact => renderContactCard(contact))}
                  </ScrollableSection>
                </div>
              )}
              
              {customLinks && customLinks.length > 0 && (
                <div className="w-full mb-4">
                  <ScrollableSection title="Links" emptyMessage="No links added yet">
                    {customLinks.map(link => renderLinkCard(link))}
                  </ScrollableSection>
                </div>
              )}
              
              {skills && skills.length > 0 && (
                <div className="w-full">
                  <ScrollableSection title="Skills" emptyMessage="No skills added yet">
                    {skills.map(skill => renderSkillCard(skill))}
                  </ScrollableSection>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {projects && projects.length > 0 && (
          <div className="w-full">
            <h3 className="text-sm font-medium mb-3">Projects</h3>
            <div className="space-y-3">
              {projects.map(project => (
                <Card 
                  key={project.id}
                  className="overflow-hidden hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => openDetail('project', project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {project.avatar_url && (
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                            <img 
                              src={project.avatar_url} 
                              alt={project.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-base truncate">{project.name}</h4>
                          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                        {project.role && (
                          <p className="text-sm text-muted-foreground mt-1">{project.role}</p>
                        )}
                        {project.description && (
                          <p className="text-sm mt-2 line-clamp-2 overflow-hidden text-muted-foreground/80">{project.description}</p>
                        )}
                        {project.url && (
                          <div className="mt-2 flex items-center">
                            <ExternalLink className="h-3 w-3 mr-1 text-muted-foreground" />
                            <a 
                              href={project.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.url.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* {projects && projects.length === 0 && (
          <div className="w-full">
            <h3 className="text-sm font-medium mb-3">Projects</h3>
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No projects added yet</p>
              </CardContent>
            </Card>
          </div>
        )} */}
      </div>

      {activeDetail && (
        <ItemDetailView
          type={activeDetail.type}
          data={activeDetail.data}
          onClose={closeDetail}
        />
      )}
    </>
  );
}