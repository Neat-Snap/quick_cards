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
    const initData = getInitData();
    console.log('[API] Validating user with initData length:', initData?.length || 0);
    
    if (!initData) {
      console.error('[API] No initData available for validation');
      return { 
        success: false, 
        error: 'No Telegram init data available. Are you running outside of Telegram?'
      };
    }
    
    console.log('[API] Making validation request to:', `${API_URL}/validate`);
    
    const response = await fetch(`${API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });
    
    console.log('[API] Validation response status:', response.status);
    
    const data = await response.json();
    console.log('[API] Validation response data:', data.success ? 'Success' : 'Failed', data.error || '');
    
    if (!response.ok) {
      console.error('[API] Validation failed:', data.error || response.statusText);
      return {
        success: false,
        error: data.error || `Authentication failed with status ${response.status}`,
      };
    }
    
    console.log('[API] User validated successfully');
    return data;
  } catch (error) {
    console.error('[API] Error during validation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during validation',
    };
  }
}

// Add more API functions here as needed
export async function updateUserProfile(userId: number, profileData: Partial<User>): Promise<ApiResponse<User>> {
  try {
    console.log('[API] Updating user profile for user ID:', userId);
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API] Profile update failed:', data.error || response.statusText);
      return {
        success: false,
        error: data.error || 'Failed to update profile',
      };
    }
    
    console.log('[API] Profile updated successfully');
    return data;
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during profile update',
    };
  }
}

export type { User }; 