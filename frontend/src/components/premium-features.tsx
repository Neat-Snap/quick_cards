// Replace the Sheet imports with simple div-based modals

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Image as ImageIcon,
  BadgeCheck,
  Briefcase,
  Code,
  Check,
  Star,
  Crown,
  Calendar,
  X
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
  getPremiumTiers 
} from "@/lib/api";

// Display labels for each tier index
const TIER_LABELS = ["Free", "Basic", "Premium", "Ultimate"];

interface PremiumFeaturesProps {
  user: User | null;
  onSubscribed?: () => void;
}

export function PremiumFeatures({ user, onSubscribed }: PremiumFeaturesProps) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [premiumTiers, setPremiumTiers] = useState<PremiumTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // All possible premium features with their required tier
  const premiumFeatures = [
    { name: "Custom Background Image", description: "Upload your own background image for your card", tier: 1, icon: ImageIcon },
    { name: "Custom Badge", description: "Add a special badge next to your name", tier: 1, icon: BadgeCheck },
    { name: "Skills", description: "Add and display your skills with custom images", tier: 1, icon: Code },
    { name: "Extended Projects", description: "Add up to 5 projects to your profile (up from 3)", tier: 2, icon: Briefcase },
    { name: "Animated Elements", description: "Add beautiful animations to your card", tier: 2, icon: Sparkles },
    { name: "Custom Links", description: "Add external links to your profile", tier: 2, icon: BadgeCheck },
    { name: "Verified Badge", description: "Show a verified badge on your card", tier: 3, icon: BadgeCheck },
    { name: "Video Support", description: "Add video presentations to your card", tier: 3, icon: ImageIcon }
  ];

  // Load status & tiers from backend
  const loadPremiumData = async () => {
    setLoading(true);
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

  useEffect(() => {
    loadPremiumData();
  }, []);

  // When user presses a tier button, open confirmation dialog
  const handleSubscribeClick = (tier: number) => {
    setSelectedTier(tier);
    setDialogOpen(true);
  };

  // Check payment status with backend API
  const checkPaymentStatus = async (user_id: string | number, tier: number, charge_id: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/premium/check_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, tier, charge_id })
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  };

  // Confirm purchase: fetch link, open invoice, handle status
  const handleConfirmPurchase = async () => {
    setDialogOpen(false);
    if (selectedTier === null || !user) return;
    
    setSubscribing(true);
    setPaymentInProgress(true);
    setPaymentError(null);
    
    try {
      // Generate payment link
      const response = await fetch(`/api/v1/premium/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate payment link: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to generate payment link");
      }
      
      const invoiceLink = data.payment_url as string;
      
      // Use Telegram WebApp to open invoice
      if (window.Telegram?.WebApp) {
        // We need to check if openInvoice exists at runtime
        // since TypeScript definition might be missing
        if (typeof (window.Telegram.WebApp as any).openInvoice === 'function') {
          (window.Telegram.WebApp as any).openInvoice(
            invoiceLink, 
            async (status: string) => {
              console.log("Payment status:", status);
              
              if (status === "paid") {
                // Verify payment on backend
                try {
                  const verified = await checkPaymentStatus(
                    user.id,
                    selectedTier,
                    invoiceLink // Use as charge_id
                  );
                  
                  if (verified) {
                    // Refresh premium status
                    await loadPremiumData();
                    toast({ 
                      title: "Payment Successful", 
                      description: `You've been upgraded to ${TIER_LABELS[selectedTier]} plan`, 
                      variant: "default" 
                    });
                    
                    // Notify parent component
                    if (onSubscribed) {
                      onSubscribed();
                    }
                  } else {
                    // Payment verification failed
                    setPaymentError("Payment succeeded but verification failed. Please contact support.");
                    setErrorDialogOpen(true);
                  }
                } catch (error) {
                  console.error("Verification error:", error);
                  setPaymentError("Payment verification error. Please contact support if your premium features aren't activated.");
                  setErrorDialogOpen(true);
                }
              } else if (status === "failed") {
                setPaymentError("Payment failed. Please try again.");
                setErrorDialogOpen(true);
              } else if (status === "cancelled") {
                // User cancelled - no error needed
                console.log("Payment cancelled by user");
              } else {
                setPaymentError(`Payment error: ${status}`);
                setErrorDialogOpen(true);
              }
              
              setPaymentInProgress(false);
            }
          );
        } else {
          // Fallback for old versions of Telegram WebApp
          window.open(invoiceLink, '_blank');
          setPaymentError("Payment window opened in new tab. After payment, please refresh this page.");
          setErrorDialogOpen(true);
          setPaymentInProgress(false);
        }
      } else {
        // Fallback for development or when Telegram WebApp is not available
        window.open(invoiceLink, '_blank');
        setPaymentError("Payment window opened in new tab. After payment, please refresh this page.");
        setErrorDialogOpen(true);
        setPaymentInProgress(false);
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      setPaymentError(error instanceof Error ? error.message : "Payment initialization failed");
      setErrorDialogOpen(true);
      setPaymentInProgress(false);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading premium information...</div>;
  }

  const isPremium = premiumStatus?.is_active ?? false;
  const currentTier = premiumStatus?.premium_tier ?? 0;
  const maxTier = premiumTiers.length > 0 ? Math.max(...premiumTiers.map(t => t.tier)) : 3;
  const nextTier = currentTier < maxTier ? currentTier + 1 : null;
  const upcomingFeatures = nextTier ? premiumFeatures.filter(f => f.tier === nextTier) : [];

  return (
    <>
      <div className="space-y-6">
        {/* Status Banner */}
        <div className="text-center">
          {isPremium ? (
            <>
              <Badge variant="default" className="bg-yellow-400 text-black px-3 py-1 text-sm">Active Premium Subscription</Badge>
              <h2 className="text-xl font-bold mt-4 mb-2">{TIER_LABELS[currentTier]} Plan</h2>
              <p className="text-sm text-muted-foreground flex justify-center items-center gap-1">
                <Calendar className="h-4 w-4" />
                Expires: {premiumStatus?.expires_at ? new Date(premiumStatus.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Never"}
              </p>
            </>
          ) : (
            <>
              <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Upgrade to Premium</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Get access to exclusive features to customize your business card and stand out from the crowd.
              </p>
            </>
          )}
        </div>

        {/* Next Tier Benefits */}
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

        {/* Tier Cards */}
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
                    <Badge variant={isCurrent ? "default" : "outline"}>
                      {isCurrent ? "Current" : `${tier.price} Stars`}
                    </Badge>
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
                      ))}
                  </div>
                </CardContent>

                <CardFooter>
                  {isPremium ? (
                    isCurrent ? (
                      <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                    ) : canUpgrade ? (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribeClick(tier.tier)}
                        disabled={subscribing || paymentInProgress}
                      >
                        Upgrade for {tier.price} Stars
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>Higher Tier</Button>
                    )
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribeClick(tier.tier)}
                      disabled={subscribing || paymentInProgress}
                    >
                      Subscribe for {tier.price} Stars
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Simple Modal for Confirmation */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Confirm Purchase</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedTier !== null
                ? `Purchase ${TIER_LABELS[selectedTier]} Plan for ${premiumTiers.find(t => t.tier === selectedTier)?.price} Stars?`
                : ""}
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={handleConfirmPurchase} disabled={subscribing}>
                Confirm
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Modal for Errors */}
      {errorDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Payment Issue</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setErrorDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {paymentError}
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setErrorDialogOpen(false)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}