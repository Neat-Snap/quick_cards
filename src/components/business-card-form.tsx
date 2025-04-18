"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function BusinessCardForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Enter your personal and contact information.
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Jane Smith" defaultValue="Jane Smith" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" placeholder="Senior Software Engineer" defaultValue="Senior Software Engineer" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="TechCorp Solutions" defaultValue="TechCorp Solutions" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Contact Information</h3>
          <p className="text-sm text-muted-foreground">
            Add your contact details for others to reach you.
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="jane.smith@techcorp.com" defaultValue="jane.smith@techcorp.com" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="+1 (555) 123-4567" defaultValue="+1 (555) 123-4567" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="website">Website</Label>
            <Input id="website" placeholder="www.janesmith.dev" defaultValue="www.janesmith.dev" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Social Media</h3>
          <p className="text-sm text-muted-foreground">
            Link your social media accounts.
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="telegram">Telegram</Label>
            <Input id="telegram" placeholder="@janesmith" defaultValue="@janesmith" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="twitter">Twitter</Label>
            <Input id="twitter" placeholder="@janesmith_dev" defaultValue="@janesmith_dev" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" placeholder="in/janesmith-dev" defaultValue="in/janesmith-dev" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Appearance</h3>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of your business card.
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode">Dark Mode</Label>
            <Switch id="darkMode" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showBadge">Show Verified Badge</Label>
            <Switch id="showBadge" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="customImage">Upload Custom Image</Label>
            <div className="flex items-center gap-2">
              <Input id="customImage" type="file" className="hidden" />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("customImage")?.click()}
              >
                Choose File
              </Button>
              <Button variant="ghost" className="shrink-0">
                Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, 500x500px or larger
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset Form</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
} 