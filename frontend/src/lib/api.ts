"use client";

import { getInitData } from './telegram';

// Update API URL to match your actual backend endpoint pattern
// Remove /api if the base URL already includes it
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

// Helper function to make API requests with proper error handling
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    // Ensure the URL starts with a slash if it doesn't already
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    // Construct the full URL using the base API_URL
    // Remove duplicate '/api' if it's already in the API_URL
    const fullUrl = `${API_URL}${normalizedUrl.replace(/^\/api/, '')}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    // Ensure CORS mode is properly set
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };
    
    const response = await fetch(fullUrl, requestOptions);
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
    
    // For network errors or non-JSON responses
    if (!response.ok) {
      // Try to parse the error response as JSON
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || `Request failed with status ${response.status}`
        };
      } catch (e) {
        // If JSON parsing fails, return a generic error
        return {
          success: false,
          error: `Request failed with status ${response.status}`
        };
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request error:", error);
    
    // Special handling for JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      return {
        success: false,
        error: 'Server returned invalid JSON. The API endpoint may be incorrect or returning an error page.'
      };
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Network error. The server may be offline or unreachable.'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function validateUser(): Promise<ApiResponse<User>> {
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
  
  console.log("Making authentication request to: /v1/auth/init");
  
  // Use the correct endpoint path for initialization with Telegram data
  return apiRequest<User>('/v1/auth/init', {
    method: 'POST',
    body: JSON.stringify({ initData }),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
}

// Add more API functions here as needed
export async function updateUserProfile(userId: number, profileData: Partial<User>): Promise<ApiResponse<User>> {
  console.log("Updating user profile for user ID:", userId);
  
  // Use direct relative URL to leverage Next.js rewrites
  return apiRequest<User>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}

export type { User }; 