"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Contact, getUserContacts, createContact, deleteContact, getPremiumStatus } from "@/lib/api";
import { Trash2 } from "lucide-react";

interface ContactFormProps {
  userId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ userId, onSuccess, onCancel }: ContactFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  // New contact form state
  const [newContactType, setNewContactType] = useState("email");
  const [newContactValue, setNewContactValue] = useState("");
  const [newContactPublic, setNewContactPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load contacts and premium status on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load contacts
        const userContacts = await getUserContacts();
        setContacts(userContacts);
        
        // Check premium status
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus.is_active);
      } catch (error) {
        console.error("Error loading contact data:", error);
        toast({
          title: "Error",
          description: "Failed to load your contact information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Handle adding a new contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newContactType || !newContactValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both type and value for the contact",
        variant: "destructive",
      });
      return;
    }
    
    // Check if non-premium user already has 3 contacts
    if (!isPremium && contacts.length >= 3) {
      toast({
        title: "Premium Required",
        description: "You need Premium to add more than 3 contacts",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await createContact({
        contact_type: newContactType,
        value: newContactValue.trim(),
        is_public: newContactPublic
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to add contact");
      }
      
      // Add the new contact to the list
      if (response.user) {
        setContacts([...contacts, response.user as unknown as Contact]);
      }
      
      // Reset form
      setNewContactType("email");
      setNewContactValue("");
      setNewContactPublic(true);
      
      toast({
        title: "Contact Added",
        description: "Your contact information has been added successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a contact
  const handleDeleteContact = async (contactId: number) => {
    try {
      const response = await deleteContact(contactId);
      
      if ('error' in response) {
        throw new Error(response.error || "Failed to delete contact");
      }
      
      // Remove the contact from the list
      setContacts(contacts.filter(contact => contact.id !== contactId));
      
      toast({
        title: "Contact Deleted",
        description: "Your contact information has been deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contact",
        variant: "destructive",
      });
    }
  };
  
  // Get placeholder based on contact type
  const getPlaceholder = (type: string) => {
    switch (type) {
      case "email":
        return "example@email.com";
      case "phone":
        return "+1 (123) 456-7890";
      case "telegram":
        return "@username";
      case "website":
        return "https://youwebsite.com";
      default:
        return "Enter contact value";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contact information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Contact Information</h3>
          <p className="text-sm text-muted-foreground">
            Add ways for others to contact you
          </p>
        </div>
        <Separator />
        
        {/* Existing Contacts */}
        {contacts.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium">Your Contacts</h4>
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium capitalize">
                    {contact.contact_type}
                    {!contact.is_public && " (Private)"}
                  </p>
                  <p className="text-sm text-muted-foreground">{contact.value}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No contact information added yet
          </div>
        )}
        
        {/* Add New Contact Form */}
        <form onSubmit={handleAddContact} className="space-y-4 pt-4">
          <h4 className="font-medium">Add New Contact</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="contactType">Contact Type</Label>
            <Select 
              value={newContactType} 
              onValueChange={setNewContactType}
            >
              <SelectTrigger id="contactType">
                <SelectValue placeholder="Select contact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="contactValue">Value</Label>
            <Input
              id="contactValue"
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
              placeholder={getPlaceholder(newContactType)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={newContactPublic}
              onCheckedChange={setNewContactPublic}
            />
            <Label htmlFor="isPublic">Make this contact public</Label>
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || (!isPremium && contacts.length >= 3)}
            >
              {isSubmitting ? "Adding..." : "Add Contact"}
            </Button>
            
            {!isPremium && contacts.length >= 3 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Upgrade to Premium to add more than 3 contacts
              </p>
            )}
          </div>
        </form>
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