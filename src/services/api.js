// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

// Importeer je Supabase client instance. Zorg dat dit bestand bestaat en correct is opgezet.
// import { supabase } from './supabaseClient'; 
// VOORBEELD: Als je geen aparte supabaseClient.js hebt, kun je de client hier opnieuw initialiseren,
// maar dat is minder ideaal. Beter is een centrale Supabase client.
// Voor nu, een placeholder om de code te laten werken, je MOET dit aanpassen.
let supabaseClientForApi; 
if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY) {
    // Dit is een fallback, importeer idealiter je geconfigureerde client
    // const { createClient } = require('@supabase/supabase-js');
    // supabaseClientForApi = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
} else {
    console.error("API.JS: Supabase credentials (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY) not found in .env. Auth token cannot be retrieved automatically for API calls.");
}


export const apiCall = async (endpoint, options = {}) => {
  const requestUrl = `${API_BASE_URL}${endpoint}`;
  let authToken = null;

  try {
    // Probeer de Supabase access token op te halen uit localStorage (meest gangbare manier)
    // Supabase JS v2 gebruikt een dynamische key gebaseerd op je Supabase project ref.
    const supabaseAppUrl = process.env.REACT_APP_SUPABASE_URL;
    if (supabaseAppUrl) {
        const projectRef = new URL(supabaseAppUrl).hostname.split('.')[0];
        const supabaseAuthStorageKey = `sb-${projectRef}-auth-token`;
        const sessionDataString = localStorage.getItem(supabaseAuthStorageKey);
        if (sessionDataString) {
            const sessionData = JSON.parse(sessionDataString);
            authToken = sessionData.access_token;
        }
    } else {
        console.warn("[api.js] REACT_APP_SUPABASE_URL is not set. Cannot automatically retrieve auth token.");
    }
    
    // Alternatief als je een globale Supabase client instance hebt:
    // if (supabaseClientForApi) { // Zorg dat supabaseClientForApi correct is geïnitialiseerd
    //   const { data: { session } } = await supabaseClientForApi.auth.getSession();
    //   if (session) {
    //     authToken = session.access_token;
    //   }
    // }
  } catch (e) {
    console.warn("[api.js] Could not retrieve Supabase auth token:", e);
  }

  console.log(
    `[API Call] ${options.method || 'GET'} ${requestUrl}`,
    authToken ? `(Authenticated)` : '(Unauthenticated)',
    // "BODY:", options.body ? String(options.body).substring(0,80) + "..." : "N/A"
  );

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(requestUrl, {
      ...options,
      headers,
    });

    // console.log("[API Response] Status:", response.status, "for URL:", requestUrl);

    if (response.status === 204) { // No Content
      return { success: true, data: null }; 
    }

    const responseData = await response.json().catch(e => {
        console.warn("API Response body was not valid JSON or empty, status:", response.status, "Error:", e.message);
        if (response.ok) return { success: true, data: null }; // Als status OK was maar geen body
        return { error: `HTTP ${response.status}: ${response.statusText} (plus invalid JSON response)` };
    });

    // console.log("[API Response] Data received:", responseData);

    if (!response.ok) {
      const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API Error from Server:', errorMessage, 'Full ResponseData:', responseData);
      const errorToThrow = new Error(errorMessage);
      errorToThrow.status = response.status; 
      errorToThrow.data = responseData; 
      throw errorToThrow;
    }

    return responseData;

  } catch (error) {
    // Vangt zowel netwerkfouten als errors gegooid vanuit de !response.ok block.
    console.error(`API Call Failed: ${options.method || 'GET'} ${endpoint}`, error.message, error);
    throw error; 
  }
};