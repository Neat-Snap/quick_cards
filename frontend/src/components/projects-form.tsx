"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Project, getUserProjects, createProject, updateProject, deleteProject, getPremiumStatus } from "@/lib/api";
import { Trash2, Pencil, X, Save, Plus } from "lucide-react";

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
  
  // Form state for new project
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    role: "",
    url: "",
    avatar_url: ""
  });
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    role: "",
    url: "",
    avatar_url: ""
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load projects and premium status on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load projects
        const userProjects = await getUserProjects();
        setProjects(userProjects);
        
        // Check premium status
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus.is_active);
        setPremiumTier(premiumStatus.premium_tier);
      } catch (error) {
        console.error("Error loading projects:", error);
        toast({
          title: "Error",
          description: "Failed to load your projects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
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
  
  // Reset form states
  const resetForms = () => {
    setNewProject({
      name: "",
      description: "",
      role: "",
      url: "",
      avatar_url: ""
    });
    setEditForm({
      name: "",
      description: "",
      role: "",
      url: "",
      avatar_url: ""
    });
    setEditingId(null);
    setShowAddForm(false);
  };
  
  // Handle adding a new project
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newProject.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Check if maximum projects reached
    const maxProjects = getMaxProjects();
    if (projects.length >= maxProjects) {
      toast({
        title: "Limit Reached",
        description: `You can only add up to ${maxProjects} projects with your current plan`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        role: newProject.role.trim(),
        url: newProject.url.trim(),
        avatar_url: newProject.avatar_url.trim()
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to add project");
      }
      
      // Add the new project to the list
      if (response.user) {
        setProjects([...projects, response.user as unknown as Project]);
      }
      
      // Reset form and hide it
      resetForms();
      
      toast({
        title: "Project Added",
        description: "Your project has been added successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle updating a project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;
    
    // Validate input
    if (!editForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await updateProject(editingId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        role: editForm.role.trim(),
        url: editForm.url.trim(),
        avatar_url: editForm.avatar_url.trim()
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to update project");
      }
      
      // Update the project in the list
      setProjects(projects.map(project => 
        project.id === editingId 
          ? { ...project, ...editForm }
          : project
      ));
      
      // Reset edit state
      resetForms();
      
      toast({
        title: "Project Updated",
        description: "Your project has been updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a project
  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await deleteProject(projectId);
      
      if ('error' in response) {
        throw new Error(response.error || "Failed to delete project");
      }
      
      // Remove the project from the list
      setProjects(projects.filter(project => project.id !== projectId));
      
      toast({
        title: "Project Deleted",
        description: "Your project has been deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    }
  };
  
  // Start editing a project
  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditForm({
      name: project.name,
      description: project.description,
      role: project.role,
      url: project.url,
      avatar_url: project.avatar_url
    });
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Projects</h3>
          <p className="text-sm text-muted-foreground">
            Add projects you've worked on
          </p>
        </div>
        <Separator />
        
        {/* Existing Projects */}
        {projects.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium">Your Projects</h4>
            {projects.map((project) => (
              <div key={project.id} className="p-3 border rounded-md">
                {editingId === project.id ? (
                  // Edit form
                  <form onSubmit={handleUpdateProject} className="space-y-3">
                    <div className="flex justify-between">
                      <h5 className="font-medium">Edit Project</h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Label htmlFor={`edit-name-${project.id}`}>Project Name *</Label>
                      <Input
                        id={`edit-name-${project.id}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Project name"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Label htmlFor={`edit-role-${project.id}`}>Your Role</Label>
                      <Input
                        id={`edit-role-${project.id}`}
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        placeholder="e.g., Lead Developer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Label htmlFor={`edit-description-${project.id}`}>Description</Label>
                      <Textarea
                        id={`edit-description-${project.id}`}
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Brief description of the project and your contribution"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Label htmlFor={`edit-url-${project.id}`}>Project URL</Label>
                      <Input
                        id={`edit-url-${project.id}`}
                        value={editForm.url}
                        onChange={(e) => setEditForm({...editForm, url: e.target.value})}
                        placeholder="https://example.com"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Save className="h-4 w-4 mr-2" /> : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  // Project display
                  <div>
                    <div className="flex justify-between">
                      <h5 className="font-medium">{project.name}</h5>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(project)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    {project.role && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.role}
                      </p>
                    )}
                    
                    {project.description && (
                      <p className="text-sm mt-2">
                        {project.description}
                      </p>
                    )}
                    
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                      >
                        Visit Project
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No projects added yet
          </div>
        )}
        
        {/* Add New Project Button */}
        {!showAddForm && !editingId && (
          <div className="pt-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => setShowAddForm(true)}
              disabled={projects.length >= getMaxProjects()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            
            {projects.length >= getMaxProjects() && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {premiumTier < 2
                  ? "Upgrade to Premium to add more projects"
                  : "You've reached the maximum number of projects for your plan"}
              </p>
            )}
          </div>
        )}
        
        {/* Add New Project Form */}
        {showAddForm && !editingId && (
          <form onSubmit={handleAddProject} className="space-y-4 border rounded-md p-4">
            <div className="flex justify-between">
              <h4 className="font-medium">Add New Project</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="Project name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="project-role">Your Role</Label>
              <Input
                id="project-role"
                value={newProject.role}
                onChange={(e) => setNewProject({...newProject, role: e.target.value})}
                placeholder="e.g., Lead Developer"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="Brief description of the project and your contribution"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="project-url">Project URL</Label>
              <Input
                id="project-url"
                value={newProject.url}
                onChange={(e) => setNewProject({...newProject, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Project"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Done
        </Button>
      </div>
    </div>
  );
}