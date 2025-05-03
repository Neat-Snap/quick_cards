"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnimatedFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function AnimatedForm({ 
  isOpen, 
  onClose, 
  title,
  children,
  showCloseButton = true
}: AnimatedFormProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            mass: 1
          }}
          className="w-full absolute top-0 left-0 right-0 z-10"
          style={{ minHeight: "100%" }}
        >
          <Card className="overflow-hidden mb-4">
            <div ref={contentRef}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl font-semibold"
                  >
                    {title}
                  </motion.h2>
                  
                  {showCloseButton && (
                    <motion.div
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}