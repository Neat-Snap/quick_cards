"use client";

import { getInitData } from './telegram';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    
    if (!initData) {
      return { 
        success: false, 
        error: 'No Telegram init data available. Are you running outside of Telegram?'
      };
    }
    
    const response = await fetch(`${API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Authentication failed',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error validating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Add more API functions here as needed
export async function updateUserProfile(userId: number, profileData: Partial<User>): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update profile',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export type { User }; 