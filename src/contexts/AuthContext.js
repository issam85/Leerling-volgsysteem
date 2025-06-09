// src/contexts/AuthContext.js - GECORRIGEERDE EN STABIELERE VERSIE
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
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
  const [loadingUser, setLoadingUser] = useState(true); // Start altijd als true
  const navigate = useNavigate();
  
  const isLoggingOut = useRef(false);

  // Harde reset functie, nu simpeler
  const hardResetAuth = useCallback(() => {
    console.log("[AuthContext] HARD RESET AUTH");
    isLoggingOut.current = false;
    setCurrentUser(null);
    setLoadingUser(false);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    console.log("[AuthContext] Hard reset complete");
  }, []);

  // DE ENIGE useEffect DIE OVERBLIJFT VOOR AUTHENTICATIE.
  // Deze listener is de 'single source of truth'.
  useEffect(() => {
    console.log("[AuthContext] Setting up the one and only auth listener...");
    
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth event received: ${event}`);
        
        if (isLoggingOut.current) return;

        // Als er een sessie is (INITIAL_SESSION op load, of SIGNED_IN na login)
        if (session?.user) {
          console.log(`[AuthContext] Session found for event ${event}. Fetching app user...`);
          const { data: appUser, error: appUserError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (appUser && !isLoggingOut.current) {
            setCurrentUser(appUser);
            localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser));
            console.log(`[AuthContext] User set from ${event}:`, appUser.name);
          } else {
            console.warn("[AuthContext] User in session but not in DB or error. Resetting.", appUserError);
            hardResetAuth();
            if (window.location.pathname !== '/login') navigate('/login', { replace: true });
          }
        } 
        // Als er GEEN sessie is (bv. na refresh zonder geldige token, of na logout)
        else {
          console.log(`[AuthContext] No session for event ${event}. Clearing user.`);
          setCurrentUser(null);
        }

        // BELANGRIJK: zet loadingUser altijd op false aan het einde van de check.
        setLoadingUser(false);
      }
    );

    return () => {
      console.log("[AuthContext] Cleaning up auth listener.");
      subscription?.unsubscribe();
    };
  }, [navigate, hardResetAuth]); // Dependencies zijn nu stabiel

  // Login functie
  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Login attempt for:", email);
    try {
      if (!currentSubdomain || currentSubdomain === 'register') throw new Error('Geen geldig subdomein.');
      const { data: mosque } = await supabase.from('mosques').select('id').eq('subdomain', currentSubdomain).single();
      if (!mosque) throw new Error(`Moskee met subdomein '${currentSubdomain}' niet gevonden.`);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: appUser, error: appUserError } = await supabase.from('users').select('*').eq('id', data.user.id).eq('mosque_id', mosque.id).single();
      if (appUserError || !appUser) { await supabase.auth.signOut(); throw new Error('Gebruiker niet gevonden voor deze moskee.'); }
      await supabase.from('users').update({ last_login: new Date() }).eq('id', appUser.id);
      
      // De onAuthStateChange listener zal de `currentUser` state nu bijwerken.
      // We hoeven hier niet handmatig `setCurrentUser` aan te roepen.
      navigate('/dashboard', { replace: true });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message.includes('Invalid login credentials') ? 'Ongeldige combinatie van email/wachtwoord.' : error.message;
      throw new Error(errorMessage);
    }
  }, [currentSubdomain, navigate]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    isLoggingOut.current = true;
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.clear(); // Simpele, effectieve clear
    navigate('/login', { replace: true });
    setTimeout(() => { isLoggingOut.current = false; }, 500);
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