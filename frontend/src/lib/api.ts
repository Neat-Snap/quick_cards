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
  avatar_url?: string;
  background_color?: string;
  background_type?: string;
  background_value?: string;
  description?: string;
  badge?: string;
  is_premium?: boolean;
  premium_tier?: number;
  contacts?: Contact[];
  projects?: Project[];
  skills?: Skill[];
  custom_links?: CustomLink[];
}

// Contact interface
export interface Contact {
  id: number;
  user_id: number | string;
  type: string;
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

// Helper function to make API requests with proper error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    // Ensure the endpoint starts with a slash if it doesn't already
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construct the full URL using the base API_URL
    const fullUrl = `${API_URL}${normalizedEndpoint}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    // Add auth token if available - special endpoints like /auth/init shouldn't use this
    const token = localStorage.getItem('authToken');
    
    // Create a proper Record for headers to avoid TypeScript issues
    const headersRecord: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Copy any existing headers from options
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.keys(existingHeaders).forEach(key => {
        headersRecord[key] = existingHeaders[key];
      });
    }
    
    // Add token to headers if available and not already set in options
    if (token && !endpoint.includes('/auth/init')) {
      console.log("Adding JWT token to request headers");
      headersRecord['Authorization'] = `Bearer ${token}`;
    }
    
    // Ensure headers are properly set
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      mode: 'cors',
      headers: headersRecord
    };
    
    // Log the headers being sent (but mask the token for security)
    const logHeaders = {...headersRecord};
    if (logHeaders['Authorization']) {
      logHeaders['Authorization'] = logHeaders['Authorization'].substring(0, 15) + '...';
    }
    console.log("Request headers:", logHeaders);
    
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
    
    // Handle 401 Unauthorized errors specially
    if (response.status === 401) {
      console.error("401 Unauthorized: Authentication token may be invalid or expired");
      
      // If we have a token but got 401, it might be expired - try to clear it
      if (token) {
        console.log("Clearing potentially expired token");
        localStorage.removeItem('authToken');
      }
      
      return {
        success: false,
        error: "Authentication failed. Please restart the application."
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
    // Make a direct fetch call to ensure no token is sent for this initial request
    const response = await fetch(`${API_URL}/v1/auth/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Telegram-Init-Data': initData,
      },
      body: JSON.stringify({ initData }),
    });
    
    // Parse the response
    const data = await response.json();
    console.log("Auth response received:", data);
    
    // Store token if available
    if (data.success && data.token) {
      console.log("JWT token received, storing in localStorage");
      localStorage.setItem('authToken', data.token);
    } else {
      console.error("No token received from the server");
    }
    
    return data;
  } catch (error) {
    console.error("Error during validateUser:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during user validation'
    };
  }
}

export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const token = localStorage.getItem('authToken');
    
    // Use fetch directly for multipart/form-data
    const response = await fetch(`${API_URL}/v1/users/me/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log("Avatar upload response:", data);
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Upload failed with status ${response.status}`
      };
    }
    
    return data;
  } catch (error) {
    console.error("Avatar upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during upload'
    };
  }
}

// User profile functions
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  // Add a cache-busting query parameter to force a fresh request
  const cacheBuster = new Date().getTime();
  try {
    const response = await apiRequest<any>(`/v1/users/me?_=${cacheBuster}`);
    
    // Check if the response contains user data directly (not wrapped in a 'user' property)
    if (response && !response.user) {
      // This means the API returned the user object directly at the root level
      // Convert it to the expected ApiResponse format
      return {
        success: true,
        user: response as unknown as User  // Use unknown as an intermediate step for type safety
      };
    }
    
    return response;
  } catch (error) {
    console.error("Error getting current user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error fetching user data"
    };
  }
}

export async function updateUserProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
  console.log("Updating user profile with data:", profileData);
  try {
    const response = await apiRequest<User>('/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    console.log("Profile update response:", response);

    // Поскольку сервер возвращает напрямую объект пользователя,
    // а не обертку { success: true, user: {...} },
    // мы должны обернуть ответ вручную в ApiResponse
    if (response && !('success' in response)) {
      return {
        success: true,
        user: response as unknown as User
      };
    }

    return response;
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during profile update"
    };
  }
}


// Contact functions
// Update this function in api.ts
export async function getUserContacts(): Promise<Contact[]> {
  try {
    // Try to get contacts directly from the dedicated endpoint
    const response = await apiRequest<any>('/v1/users/me/contacts');
    
    // Log what we received to help with debugging
    console.log("Contacts response:", response);
    
    // Check if response is an array directly (the backend might return just the array)
    if (Array.isArray(response)) {
      return response;
    }
    
    // Check if response has contacts property
    if (response && response.user && response.user.contacts && Array.isArray(response.user.contacts)) {
      return response.user.contacts;
    }
    
    // Check if user property contains contacts
    if (response && response.user && response.user.contacts && Array.isArray(response.user.contacts)) {
      return response.user.contacts;
    }
    
    // If data structure doesn't match any expected format, get from the user endpoint
    const userResponse = await apiRequest<any>('/v1/users/me');
    console.log("User response for contacts:", userResponse);
    
    if (userResponse && userResponse.user && userResponse.user.contacts && Array.isArray(userResponse.user.contacts)) {
      return userResponse.user.contacts;
    }
    
    if (userResponse && userResponse.user && userResponse.user.contacts && Array.isArray(userResponse.user.contacts)) {
      return userResponse.user.contacts;
    }
    
    // If still nothing, return empty array
    return [];
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
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

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to check if a string is a data URL
export function isDataUrl(url: string): boolean {
  return !!url && url.startsWith('data:');
}

export async function updateContact(contactId: number, contact: Partial<Contact>): Promise<ApiResponse<Contact>> {
  return apiRequest<Contact>(`/v1/users/me/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify(contact),
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
// Premium functions
export async function getPremiumStatus(): Promise<PremiumStatus> {
  try {
    const response = await apiRequest<any>('/v1/premium/status');
    console.log("Premium status response:", response);
    
    // If the response is successful and contains user data
    if (response.success && response.user) {
      return response.user as PremiumStatus;
    }
    
    // Handle case where response might contain data directly
    if (response && !response.success && !response.user) {
      // Check if the response itself is the premium status
      if (response.premium_tier !== undefined) {
        // Ensure is_active is set correctly based on premium_tier
        const premiumTier = response.premium_tier;
        return {
          ...response,
          is_active: premiumTier > 0
        };
      }
    }
    
    // Default value if the request fails or returns no data
    return { premium_tier: 0, tier_name: 'Free', expires_at: null, is_active: false };
  } catch (error) {
    console.error("Error fetching premium status:", error);
    return { premium_tier: 0, tier_name: 'Free', expires_at: null, is_active: false };
  }
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