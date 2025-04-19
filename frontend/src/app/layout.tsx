import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";

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
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        
        {/* Load as a regular script tag for increased compatibility */}
        <Script
          id="telegram-webapp-script"
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Telegram WebApp script loaded successfully");
          }}
          onError={() => {
            console.error("Failed to load Telegram WebApp script");
          }}
        />
      </body>
    </html>
  );
} 