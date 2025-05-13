
import React from "react";
import { Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  project: Project;
  onBack: () => void;
}


const DURATION = 0.1;

export default function AnimatedProjectDetailFullscreen({ project, onBack }: Props) {
  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto p-4 pb-28">
      <div className="p-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: DURATION }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 mb-4"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 pl-0" />
            Back
          </Button>
        </motion.div>

        <motion.h1 
          className="text-2xl font-bold mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: DURATION }}
        >
          {project.name}
        </motion.h1>
        
        {project.role && (
          <motion.p 
            className="text-sm text-muted-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: DURATION }}
          >
            {project.role}
          </motion.p>
        )}

        {project.avatar_url && (
          <motion.div 
            className="mb-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 25 }}
          >
            <img 
              src={project.avatar_url} 
              alt={project.name} 
              className="w-full rounded-lg object-cover max-h-[300px] mx-auto"
            />
          </motion.div>
        )}

        {project.description && (
          <motion.div 
            className="mb-6 whitespace-pre-line"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: DURATION }}
          >
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </motion.div>
        )}
        
        {project.url && typeof project.url === 'string' && project.url.trim() !== 'https://' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: DURATION }}
          >
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(project.url, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Project
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}