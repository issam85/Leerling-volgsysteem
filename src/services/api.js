// src/services/api.js - Verbeterde versie met Cache-Busting voor 304 Not Modified probleem
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

export const apiCall = async (endpoint, options = {}) => {
  let requestUrl = `${API_BASE_URL}${endpoint}`;
  
  // ==========================================================
  // CACHE-BUSTING: Voorkom 304 Not Modified responses
  // ==========================================================
  const method = options.method || 'GET';
  
  if (method === 'GET') {
    // Voeg een unieke timestamp toe om browser caching te omzeilen
    // Dit zorgt ervoor dat we altijd fresh data krijgen van de server
    const separator = requestUrl.includes('?') ? '&' : '?';
    const cacheBuster = `_cb=${new Date().getTime()}`;
    requestUrl += `${separator}${cacheBuster}`;
  }
  
  // ==========================================================
  // SUPABASE AUTH TOKEN OPHALEN
  // ==========================================================
  let authToken = null;
  
  try {
    const supabaseAppUrl = process.env.REACT_APP_SUPABASE_URL;
    if (supabaseAppUrl) {
        // Haal auth token op uit localStorage op de meest stabiele manier
        const projectRef = new URL(supabaseAppUrl).hostname.split('.')[0];
        const supabaseAuthStorageKey = `sb-${projectRef}-auth-token`;
        const sessionDataString = localStorage.getItem(supabaseAuthStorageKey);
        
        if (sessionDataString) {
            try {
                const sessionData = JSON.parse(sessionDataString);
                authToken = sessionData.access_token;
            } catch (parseError) {
                console.warn("[api.js] Kon session data niet parsen:", parseError);
            }
        }
    }
  } catch (e) {
    console.warn("[api.js] Kon Supabase auth token niet ophalen uit localStorage:", e);
  }

  // ==========================================================
  // REQUEST LOGGING
  // ==========================================================
  const isAuthenticated = authToken ? '(Authenticated)' : '(Unauthenticated)';
  console.log(`[API Call] ${method} ${requestUrl} ${isAuthenticated}`);
  
  // Log request body voor debugging (alleen eerste 100 characters)
  if (options.body && process.env.NODE_ENV === 'development') {
    const bodyPreview = String(options.body).substring(0, 100);
    console.log(`[API Call] Body: ${bodyPreview}${bodyPreview.length >= 100 ? '...' : ''}`);
  }

  // ==========================================================
  // FETCH REQUEST UITVOEREN
  // ==========================================================
  try {
    const headers = {
      'Content-Type': 'application/json',
      // Voeg extra headers toe om caching te voorkomen
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    };

    // Voeg authorization header toe als we een token hebben
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const fetchOptions = {
      ...options,
      method,
      headers,
    };

    const response = await fetch(requestUrl, fetchOptions);

    // ==========================================================
    // RESPONSE HANDLING
    // ==========================================================
    
    // Log response status voor debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${method} ${endpoint} - Status: ${response.status}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      console.log(`[API Response] No content returned (204) for ${endpoint}`);
      return { success: true, data: null }; 
    }

    // Parse response body
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.warn(`[API Response] Invalid JSON response for ${endpoint}:`, jsonError.message);
      
      if (response.ok) {
        // Als response OK is maar geen JSON, behandel als success
        return { success: true, data: null };
      } else {
        // Als response niet OK is én geen JSON, maak een error
        return { 
          error: `HTTP ${response.status}: ${response.statusText} (Invalid JSON response)`,
          status: response.status 
        };
      }
    }

    // Log response data voor debugging (alleen in development)
    if (process.env.NODE_ENV === 'development' && responseData) {
      const dataPreview = JSON.stringify(responseData).substring(0, 200);
      console.log(`[API Response] Data: ${dataPreview}${dataPreview.length >= 200 ? '...' : ''}`);
    }

    // ==========================================================
    // ERROR HANDLING
    // ==========================================================
    
    if (!response.ok) {
      const errorMessage = responseData?.error || 
                          responseData?.message || 
                          responseData?.details ||
                          `HTTP ${response.status}: ${response.statusText}`;
      
      console.error(`[API Error] ${method} ${endpoint}:`, {
        status: response.status,
        message: errorMessage,
        fullResponse: responseData
      });
      
      const errorToThrow = new Error(errorMessage);
      errorToThrow.status = response.status; 
      errorToThrow.data = responseData; 
      errorToThrow.endpoint = endpoint;
      
      throw errorToThrow;
    }

    // ==========================================================
    // SUCCESS RESPONSE
    // ==========================================================
    
    return responseData;

  } catch (error) {
    // ==========================================================
    // NETWORK ERROR HANDLING
    // ==========================================================
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network error (geen internet, server down, etc.)
      console.error(`[API Network Error] ${method} ${endpoint}:`, 'Netwerkfout - controleer internetverbinding');
      const networkError = new Error('Netwerkfout - controleer je internetverbinding en probeer opnieuw');
      networkError.isNetworkError = true;
      networkError.endpoint = endpoint;
      throw networkError;
    }
    
    if (error.name === 'AbortError') {
      // Request was cancelled
      console.error(`[API Abort Error] ${method} ${endpoint}:`, 'Request geannuleerd');
      const abortError = new Error('Request werd geannuleerd');
      abortError.isAbortError = true;
      abortError.endpoint = endpoint;
      throw abortError;
    }
    
    // Re-throw andere errors (inclusief HTTP errors van hierboven)
    console.error(`[API Call Failed] ${method} ${endpoint}:`, {
      message: error.message,
      status: error.status,
      endpoint: error.endpoint,
      fullError: error
    });
    
    throw error; 
  }
};

// ==========================================================
// HELPER FUNCTIES
// ==========================================================

/**
 * Helper functie voor GET requests met extra cache-busting
 * Gebruik deze na belangrijke updates om zeker verse data te krijgen
 */
export const apiCallFresh = async (endpoint, options = {}) => {
  const freshOptions = {
    ...options,
    method: 'GET',
    headers: {
      ...options.headers,
      // Extra sterke cache-busting headers
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'If-None-Match': '*', // Voorkom 304 responses
    }
  };
  
  return apiCall(endpoint, freshOptions);
};

/**
 * Helper functie voor het maken van POST/PUT requests
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Helper functie voor het maken van PUT requests
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Helper functie voor het maken van DELETE requests
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiCall(endpoint, {
    method: 'DELETE',
    ...options
  });
};

/**
 * Helper functie om te controleren of er een actieve internetverbinding is
 */
export const checkConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default apiCall;