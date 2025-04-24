"use client";

import { getInitData } from './telegram';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';

// User interface
export interface User {
  id: number | string;
  telegram_id?: string;
  username: string;
  first_name: string;
  last_name?: string;
  name?: string;
  avatar?: string;
  background_color?: string;
  background_type?: string;
  background_value?: string;
  description?: string;
  badge?: string;
  is_premium?: boolean;
  premium_tier?: number;
}

// Contact interface
export interface Contact {
  id: number;
  user_id: number | string;
  contact_type: string;
  value: string;
  is_public: boolean;
}

// Project interface
export interface Project {
  id: number;
  user_id: number | string;
  name: string;
  description: string;
  avatar_url: string;
  role: string;
  url: string;
}

// Skill interface
export interface Skill {
  id: number;
  name: string;
  description: string;
  image_url: string;
}

// Custom Link interface
export interface CustomLink {
  id: number;
  user_id: number | string;
  title: string;
  url: string;
}

// Premium tier interface
export interface PremiumTier {
  tier: number;
  name: string;
  price: number;
  description: string;
  features: string[];
}

// Premium status interface
export interface PremiumStatus {
  premium_tier: number;
  tier_name: string;
  expires_at: string | null;
  is_active: boolean;
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  user?: T;
  token?: string;
  is_new_user?: boolean;
  valid?: boolean;
  payment_url?: string;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    // Ensure the endpoint starts with a slash if it doesn't already
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construct the full URL using the base API_URL
    const fullUrl = `${API_URL}${normalizedEndpoint}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('authToken');
    console.log("Using auth token:", token ? "Token exists" : "No token");
    
    // Ensure headers are properly set with authorization if token exists
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add Authorization header if token exists
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    };
    
    console.log("Request options:", {
      method: requestOptions.method,
      hasAuthHeader: token ? true : false
    });
    
    const response = await fetch(fullUrl, requestOptions);
    console.log("Response status:", response.status, response.statusText);
    
    // For 401 errors, you might want to clear the token and redirect to login
    if (response.status === 401) {
      console.error("Unauthorized request. Token may be invalid or expired.");
      // Clear the invalid token
      localStorage.removeItem('authToken');
    }
    
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

// Auth functions
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
  
  try {
    // Use the correct endpoint path for initialization with Telegram data
    const response = await apiRequest<User>('/v1/auth/init', {
      method: 'POST',
      body: JSON.stringify({ initData }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Telegram-Init-Data': initData, // Add this header for additional security
      }
    });
    
    // Store token if available
    if (response.success && response.token) {
      console.log("Received token, storing in localStorage");
      localStorage.setItem('authToken', response.token);
      
      // Test that the token is properly stored
      const storedToken = localStorage.getItem('authToken');
      console.log("Token successfully stored:", !!storedToken);
    } else {
      console.warn("No token received in auth response");
    }
    
    console.log("Auth response received:", { 
      success: response.success, 
      hasToken: !!response.token,
      user: response.user ? "User data present" : "No user data" 
    });
    
    return response;
  } catch (error) {
    console.error("Error during validateUser:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during user validation'
    };
  }
}

// User profile functions
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest<User>('/v1/users/me');
}

export async function updateUserProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
  return apiRequest<User>('/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}

// Contact functions
export async function getUserContacts(): Promise<Contact[]> {
  const response = await apiRequest<any>('/v1/users/me');
  return response.success && response.user ? response.user.contacts || [] : [];
}

export async function createContact(contact: Omit<Contact, 'id' | 'user_id'>): Promise<ApiResponse<Contact>> {
  return apiRequest<Contact>('/v1/users/me/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  });
}

export async function deleteContact(contactId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/v1/users/me/contacts/${contactId}`, {
    method: 'DELETE',
  });
}

// Project functions
export async function getUserProjects(): Promise<Project[]> {
  const response = await apiRequest<any>('/v1/users/me');
  return response.success && response.user ? response.user.projects || [] : [];
}

export async function createProject(project: Omit<Project, 'id' | 'user_id'>): Promise<ApiResponse<Project>> {
  return apiRequest<Project>('/v1/users/me/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export async function updateProject(projectId: number, project: Partial<Project>): Promise<ApiResponse<Project>> {
  return apiRequest<Project>(`/v1/users/me/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(project),
  });
}

export async function deleteProject(projectId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/v1/users/me/projects/${projectId}`, {
    method: 'DELETE',
  });
}

// Skills functions
export async function getUserSkills(): Promise<Skill[]> {
  const response = await apiRequest<any>('/v1/users/me');
  return response.success && response.user ? response.user.skills || [] : [];
}

export async function searchSkills(query: string): Promise<Skill[]> {
  const response = await apiRequest<any>(`/v1/skills?q=${encodeURIComponent(query)}`);
  // Fix: Return the array from the response, not the response object itself
  return response.success && Array.isArray(response) ? response : [];
}


export async function addSkillToUser(skillId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/v1/users/me/skills/${skillId}`, {
    method: 'POST',
  });
}

export async function removeSkillFromUser(skillId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/v1/users/me/skills/${skillId}`, {
    method: 'DELETE',
  });
}

// Custom links functions
export async function getUserLinks(): Promise<CustomLink[]> {
  const response = await apiRequest<any>('/v1/users/me');
  return response.success && response.user ? response.user.custom_links || [] : [];
}

export async function createCustomLink(link: Omit<CustomLink, 'id' | 'user_id'>): Promise<ApiResponse<CustomLink>> {
  return apiRequest<CustomLink>('/v1/users/me/links', {
    method: 'POST',
    body: JSON.stringify(link),
  });
}

export async function deleteCustomLink(linkId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/v1/users/me/links/${linkId}`, {
    method: 'DELETE',
  });
}

// Premium functions
export async function getPremiumStatus(): Promise<PremiumStatus> {
  const response = await apiRequest<PremiumStatus>('/v1/premium/status');
  if (response.success && response.user) {
    return response.user as PremiumStatus;
  }
  // Default value if the request fails or returns no data
  return { premium_tier: 0, tier_name: 'Free', expires_at: null, is_active: false };
}

export async function getPremiumTiers(): Promise<PremiumTier[]> {
  const response = await apiRequest<any>('/v1/premium/tiers');
  if (response.success) {
    // First, check if the response contains an array directly
    if (Array.isArray(response.user)) {
      return response.user as PremiumTier[];
    }
    
    // Check for nested data in the response
    const data = response.user as any;
    if (data) {
      // If there's a data property that's an array
      if (data.data && Array.isArray(data.data)) {
        return data.data as PremiumTier[];
      }
      
      // If there's a tiers property that's an array
      if (data.tiers && Array.isArray(data.tiers)) {
        return data.tiers as PremiumTier[];
      }
    }
  }
  return [];
}

export async function subscribeToPremium(tier: number, paymentMethod: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('/v1/premium/subscribe', {
    method: 'POST',
    body: JSON.stringify({ tier, payment_method: paymentMethod }),
  });
}

// User search functions
export async function searchUsers(query: string, skillFilter?: string, limit: number = 10, offset: number = 0): Promise<User[]> {
  let endpoint = `/v1/users?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
  if (skillFilter) {
    endpoint += `&skill=${encodeURIComponent(skillFilter)}`;
  }
  
  const response = await apiRequest<any>(endpoint);
  if (response.success) {
    // If the response itself is the users array
    if (Array.isArray(response.user)) {
      return response.user as User[];
    }
    
    // Check for nested data in the response
    const data = response.user as any;
    if (data) {
      // If there's a data property that's an array
      if (data.data && Array.isArray(data.data)) {
        return data.data as User[];
      }
      
      // If there's a users property that's an array
      if (data.users && Array.isArray(data.users)) {
        return data.users as User[];
      }
    }
  }
  return [];
}

export async function getUserById(userId: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/v1/users/${userId}`);
}