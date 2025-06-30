// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { validateEnvironmentVariables } from './utils/envValidation';

// Validate environment variables before creating client
let supabaseUrl, supabaseAnonKey;

try {
  const { config } = validateEnvironmentVariables();
  supabaseUrl = config.REACT_APP_SUPABASE_URL;
  supabaseAnonKey = config.REACT_APP_SUPABASE_ANON_KEY;
} catch (error) {
  // In case of validation failure, try to get values directly (fallback)
  supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  console.error('[Supabase] Environment validation failed:', error.message);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('REACT_APP_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
    
    throw new Error(`Critical configuration missing: ${missingVars.join(', ')}. Application cannot start.`);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});