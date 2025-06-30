// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL of Anon Key niet gevonden. Zorg dat REACT_APP_SUPABASE_URL en REACT_APP_SUPABASE_ANON_KEY in je .env bestand staan."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);