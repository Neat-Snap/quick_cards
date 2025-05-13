
import { useState, useEffect } from "react";
import { User, searchUsers } from "@/lib/api";
import { ExploreUserCard } from "./ExploreUserCard";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedUsersProps {
  onSelectUser: (user: User) => void;
}

export function FeaturedUsers({ onSelectUser }: FeaturedUsersProps) {
  const [featuredUsers, setFeaturedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadRandomUsers = async () => {
    setLoading(true);
    
    try {
      const users = await searchUsers("", undefined, 6, 0);
      setFeaturedUsers(users);
    } catch (error) {
      console.error("Failed to load featured users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadRandomUsers();
  }, []);
  
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading featured users...</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Featured Profiles</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={loadRandomUsers} className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
      
      {featuredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featuredUsers.map(user => (
            <ExploreUserCard 
              key={user.id} 
              user={user} 
              onClick={() => onSelectUser(user)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-medium mb-1">No users found</h3>
          <p className="text-sm text-muted-foreground">
            Try again later or try searching for specific users
          </p>
        </div>
      )}
    </div>
  );
}