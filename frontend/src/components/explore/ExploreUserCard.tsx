// components/explore/ExploreUserCard.tsx - Card component for displaying user in grid

import { User } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl } from "@/components/business-card-preview";

interface ExploreUserCardProps {
  user: User;
  onClick: () => void;
}

export function ExploreUserCard({ user, onClick }: ExploreUserCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div 
        className="h-24 w-full bg-gradient-to-r from-primary/10 to-secondary/10" 
        style={{ 
          backgroundColor: user.background_color || undefined,
          backgroundImage: user.background_type === "gradient" ? user.background_value : undefined,
          backgroundSize: "cover"
        }}
      />
      <CardContent className="pt-0 relative">
        <div className="flex items-center gap-3 -mt-6">
          <Avatar className="h-12 w-12 border-2 border-background">
            <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
            <AvatarFallback>
              {user.first_name?.charAt(0) || ''}
              {user.last_name?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          <div className="mt-6">
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        
        {user.description && (
          <p className="text-sm mt-3 line-clamp-2 text-muted-foreground">
            {user.description}
          </p>
        )}
        
        {user.skills && user.skills.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {user.skills.slice(0, 3).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
              {user.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}