"use client";

import { useState, useEffect } from 'react';
import { isTelegramWebApp, getTelegramUser, getInitData } from '@/lib/telegram';
import { Button } from '@/components/ui/button';

export function TelegramDebug() {
  const [visible, setVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    // Gather debug information
    const telegramUser = getTelegramUser();
    const initData = getInitData();
    
    setDebugInfo({
      isTelegramWebApp: isTelegramWebApp(),
      hasUser: Boolean(telegramUser),
      userId: telegramUser?.id,
      userName: telegramUser?.first_name,
      initDataLength: initData?.length || 0,
      userAgent: navigator.userAgent,
      url: window.location.href,
      currentTime: new Date().toISOString(),
      isDevelopment: process.env.NODE_ENV === 'development',
    });
  }, []);
  
  if (!visible) {
    return (
      <div className="fixed bottom-20 right-2 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setVisible(true)}
        >
          Debug
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-background/90 z-50 p-4 overflow-auto">
      <div className="max-w-lg mx-auto bg-card p-4 rounded-lg shadow-lg border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Telegram Debug Info</h2>
          <Button variant="outline" size="sm" onClick={() => setVisible(false)}>
            Close
          </Button>
        </div>
        
        <div className="space-y-2 overflow-auto max-h-[80vh]">
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key} className="grid grid-cols-2 gap-2 border-b pb-2">
              <span className="font-medium">{key}:</span>
              <span className="break-all">{String(value)}</span>
            </div>
          ))}
          
          <div className="mt-4">
            <Button 
              onClick={() => {
                console.log('Debug info:', debugInfo);
                alert('Debug info copied to console');
              }}
              className="w-full"
            >
              Log to Console
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 