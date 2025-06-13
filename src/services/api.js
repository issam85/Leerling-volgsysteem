// src/services/api.js (Verbeterde versie)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

export const apiCall = async (endpoint, options = {}) => {
  const requestUrl = `${API_BASE_URL}${endpoint}`;
  let authToken = null;
  
  try {
    const supabaseAppUrl = process.env.REACT_APP_SUPABASE_URL;
    if (supabaseAppUrl) {
        // Dit is de meest stabiele manier om de token te krijgen, rechtstreeks uit storage.
        const projectRef = new URL(supabaseAppUrl).hostname.split('.')[0];
        const supabaseAuthStorageKey = `sb-${projectRef}-auth-token`;
        const sessionDataString = localStorage.getItem(supabaseAuthStorageKey);
        if (sessionDataString) {
            authToken = JSON.parse(sessionDataString).access_token;
        }
    }
  } catch (e) {
    console.warn("[api.js] Kon Supabase auth token niet ophalen uit localStorage:", e);
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