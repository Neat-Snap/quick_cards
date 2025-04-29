import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Image,
  BadgeCheck,
  Briefcase,
  Code,
  Check,
  Star,
  Crown,
  Calendar
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  User,
  PremiumTier,
  PremiumStatus,
  getPremiumStatus,
  getPremiumTiers,
  subscribeToPremium
} from "@/lib/api";
import { closeApp } from "@/lib/telegram";

interface PremiumFeaturesProps {
  user: User | null;
  onSubscribed?: () => void;
}

// Local mapping of tier indices to display names
const TIER_LABELS = ["Basic", "Premium", "Ultimate", "God"];

export function PremiumFeatures({ user, onSubscribed }: PremiumFeaturesProps) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [premiumTiers, setPremiumTiers] = useState<PremiumTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  // Define features list
  const premiumFeatures = [
    { name: "Custom Background Image", description: "Upload your own background image for your card", tier: 1, icon: Image },
    { name: "Custom Badge", description: "Add a special badge next to your name", tier: 1, icon: BadgeCheck },
    { name: "Skills", description: "Add and display your skills with custom images", tier: 1, icon: Code },
    { name: "Extended Projects", description: "Add up to 5 projects to your profile (up from 3)", tier: 2, icon: Briefcase },
    { name: "Animated Elements", description: "Add beautiful animations to your card", tier: 2, icon: Sparkles },
    { name: "Custom Links", description: "Add external links to your profile", tier: 2, icon: BadgeCheck },
    { name: "Verified Badge", description: "Show a verified badge on your card", tier: 3, icon: BadgeCheck },
    { name: "Video Support", description: "Add video presentations to your card", tier: 3, icon: Image }
  ];

  // Load premium status and tiers on mount
  useEffect(() => {
    const loadPremiumData = async () => {
      try {
        const status = await getPremiumStatus();
        setPremiumStatus(status);
        const tiers = await getPremiumTiers();
        setPremiumTiers(tiers);
      } catch (error) {
        console.error("Error loading premium data:", error);
        toast({ title: "Error", description: "Failed to load premium information", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadPremiumData();
  }, []);

  // Handle subscription
  const handleSubscribe = async (tier: number) => {
    setSubscribing(true);
    try {
      const response = await subscribeToPremium(tier, "telegram");
      if (!response.success) throw new Error(response.error || "Failed to subscribe");
      if (response.payment_url) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openLink(response.payment_url);
          setTimeout(() => closeApp(), 1000);
        } else {
          window.open(response.payment_url, '_blank');
        }
      }
      // Optimistic update
      setPremiumStatus(prev => prev ? { ...prev, premium_tier: tier, is_active: true, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() } : null);
      toast({ title: "Subscription Initiated", description: "You will be redirected to complete your subscription", variant: "default" });
      onSubscribed?.();
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({ title: "Subscription Error", description: error instanceof Error ? error.message : "Failed to subscribe", variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <div className="text-center py-8">Loading premium information...</div>;

  const isPremium = premiumStatus?.is_active ?? false;
  const currentTier = premiumStatus?.premium_tier ?? 0;
  const maxTier = premiumTiers.length > 0 ? Math.max(...premiumTiers.map(t => t.tier)) : 3;

  // Next-level features
  const nextTier = currentTier < maxTier ? currentTier + 1 : null;
  const upcomingFeatures = nextTier ? premiumFeatures.filter(f => f.tier === nextTier) : [];

  return (
    <div className="space-y-6">
      {/* Premium Status Banner */}
      <div className="text-center">
        {isPremium ? (
          <>
            <Badge variant="default" className="bg-yellow-400 text-black px-3 py-1 text-sm">Active Premium Subscription</Badge>
            <h2 className="text-xl font-bold mt-4 mb-2">{TIER_LABELS[currentTier]} Plan</h2>
            <p className="text-sm text-muted-foreground flex justify-center items-center gap-1">
              <Calendar className="h-4 w-4" />
              Expires: {premiumStatus?.expires_at ? formatExpirationDate(premiumStatus.expires_at) : "Never"}
            </p>
          </>
        ) : (
          <>
            <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Upgrade to Premium</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Get access to exclusive features to customize your business card and stand out from the crowd.</p>
          </>
        )}
      </div>

      {/* Upcoming Features (always show next-level benefits) */}
      {nextTier && upcomingFeatures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-center mb-4">Features in {TIER_LABELS[nextTier]} Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-start gap-2">
                  <Icon className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">{feature.name}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Premium Tiers List */}
      <div className="grid grid-cols-1 gap-4">
        {premiumTiers.map(tier => {
          const TierIcon = tier.tier === 1 ? Star : tier.tier === 2 ? Sparkles : Crown;
          const isCurrent = tier.tier === currentTier;
          const canUpgrade = tier.tier > currentTier;

          return (
            <Card key={tier.tier} className={`${isCurrent ? 'border-2 border-yellow-400/50' : ''}`}> 
              <CardHeader className={`${isCurrent ? 'bg-yellow-400/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TierIcon className={`h-5 w-5 ${isCurrent ? 'text-yellow-400' : ''}`} />
                    {TIER_LABELS[tier.tier]} Plan
                  </CardTitle>
                  <Badge variant={isCurrent ? "default" : "outline"}>{isCurrent ? "Current" : `${tier.price} Stars`}</Badge>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {premiumFeatures
                    .filter(f => f.tier <= tier.tier)
                    .map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium">{feature.name}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
              <CardFooter>
                {isPremium ? (
                  isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                  ) : canUpgrade ? (
                    <Button className="w-full" onClick={() => handleSubscribe(tier.tier)} disabled={subscribing}>Upgrade for {tier.price} Stars</Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>Higher Tier</Button>
                  )
                ) : (
                  <Button className="w-full" onClick={() => handleSubscribe(tier.tier)} disabled={subscribing}>Subscribe for {tier.price} Stars</Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}