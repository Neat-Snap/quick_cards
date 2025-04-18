"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function BusinessCardForm() {
  const [projectCount, setProjectCount] = React.useState(1);
  const isPremium = false; // This would be connected to actual premium status

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Profile Avatar</h3>
          <p className="text-sm text-muted-foreground">
            Upload your profile picture
          </p>
        </div>
        <Separator />
        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
            <span className="text-2xl text-muted-foreground">JP</span>
            {/* Avatar would be displayed here */}
          </div>
          <div className="flex gap-2">
            <Input id="avatar" type="file" className="hidden" />
            <Button
              variant="outline"
              onClick={() => document.getElementById("avatar")?.click()}
            >
              Upload Avatar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Background Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Background</h3>
          <p className="text-sm text-muted-foreground">
            Customize your card background
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-8 w-8 p-0 rounded-full bg-blue-500" />
            <Button variant="outline" className="h-8 w-8 p-0 rounded-full bg-green-500" />
            <Button variant="outline" className="h-8 w-8 p-0 rounded-full bg-purple-500" />
            <Button variant="outline" className="h-8 w-8 p-0 rounded-full bg-red-500" />
            <Button variant="outline" className="h-8 w-8 p-0 rounded-full bg-yellow-500" />
            <Button variant="outline" className="h-8 w-8 p-0 rounded-full bg-gray-500" />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="gradient">Use Gradient</Label>
            <Switch id="gradient" />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="customBackground">Upload Custom Photo {!isPremium && "(Premium)"}</Label>
            <div className="flex items-center gap-2">
              <Input id="customBackground" type="file" className="hidden" disabled={!isPremium} />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("customBackground")?.click()}
                disabled={!isPremium}
              >
                Choose File
              </Button>
            </div>
            {!isPremium && (
              <p className="text-xs text-muted-foreground">
                Custom background photos are available with Premium
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Personal Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Enter your personal details
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Jane Smith" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Write a brief description about yourself"
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="badge">Badge {!isPremium && "(Premium)"}</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="badge" 
                placeholder="e.g., Pro, Verified, Expert" 
                disabled={!isPremium}
              />
            </div>
            {!isPremium && (
              <p className="text-xs text-muted-foreground">
                Custom badges are available with Premium
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Contact Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Contact Information</h3>
          <p className="text-sm text-muted-foreground">
            Add your contact details
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="jane.smith@example.com" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="+1 (555) 123-4567" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="telegram">Telegram</Label>
            <Input id="telegram" placeholder="@username" />
          </div>
          <Button variant="outline" size="sm" className="w-full">
            + Add More Contact Info
          </Button>
        </div>
      </div>
      
      {/* Projects Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Projects</h3>
          <p className="text-sm text-muted-foreground">
            Add up to {isPremium ? "unlimited" : "3"} projects
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          {Array.from({ length: projectCount }).map((_, index) => (
            <div key={index} className="space-y-3 p-3 border rounded-md">
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor={`project-${index}-name`}>Project Name</Label>
                <Input id={`project-${index}-name`} placeholder="Project name" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor={`project-${index}-role`}>Your Role</Label>
                <Input id={`project-${index}-role`} placeholder="e.g., Lead Developer" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor={`project-${index}-description`}>Description</Label>
                <Textarea 
                  id={`project-${index}-description`} 
                  placeholder="Brief description of the project and your contribution"
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Label htmlFor={`project-${index}-image`}>Project Image</Label>
                <div className="flex items-center gap-2">
                  <Input id={`project-${index}-image`} type="file" className="hidden" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById(`project-${index}-image`)?.click()}
                  >
                    Upload Image
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {projectCount < (isPremium ? 10 : 3) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setProjectCount(prev => prev + 1)}
            >
              + Add Project
            </Button>
          )}
          
          {!isPremium && projectCount >= 3 && (
            <p className="text-xs text-muted-foreground text-center">
              Upgrade to Premium to add more than 3 projects
            </p>
          )}
        </div>
      </div>
      
      {/* Skills Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Skills {!isPremium && "(Premium)"}</h3>
          <p className="text-sm text-muted-foreground">
            Add skills to showcase your expertise
          </p>
        </div>
        <Separator />
        
        {isPremium ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="w-full">
                + Add Skill
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center border rounded-md bg-muted/50">
            <p className="text-sm mb-2">Add skills to your profile with Premium</p>
            <Button variant="outline" size="sm">
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
} 