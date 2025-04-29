"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Project, getUserProjects, createProject, updateProject, deleteProject, getPremiumStatus, getCurrentUser, fileToDataUrl } from "@/lib/api";
import { Trash2, Edit, X, Save, Plus, Check, Image, Link, User, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface ProjectsFormProps {
  userId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectsForm({ userId, onSuccess, onCancel }: ProjectsFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumTier, setPremiumTier] = useState(0);
  
  // Animation states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  
  // Detail view state
  const [detailView, setDetailView] = useState<{
    project: Project;
    isOpen: boolean;
  } | null>(null);
  
  // Form mode state (add or edit)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  
  // Project form state
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectRole, setProjectRole] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [projectAvatar, setProjectAvatar] = useState<File | null>(null);
  const [projectAvatarUrl, setProjectAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for form animation
  const formRef = useRef<HTMLFormElement>(null);
  
  // Load projects and premium status on mount
  useEffect(() => {
    loadProjects();
  }, [userId]);

  // Function to load projects - reused throughout the component
  const loadProjects = async () => {
    try {
      console.log("Loading projects for user:", userId);
      
      // Try to load projects directly first
      let userProjects = await getUserProjects();
      
      // If that returns empty, try getting them from the user object
      if (!userProjects || userProjects.length === 0) {
        console.log("No projects found via direct API, trying from user object");
        const userResponse = await getCurrentUser();
        
        if (userResponse.success && userResponse.user && userResponse.user.projects) {
          userProjects = userResponse.user.projects as Project[];
        }
      }
      
      console.log("Projects loaded in ProjectsForm:", userProjects, "Count:", userProjects?.length || 0);
      setProjects(userProjects || []);
      
      // Check premium status if we haven't already
      if (!isPremium) {
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus.is_active);
        setPremiumTier(premiumStatus.premium_tier);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      toast({
        title: "Error",
        description: "Failed to load your projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get max allowed projects based on premium tier
  const getMaxProjects = () => {
    // Free tier: 3 projects
    if (premiumTier === 0) return 3;
    
    // Basic tier (1): 3 projects still
    if (premiumTier === 1) return 3;
    
    // Premium tier (2): 5 projects
    if (premiumTier === 2) return 5;
    
    // Ultimate tier (3): Unlimited projects
    return Infinity;
  };
  
  // Success animation handler
  useEffect(() => {
    if (successId !== null) {
      const timer = setTimeout(() => {
        setSuccessId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successId]);
  
  // Reset form state
  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setProjectRole("");
    setProjectUrl("");
    setProjectAvatar(null);
    setProjectAvatarUrl("");
    setIsEditMode(false);
    setEditingProjectId(null);
    
    // Add animation class to form
    if (formRef.current) {
      formRef.current.classList.add('form-reset');
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.classList.remove('form-reset');
        }
      }, 300);
    }
  };
  
  // Open detail view for a project
  const openDetailView = (project: Project) => {
    setDetailView({
      project,
      isOpen: true
    });
  };
  
  // Close detail view
  const closeDetailView = () => {
    setDetailView(null);
  };
  
  // Start editing a project
  const startEditing = (project: Project) => {
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setProjectRole(project.role || "");
    setProjectUrl(project.url || "");
    setProjectAvatarUrl(project.avatar_url || "");
    setIsEditMode(true);
    setEditingProjectId(project.id);
    
    // Close detail view if open
    if (detailView) {
      closeDetailView();
    }
    
    // Add focus animation
    if (formRef.current) {
      formRef.current.classList.add('form-focus');
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.classList.remove('form-focus');
        }
      }, 300);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    resetForm();
  };
  
  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProjectAvatar(file);
      
      try {
        // Convert to Base64 data URL for persistence across page reloads
        const dataUrl = await fileToDataUrl(file);
        setProjectAvatarUrl(dataUrl);
        
        // Log success
        console.log("Project image converted to persistent data URL");
      } catch (error) {
        console.error("Error converting project image to data URL:", error);
        // Fallback to blob URL if conversion fails
        const blobUrl = URL.createObjectURL(file);
        setProjectAvatarUrl(blobUrl);
      }
    }
  };
  
  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!projectName.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Check if non-premium user is adding more than allowed
    const maxProjects = getMaxProjects();
    if (!isEditMode && projects.length >= maxProjects) {
      toast({
        title: "Limit Reached",
        description: `You can only add up to ${maxProjects} projects with your current plan`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && editingProjectId) {
        console.log(`Updating project with ID ${editingProjectId}`);
        
        // Update existing project
        const response = await updateProject(editingProjectId, {
          name: projectName.trim(),
          description: projectDescription.trim(),
          role: projectRole.trim(),
          url: projectUrl.trim(),
          avatar_url: projectAvatarUrl
        });
        
        console.log("Update project response:", response);
        
        // Reload projects to get the updated list
        await loadProjects();
        
        // Find the updated project to highlight
        const updatedProjects = await getUserProjects();
        const updatedProject = updatedProjects.find(p => p.id === editingProjectId);
        
        if (updatedProject) {
          setSuccessId(updatedProject.id);
        }
        
        toast({
          title: "Project Updated",
          description: "Your project has been updated successfully",
          variant: "default",
        });
      } else {
        // Create new project
        console.log("Creating new project");
        const response = await createProject({
          name: projectName.trim(),
          description: projectDescription.trim(),
          role: projectRole.trim(),
          url: projectUrl.trim(),
          avatar_url: projectAvatarUrl
        });
        
        console.log("Create project response:", response);
        
        // Reload projects to get the updated list
        await loadProjects();
        
        // Find the newly created project to highlight
        const updatedProjects = await getUserProjects();
        const newProject = updatedProjects.find(p => 
          p.name === projectName.trim() && 
          (p.description === projectDescription.trim() || (!p.description && !projectDescription.trim()))
        );
        
        if (newProject) {
          setSuccessId(newProject.id);
        }
        
        toast({
          title: "Project Added",
          description: "Your project has been added successfully",
          variant: "default",
        });
      }
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error("Error handling project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a project
  const handleDeleteProject = async (projectId: number) => {
    // Mark as deleting for animation
    setDeletingId(projectId);
    
    try {
      console.log(`Deleting project with ID ${projectId}`);
      await deleteProject(projectId);
      
      // Wait for animation, then remove from state
      setTimeout(async () => {
        // Remove from local state first for immediate feedback
        setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
        
        // If we were editing this project, reset the form
        if (editingProjectId === projectId) {
          resetForm();
        }
        
        // Close detail view if this project was being viewed
        if (detailView && detailView.project.id === projectId) {
          closeDetailView();
        }
        
        // Clear deleting state
        setDeletingId(null);
        
        // Reload projects to ensure everything is in sync
        await loadProjects();
        
        toast({
          title: "Project Deleted",
          description: "Your project has been deleted successfully",
          variant: "default",
        });
      }, 300);
      
    } catch (error) {
      console.error("Error deleting project:", error);
      // Reset deleting animation state
      setDeletingId(null);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    }
  };
  
  // Handle form success - call onSuccess with updated projects
  const handleSuccess = () => {
    if (onSuccess) {
      console.log("Project form calling onSuccess with updated projects");
      onSuccess();
    }
  };

  // Function to get initials from project name
  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  const maxProjectsAllowed = getMaxProjects();

  // Render project details view
  const renderDetailView = () => {
    if (!detailView || !detailView.isOpen) return null;
    
    const { project } = detailView;
    
    return (
      <div className="fixed inset-0 bg-background/90 z-50 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={closeDetailView}
            className="gap-1"
          >
            <X className="h-4 w-4" /> Close
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(project)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                closeDetailView();
                handleDeleteProject(project.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Card className="border-none shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-16 w-16">
                  {project.avatar_url ? (
                    <AvatarImage src={project.avatar_url} alt={project.name} />
                  ) : (
                    <AvatarFallback>{getProjectInitials(project.name)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  {project.role && (
                    <CardDescription>{project.role}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-3">
              {project.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <div className="max-h-60 overflow-y-auto bg-muted/20 p-3 rounded-md text-sm">
                    {project.description.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            {project.url && (
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(project.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Project
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx global>{`
        .project-item {
          transition: all 0.3s ease;
        }
        .deleting {
          transform: translateX(100%);
          opacity: 0;
        }
        .success {
          background-color: rgba(132, 204, 22, 0.1);
          border-color: rgba(132, 204, 22, 0.5);
        }
        .form-focus {
          animation: highlight 0.3s ease;
        }
        .form-reset {
          animation: fadeOut 0.2s ease;
        }
        @keyframes highlight {
          0% { background-color: transparent; }
          50% { background-color: rgba(59, 130, 246, 0.1); }
          100% { background-color: transparent; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Projects</h3>
            <p className="text-sm text-muted-foreground">
              Add up to {maxProjectsAllowed === Infinity ? "unlimited" : maxProjectsAllowed} projects to your profile
            </p>
          </div>
          <Separator />
          
          {/* Existing Projects */}
          {projects.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium">Your Projects ({projects.length})</h4>
              <div className="max-h-80 overflow-y-auto pr-1">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className={`project-item flex items-start gap-3 p-3 border rounded-md mb-2 cursor-pointer
                      ${editingProjectId === project.id ? 'border-primary' : ''}
                      ${deletingId === project.id ? 'deleting' : ''}
                      ${successId === project.id ? 'success' : ''}
                    `}
                    onClick={() => openDetailView(project)}
                  >
                    <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
                      {project.avatar_url ? (
                        <AvatarImage src={project.avatar_url} alt={project.name} />
                      ) : (
                        <AvatarFallback>{getProjectInitials(project.name)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium">{project.name}</p>
                      {project.role && (
                        <p className="text-sm text-muted-foreground">{project.role}</p>
                      )}
                      {project.description && (
                        <p className="text-sm mt-1 line-clamp-1 text-ellipsis overflow-hidden">
                          {project.description}
                        </p>
                      )}
                      {project.url && (
                        <p className="text-xs text-blue-500 mt-1 truncate">{project.url}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {successId === project.id ? (
                        <div className="flex h-9 w-9 items-center justify-center text-green-500">
                          <Check className="h-5 w-5" />
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(project);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            disabled={deletingId === project.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No projects added yet. Add your first project below.
            </div>
          )}
          
          {/* Project Form - Add/Edit */}
          {(!isEditMode && projects.length >= maxProjectsAllowed) ? (
            <div className="text-center py-4 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground mb-2">
                You've reached the maximum number of projects for your plan ({maxProjectsAllowed}).
              </p>
              {premiumTier < 2 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => window.location.href = '/#premium'}
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4 rounded-md">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {isEditMode ? 'Edit Project' : 'Add New Project'}
                </h4>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
              
              {/* Project Avatar */}
              <div className="flex flex-col items-center gap-3 mb-2">
                <Avatar className="h-20 w-20">
                  {projectAvatarUrl ? (
                    <AvatarImage src={projectAvatarUrl} alt={projectName} />
                  ) : (
                    <AvatarFallback>
                      {projectName ? getProjectInitials(projectName) : 'PR'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <Input
                    id="project-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('project-avatar')?.click()}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    {projectAvatarUrl ? 'Change Image' : 'Add Image'}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor="project-role">Your Role</Label>
                <Input
                  id="project-role"
                  value={projectRole}
                  onChange={(e) => setProjectRole(e.target.value)}
                  placeholder="e.g., Lead Developer, Project Manager"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of this project"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor="project-url">Project URL</Label>
                <Input
                  id="project-url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    isEditMode ? "Updating..." : "Adding..."
                  ) : (
                    isEditMode ? (
                      <><Save className="h-4 w-4 mr-2" />Update Project</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Add Project</>
                    )
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <Button 
            type="button" 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => {
              handleSuccess();
              if (onCancel) onCancel();
            }}
          >
            Back
          </Button>
      </div>

      {/* Render project detail view if active */}
      {renderDetailView()}
    </>
  );
}