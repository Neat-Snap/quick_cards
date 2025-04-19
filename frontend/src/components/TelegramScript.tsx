"use client";

import Script from "next/script";

export default function TelegramScript() {
  return (
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
  );
} 