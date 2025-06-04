// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { apiCall } from '../services/api'; // Je bestaande apiCall
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Importeer je Supabase client

const AuthContext = createContext(null);

const getSubdomainFromHostname = (hostname) => {
  const parts = hostname.split('.');
  if (hostname === 'localhost' || hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return localStorage.getItem('currentSubdomainForDev') || 'al-hijra'; // Default voor dev
  }
  if (parts.length >= 3 && parts[0] !== 'www') {
    if (['al-hijra', 'al-noor', 'register'].includes(parts[0])) {
      return parts[0];
    }
  }
  return 'register';
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Dit wordt nu de app user
  const [currentSubdomain, setCurrentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
  const [loadingUser, setLoadingUser] = useState(true); // Start als true
  const navigate = useNavigate();
  const location = useLocation();

  // Effect voor het instellen van het subdomein en de initiële check van de Supabase sessie
  useEffect(() => {
    const detectedSubdomain = getSubdomainFromHostname(window.location.hostname);
    if (window.location.hostname === 'localhost') {
      const storedDevSubdomain = localStorage.getItem('currentSubdomainForDev');
      if (storedDevSubdomain && storedDevSubdomain !== detectedSubdomain) {
        setCurrentSubdomain(storedDevSubdomain);
      } else if (!storedDevSubdomain) {
        localStorage.setItem('currentSubdomainForDev', detectedSubdomain);
      }
    } else {
      setCurrentSubdomain(detectedSubdomain);
    }

    // Check de initiële Supabase sessie bij het laden van de app
    const checkInitialSession = async () => {
        setLoadingUser(true);
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AuthContext] Initial session check:", session);
        if (session?.user) {
            // Als er een Supabase sessie is, haal de app user op
            try {
                const { data: appUser, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    // Optioneel: .eq('mosque_id', /* ID van moskee o.b.v. subdomein */)
                    .single();

                if (error) throw error;
                
                if (appUser) {
                    setCurrentUser(appUser);
                    localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser)); // Gebruik detectedSubdomain
                    console.log("[AuthContext] Initial appUser set from session:", appUser);
                } else {
                    console.warn("[AuthContext] Supabase user exists but no matching appUser found. Logging out.");
                    await supabase.auth.signOut(); // Log Supabase sessie uit
                    setCurrentUser(null);
                    localStorage.removeItem(`currentUser_${detectedSubdomain}`);
                }
            } catch (dbError) {
                console.error("[AuthContext] Error fetching appUser for initial session:", dbError);
                await supabase.auth.signOut();
                setCurrentUser(null);
                localStorage.removeItem(`currentUser_${detectedSubdomain}`);
            }
        }
        setLoadingUser(false);
    };
    checkInitialSession();

  }, []); // Alleen bij mount

  // Effect voor Supabase onAuthStateChange listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] onAuthStateChange - Event:", event, "Session:", session);
        setLoadingUser(true); // Begin met laden bij elke auth state change
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname); // Gebruik altijd actieve subdomein

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Haal de app user op uit jouw 'users' tabel, gekoppeld aan de Supabase user ID
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              // Optioneel: filter ook op mosque_id als je zeker wilt zijn
              // .eq('mosque_id', currentMosqueIdFromSubdomain)
              .single();

            if (appUserError) throw appUserError;

            if (appUser) {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              console.log("[AuthContext] SIGNED_IN: currentUser set to appUser:", appUser);
              // Navigeer pas na het zetten van de user state
              // navigate(location.state?.from?.pathname || '/dashboard', { replace: true }); // Verplaatst naar login
            } else {
              // Supabase user is ingelogd, maar geen corresponderende app user gevonden.
              // Dit is een inconsistente staat. Log de Supabase user uit.
              console.warn("[AuthContext] SIGNED_IN: Supabase user exists, but no appUser found. Forcing logout.");
              await supabase.auth.signOut(); // Dit triggert een 'SIGNED_OUT' event
            }
          } catch (error) {
            console.error("[AuthContext] SIGNED_IN: Error fetching/setting appUser:", error);
            await supabase.auth.signOut(); // Log uit bij fout
            setCurrentUser(null);
            localStorage.removeItem(`currentUser_${activeSubdomain}`);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem(`currentUser_${activeSubdomain}`);
          console.log("[AuthContext] SIGNED_OUT: currentUser reset.");
          if (location.pathname !== '/login' && activeSubdomain !== 'register') {
            navigate('/login', { replace: true });
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
             try {
                const { data: appUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (appUser) {
                    setCurrentUser(appUser); // Update met mogelijk verse app user data
                    localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
                    console.log("[AuthContext] TOKEN_REFRESHED: currentUser updated.");
                }
             } catch (error) {
                 console.error("[AuthContext] TOKEN_REFRESHED: Error updating appUser:", error);
             }
        }
        setLoadingUser(false); // Stop met laden na afhandeling
      }
    );
    return () => {
      authListener?.unsubscribe();
    };
  }, [navigate, location.pathname]); // location.pathname om te reageren op navigatie

  const handleLogin = useCallback(async (email, password) => {
    setLoadingUser(true);
    try {
      // De backend /api/auth/login handelt nu Supabase Auth login af
      // en retourneert de app user als het succesvol is.
      const result = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          subdomain: currentSubdomain, // currentSubdomain wordt hier al correct gebruikt
        }),
      });

      console.log("[AuthContext] handleLogin - Backend API Result:", result);

      if (result.success && result.user) {
        // Backend was succesvol. Supabase client-side sessie is al gezet.
        // onAuthStateChange zal nu getriggerd worden en currentUser correct zetten.
        // We kunnen hier al navigeren.
        setLoadingUser(false); // Stop met laden van login proces
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
        return true;
      } else {
        // Fout van backend, of geen user object
        throw new Error(result.error || 'Ongeldige inloggegevens of serverfout.');
      }
    } catch (error) {
      console.error('AuthContext handleLogin error:', error.message, error);
      // Supabase sessie wordt niet gezet, onAuthStateChange handelt SIGNED_OUT (of geen verandering) af.
      // Zorg ervoor dat currentUser gereset wordt als het nog niet null is
      setCurrentUser(null);
      localStorage.removeItem(`currentUser_${currentSubdomain}`);
      setLoadingUser(false);
      throw error; // Geef error door aan LoginPage
    }
  }, [currentSubdomain, navigate, location.state]);

  const handleLogout = useCallback(async () => {
    setLoadingUser(true);
    console.log("[AuthContext] handleLogout initiated.");
    const { error } = await supabase.auth.signOut(); // Supabase handelt sessie verwijderen af
    if (error) {
      console.error("Error during Supabase signOut:", error);
    }
    // onAuthStateChange zal 'SIGNED_OUT' event afhandelen:
    // setCurrentUser(null);
    // localStorage.removeItem(`currentUser_${currentSubdomain}`);
    // navigate('/login', { replace: true }); // Verplaatst naar onAuthStateChange
    setLoadingUser(false); // Alsnog loading stoppen voor het geval onAuthStateChange niet direct triggert
  }, [navigate, currentSubdomain]);

  const switchSubdomain = useCallback((newSubdomain) => {
    // ... (jouw bestaande switchSubdomain logica, ongewijzigd)
    const currentHostname = window.location.hostname;
    if (currentHostname === 'localhost') {
        localStorage.setItem('currentSubdomainForDev', newSubdomain);
        window.location.reload(); 
        return;
    }
    const parts = currentHostname.split('.');
    let newHost;
    if (parts.length >= 3 && parts[0] !== 'www') { 
        newHost = `${newSubdomain}.${parts.slice(1).join('.')}`;
    } else if (parts.length === 2) { 
        newHost = `${newSubdomain}.${currentHostname}`;
    } else { 
        console.warn("Cannot determine how to switch subdomain for hostname:", currentHostname);
        newHost = currentHostname; 
    }
    const port = window.location.port ? `:${window.location.port}` : '';
    window.location.href = `${window.location.protocol}//${newHost}${port}/`;
  }, []);

  const value = {
    currentUser,
    currentSubdomain,
    loadingUser,
    login: handleLogin,
    logout: handleLogout,
    switchSubdomain,
    setCurrentUser, // Houd deze voor eventuele handmatige updates indien strikt nodig
    setLoadingUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};