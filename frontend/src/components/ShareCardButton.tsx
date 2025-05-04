// components/ShareCardButton.tsx
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share, Copy, Users, Check, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ShareCardButtonProps {
  userId: string | number;
  botUsername?: string;
}

export function ShareCardButton({ userId, botUsername = "business_card_bot" }: ShareCardButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    
    if (window.Telegram?.WebApp?.switchInlineQuery) {
      // Using Telegram's WebApp API to share
      try {
        window.Telegram.WebApp.switchInlineQuery(link, ['users', 'groups', 'channels']);
        setIsMenuOpen(false);
      } catch (error) {
        console.error("Error sharing through Telegram:", error);
        toast({ 
          title: "Share failed",
          description: "Could not share through Telegram. Try copying the link instead.",
          variant: "destructive"
        });
      }
    } else {
      // Fallback for when Telegram WebApp API is not available
      toast({ 
        title: "Share unavailable",
        description: "Telegram sharing is only available in the Telegram app",
        variant: "destructive"
      });
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mb-4">
      <Button 
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Share className="h-4 w-4" />
        Share Your Card
      </Button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-lg border-primary/10">
              <CardContent className="p-2">
                <div className="flex justify-between items-center p-2">
                  <h3 className="text-sm font-medium">Share Your Card</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-2 p-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start" 
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Link
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="justify-start" 
                    onClick={handleTelegramShare}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Share to Contacts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}