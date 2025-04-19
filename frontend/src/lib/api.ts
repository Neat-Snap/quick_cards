"use client";

import { getInitData } from './telegram';

// Update API URL to match your actual backend endpoint pattern
// Remove /api if the base URL already includes it
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru';

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
    
    // Construct the URL to match your server's endpoint format
    const validateUrl = `${API_URL}/validate`;
    console.log(`Making validation request to: ${validateUrl}`);
    console.log("Request payload:", { initData: initData.substring(0, 20) + "..." });
    
    const response = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });
    
    console.log("Response status:", response.status, response.statusText);
    
    // Check if the response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error("Received HTML instead of JSON. Server likely returned an error page.");
      return {
        success: false,
        error: `Server returned HTML instead of JSON (Status: ${response.status}). Backend endpoint may be incorrect.`
      };
    }
    
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
    // Special handling for JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      return {
        success: false,
        error: 'Server returned invalid JSON. The API endpoint may be incorrect or returning an error page.'
      };
    }
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
    
    // Check for HTML response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error("Received HTML instead of JSON in profile update");
      return {
        success: false,
        error: 'Server returned HTML instead of JSON. API endpoint may be incorrect.'
      };
    }
    
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