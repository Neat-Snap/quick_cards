"use client";

import { getInitData } from './telegram';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';

interface User {
  id: number;
  telegram_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string;
  background_color: string;
  description: string;
  badge: string;
  is_premium: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  user?: T;
}

export async function validateUser(): Promise<ApiResponse<User>> {
  try {
    console.log("validateUser called - API URL:", API_URL);
    const initData = getInitData();
    console.log("InitData retrieved, length:", initData?.length || 0);
    
    if (!initData) {
      console.error("No initData available for validation");
      return { 
        success: false, 
        error: 'No Telegram init data available. Are you running outside of Telegram?'
      };
    }
    
    console.log(`Making validation request to: ${API_URL}/validate`);
    console.log("Request payload:", { initData: initData.substring(0, 20) + "..." });
    
    const response = await fetch(`${API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });
    
    console.log("Response status:", response.status, response.statusText);
    
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data).substring(0, 100) + "...");
    
    if (!response.ok) {
      console.error("Validation failed:", data.error || response.statusText);
      return {
        success: false,
        error: data.error || `Authentication failed with status ${response.status}`,
      };
    }
    
    console.log("User validated successfully");
    return data;
  } catch (error) {
    console.error("Error during validation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during validation',
    };
  }
}

// Add more API functions here as needed
export async function updateUserProfile(userId: number, profileData: Partial<User>): Promise<ApiResponse<User>> {
  try {
    console.log("Updating user profile for user ID:", userId);
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Profile update failed:", data.error || response.statusText);
      return {
        success: false,
        error: data.error || 'Failed to update profile',
      };
    }
    
    console.log("Profile updated successfully");
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during profile update',
    };
  }
}

export type { User }; 