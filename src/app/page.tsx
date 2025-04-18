"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessCardPreview } from "@/components/business-card-preview";
import { BusinessCardForm } from "@/components/business-card-form";
import { PremiumFeatures } from "@/components/premium-features";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Search, CreditCard, Star } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("card");
  
  return (
    <main className="flex min-h-screen flex-col items-center pb-16">
      <div className="w-full max-w-md flex-1 overflow-y-auto">
        {activeTab === "card" && (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Your Card</h1>
            <div className="mb-6">
              <BusinessCardPreview />
            </div>
            <BusinessCardForm />
          </div>
        )}
        
        {activeTab === "explore" && (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Explore</h1>
            <div className="rounded-lg border p-4 mb-4">
              <div className="flex items-center space-x-2 mb-4">
                <input 
                  type="text" 
                  placeholder="Search by name, skills..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button>Search</Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Filter by:</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="default">Skills</Button>
                  <Button variant="outline" size="default">Projects</Button>
                  <Button variant="outline" size="default">Location</Button>
                </div>
              </div>
            </div>
            
            <div className="text-center text-muted-foreground">
              <p>Search for other users' cards</p>
            </div>
          </div>
        )}
        
        {activeTab === "premium" && (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Premium Features</h1>
            <PremiumFeatures />
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around">
        <button 
          onClick={() => setActiveTab("card")}
          className={`flex flex-col items-center justify-center w-1/3 h-full ${activeTab === "card" ? "text-primary" : "text-muted-foreground"}`}
        >
          <CreditCard className="h-5 w-5 mb-1" />
          <span className="text-xs">Card</span>
        </button>
        <button 
          onClick={() => setActiveTab("explore")}
          className={`flex flex-col items-center justify-center w-1/3 h-full ${activeTab === "explore" ? "text-primary" : "text-muted-foreground"}`}
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs">Explore</span>
        </button>
        <button 
          onClick={() => setActiveTab("premium")}
          className={`flex flex-col items-center justify-center w-1/3 h-full ${activeTab === "premium" ? "text-primary" : "text-muted-foreground"}`}
        >
          <Star className="h-5 w-5 mb-1" />
          <span className="text-xs">Premium</span>
        </button>
      </div>
    </main>
  );
} 