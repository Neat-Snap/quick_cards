"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Contact, Project, Skill } from "@/lib/api";
import { X, Mail, Phone, MessageCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { getSkillIconUrl } from "@/lib/SkillIconHelper";
import ProjectDetailFullscreen from "@/components/ProjectDetailFullscreen";


interface ItemDetailViewProps {
  type: 'contact' | 'project' | 'skill';
  data: Contact | Project | Skill;
  onClose: () => void;
}

const getContactIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'email':
      return <Mail className="h-5 w-5" />;
    case 'phone':
      return <Phone className="h-5 w-5" />;
    case 'telegram':
      return <MessageCircle className="h-5 w-5" />;
    default:
      return <MessageCircle className="h-5 w-5" />;
  }
};

const handleContactAction = (type: string, value: string) => {
  if (type === 'email') {
    window.location.href = `mailto:${value}`;
  } else if (type === 'phone') {
    window.location.href = `tel:${value}`;
  } else if (type === 'telegram') {
    window.location.href = `https://t.me/${value.replace('@', '')}`;
  } else if (type === 'website') {
    window.open(value, '_blank');
  }
};

export function ItemDetailView({ type, data, onClose }: ItemDetailViewProps) {
  // Rendering for contact details
  const renderContactDetail = () => {
    const contact = data as Contact;
    
    // Generate the appropriate button text and action based on contact type
    const getContactButton = () => {
      const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
          .then(() => {
            // Show toast notification
            alert("Copied to clipboard!");
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
          });
      };
      
      switch(contact.type.toLowerCase()) {
        case 'email':
          return {
            text: 'Send Email',
            action: () => window.location.href = `mailto:${contact.value}`
          };
        case 'phone':
          return {
            text: 'Copy Number',
            action: () => copyToClipboard(contact.value)
          };
        case 'telegram':
          return {
            text: 'Open in Telegram',
            action: () => window.location.href = `https://t.me/${contact.value.replace('@', '')}`
          };
        case 'website':
          return {
            text: 'Visit Website',
            action: () => window.open(contact.value, '_blank')
          };
        default:
          return {
            text: 'Copy Value',
            action: () => copyToClipboard(contact.value)
          };
      }
    };
    
    const contactButton = getContactButton();
    
    return (
      <>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              {getContactIcon(contact.type)}
            </div>
            <CardTitle className="capitalize">{contact.type}</CardTitle>
          </div>
          <CardDescription>
            {contact.value}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              {contact.type === 'email' && 'Click the button below to send an email.'}
              {contact.type === 'phone' && 'Click the button below to copy this number.'}
              {contact.type === 'telegram' && 'Click the button below to open this profile in Telegram.'}
              {contact.type === 'website' && 'Click the button below to visit this website.'}
              {!['email', 'phone', 'telegram', 'website'].includes(contact.type.toLowerCase()) && 
                'Click the button below to copy this information.'}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={contactButton.action}
          >
            {contactButton.text}
          </Button>
        </CardFooter>
      </>
    );
  };

  // Rendering for project details
  const renderProjectDetail = () => {
    const project = data as Project;
    return (
      <>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          {project.role && (
            <CardDescription>{project.role}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {project.avatar_url && (
            <div className="mb-4 flex justify-center">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-muted">
                <img 
                  src={project.avatar_url} 
                  alt={project.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {project.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="max-h-[200px] overflow-y-auto rounded-md bg-muted/10 p-3">
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            </div>
          )}
        </CardContent>
        {project.url && (
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.open(project.url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Project
            </Button>
          </CardFooter>
        )}
      </>
    );
  };

  // Rendering for skill details
  const renderSkillDetail = () => {
    const skill = data as Skill;
    
    // Get icon for this skill
    const iconUrl = getSkillIconUrl(skill);
    
    return (
      <>
        <CardHeader>
          <CardTitle>{skill.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {iconUrl ? (
                <img 
                  src={iconUrl} 
                  alt={skill.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    // Fallback to name initials if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = 
                      `<span class="text-xl font-medium">${skill.name.substring(0, 2).toUpperCase()}</span>`;
                  }}
                />
              ) : (
                <span className="text-xl font-medium">{skill.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>
          
          {skill.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{skill.description}</p>
            </div>
          )}
        </CardContent>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" onClick={onClose}></div>
      
      <Card className="w-full max-w-md mx-auto z-10">
        <div className="absolute top-2 right-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 ml-4 mt-2"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        {/* Render the appropriate content based on type */}
        {type === 'contact' && renderContactDetail()}
        {type === 'project' ? (
          <ProjectDetailFullscreen 
            project={data as Project} 
            onBack={onClose} 
          />
        ) : (
          <Card className="w-full max-w-md mx-auto z-10">
            <div className="absolute top-2 right-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 ml-4 mt-2"
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            
            {type === 'contact' && renderContactDetail()}
            {type === 'skill' && renderSkillDetail()}
          </Card>
        )}
        {type === 'skill' && renderSkillDetail()}
      </Card>
    </div>
  );
}