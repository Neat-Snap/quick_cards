import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import TelegramScript from "@/components/TelegramScript";
import AnalyticsScript from "@/components/AnalyticsScript"
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
        {/* Load the script in head without event handlers */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
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
        
        {/* Use the Client Component for scripts with event handlers */}
        <TelegramScript />
        <AnalyticsScript />
      </body>
    </html>
  );
}