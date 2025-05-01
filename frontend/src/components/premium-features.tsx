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
  X,
  Zap,
  ShoppingCart,
  CreditCard,
  AlertCircle,
  Loader2  
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
  PremiumStatus, 
  getPremiumStatus,
  generatePaymentLink
} from "@/lib/api";

// Single Premium Tier
const PREMIUM_TIER = {
  tier: 1,
  name: "Premium",
  price: 1,
  description: "All premium features",
  features: [
    "Custom Background Image",
    "Custom Badge",
    "Skills",
    "Extended Projects",
    "Animated Elements",
    "Custom Links",
    "Verified Badge",
    "Video Support"
  ]
};

interface PremiumFeaturesProps {
  user: User | null;
  onSubscribed?: () => void;
}

export function PremiumFeatures({ user, onSubscribed }: PremiumFeaturesProps) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // All premium features with their icons
  const premiumFeatures = [
    { name: "Custom Background Image", description: "Upload your own background image for your card", icon: ImageIcon },
    { name: "Custom Badge", description: "Add a special badge next to your name", icon: BadgeCheck },
    { name: "Skills", description: "Add and display your skills with custom images", icon: Code },
    { name: "Extended Projects", description: "Add up to 5 projects to your profile (up from 3)", icon: Briefcase },
    { name: "Animated Elements", description: "Add beautiful animations to your card", icon: Sparkles },
    { name: "Custom Links", description: "Add external links to your profile", icon: BadgeCheck },
    { name: "Verified Badge", description: "Show a verified badge on your card", icon: BadgeCheck },
    { name: "Video Support", description: "Add video presentations to your card", icon: ImageIcon }
  ];

  // Load status from backend
  const loadPremiumData = async () => {
    setLoading(true);
    try {
      // Get current premium status
      const status = await getPremiumStatus();
      setPremiumStatus(status);
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

  // When user presses subscribe button, open confirmation dialog
  const handleSubscribeClick = () => {
    setDialogOpen(true);
  };

  // Check payment status with backend API
  const checkPaymentStatus = async (user_id: string | number): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/premium/check_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, tier: PREMIUM_TIER.tier })
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
    if (!user) return;
    
    setSubscribing(true);
    setPaymentInProgress(true);
    setPaymentError(null);
    
    try {
      // Generate payment link
      const response = await generatePaymentLink(PREMIUM_TIER.tier);
      
      const invoiceLink = response.payment_url as string;
      
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
                  const verified = await checkPaymentStatus(user.id);
                  
                  if (verified) {
                    // Refresh premium status
                    await loadPremiumData();
                    toast({ 
                      title: "Payment Successful", 
                      description: `You've been upgraded to Premium`, 
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
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading premium information...</p>
      </div>
    );
  }

  const isPremium = premiumStatus?.is_active ?? false;

  return (
    <>
      {/* Current Premium Status */}
      <div className="space-y-6">
        <div className="text-center rounded-lg border p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
          {isPremium ? (
            <>
              <div className="inline-flex gap-2 items-center bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 rounded-full px-4 py-1 mb-4">
                <Crown className="h-4 w-4" />
                <span className="font-semibold">Premium Active</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Premium Plan</h2>
              <p className="text-sm text-muted-foreground flex justify-center items-center gap-1 mb-4">
                <Calendar className="h-4 w-4" />
                Expires: {premiumStatus?.expires_at ? new Date(premiumStatus.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Never"}
              </p>
              
              {/* Current benefits */}
              <div className="mt-4 bg-background/50 rounded-md p-4 max-w-md mx-auto">
                <h3 className="font-medium mb-2">Your Premium Benefits:</h3>
                <div className="grid grid-cols-1 gap-2">
                  {premiumFeatures.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">{feature.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Upgrade to Premium</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Get access to exclusive features to customize your business card and stand out from the crowd.
              </p>
              <Button 
                className="mx-auto flex items-center gap-2" 
                size="lg"
                onClick={() => window.scrollTo({ top: document.getElementById('premium-features')?.offsetTop || 0, behavior: 'smooth' })}
              >
                <CreditCard className="h-4 w-4" />
                View Premium Features
              </Button>
            </>
          )}
        </div>

        {/* Premium Features Section */}
        {!isPremium && (
          <div id="premium-features" className="pt-6">
            <h2 className="text-xl font-bold text-center mb-6">Premium Features</h2>
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Premium Plan</CardTitle>
                </div>
                <CardDescription>{PREMIUM_TIER.description}</CardDescription>
                <div className="mt-4 text-3xl font-bold">
                  {PREMIUM_TIER.price} <span className="text-base font-normal text-muted-foreground">Stars</span>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium mb-2">All premium features include:</p>
                  {premiumFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                        {React.createElement(feature.icon, { className: "h-5 w-5 text-purple-600 dark:text-purple-400" })}
                      </div>
                      <div className="pt-1">
                        <span className="text-sm font-medium">{feature.name}</span>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6">
                <Button
                  className="w-full"
                  onClick={handleSubscribeClick}
                  disabled={subscribing || paymentInProgress}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Payment Process Indicator */}
        {paymentInProgress && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Please complete the payment in Telegram.
              </p>
              <p className="text-xs text-muted-foreground">
                Don't close this window until the payment is complete.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Simple Modal for Confirmation */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
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
            
            <div className="mb-6">
              <div className="bg-muted p-4 rounded-md mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Premium Plan</span>
                  <span className="font-bold">{PREMIUM_TIER.price} Stars</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {PREMIUM_TIER.description}
                </p>
              </div>
              
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Payment will be processed through Telegram. You'll be redirected to complete your purchase.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={subscribing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmPurchase} 
                disabled={subscribing}
                className="gap-2"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Modal for Errors */}
      {errorDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Payment Issue
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setErrorDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm mb-4">
                {paymentError}
              </p>
              
              <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
                If you've been charged but don't see your premium features, please contact support with your payment ID.
              </div>
            </div>
            
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