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

declare global {
  interface Window {
    telegramAnalytics?: {
      init: (options: { token: string; appName: string }) => void;
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
        <link 
          rel="preload" 
          href="https://telegram.org/js/telegram-web-app.js" 
          as="script"
        />
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(101680351, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/101680351" style={{position: "absolute", left: "-9999px"}} alt="" />
          </div>
        </noscript>
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
        <AnalyticsScript />
      </body>
    </html>
  );
}