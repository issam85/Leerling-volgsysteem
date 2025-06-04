// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

// Helper om de Supabase client instance te krijgen (als je die niet al globaal hebt)
// Dit is nodig om toegang te krijgen tot supabase.auth.session()
// Als je 'supabase' al exporteert vanuit een supabaseClient.js, gebruik die dan.
// Voor nu een placeholder, je moet dit vervangen door je daadwerkelijke Supabase client import.
// import { supabase } from './supabaseClient'; // VOORBEELD

export const apiCall = async (endpoint, options = {}) => {
  const requestUrl = `${API_BASE_URL}${endpoint}`;
  let authToken = null;

  // Probeer de actieve Supabase sessie token te krijgen
  // Dit vereist dat je de Supabase client correct hebt geïnitialiseerd en beschikbaar hebt.
  // De manier waarop je dit doet hangt af van hoe je Supabase hebt opgezet.
  // Een gebruikelijke manier is om `supabase.auth.getSession()` te gebruiken.
  try {
    // Dit is een algemene manier. Als je supabase client instance ergens anders is, pas aan.
    // Supabase JS v2:
    const supabaseAuthStorageKey = `sb-${new URL(process.env.REACT_APP_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
    const sessionDataString = localStorage.getItem(supabaseAuthStorageKey);
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        authToken = sessionData.access_token;
    }
    // Als je een globale Supabase client instance hebt:
    // const { data: { session }, error } = await supabase.auth.getSession();
    // if (session) {
    //   authToken = session.access_token;
    // } else if (error) {
    //   console.warn("Error getting Supabase session for API call:", error.message);
    // }
  } catch (e) {
    console.warn("Could not retrieve Supabase auth token from localStorage:", e);
  }

  console.log(`[API Call] ${options.method || 'GET'} ${requestUrl}`, authToken ? `(Authenticated with token)` : '(Unauthenticated)');
  // console.log("FRONTEND API CALL:", requestUrl, "METHOD:", options.method || "GET", "AuthToken (length):", authToken ? authToken.length : "NONE", "BODY PREVIEW:", options.body ? String(options.body).substring(0, 100) + "..." : "undefined");


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

    console.log("[API Response] Status:", response.status, "for URL:", requestUrl);

    if (response.status === 204) {
      return { success: true, data: null };
    }

    const responseData = await response.json().catch(e => {
        console.warn("API Response body was not valid JSON or empty, status:", response.status, e);
        if (response.ok) return { success: true, data: null };
        return { error: `HTTP ${response.status}: ${response.statusText} (and invalid JSON response)` };
    });

    // console.log("[API Response] Data:", responseData);

    if (!response.ok) {
      const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API Error from Server:', errorMessage, 'Full ResponseData:', responseData);
      // Gooi een error met de statuscode erbij, zodat de UI hierop kan reageren (bijv. 401 -> logout)
      const errorToThrow = new Error(errorMessage);
      errorToThrow.status = response.status; // Voeg status toe aan error object
      errorToThrow.data = responseData; // Voeg volledige data toe voor meer context
      throw errorToThrow;
    }

    return responseData;

  } catch (error) {
    console.error(`API Call Failed: ${options.method || 'GET'} ${endpoint}`, error.message, error);
    // Geef de error (inclusief eventuele status) door
    throw error;
  }
};