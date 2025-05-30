"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { GlassButton } from "@/components/GlassButton";
import { 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Share2, 
  UserCheck, 
  Code, 
  Briefcase, 
  Star, 
  CheckCircle, 
  MessageCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const onboardingPages = [
  {
    title: "Create Your Digital Business Card",
    description: "Design a professional business card to share with your contacts on Telegram.",
    icon: <CreditCard className="h-16 w-16 text-primary" />,
    features: [
      "Customize your profile with photos and details",
      "Create a personal brand in seconds",
      "Easy to use and share"
    ]
  },
  {
    title: "Showcase Your Professional Info",
    description: "Add your skills, projects, and contact details to make networking easier.",
    icon: <UserCheck className="h-16 w-16 text-primary" />,
    features: [
      { title: "Contacts", icon: <MessageCircle className="h-5 w-5" />, description: "Add email, phone, and social media links" },
      { title: "Skills", icon: <Code className="h-5 w-5" />, description: "Highlight your expertise with visual tags" },
      { title: "Projects", icon: <Briefcase className="h-5 w-5" />, description: "Showcase your work and achievements" }
    ]
  },
  {
    title: "Share Your Card & Go Premium",
    description: "Share your card with anyone via Telegram and unlock premium features.",
    icon: <Share2 className="h-16 w-16 text-primary" />,
    features: [
      { title: "Easy Sharing", icon: <Share2 className="h-5 w-5" />, description: "Share your card with a single tap" },
      { title: "Premium Features", icon: <Star className="h-5 w-5" />, description: "Get custom backgrounds, badges, and more" }
    ]
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState<"right" | "left">("right");
    
    const goToNextPage = () => {
      if (currentPage < onboardingPages.length - 1) {
        setDirection("right");
        setCurrentPage(prev => prev + 1);
      } else {
        handleComplete();
      }
    };
    
    const goToPrevPage = () => {
      if (currentPage > 0) {
        setDirection("left");
        setCurrentPage(prev => prev - 1);
      }
    };
    
    const goToPage = (index: number) => {
      setDirection(index > currentPage ? "right" : "left");
      setCurrentPage(index);
    };
    
    const handleComplete = () => {
      onComplete();
    };
    
    useEffect(() => {
      return () => {
        document.body.style.overflow = '';
      };
    }, []);
    
    const pageVariants = {
      enter: (direction: "right" | "left") => ({
        x: direction === "right" ? 300 : -300,
        opacity: 0
      }),
      center: {
        x: 0,
        opacity: 1
      },
      exit: (direction: "right" | "left") => ({
        x: direction === "right" ? -300 : 300,
        opacity: 0
      })
    };
    
    const renderPage = (page: typeof onboardingPages[0], index: number) => {
      return (
        <motion.div
          key={index}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full h-full flex flex-col"
        >
          <div className="flex-1 flex flex-col items-center justify-start text-center px-6 overflow-y-auto">
            <motion.div 
              className="mb-8 relative pt-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative">
                {page.icon}
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-2xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {page.title}
            </motion.h2>
            
            <motion.p 
              className="text-muted-foreground mb-8 max-w-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {page.description}
            </motion.p>
            
            <motion.div 
              className="w-full mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {Array.isArray(page.features) && page.features.length > 0 && (
                typeof page.features[0] === 'string' ? (
                  <div className="space-y-4 pb-4">
                    {page.features.map((feature, i) => (
                      <motion.div 
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + (i * 0.1), duration: 0.3 }}
                        className="bg-primary/5 rounded-lg p-3 flex items-start"
                      >
                        <div className="bg-primary/10 text-primary rounded-full p-1.5 mr-3 flex-shrink-0 mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="text-sm">{feature as string}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {page.features.map((feature: any, i) => (
                      <motion.div 
                        key={i}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + (i * 0.1), duration: 0.3 }}
                      >
                        <GlassCard className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="font-medium">{feature.title}</h3>
                              <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                )
              )}
            </motion.div>
          </div>
        </motion.div>
      );
    };
  
    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center">
          <div className="absolute top-4 right-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleComplete}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="w-full max-w-md flex-1 flex flex-col h-full"> 
            <div className="flex-1 overflow-y-auto px-4 pt-12 hide-scrollbar pb-4">
              <div className="relative rounded-xl h-full">
                <AnimatePresence custom={direction} initial={false}>
                  {renderPage(onboardingPages[currentPage], currentPage)}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
              <div className="flex justify-center gap-2 mb-6">
                {onboardingPages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      currentPage === index ? "bg-primary w-8" : "bg-muted hover:bg-primary/50"
                    )}
                  />
                ))}
              </div>
              
              <div className="flex justify-between gap-2">
                {currentPage > 0 ? (
                  <Button 
                    variant="outline" 
                    onClick={goToPrevPage}
                    className="gap-2 min-w-[80px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div className="min-w-[80px]">{}</div>
                )}
                
                <Button
                  variant="default"
                  onClick={goToNextPage}
                  className="min-w-[80px]"
                >
                  {currentPage < onboardingPages.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
}