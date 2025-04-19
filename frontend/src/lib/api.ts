"use client";

import { getInitData } from './telegram';
import { DEBUG_TELEGRAM } from './dev-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';

// Log the configured API URL on load
console.log('API URL configured as:', API_URL);

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
    
    const validateUrl = `${API_URL}/validate`;
    console.log('[API] Making validation request to:', validateUrl);
    
    const response = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify({ initData }),
    });
    
    console.log('[API] Validation response status:', response.status);
    
    if (DEBUG_TELEGRAM) {
      // Log a few important headers instead of all headers
      console.log('[API] Response content-type:', response.headers.get('content-type'));
      console.log('[API] Response access-control-allow-origin:', response.headers.get('access-control-allow-origin'));
    }
    
    const data = await response.json().catch(e => {
      console.error('[API] Failed to parse JSON response:', e);
      return { success: false, error: 'Invalid response format' };
    });
    
    console.log('[API] Validation response data:', data);
    
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
    const updateUrl = `${API_URL}/users/${userId}`;
    
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json().catch(e => {
      console.error('[API] Failed to parse JSON response:', e);
      return { success: false, error: 'Invalid response format' };
    });
    
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