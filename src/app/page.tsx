"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessCardPreview } from "@/components/business-card-preview";
import { BusinessCardForm } from "@/components/business-card-form";
import { PremiumFeatures } from "@/components/premium-features";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center mb-8">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
            Business Card Creator
          </h1>
          <p className="text-xl text-muted-foreground text-center">
            Create your professional digital business card
          </p>
        </div>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Card</CardTitle>
                <CardDescription>
                  Fill in your details to personalize your business card.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessCardForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  This is how your business card will look.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6">
                <BusinessCardPreview />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline">Save Draft</Button>
                <Button>Publish Card</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="premium">
            <Card>
              <CardHeader>
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>
                  Unlock premium features with Telegram Stars.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PremiumFeatures />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 