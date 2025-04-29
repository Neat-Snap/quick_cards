// components/ProjectDetailFullscreen.tsx

import React from "react";
import { Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";

interface Props {
  project: Project;
  onBack: () => void;
}

export default function ProjectDetailFullscreen({ project, onBack }: Props) {
  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto p-4">
      <div className="p-4 max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 mb-4"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 pl-0" />
          Back
        </Button>

        <h1 className="text-2xl font-bold mb-5">{project.name}</h1>
        {project.role && <p className="text-sm text-muted-foreground mb-4">{project.role}</p>}

        {project.avatar_url && (
          <div className="mb-6">
            <img 
              src={project.avatar_url} 
              alt={project.name} 
              className="w-full rounded-lg object-cover max-h-[300px] mx-auto"
            />
          </div>
        )}

        {project.description && (
          <div className="mb-6 whitespace-pre-line">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        )}
        
        {project.url && typeof project.url === 'string' && project.url.trim() !== 'https://' && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(project.url, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Project
          </Button>
        )}
      </div>
    </div>
  );
}
