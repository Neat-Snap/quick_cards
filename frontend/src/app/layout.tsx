import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import TelegramScript from "@/components/TelegramScript";
import { Toaster } from "@/components/ui/use-toast";
import { LoadingProvider } from "@/context/LoadingContext";
import Script from "next/script";

// Extend the Window interface to include telegramAnalytics
declare global {
  interface Window {
    telegramAnalytics?: {
      init: (options: { token: string; appName: string }) => void;
      // Add other methods if needed
    };
  }
}


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Business Card Creator",
  description: "Create personalized business cards for Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload the Telegram WebApp script */}
        <link 
          rel="preload" 
          href="https://telegram.org/js/telegram-web-app.js" 
          as="script"
        />
        {/* Load the script directly in head for immediate access */}
        <script 
          src="https://telegram.org/js/telegram-web-app.js" 
          crossOrigin="anonymous"
        />
        {/* Telegram Analytics SDK via CDN */}
        <Script
          src="https://tganalytics.xyz/index.js"
          strategy="afterInteractive"
          async
          onLoad={() => {
            if (window.telegramAnalytics) {
              window.telegramAnalytics.init({
                token: 'eyJhcHBfbmFtZSI6InF1aWNrX2JvdCIsImFwcF91cmwiOiJodHRwczovL3QubWUvcXVpY2tfYnVzaW5lc3NfYm90IiwiYXBwX2RvbWFpbiI6Imh0dHBzOi8vZmFjZS1jYXJkcy5ydSJ9!IC5m7q2ibufrjo1zcAL71+IWPOAOuLrHT05HBw048QE=', // Replace with your token
                appName: 'quick_bot',
              });
            }
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LoadingProvider>
              {children}
              <Toaster />
            </LoadingProvider>
          </AuthProvider>
        </ThemeProvider>
        
        <TelegramScript />
      </body>
    </html>
  );
}