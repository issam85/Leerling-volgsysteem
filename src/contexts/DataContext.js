// src/contexts/DataContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser, currentSubdomain, loadingUser: authLoading } = useAuth();
  const [realData, setRealData] = useState({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    loading: true,
    error: null,
  });

  const fetchMosqueDataBySubdomain = useCallback(async (subdomain) => {
    if (subdomain && subdomain !== 'register') {
      try {
        const cacheBuster = `timestamp=${Date.now()}`;
        const endpoint = `/api/mosque/${subdomain}?${cacheBuster}`;
        console.log(`[DataContext] FETCHING mosque details for subdomain: ${subdomain} from endpoint: ${endpoint} (Timestamp: ${new Date().toLocaleTimeString()})`);
        const mosqueDetails = await apiCall(endpoint);
        console.log("[DataContext] RECEIVED mosque details from API:", JSON.stringify(mosqueDetails, null, 2));
        if (mosqueDetails && mosqueDetails.id) {
          return mosqueDetails;
        } else {
          console.warn(`[DataContext] No mosque details found or no ID in response for subdomain: ${subdomain}`);
          throw new Error(`Moskee voor subdomein '${subdomain}' niet gevonden of ongeldige respons.`);
        }
      } catch (error) {
        console.error(`[DataContext] Error fetching mosque details for subdomain ${subdomain}:`, error.message);
        throw error;
      }
    }
    return null;
  }, []); // Empty dependency array: function itself doesn't change

  const loadDetailedData = useCallback(async (mosqueForDataLoading) => {
    if (!currentUser || !mosqueForDataLoading || !mosqueForDataLoading.id) {
      console.log("[DataContext] loadDetailedData: Pre-conditions not met (no currentUser or no mosqueForDataLoading). Skipping.");
      setRealData(prev => ({ ...prev, users: [], classes: [], students: [], payments: [], loading: false }));
      return;
    }

    console.log(`[DataContext] loadDetailedData: Loading for mosque ID: ${mosqueForDataLoading.id} (Timestamp: ${new Date().toLocaleTimeString()})`);
    // Set loading for detailed data, but keep existing mosque data
    setRealData(prev => ({ ...prev, mosque: mosqueForDataLoading, loading: true, error: null }));

    try {
      const mosqueId = mosqueForDataLoading.id;
      const [usersRes, classesRes, studentsRes, paymentsRes] = await Promise.all([
        apiCall(`/api/mosques/${mosqueId}/users`),
        apiCall(`/api/mosques/${mosqueId}/classes`),
        apiCall(`/api/mosques/${mosqueId}/students`),
        apiCall(`/api/mosques/${mosqueId}/payments`),
      ]);

      console.log("[DataContext] loadDetailedData: RECEIVED detailed data. Users:", usersRes?.length, "Classes:", classesRes?.length, "Students:", studentsRes?.length, "Payments:", paymentsRes?.length);

      setRealData(prev => ({
        ...prev, // This ensures mosque data from mosqueForDataLoading is kept
        users: usersRes || [],
        classes: classesRes || [],
        students: studentsRes || [],
        payments: paymentsRes || [],
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[DataContext] loadDetailedData: Error loading detailed data:', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van gegevens." }));
    }
  }, [currentUser]); // Only currentUser, as mosqueForDataLoading is passed as argument

  // Effect to fetch mosque data when subdomain changes or auth state is ready
  useEffect(() => {
    console.log("[DataContext] Mosque Fetch useEffect. AuthLoading:", authLoading, "Subdomain:", currentSubdomain, "Current mosque subdomain:", realData.mosque?.subdomain);
    if (authLoading) {
      console.log("[DataContext] Auth is loading, delaying mosque fetch.");
      setRealData(prev => ({ ...prev, loading: true })); // Indicate loading
      return;
    }
    if (currentSubdomain === 'register') {
      console.log("[DataContext] On register subdomain, clearing mosque data and stopping load.");
      setRealData({ users: [], classes: [], students: [], payments: [], mosque: null, loading: false, error: null });
      return;
    }

    // Fetch mosque data if it's not present, or if the subdomain has changed
    if (!realData.mosque || realData.mosque.subdomain !== currentSubdomain) {
      console.log(`[DataContext] Mosque data needs refresh (current: ${realData.mosque?.subdomain}, target: ${currentSubdomain}). Fetching...`);
      setRealData(prev => ({ ...prev, loading: true, error: null, mosque: null })); // Clear old mosque while fetching
      fetchMosqueDataBySubdomain(currentSubdomain)
        .then(mosqueObject => {
          if (mosqueObject) {
            console.log("[DataContext] SETTING realData.mosque after fetch:", JSON.stringify(mosqueObject, null, 2));
            // State update for mosque will trigger the next useEffect to load detailed data
            setRealData(prev => ({ ...prev, mosque: mosqueObject, /* loading will be handled by loadDetailedData call */ error: null }));
          } else {
            console.warn(`[DataContext] No mosque object returned for subdomain ${currentSubdomain}.`);
            setRealData(prev => ({ ...prev, mosque: null, loading: false, error: `Moskee voor subdomein '${currentSubdomain}' kon niet worden geladen.` }));
          }
        })
        .catch(err => {
          console.error("[DataContext] Error in fetchMosqueDataBySubdomain promise chain:", err);
          setRealData(prev => ({ ...prev, mosque: null, loading: false, error: err.message }));
        });
    } else {
      console.log("[DataContext] Mosque data already present and subdomain matches. Current mosque:", realData.mosque?.name);
      // If mosque data is present, but other data might not be (e.g., after login but before detailed load)
      // and if we are not currently loading. The detailed data load is handled by the next useEffect.
      if (realData.loading && !currentUser) { // If was loading but user logged out
          setRealData(prev => ({ ...prev, loading: false }));
      }
    }
  }, [authLoading, currentSubdomain, fetchMosqueDataBySubdomain, currentUser]); // currentUser added to re-evaluate if mosque needs fetch on login/logout

  // Effect to load detailed data once currentUser and realData.mosque are available
  useEffect(() => {
    console.log("[DataContext] Detailed Data Load useEffect. currentUser:", !!currentUser, "realData.mosque:", !!realData.mosque?.id, "authLoading:", authLoading);
    if (currentUser && realData.mosque && realData.mosque.id && !authLoading) {
      console.log("[DataContext] Conditions met for loading detailed data with mosque:", realData.mosque.name);
      loadDetailedData(realData.mosque);
    } else if (!currentUser && !authLoading) {
      console.log("[DataContext] No currentUser and not authLoading. Resetting arrays, keeping mosque if present.");
      setRealData(prev => ({
          ...prev, // Keep mosque data if it was fetched (e.g., for login page branding)
          users: [], classes: [], students: [], payments: [],
          loading: false, // Not loading if no user
      }));
    }
  }, [currentUser, realData.mosque, authLoading, loadDetailedData]);

  const refreshAllData = useCallback(async () => {
    console.log("[DataContext] RefreshAllData called. Forcing mosque refetch.");
    // Eerst de moskee data forceren opnieuw te halen
    if (currentSubdomain && currentSubdomain !== 'register') {
        setRealData(prev => ({ ...prev, loading: true, error: null})); // Start loading indicator
        try {
            const mosqueObject = await fetchMosqueDataBySubdomain(currentSubdomain);
            if (mosqueObject && mosqueObject.id) {
                // Als moskee succesvol is opgehaald, laad dan de rest
                // setRealData in loadDetailedData zal mosqueObject gebruiken
                await loadDetailedData(mosqueObject);
            } else {
                throw new Error("Kon moskeegegevens niet opnieuw laden voor volledige refresh.");
            }
        } catch (error) {
            console.error("[DataContext] Error during refreshAllData (mosque fetch part):", error);
            setRealData(prev => ({ ...prev, loading: false, error: error.message }));
        }
    } else {
        console.log("[DataContext] refreshAllData: Cannot refresh, no valid subdomain or on register page.");
    }
  }, [currentSubdomain, fetchMosqueDataBySubdomain, loadDetailedData]);


  const value = {
    realData,
    loadData: refreshAllData, // `loadData` in de app noemt nu `refreshAllData`
    currentUser, // Voor gemakkelijke toegang in componenten
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};