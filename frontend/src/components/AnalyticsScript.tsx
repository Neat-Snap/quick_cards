"use client";

import Script from "next/script";


export default function AnalyticsScript() {
    return (
      <Script
        src="https://tganalytics.xyz/index.js"
        strategy="afterInteractive"
        async
        onLoad={() => {
          if (window.telegramAnalytics) {
            window.telegramAnalytics.init({
              token: "eyJhcHBfbmFtZSI6InF1aWNrX2JvdCIsImFwcF91cmwiOiJodHRwczovL3QubWUvcXVpY2tfYnVzaW5lc3NfYm90IiwiYXBwX2RvbWFpbiI6Imh0dHBzOi8vZmFjZS1jYXJkcy5ydSJ9!IC5m7q2ibufrjo1zcAL71+IWPOAOuLrHT05HBw048QE=", // Replace with your actual token
              appName: "quick_bot",
            });
          }
        }}
      />
    );
  }