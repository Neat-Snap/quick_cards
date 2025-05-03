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
  const [height, setHeight] = useState<number | "auto">("auto");
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Measure the height of the content when it becomes visible
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            mass: 1
          }}
          className="w-full"
        >
          <Card className="overflow-hidden">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
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
            </motion.div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}