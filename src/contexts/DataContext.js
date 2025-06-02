import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser, currentSubdomain, loadingUser: authLoading } = useAuth(); // authLoading om te voorkomen dat te vroeg wordt geladen
  const [realData, setRealData] = useState({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    loading: true, // Start met true, wordt false na eerste poging tot laden
    error: null,
  });

  // Haalt het volledige mosque object op, inclusief M365 config
  const fetchMosqueDataBySubdomain = useCallback(async (subdomain) => {
    if (subdomain && subdomain !== 'register') {
      try {
        console.log(`DataContext: Fetching mosque details for subdomain: ${subdomain}`);
        // Je backend /api/mosque/:subdomain geeft het mosque object terug
        const mosqueDetails = await apiCall(`/api/mosque/${subdomain}`);
        if (mosqueDetails && mosqueDetails.id) {
          return mosqueDetails;
        } else {
          console.warn(`DataContext: No mosque details found for subdomain: ${subdomain} from API.`);
          // Dit kan betekenen dat het subdomein niet bestaat in de DB
          throw new Error(`Moskee voor subdomein '${subdomain}' niet gevonden.`);
        }
      } catch (error) {
        console.error(`DataContext: Error fetching mosque details for subdomain ${subdomain}:`, error);
        throw error; // Gooi door zodat loadData het kan afhandelen
      }
    }
    return null; // Geen subdomein of 'register'
  }, []);


  const loadData = useCallback(async () => {
    if (!currentUser || currentSubdomain === 'register' || !realData.mosque || !realData.mosque.id) {
      // Als er geen user is, of geen geldig mosque object, niet proberen data te laden
      // De mosque data wordt eerst gehaald in de useEffect hieronder.
      if (!realData.mosque && currentSubdomain !== 'register' && currentUser) {
        // Probeer mosque data te laden als die nog niet is geladen
        console.log("DataContext: Mosque data missing, attempting to fetch in loadData guard.");
        // Dit zou idealiter al gebeurd moeten zijn in de useEffect
      } else {
         setRealData(prev => ({ ...prev, users: [], classes: [], students: [], payments: [], loading: false, error: prev.error }));
      }
      return;
    }

    console.log(`DataContext: Loading data for mosque ID: ${realData.mosque.id}`);
    setRealData(prev => ({ ...prev, loading: true, error: null })); // Reset error voor nieuwe laadpoging

    try {
      const mosqueId = realData.mosque.id;
      // Je backend geeft direct de arrays terug, geen .data property nodig.
      const [usersRes, classesRes, studentsRes, paymentsRes] = await Promise.all([
        apiCall(`/api/mosques/${mosqueId}/users`),
        apiCall(`/api/mosques/${mosqueId}/classes`),
        apiCall(`/api/mosques/${mosqueId}/students`),
        apiCall(`/api/mosques/${mosqueId}/payments`),
      ]);

      setRealData(prev => ({
        ...prev, // Behoud het bestaande mosque object
        users: usersRes || [],
        classes: classesRes || [],
        students: studentsRes || [],
        payments: paymentsRes || [],
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('DataContext: Error loading detailed data (users, classes, etc.):', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van gegevens." }));
    }
  }, [currentUser, currentSubdomain, realData.mosque]); // Afhankelijk van realData.mosque

  // Effect om eerst mosque data te laden o.b.v. subdomein, dan pas andere data
  useEffect(() => {
    if (authLoading || currentSubdomain === 'register') {
      setRealData(prev => ({ ...prev, mosque: null, loading: currentSubdomain !== 'register' })); // Blijf laden als niet register
      return;
    }

    if (!currentUser && currentSubdomain !== 'register') {
        // Geen user, maar wel een subdomein, haal wel moskee info op voor login pagina
        console.log("DataContext: No current user, but attempting to fetch mosque data for login page branding.");
    } else if (!currentUser && currentSubdomain === 'register') {
        // Registratie pagina, geen moskee data nodig
        setRealData(prev => ({ ...prev, mosque: null, loading: false, error: null}));
        return;
    }


    setRealData(prev => ({ ...prev, loading: true, error: null }));
    fetchMosqueDataBySubdomain(currentSubdomain)
      .then(mosqueObject => {
        if (mosqueObject) {
          setRealData(prev => ({ ...prev, mosque: mosqueObject, loading: false, error: null }));
          // Als er een currentUser is, trigger dan het laden van de rest van de data.
          // Dit gebeurt nu via de dependency change van realData.mosque in de loadData useEffect.
        } else if (currentSubdomain !== 'register') {
          // Geen mosqueObject maar het is ook niet de register pagina
          setRealData(prev => ({ ...prev, mosque: null, loading: false, error: `Moskee voor subdomein '${currentSubdomain}' kon niet worden geladen.` }));
        } else {
            // Register pagina, geen error nodig als mosqueObject null is
            setRealData(prev => ({...prev, mosque: null, loading: false, error: null}));
        }
      })
      .catch(err => {
        setRealData(prev => ({ ...prev, mosque: null, loading: false, error: err.message }));
      });
  }, [authLoading, currentUser, currentSubdomain, fetchMosqueDataBySubdomain]);


  // Effect om data te laden als currentUser of realData.mosque verandert
  useEffect(() => {
    if (currentUser && realData.mosque && realData.mosque.id && !authLoading) {
      loadData();
    } else if (!currentUser && !authLoading) {
      // Reset specifieke data als user uitlogt, maar behoud mosque info als die er is
      setRealData(prev => ({
          ...prev, // Behoud mosque en error state van vorige fetchMosqueDataBySubdomain
          users: [],
          classes: [],
          students: [],
          payments: [],
          loading: false, // Stop met laden als er geen user is
      }));
    }
  }, [currentUser, realData.mosque, authLoading, loadData]);


  const value = {
    realData,
    loadData, // Om handmatig herladen mogelijk te maken
    currentUser, // Handig om hier ook te hebben voor gemak
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