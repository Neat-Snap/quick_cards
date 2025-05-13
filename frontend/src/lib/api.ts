"use client";

import { getInitData } from './telegram';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';

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

export interface Contact {
  id: number;
  user_id: number | string;
  type: string;
  value: string;
  is_public: boolean;
}

export interface Project {
  id: number;
  user_id: number | string;
  name: string;
  description: string;
  avatar_url: string;
  role: string;
  url: string;
}

export interface Skill {
  id: number | null;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  is_predefined?: boolean;
  score?: number;
}

export interface CustomLink {
  id: number;
  user_id: number | string;
  title: string;
  url: string;
}

export interface PremiumTier {
  tier: number;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface PremiumStatus {
  premium_tier: number;
  tier_name: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  user?: T;
  skill?: Skill;
  skills?: Skill[];
  token?: string;
  is_new_user?: boolean;
  valid?: boolean;
  payment_url?: string;
  message?: string;
  image_url?: string;
  is_new?: boolean;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const fullUrl = `${API_URL}${normalizedEndpoint}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    const token = localStorage.getItem('authToken');
    
    const headersRecord: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.keys(existingHeaders).forEach(key => {
        headersRecord[key] = existingHeaders[key];
      });
    }
    
    if (token && !endpoint.includes('/auth/init')) {
      console.log("Adding JWT token to request headers");
      headersRecord['Authorization'] = `Bearer ${token}`;
    }
    
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      mode: 'cors',
      headers: headersRecord
    };
    
    const logHeaders = {...headersRecord};
    if (logHeaders['Authorization']) {
      logHeaders['Authorization'] = logHeaders['Authorization'].substring(0, 15) + '...';
    }
    console.log("Request headers:", logHeaders);
    
    const response = await fetch(fullUrl, requestOptions);
    console.log("Response status:", response.status, response.statusText);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error("Received HTML instead of JSON. Server likely returned an error page.");
      return {
        success: false,
        error: `Server returned HTML instead of JSON (Status: ${response.status}). Backend endpoint may be incorrect.`
      };
    }
    
    if (response.status === 401) {
      console.error("401 Unauthorized: Authentication token may be invalid or expired");
      
      if (token) {
        console.log("Clearing potentially expired token");
        localStorage.removeItem('authToken');
      }
      
      return {
        success: false,
        error: "Authentication failed. Please restart the application."
      };
    }
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || `Request failed with status ${response.status}`
        };
      } catch (e) {
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
    
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      return {
        success: false,
        error: 'Server returned invalid JSON. The API endpoint may be incorrect or returning an error page.'
      };
    }
    
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
  
  try {
    const response = await fetch(`${API_URL}/v1/auth/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Telegram-Init-Data': initData,
      },
      body: JSON.stringify({ initData }),
    });
    
    const data = await response.json();
    console.log("Auth response received:", data);
    
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
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const token = localStorage.getItem('authToken');
    
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


export async function uploadStory(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'story.jpg');

  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_URL}/v1/users/me/story`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      credentials: 'include'
    });

    const data = await response.json();
    console.log("Story upload response:", data);

    if (!response.ok) {
      throw new Error(data.error || `Upload failed with status ${response.status}`);
    }

    if (data.avatar_url && typeof data.avatar_url === 'string') {
      return data.avatar_url;
    }
    if (data.url && typeof data.url === 'string') {
      return data.url;
    }
    if (data.file_url && typeof data.file_url === 'string') {
      return data.file_url;
    }
    if (data.image_url && typeof data.image_url === 'string') {
      return data.image_url;
    }

    throw new Error('No image URL returned from server');
  } catch (error) {
    console.error("Story upload error:", error);
    throw error instanceof Error ? error : new Error('Unknown error during upload');
  }
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const cacheBuster = new Date().getTime();
  try {
    const response = await apiRequest<any>(`/v1/users/me?_=${cacheBuster}`);
    
    console.log("getCurrentUser response:", response);
    
    if (response && !response.success && !response.user) {
      return {
        success: true,
        user: response as unknown as User
      };
    }
    
    if (response.success === undefined) {
      const userObj = response as unknown;
      return {
        success: true,
        user: userObj as User
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


export async function getUserContacts(): Promise<Contact[]> {
  try {
    const response = await apiRequest<any>('/v1/users/me/contacts');
    
    console.log("Contacts response:", response);
    
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && response.user && response.user.contacts && Array.isArray(response.user.contacts)) {
      return response.user.contacts;
    }
    
    if (response && response.user && response.user.contacts && Array.isArray(response.user.contacts)) {
      return response.user.contacts;
    }
    
    const userResponse = await apiRequest<any>('/v1/users/me');
    console.log("User response for contacts:", userResponse);
    
    if (userResponse && userResponse.user && userResponse.user.contacts && Array.isArray(userResponse.user.contacts)) {
      return userResponse.user.contacts;
    }
    
    if (userResponse && userResponse.user && userResponse.user.contacts && Array.isArray(userResponse.user.contacts)) {
      return userResponse.user.contacts;
    }
    
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

export function isDataUrl(url: string): boolean {
  return !!url && url.startsWith('data:');
}

export async function updateContact(contactId: number, contact: Partial<Contact>): Promise<ApiResponse<Contact>> {
  return apiRequest<Contact>(`/v1/users/me/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify(contact),
  });
}

export async function getUserProjects(): Promise<Project[]> {
  const response = await apiRequest<Project[]>('/v1/users/me/projects');
  if (Array.isArray(response)) {
    return response;
  }
  if (response && response.success && response.user && Array.isArray((response.user as any).projects)) {
    return (response.user as any).projects;
  }
  if (response && response.success && Array.isArray((response as any).projects)) {
    return (response as any).projects;
  }
  return [];
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

export async function getUserSkills(): Promise<Skill[]> {
  try {
    console.log("Getting user skills from API...");
    const response = await apiRequest<any>('/v1/users/me/skills');
    
    if (Array.isArray(response)) {
      console.log(`Found ${response.length} skills from direct endpoint`);
      return response;
    }
    
    if (response && response.success && response.user) {
      if (response.user.skills && Array.isArray(response.user.skills)) {
        console.log(`Found ${response.user.skills.length} skills in user object`);
        return response.user.skills;
      }
      
      if (Array.isArray(response.user)) {
        console.log(`Found ${response.user.length} skills in user array`);
        return response.user;
      }
    }
    
    console.log("No skills found in direct response, checking full user profile...");
    const userResponse = await apiRequest<any>('/v1/users/me');
    
    if (userResponse && userResponse.success && userResponse.user) {
      if (userResponse.user.skills && Array.isArray(userResponse.user.skills)) {
        console.log(`Found ${userResponse.user.skills.length} skills in full user profile`);
        return userResponse.user.skills;
      }
    }
    
    const userResponseObj = userResponse as any;
    if (userResponseObj && 
        (!userResponseObj.success || userResponseObj.success === undefined) && 
        userResponseObj.skills && 
        Array.isArray(userResponseObj.skills)) {
      
      console.log(`Found ${userResponseObj.skills.length} skills in user response object`);
      return userResponseObj.skills;
    }
    
    console.log("Could not find skills in any expected location. API responses:", { 
      response, 
      userResponse 
    });
    
    return [];
  } catch (error) {
    console.error("Error fetching user skills:", error);
    return [];
  }
}

export async function searchSkills(query: string): Promise<Skill[]> {
  const response = await apiRequest<any>(`/v1/skills?q=${encodeURIComponent(query)}`);
  
  if (Array.isArray(response)) {
    return response;
  }
  
  if (response && response.success && response.user) {
    if (Array.isArray(response.user)) {
      return response.user;
    }
  }
  
  const responseObj = response as any;
  
  if (responseObj && typeof responseObj === 'object') {
    if (responseObj.data && Array.isArray(responseObj.data)) {
      return responseObj.data;
    }
    if (responseObj.skills && Array.isArray(responseObj.skills)) {
      return responseObj.skills;
    }
    if (responseObj.results && Array.isArray(responseObj.results)) {
      return responseObj.results;
    }
  }

  return [];
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

export async function createCustomSkill(skill: { 
  name: string; 
  description?: string; 
  image_url?: string;
  is_predefined?: boolean;
}): Promise<ApiResponse<Skill>> {
  return apiRequest<Skill>('/v1/skills', {
    method: 'POST',
    body: JSON.stringify(skill),
  });
}

export async function uploadSkillImage(file: File, skillId?: number): Promise<ApiResponse<{ image_url: string }>> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (skillId) {
    formData.append('skill_id', skillId.toString());
  }
  
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_URL}/v1/skills/upload-image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log("Skill image upload response:", data);
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Upload failed with status ${response.status}`
      };
    }
    
    return {
      success: true,
      image_url: data.image_url
    };
  } catch (error) {
    console.error("Skill image upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during upload'
    };
  }
}

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

export async function getPremiumStatus(): Promise<PremiumStatus> {
  try {
    const response = await apiRequest<any>('/v1/premium/status');
    console.log("Premium status response:", response);
    
    if (response.success && response.user) {
      return response.user as PremiumStatus;
    }
    
    if ('premium_tier' in response) {
      const premiumResponse = response as Partial<PremiumStatus>;
      const premiumTier = premiumResponse.premium_tier || 0;
      
      return {
        premium_tier: premiumTier,
        tier_name: premiumResponse.tier_name || 
                  ['Free', 'Basic', 'Premium', 'Ultimate'][premiumTier] || 
                  'Unknown',
        expires_at: premiumResponse.expires_at || null,
        is_active: premiumResponse.is_active !== undefined ? 
                  !!premiumResponse.is_active : 
                  premiumTier > 0
      };
    }
    
    return { premium_tier: 0, tier_name: 'Free', expires_at: null, is_active: false };
  } catch (error) {
    console.error("Error fetching premium status:", error);
    return { premium_tier: 0, tier_name: 'Free', expires_at: null, is_active: false };
  }
}

export async function getPremiumTiers(): Promise<PremiumTier[]> {
  const response = await apiRequest<any>('/v1/premium/tiers');
  if (response.success) {
    if (Array.isArray(response.user)) {
      return response.user as PremiumTier[];
    }
    
    const data = response.user as any;
    if (data) {
      if (data.data && Array.isArray(data.data)) {
        return data.data as PremiumTier[];
      }
      
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

export async function searchUsers(query: string, skillFilter?: string, limit: number = 10, offset: number = 0): Promise<User[]> {
  let endpoint = `/v1/users?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
  if (skillFilter) {
    endpoint += `&skill=${encodeURIComponent(skillFilter)}`;
  }
  
  const response = await apiRequest<any>(endpoint);
  if (response.success) {
    if (Array.isArray(response.user)) {
      return response.user as User[];
    }
    
    const data = response.user as any;
    if (data) {
      if (data.data && Array.isArray(data.data)) {
        return data.data as User[];
      }
      
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



export async function generatePaymentLink(tier: number): Promise<ApiResponse<{ payment_url: string }>> {
  try {
    const token = localStorage.getItem('authToken');

    const response = await apiRequest<{ payment_url: string }>('/v1/premium/link', {
      method: 'POST',
      body: JSON.stringify({ tier }),
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return response;
  } catch (error) {
    console.error("Error generating payment link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error generating payment link"
    };
  }
}

export async function checkPaymentStatus(
  userId: string | number,
  tier: number,
  chargeId: string
): Promise<ApiResponse<PremiumStatus>> {
  try {
    const response = await apiRequest<PremiumStatus>('/v1/premium/check_payment', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        tier,
        charge_id: chargeId
      }),
    });
    return response;
  } catch (error) {
    console.error("Error checking payment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error checking payment"
    };
  }
}

export async function getIsNewUser(userId: string | number): Promise<{ is_new: boolean }> {
  const res = await apiRequest<{ is_new: boolean }>(`/v1/users/new/${userId}`);
  return { is_new: !!(res && res.is_new) };
}

export async function updateIsNewUser(userId: string | number): Promise<void> {
  await apiRequest<any>(`/v1/users/new/update`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}