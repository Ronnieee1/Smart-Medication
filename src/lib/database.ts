import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client with environment credentials
 */
export const initializeSupabase = (): SupabaseClient => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials are missing in .env file. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
};

/**
 * Get the current Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseClient;
};

/**
 * Test the connection to verify credentials are valid
 */
export const testSupabaseConnection = async (client: SupabaseClient): Promise<boolean> => {
  try {
    const { error } = await client.auth.getSession();
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Close and clear the Supabase client
 */
export const closeSupabase = (): void => {
  supabaseClient = null;
};

/**
 * Get stored Supabase credentials from localStorage
 */
export const getStoredCredentials = (): { url: string | null; key: string | null } => {
  return {
    url: localStorage.getItem('supabase_url'),
    key: localStorage.getItem('supabase_key'),
  };
};

/**
 * Store Supabase credentials in localStorage
 */
export const storeCredentials = (url: string, key: string): void => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
};

/**
 * Clear stored Supabase credentials from localStorage
 */
export const clearStoredCredentials = (): void => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
};

/**
 * Check if Supabase is currently connected
 */
export const isSupabaseConnected = (): boolean => {
  return supabaseClient !== null;
};
