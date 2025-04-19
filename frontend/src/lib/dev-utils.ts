"use client";

// This utility is for development testing only

// Set this to true to force API calls even when not in Telegram WebApp
export const FORCE_API_CALLS = true;

// Set this to true to log all Telegram WebApp related data 
export const DEBUG_TELEGRAM = true;

// Mock Telegram data for testing in development
export const MOCK_INIT_DATA = "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1616969234&hash=c501b91e775f74ce13b422fd6e8bb15603ce10ae6d893a57ab8d00f222e64224";

export const isDevelopment = process.env.NODE_ENV === 'development'; 