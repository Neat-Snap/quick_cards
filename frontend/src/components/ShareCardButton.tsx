// components/ShareCardButton.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share, Copy, Send, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

interface ShareCardButtonProps {
  userId: string | number;
  botUsername?: string;
}

export function ShareCardButton({ userId, botUsername = "face_cards_bot" }: ShareCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate the shareable link
  const getShareLink = () => {
    return `https://t.me/${botUsername}?startapp=id${userId}`;
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
    
    if (window.Telegram?.WebApp) {
      // Using Telegram's WebApp API to share
      try {
        if (window.Telegram.WebApp.switchInlineQuery) {
          window.Telegram.WebApp.switchInlineQuery("Check out my business card!", ['users']);
          setIsOpen(false);
        } else {
          // Fallback if switchInlineQuery is not available
          handleCopyLink();
          toast({
            title: "Sharing hint",
            description: "Link copied. You can now paste it in any chat.",
          });
        }
      } catch (error) {
        console.error("Error sharing through Telegram:", error);
        handleCopyLink();
      }
    } else {
      // Fallback for when Telegram WebApp API is not available
      handleCopyLink();
    }
  };

  return (
    <>
      <Button 
        variant="outline"
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
                </CardContent>
                
                <CardFooter className="flex flex-col gap-2">
                  <motion.div 
                    className="w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button 
                      className="w-full" 
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      Copy Link
                    </Button>
                  </motion.div>
                  
                  <motion.div 
                    className="w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={handleTelegramShare}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Share via Telegram
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}