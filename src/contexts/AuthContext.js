// src/contexts/AuthContext.js - FINALE STABIELE VERSIE
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

const getSubdomainFromHostname = (hostname) => {
  const parts = hostname.split('.');
  if (hostname === 'localhost' || hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return localStorage.getItem('currentSubdomainForDev') || 'al-hijra';
  }
  if (parts.length >= 3 && parts[0] !== 'www') {
    if (['al-hijra', 'al-noor', 'register'].includes(parts[0])) {
      return parts[0];
    }
  }
  return 'register';
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSubdomain, setCurrentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[AuthContext] Setting up auth listener for session restoration.");
    
    // Initialiseer het subdomein
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
    
    // Alleen de listener. Geen aparte check.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth event: ${event}. Session available: ${!!session}`);

        // Deze listener is nu vooral voor INITIAL_SESSION (refresh) en externe events.
        if (event === 'INITIAL_SESSION' && session?.user) {
          console.log("[AuthContext] Restoring session. Fetching app user...");
          const { data: appUser, error: appUserError } = await supabase
            .from('users').select('*').eq('id', session.user.id).single();

          if (appUser) {
            setCurrentUser(appUser);
            localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser));
            console.log("[AuthContext] Session restored for:", appUser.name);
          } else {
            console.warn("[AuthContext] Session token valid, but user not found in DB. Logging out.", appUserError);
            await supabase.auth.signOut();
            setCurrentUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("[AuthContext] SIGNED_OUT event - clearing user");
          setCurrentUser(null);
        }

        // Na de eerste check (meestal INITIAL_SESSION), is het laden klaar.
        setLoadingUser(false);
      }
    );

    return () => {
      console.log("[AuthContext] Cleaning up auth listener.");
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Starting robust login flow...");
    setLoadingUser(true); // Zet laden aan tijdens de login-actie

    try {
      if (!currentSubdomain || currentSubdomain === 'register') {
        throw new Error('Geen geldig subdomein gevonden voor login.');
      }
      
      // Get mosque
      const { data: mosque, error: mosqueError } = await supabase
        .from('mosques')
        .select('id')
        .eq('subdomain', currentSubdomain.toLowerCase().trim())
        .single();
      
      if (mosqueError || !mosque) {
        throw new Error(`Moskee met subdomein '${currentSubdomain}' niet gevonden.`);
      }
      
      // Login with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Ongeldige combinatie van email/wachtwoord.');
        }
        throw new Error(`Authenticatiefout: ${signInError.message}`);
      }
      
      if (!authData.user) {
        throw new Error("Inloggen mislukt, geen gebruiker teruggekregen.");
      }

      // Validate app user exists for this mosque
      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('mosque_id', mosque.id)
        .single();
        
      if (appUserError || !appUser) {
        await supabase.auth.signOut();
        throw new Error('Gebruiker niet gevonden voor deze moskee.');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', appUser.id);
      
      // Belangrijk: zet de state HIER, voordat je navigeert.
      setCurrentUser(appUser);
      localStorage.setItem(`currentUser_${currentSubdomain}`, JSON.stringify(appUser));
      setLoadingUser(false); // Zet laden uit, alles is klaar.
      
      console.log("[AuthContext] Login successful for:", appUser.name, appUser.role, ". Navigating to dashboard.");
      navigate('/dashboard', { replace: true });
      return true;

    } catch (error) {
      console.error('Login error in handleLogin:', error);
      setLoadingUser(false); // Zet laden ook uit bij een fout.
      throw error; // Re-throw de originele error
    }
  }, [currentSubdomain, navigate]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      localStorage.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      console.warn("Logout error:", error);
      // Zelfs bij error, forceer logout
      setCurrentUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const switchSubdomain = useCallback((newSubdomain) => {
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

  const hardResetAuth = useCallback(() => {
    console.log("[AuthContext] HARD RESET AUTH");
    setCurrentUser(null);
    setLoadingUser(false);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    console.log("[AuthContext] Hard reset complete");
  }, []);

  const value = {
    currentUser,
    currentSubdomain,
    loadingUser,
    login: handleLogin,
    logout: handleLogout,
    switchSubdomain,
    hardResetAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};