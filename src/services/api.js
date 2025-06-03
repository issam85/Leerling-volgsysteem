// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://moskee-backend-api-production.up.railway.app';

export const apiCall = async (endpoint, options = {}) => {
  const requestUrl = `${API_BASE_URL}${endpoint}`;
  console.log("FRONTEND API CALL:", requestUrl, "METHOD:", options.method || "GET", "BODY PREVIEW:", options.body ? String(options.body).substring(0, 100) + "..." : "undefined");

  try {
    const headers = {
      'Content-Type': 'application/json',
      // Voeg hier eventueel Authorization header toe als je JWT tokens gebruikt
      // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      ...options.headers,
    };

    const response = await fetch(requestUrl, {
      ...options,
      headers,
    });

    // Log de status voor debugging
    console.log("API RESPONSE STATUS:", response.status, "for URL:", requestUrl);

    if (response.status === 204) { // No Content success
      return { success: true, data: null }; // Consistent success response
    }

    // Probeer altijd de body te parsen, zelfs bij errors, want backend kan JSON error sturen
    const responseData = await response.json().catch(e => {
        // Als parsen faalt (bijv. geen JSON body), maak een placeholder error
        console.warn("API Response body was not valid JSON or empty, status:", response.status, e);
        if (response.ok) return { success: true, data: null }; // Als status OK was maar geen body, toch succes
        return { error: `HTTP ${response.status}: ${response.statusText} (and invalid JSON response)` };
    });

    console.log("API RESPONSE DATA:", responseData);


    if (!response.ok) {
      // Haal error message uit responseData indien beschikbaar
      const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API Error from Server:', errorMessage, 'Full ResponseData:', responseData);
      throw new Error(errorMessage); // Gooi een Error object met de server message
    }

    // Als de backend een { success: true, ... } structuur stuurt, is dat prima.
    // Als de backend direct de data array/object stuurt bij succes (zoals jouw GETs), is dat ook prima.
    // Deze functie geeft nu de volledige geparste responseData terug.
    return responseData;

  } catch (error) {
    // Dit vangt zowel netwerkfouten (fetch failed) als errors gegooid vanuit de !response.ok block.
    console.error('API Call Failed (outer catch):', endpoint, error.message, error);
    // Om de error message door te geven aan de UI componenten:
    throw error; // Gooi de error (met message) opnieuw zodat de aanroepende functie het kan vangen.
  }
};