// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

export const apiCall = async (endpoint, options = {}) => {
    const requestUrl = `${API_BASE_URL}${endpoint}`;
    console.log("FRONTEND API CALL:", requestUrl, "METHOD:", options.method || "GET", "BODY:", options.body);
    
  try {
    // Retrieve token if available (example, adjust to your auth mechanism)
    // const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      // ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) { // No Content success
      return { success: true, data: null }; // Consistent success response
    }

    const responseData = await response.json();

    if (!response.ok) {
      // Log more detailed error from backend if available
      console.error('API Error Response:', responseData);
      const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    // Voor GET requests die direct de array/object teruggeven (zoals jouw backend nu doet)
    // of voor POST/PUT die { success: true, data: ...} of { success: true, item: ...} teruggeven.
    // Als de backend alleen de data array/object teruggeeft bij succes, dan is responseData de data.
    // Als de backend een {success: boolean, ...} structuur teruggeeft, dan is responseData die structuur.
    // Deze apiCall is nu generiek.
    return responseData; // Backend geeft al {success: true, user: ...} etc. terug.

  } catch (error) {
    console.error('API Call Failed:', endpoint, error.message);
    // Om de error message door te geven aan de UI componenten:
    throw error; // Gooi de error (met message) opnieuw zodat de aanroepende functie het kan vangen.
  }
};