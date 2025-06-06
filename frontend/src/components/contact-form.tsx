"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Contact, getUserContacts, createContact, deleteContact, getPremiumStatus } from "@/lib/api";
import { Trash2, Edit, X, Save, Plus, Check, AlertCircle, Info } from "lucide-react";

const ALLOWED_CONTACT_TYPES = ["email", "phone", "telegram", "website"];
const MAX_VALUE_LENGTH = 255;
const PHONE_REGEX = /^\+?\d{7,16}$/;
const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]+$/;
const TELEGRAM_REGEX = /^@?[a-zA-Z0-9_]{4,32}$/;
const WEBSITE_REGEX = /^https?:\/\/[^\s\/$.?#].[^\s]*$/;

interface ContactFormProps {
  userId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ userId, onSuccess, onCancel }: ContactFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  
  const [contactType, setContactType] = useState("email");
  const [contactValue, setContactValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [contactValueError, setContactValueError] = useState<string | null>(null);
  const [contactPublic, setContactPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    loadContacts();
  }, [userId]);

  useEffect(() => {
    setDisplayValue("");
    
    if (contactType === "website") {
      setContactValue("https://");
    } else if (contactType === "telegram") {
      setContactValue("@");
    } else {
      setContactValue("");
    }
  }, [contactType]);
  
  useEffect(() => {
    if (contactType === "website") {
      if (displayValue) {
        setContactValue(`https://${displayValue}`);
      } else {
        setContactValue("https://");
      }
    } else if (contactType === "telegram") {
      if (displayValue) {
        setContactValue(`@${displayValue}`);
      } else {
        setContactValue("@");
      }
    } else {
      setContactValue(displayValue);
    }
  }, [displayValue, contactType]);

  useEffect(() => {
    if (isEditMode && contactValue) {
      if (contactType === "website" && contactValue.startsWith("https://")) {
        setDisplayValue(contactValue.substring(8));
      } else if (contactType === "telegram" && contactValue.startsWith("@")) {
        setDisplayValue(contactValue.substring(1));
      } else {
        setDisplayValue(contactValue);
      }
    }
  }, [isEditMode, contactValue, contactType]);

  useEffect(() => {
    validateContactValue();
  }, [contactType, contactValue]);

  const validateContactValue = () => {
    if (contactType === "website") {
      if (!displayValue.trim()) {
        setContactValueError(null);
        return;
      }
      
      if (!WEBSITE_REGEX.test(contactValue) || contactValue.length > MAX_VALUE_LENGTH) {
        setContactValueError("Invalid website URL format");
      } else {
        setContactValueError(null);
      }
      return;
    }
    
    if (contactType === "telegram") {
      if (!displayValue.trim()) {
        setContactValueError(null);
        return;
      }
      
      if (!TELEGRAM_REGEX.test(contactValue)) {
        setContactValueError("Invalid Telegram username. Must be 5-32 characters (letters, numbers, underscore)");
      } else {
        setContactValueError(null);
      }
      return;
    }
    
    if (!contactValue.trim()) {
      setContactValueError(null);
      return;
    }

    switch (contactType) {
      case "phone":
        if (!PHONE_REGEX.test(contactValue)) {
          setContactValueError("Invalid phone format. Must be 7-16 digits with optional + prefix");
        } else {
          setContactValueError(null);
        }
        break;
      case "email":
        if (!EMAIL_REGEX.test(contactValue) || contactValue.length > 100) {
          setContactValueError("Invalid email format");
        } else {
          setContactValueError(null);
        }
        break;
      default:
        if (contactValue.length > MAX_VALUE_LENGTH) {
          setContactValueError(`Value must be ${MAX_VALUE_LENGTH} characters or less`);
        } else {
          setContactValueError(null);
        }
    }
  };

  const loadContacts = async () => {
    try {
      console.log("Loading contacts for user:", userId);
      
      const userContacts = await getUserContacts();
      console.log("Contacts loaded in ContactForm:", userContacts, "Count:", userContacts.length);
      setContacts(userContacts);
      
      if (!isPremium) {
        const premiumStatus = await getPremiumStatus();
        setIsPremium(premiumStatus.is_active);
      }
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
  
  useEffect(() => {
    if (successId !== null) {
      const timer = setTimeout(() => {
        setSuccessId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successId]);
  
  const resetForm = () => {
    setContactType("email");
    setContactValue("");
    setContactPublic(true);
    setIsEditMode(false);
    setEditingContactId(null);
    setContactValueError(null);
    
    if (formRef.current) {
      formRef.current.classList.add('form-reset');
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.classList.remove('form-reset');
        }
      }, 300);
    }
  };
  
  const startEditing = (contact: Contact) => {
    setContactType(contact.type);
    setContactPublic(contact.is_public);
    setIsEditMode(true);
    setEditingContactId(contact.id);
    setContactValueError(null);
    
    if (contact.type === "website" && contact.value.startsWith("https://")) {
      setContactValue(contact.value);
      setDisplayValue(contact.value.substring(8));
    } else if (contact.type === "telegram" && contact.value.startsWith("@")) {
      setContactValue(contact.value);
      setDisplayValue(contact.value.substring(1)); 
    } else {
      setContactValue(contact.value);
      setDisplayValue(contact.value);
    }
    
    if (formRef.current) {
      formRef.current.classList.add('form-focus');
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.classList.remove('form-focus');
        }
      }, 300);
    }
  };
  
  const cancelEditing = () => {
    resetForm();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactType || !contactValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both type and value for the contact",
        variant: "destructive",
      });
      return;
    }

    if (contactValueError) {
      toast({
        title: "Validation Error",
        description: contactValueError,
        variant: "destructive",
      });
      return;
    }
    
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
        const oldContactId = editingContactId;
        
        console.log(`Deleting contact with ID ${oldContactId}`);
        await deleteContact(oldContactId);
        
        console.log("Creating new contact to replace deleted one");
        const response = await createContact({
          type: contactType,
          value: contactValue.trim(),
          is_public: contactPublic
        });
        
        await loadContacts();
        
        const updatedContacts = await getUserContacts();
        const newContact = updatedContacts.find(contact => 
          contact.type === contactType && 
          contact.value === contactValue.trim()
        );
        
        if (newContact) {
          setSuccessId(newContact.id);
        }
        
        toast({
          title: "Contact Updated",
          description: "Your contact information has been updated successfully",
          variant: "default",
        });
      } else {
        console.log("Creating new contact");
        const response = await createContact({
          type: contactType,
          value: contactValue.trim(),
          is_public: contactPublic
        });
        
        console.log("Create contact response:", response);
        
        await loadContacts();
        
        const updatedContacts = await getUserContacts();
        const newContact = updatedContacts.find(contact => 
          contact.type === contactType && 
          contact.value === contactValue.trim()
        );
        
        if (newContact) {
          setSuccessId(newContact.id);
        }
        
        toast({
          title: "Contact Added",
          description: "Your contact information has been added successfully",
          variant: "default",
        });
      }
      
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
  
  const handleDeleteContact = async (contactId: number) => {
    setDeletingId(contactId);
    
    try {
      console.log(`Deleting contact with ID ${contactId}`);
      await deleteContact(contactId);
      
      setTimeout(async () => {
        setContacts(prevContacts => prevContacts.filter(contact => contact.id !== contactId));
        
        if (editingContactId === contactId) {
          resetForm();
        }
        
        setDeletingId(null);
        
        await loadContacts();
        
        toast({
          title: "Contact Deleted",
          description: "Your contact information has been deleted successfully",
          variant: "default",
        });
      }, 300);
      
    } catch (error) {
      console.error("Error deleting contact:", error);
      setDeletingId(null);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contact",
        variant: "destructive",
      });
    }
  };
  
  const getPlaceholder = (type: string) => {
    switch (type) {
      case "email":
        return "example@email.com";
      case "phone":
        return "+1 (123) 456-7890";
      case "telegram":
        return "username";
      case "website":
        return "example.com";
      default:
        return "Enter contact value";
    }
  };

  const getFormatHint = (type: string) => {
    switch (type) {
      case "email":
        return "Format: username@domain.com (max 100 chars)";
      case "phone":
        return "Format: +XXXXXXXXXXXX (7-16 digits with optional + prefix)";
      case "telegram":
        return "Format: 5-32 characters (letters, numbers, underscore)";
      case "website":
        return "Enter domain without https:// prefix";
      default:
        return "";
    }
  };

  const handleSuccess = () => {
    if (onSuccess) {
      console.log("Contact form calling onSuccess with updated contacts");
      onSuccess();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contact information...</div>;
  }

  return (
    <>
      <style jsx global>{`
        .contact-item {
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
            <h3 className="text-lg font-medium">Contact Information</h3>
            <p className="text-sm text-muted-foreground">
              Add ways for others to contact you
            </p>
          </div>
          <Separator />
          
          {contacts.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium">Your Contacts ({contacts.length})</h4>
              <div className="max-h-64 overflow-y-auto pr-1 show-scrollbar">
                {contacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className={`contact-item flex items-center justify-between p-3 border rounded-md mb-2 
                      ${editingContactId === contact.id ? 'border-primary' : ''}
                      ${deletingId === contact.id ? 'deleting' : ''}
                      ${successId === contact.id ? 'success' : ''}
                    `}
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => startEditing(contact)}>
                      <p className="font-medium capitalize">
                        {contact.type}
                        {!contact.is_public && " (Private)"}
                      </p>
                      <p className="text-sm text-muted-foreground">{contact.value}</p>
                    </div>
                    <div className="flex gap-1">
                      {successId === contact.id ? (
                        <div className="flex h-9 w-9 items-center justify-center text-green-500">
                          <Check className="h-5 w-5" />
                        </div>
                      ) : (
                        <>
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
                            disabled={deletingId === contact.id}
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
              No contact information added yet. Add your first contact below.
            </div>
          )}
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4 rounded-md">
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
              <Label htmlFor="contactType">Contact Type*</Label>
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
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="contactValue">Value*</Label>
                <span className={`text-xs ${contactValue.length > MAX_VALUE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                  {contactValue.length}/{MAX_VALUE_LENGTH}
                </span>
              </div>
              
              {contactType === "website" ? (
                <div className="flex rounded-md overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-sm flex items-center border-y border-l rounded-l-md">
                    https:
                  </div>
                  <Input
                    id="contactValue"
                    value={displayValue}
                    onChange={(e) => setDisplayValue(e.target.value)}
                    placeholder="example.com"
                    className={`rounded-l-none ${contactValueError ? "border-destructive" : ""}`}
                    maxLength={MAX_VALUE_LENGTH - 8}
                  />
                </div>
              ) : contactType === "telegram" ? (
                <div className="flex rounded-md overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-sm flex items-center border-y border-l rounded-l-md">
                    @
                  </div>
                  <Input
                    id="contactValue"
                    value={displayValue}
                    onChange={(e) => setDisplayValue(e.target.value)}
                    placeholder="username"
                    className={`rounded-l-none ${contactValueError ? "border-destructive" : ""}`}
                    maxLength={MAX_VALUE_LENGTH - 1}
                  />
                </div>
              ) : (
                <Input
                  id="contactValue"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={getPlaceholder(contactType)}
                  className={contactValueError ? "border-destructive" : ""}
                  maxLength={MAX_VALUE_LENGTH}
                />
              )}
              
              {contactValueError && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>{contactValueError}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>{getFormatHint(contactType)}</span>
              </div>
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
                disabled={isSubmitting || !!contactValueError || !contactValue.trim() || (!isPremium && !isEditMode && contacts.length >= 3)}
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
      </div>
    </>
  );
}