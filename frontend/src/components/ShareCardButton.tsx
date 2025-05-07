"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share, Copy, Send, Check, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryPreview } from "@/components/StoryPreview";
import { User, getUserById, uploadStory } from "@/lib/api";
import html2canvas from 'html2canvas';
import { botUsername as bus} from "@/constants/constants";


interface ShareCardButtonProps {
  userId: string | number;
  botUsername?: string;
  userData?: User | null;
}

function isUser(obj: any): obj is User {
  return obj && typeof obj.id === "number";
}

export function ShareCardButton({ userId, botUsername = bus(), userData = null }: ShareCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("link");
  const [user, setUser] = useState<User | null>(userData);
  const [loading, setLoading] = useState(false);
  const storyPreviewRef = useRef<HTMLDivElement>(null);
  const [generatingStory, setGeneratingStory] = useState(false);
  const fetchedRef = useRef(false);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("link");
      fetchedRef.current = false;
      if (!userData) {
        setUser(null);
      }
    }
  }, [isOpen, userData]);
  
  // Fetch user data if not provided and dialog is open
  useEffect(() => {
    const fetchUserData = async () => {
      // Only fetch if:
      // 1. No userData was provided as a prop
      // 2. Dialog is open
      // 3. We don't already have user data
      // 4. We're not already loading
      // 5. We haven't already fetched in this dialog session
      if (!userData && isOpen && !user && !loading && !fetchedRef.current) {
        fetchedRef.current = true; // Mark that we've attempted to fetch
        setLoading(true);
        try {
          console.log("Fetching user data for story...");
          const response = await getUserById(userId.toString());
          console.log("User data response:", response);
          
          // Check if response is the user object directly or has expected structure
          if (isUser(response)) {
            // API returned user object directly
            setUser(response);
          } else if (response && response.success && response.user) {
            // API returned {success: true, user: {...}}
            setUser(response.user);
          } else {
            console.error("Failed to get valid user data");
          }
        } catch (error) {
          console.error("Error fetching user data for story:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [userId, userData, isOpen]); // Removed user and loading from dependency array

  // Generate the shareable link
  const getShareLink = () => {
    return bus(`id${userId?.toString()}`);
  };

  // Handle copy link
  const handleCopyLink = () => {
    const link = getShareLink();
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied", description: "Share link copied to clipboard" });
      })
      .catch((error) => {
        console.error("Error copying link:", error);
        toast({ 
          title: "Copy failed", 
          description: "Could not copy link to clipboard",
          variant: "destructive"
        });
      });
  };

  // Handle Telegram share
  const handleTelegramShare = () => {
    const link = getShareLink();
    
    // Create the share URL with encoded parameters
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Check out my business card!")}`;
    
    if (window.Telegram?.WebApp) {
      // Using Telegram's WebApp API to open the link
      try {
        window.Telegram.WebApp.openLink(shareUrl);
        setIsOpen(false);
      } catch (error) {
        console.error("Error sharing through Telegram:", error);
        // Fallback to copying link
        handleCopyLink();
        toast({
          title: "Sharing hint",
          description: "Link copied. You can now paste it in any chat.",
        });
      }
    } else {
      // Fallback for when Telegram WebApp API is not available
      window.open(shareUrl, '_blank');
      setIsOpen(false);
    }
  };

  // Function to upload story image to server
  // const uploadStoryImage = async (blob: Blob): Promise<string> => {
  //   const formData = new FormData();
  //   formData.append('file', blob, 'story-image.jpg');
    
  //   try {
  //     const response = await fetch('/api/v1/users/me/story', {
  //       method: 'POST',
  //       body: formData,
  //       credentials: 'include',
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`Failed to upload story image: ${response.status}`);
  //     }
      
  //     const data = await response.json();
      
  //     // The server should return the URL to the uploaded image
  //     if (data && data.url) {
  //       return data.url;
  //     } else if (data && data.file_url) {
  //       return data.file_url;
  //     } else {
  //       throw new Error('Invalid response from server');
  //     }
  //   } catch (error) {
  //     console.error('Error uploading story image:', error);
  //     throw error;
  //   }
  // };

  // Handle story share
  const handleStoryShare = async () => {
    if (!storyPreviewRef.current || !window.Telegram?.WebApp) {
      handleCopyLink(); // Fallback
      return;
    }
    
    setGeneratingStory(true);
    
    try {
      // Convert the story preview component to an image
      const canvas = await html2canvas(storyPreviewRef.current, {
        logging: false,
        scale: 2, // Better quality for retina displays
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error('Failed to convert canvas to blob');
        }, 'image/jpeg', 0.9);
      });
      
      // Upload image to server and get URL
      const imageUrl = await uploadStory(blob);
      console.log('Story image uploaded, URL:', imageUrl);
      
      // Create complete image URL if it's a relative path
      const fullImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${window.location.origin}/api/v1${imageUrl}`;
      
      // Share to story using Telegram's native API
      if (typeof window.Telegram?.WebApp?.shareToStory === 'function') {
        // Use the shareStory method if available with the URL
        window.Telegram.WebApp.shareToStory(fullImageUrl);
        setIsOpen(false);
      } else if (typeof window.Telegram?.WebApp?.sendData === 'function') {
        // Alternative using sendData (for older WebApp versions)
        window.Telegram.WebApp.sendData(JSON.stringify({
          type: 'share_story',
          image: fullImageUrl,
          text: "Check out my digital business card!"
        }));
        setIsOpen(false);
      } else {
        // Fallback to opening the image in a new tab
        window.open(fullImageUrl, '_blank');
        
        toast({
          title: "Story image created",
          description: "Image has been created and opened in a new tab",
        });
      }
    } catch (error) {
      console.error("Error generating story:", error);
      toast({
        title: "Failed to create story",
        description: error instanceof Error ? error.message : "There was an error generating your story image",
        variant: "destructive"
      });
    } finally {
      setGeneratingStory(false);
    }
  };

  return (
    <>
      <Button 
        variant="default"
        className="w-full flex items-center justify-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Share className="h-4 w-4" />
        Share Your Card
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 pb-24 overflow-y-auto"
          >
            <motion.div 
              className="absolute inset-0 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            ></motion.div>
            
            <motion.div
              className="w-full max-w-md mx-auto z-10"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ 
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
            >
              <Card className="w-full">
                <div className="pt-2 flex flex-row justify-between items-center">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 ml-4 mt-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </motion.div>

                  <div className="mr-3 mt-2">
                    <motion.div
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <motion.div 
                    className="flex items-center gap-3 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div 
                      className="p-3 bg-primary/10 rounded-full"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                    >
                      <Share className="h-5 w-5" />
                    </motion.div>
                    <CardTitle>Share Your Card</CardTitle>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-sm text-muted-foreground">
                      Share your card with friends and colleagues through Telegram
                    </p>
                  </motion.div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="link">Share Link</TabsTrigger>
                      <TabsTrigger value="story">Create Story</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="link" className="mt-0">
                      <motion.div 
                        className="py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-sm mb-4">
                          Your shareable link:
                        </p>
                        <div className="bg-muted p-3 rounded-md text-sm font-mono mb-4 text-muted-foreground overflow-hidden overflow-ellipsis">
                          {getShareLink()}
                        </div>
                      </motion.div>
                    </TabsContent>
                    
                    <TabsContent value="story" className="mt-0">
                      <motion.div 
                        className="py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-sm mb-4">
                          Share your card as a beautiful story:
                        </p>
                        <div className="flex justify-center mb-4">
                          {loading ? (
                            <div className="h-96 w-48 bg-muted rounded-lg flex items-center justify-center">
                              <div className="animate-pulse">Loading preview...</div>
                            </div>
                          ) : user ? (
                            <div className="max-w-[250px] w-full" ref={storyPreviewRef}>
                              <StoryPreview user={user} logoUrl="/static/images/logo.svg" />
                            </div>
                          ) : (
                            <div className="h-96 w-48 bg-muted rounded-lg flex items-center justify-center">
                              <div className="text-sm text-muted-foreground">Failed to load preview</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-2 pt-2 pb-6">
                  {activeTab === "link" && (
                    <>
                      <Button 
                        className="w-full" 
                        onClick={handleCopyLink}
                      >
                        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        Copy Link
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={handleTelegramShare}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Share via Telegram
                      </Button>
                    </>
                  )}
                  
                  {activeTab === "story" && (
                    <Button 
                      className="w-full" 
                      onClick={handleStoryShare}
                      disabled={!user || loading || generatingStory}
                    >
                      {generatingStory ? (
                        <>
                          <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Share as Story
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}