// src/contexts/AuthContext.js - AGRESSIEVE FIX voor hanging login
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  // Refs to prevent infinite loops and manage state
  const isInitialized = useRef(false);
  const authListenerRef = useRef(null);
  const isLoggingOut = useRef(false);
  const emergencyTimeoutRef = useRef(null);

  // NIEUWE FUNCTIE: Hard reset alles
  const hardResetAuth = useCallback(() => {
    console.log("[AuthContext] HARD RESET AUTH - Clearing everything");
    
    // Stop alle timers
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }
    
    // Reset alle flags
    isLoggingOut.current = false;
    isInitialized.current = false;
    
    // Clear state
    setCurrentUser(null);
    setLoadingUser(false);
    
    // Nuclear option: clear ALL localStorage
    localStorage.clear();
    
    // Force sign out van Supabase (in background, don't wait)
    supabase.auth.signOut().catch(e => console.warn("Signout error during hard reset:", e));
    
    console.log("[AuthContext] Hard reset complete");
  }, []);

  // SNELLE TIMEOUT - slechts 5 seconden
  useEffect(() => {
    if (loadingUser) {
      emergencyTimeoutRef.current = setTimeout(() => {
        console.warn("[AuthContext] EMERGENCY TIMEOUT - 5 seconds");
        hardResetAuth();
      }, 5000); // VERLAAGD naar 5 seconden
    } else {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
    };
  }, [loadingUser, hardResetAuth]);

  // VEREENVOUDIGDE INITIAL SETUP
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log("[AuthContext] Simple initialization...");

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

    // SIMPLE session check - no complex logic
    const quickSessionCheck = async () => {
      try {
        console.log("[AuthContext] Quick session check...");
        
        // Als we al aan het uitloggen zijn, skip
        if (isLoggingOut.current) {
          setLoadingUser(false);
          return;
        }
        
        // Probeer session op te halen met timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.warn("[AuthContext] Session error:", error);
          setLoadingUser(false);
          return;
        }
        
        if (session?.user && !isLoggingOut.current) {
          console.log("[AuthContext] Session found, getting app user...");
          
          // Simple app user fetch
          const { data: appUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (appUser && !isLoggingOut.current) {
            setCurrentUser(appUser);
            localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser));
            console.log("[AuthContext] User set:", appUser.name);
          }
        }
        
      } catch (sessionError) {
        console.warn("[AuthContext] Session check failed:", sessionError.message);
      } finally {
        if (!isLoggingOut.current) {
          setLoadingUser(false);
        }
      }
    };
    
    // Gebruik setTimeout om race conditions te voorkomen
    setTimeout(quickSessionCheck, 100);
  }, []);

  // VEREENVOUDIGDE AUTH LISTENER
  useEffect(() => {
    if (authListenerRef.current) {
      authListenerRef.current.unsubscribe();
    }

    console.log("[AuthContext] Setting up simple auth listener...");
    
    authListenerRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth event:", event);
        
        if (isLoggingOut.current && event !== 'SIGNED_OUT') {
          return;
        }
        
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log("[AuthContext] SIGNED_IN event");
          
          try {
            const { data: appUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUser) {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              setLoadingUser(false);
              
              if (window.location.pathname === '/login') {
                navigate('/dashboard', { replace: true });
              }
            } else {
              hardResetAuth();
            }
          } catch (error) {
            console.error("[AuthContext] Error in SIGNED_IN:", error);
            hardResetAuth();
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("[AuthContext] SIGNED_OUT event");
          hardResetAuth();
          
          if (window.location.pathname !== '/login' && activeSubdomain !== 'register') {
            navigate('/login', { replace: true });
          }
        }
      }
    );

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [navigate, hardResetAuth]);

  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Login attempt for:", email);
    
    // Reset everything before login
    isLoggingOut.current = false;
    setLoadingUser(true);
    
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

      // Login
      const { data: { user: supabaseAuthUser, session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Ongeldige combinatie van email/wachtwoord.');
        }
        throw new Error(`Authenticatiefout: ${signInError.message}`);
      }

      if (!supabaseAuthUser || !session) {
        throw new Error('Ongeldige inlogpoging.');
      }

      // Validate app user
      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseAuthUser.id)
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

      console.log("[AuthContext] Login successful for:", appUser.name);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      hardResetAuth();
      throw error;
    }
  }, [currentSubdomain, hardResetAuth]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    isLoggingOut.current = true;
    
    hardResetAuth();
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout error:", error);
    }
    
    navigate('/login', { replace: true });
    
    setTimeout(() => {
      isLoggingOut.current = false;
    }, 100);
  }, [navigate, hardResetAuth]);

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
    setCurrentUser,
    setLoadingUser,
    hardResetAuth
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