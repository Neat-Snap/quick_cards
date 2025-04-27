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
import { Trash2, Edit, X, Save, Plus } from "lucide-react";

interface ContactFormProps {
  userId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ userId, onSuccess, onCancel }: ContactFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  // Form mode state (add or edit)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  
  // Contact form state
  const [contactType, setContactType] = useState("email");
  const [contactValue, setContactValue] = useState("");
  const [contactPublic, setContactPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load contacts and premium status on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load contacts
        const userContacts = await getUserContacts();
        console.log("Loaded contacts in ContactForm:", userContacts);
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
  
  // Reset form state
  const resetForm = () => {
    setContactType("email");
    setContactValue("");
    setContactPublic(true);
    setIsEditMode(false);
    setEditingContactId(null);
  };
  
  // Start editing a contact
  const startEditing = (contact: Contact) => {
    setContactType(contact.type);
    setContactValue(contact.value);
    setContactPublic(contact.is_public);
    setIsEditMode(true);
    setEditingContactId(contact.id);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    resetForm();
  };
  
  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!contactType || !contactValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both type and value for the contact",
        variant: "destructive",
      });
      return;
    }
    
    // Check if non-premium user is adding more than allowed
    if (!isPremium && !isEditMode && contacts.length >= 3) {
      toast({
        title: "Premium Required",
        description: "You need Premium to add more than 3 contacts",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && editingContactId) {
        // Update existing contact
        // Since your API doesn't have an updateContact function, we'll simulate by:
        // 1. Delete the existing contact
        // 2. Create a new one with updated values
        await deleteContact(editingContactId);
        
        const response = await createContact({
          type: contactType,
          value: contactValue.trim(),
          is_public: contactPublic
        });
        
        if (!response.success) {
          throw new Error(response.error || "Failed to update contact");
        }
        
        toast({
          title: "Contact Updated",
          description: "Your contact information has been updated successfully",
          variant: "default",
        });
      } else {
        // Create new contact
        const response = await createContact({
          type: contactType,
          value: contactValue.trim(),
          is_public: contactPublic
        });
        
        if (!response.success) {
          throw new Error(response.error || "Failed to add contact");
        }
        
        toast({
          title: "Contact Added",
          description: "Your contact information has been added successfully",
          variant: "default",
        });
      }
      
      // Reload contacts to get fresh data
      const updatedContacts = await getUserContacts();
      setContacts(updatedContacts);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error("Error handling contact:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process contact",
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
      
      // If we were editing this contact, reset the form
      if (editingContactId === contactId) {
        resetForm();
      }
      
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

  // Handle form success - call onSuccess with updated contacts
  const handleSuccess = () => {
    if (onSuccess) {
      console.log("Contact form calling onSuccess with updated contacts");
      onSuccess();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contact information...</div>;
  }

  console.log("Contacts in ContactForm:", contacts);

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
        {contacts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Your Contacts</h4>
            <div className="max-h-64 overflow-y-auto pr-1">
              {contacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className={`flex items-center justify-between p-3 border rounded-md mb-2 ${
                    editingContactId === contact.id ? 'border-primary' : ''
                  }`}
                >
                  <div className="flex-1 cursor-pointer" onClick={() => startEditing(contact)}>
                    <p className="font-medium capitalize">
                      {contact.type}
                      {!contact.is_public && " (Private)"}
                    </p>
                    <p className="text-sm text-muted-foreground">{contact.value}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact Form - Add/Edit */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {isEditMode ? 'Edit Contact' : 'Add New Contact'}
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
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="contactType">Contact Type</Label>
            <Select 
              value={contactType} 
              onValueChange={setContactType}
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
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={getPlaceholder(contactType)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={contactPublic}
              onCheckedChange={setContactPublic}
            />
            <Label htmlFor="isPublic">Make this contact public</Label>
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || (!isPremium && !isEditMode && contacts.length >= 3)}
            >
              {isSubmitting ? (
                isEditMode ? "Updating..." : "Adding..."
              ) : (
                isEditMode ? (
                  <><Save className="h-4 w-4 mr-2" />Update Contact</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" />Add Contact</>
                )
              )}
            </Button>
            
            {!isPremium && !isEditMode && contacts.length >= 3 && (
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
          onClick={() => {
            handleSuccess();
            if (onCancel) onCancel();
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );
}