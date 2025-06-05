// src/contexts/AuthContext.js - FIXED VERSION met loading hang oplossing
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
  const sessionCheckTimeoutRef = useRef(null); // NEW: Timeout for session check

  // NIEUWE FUNCTIE: Force reset van de auth state
  const forceResetAuth = useCallback(() => {
    console.log("[AuthContext] FORCE RESET AUTH STATE");
    isLoggingOut.current = false;
    setCurrentUser(null);
    setLoadingUser(false);
    
    // Clear ALL localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear any pending timeouts
    if (sessionCheckTimeoutRef.current) {
      clearTimeout(sessionCheckTimeoutRef.current);
      sessionCheckTimeoutRef.current = null;
    }
  }, []);

  // Initial setup effect - runs once
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

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

    // Initial session check with timeout protection
    const checkInitialSession = async () => {
      try {
        console.log("[AuthContext] Checking initial session...");
        
        // NIEUW: Timeout protection voor session check
        sessionCheckTimeoutRef.current = setTimeout(() => {
          console.warn("[AuthContext] Session check timeout - forcing reset");
          forceResetAuth();
        }, 10000); // 10 seconden timeout

        // Don't check session if we're logging out
        if (isLoggingOut.current) {
          console.log("[AuthContext] Skipping initial session check - logout in progress");
          setLoadingUser(false);
          if (sessionCheckTimeoutRef.current) {
            clearTimeout(sessionCheckTimeoutRef.current);
            sessionCheckTimeoutRef.current = null;
          }
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clear timeout - we got a response
        if (sessionCheckTimeoutRef.current) {
          clearTimeout(sessionCheckTimeoutRef.current);
          sessionCheckTimeoutRef.current = null;
        }
        
        if (error) {
          console.error("[AuthContext] Error getting session:", error);
          setLoadingUser(false);
          return;
        }
        
        console.log("[AuthContext] Initial session:", session ? 'Found' : 'None');
        
        if (session?.user && !isLoggingOut.current) {
          try {
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUserError) throw appUserError;
            
            if (appUser && !isLoggingOut.current) {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser));
              console.log("[AuthContext] Initial appUser set:", appUser.name);
            } else {
              console.warn("[AuthContext] No matching appUser found. Logging out.");
              await supabase.auth.signOut();
              forceResetAuth();
            }
          } catch (dbError) {
            console.error("[AuthContext] Error fetching appUser:", dbError);
            await supabase.auth.signOut();
            forceResetAuth();
          }
        }
      } catch (sessionError) {
        console.error("[AuthContext] Session check failed:", sessionError);
        forceResetAuth();
      } finally {
        if (!isLoggingOut.current) {
          setLoadingUser(false);
        }
        // Ensure timeout is cleared
        if (sessionCheckTimeoutRef.current) {
          clearTimeout(sessionCheckTimeoutRef.current);
          sessionCheckTimeoutRef.current = null;
        }
      }
    };
    
    checkInitialSession();
  }, []); // Empty deps - runs once

  // Auth state listener effect - runs once
  useEffect(() => {
    if (authListenerRef.current) {
      authListenerRef.current.unsubscribe();
    }

    console.log("[AuthContext] Setting up auth state listener...");
    
    authListenerRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth state changed:", event, session ? 'Session exists' : 'No session');
        
        // Skip processing if we're in the middle of logout
        if (isLoggingOut.current && event !== 'SIGNED_OUT') {
          console.log("[AuthContext] Skipping auth event during logout:", event);
          return;
        }
        
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log("[AuthContext] User signed in, fetching app user...");
            
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUserError) throw appUserError;

            if (appUser) {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              console.log("[AuthContext] SIGNED_IN: currentUser set:", appUser.name);
              
              // Reset loading state
              setLoadingUser(false);
              
              // Navigate to dashboard if on login page
              if (window.location.pathname === '/login') {
                navigate('/dashboard', { replace: true });
              }
            } else {
              console.warn("[AuthContext] SIGNED_IN: No appUser found. Forcing logout.");
              await supabase.auth.signOut();
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("[AuthContext] User signed out");
            forceResetAuth();
            
            // Only navigate if not already on login page
            if (window.location.pathname !== '/login' && activeSubdomain !== 'register') {
              console.log("[AuthContext] Navigating to login after logout");
              navigate('/login', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log("[AuthContext] Token refreshed");
            
            const { data: appUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (appUser) {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              console.log("[AuthContext] TOKEN_REFRESHED: currentUser updated.");
            }
          }
        } catch (error) {
          console.error("[AuthContext] Error in auth state change handler:", error);
          forceResetAuth();
        }
      }
    );

    return () => {
      console.log("[AuthContext] Cleaning up auth listener...");
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
        sessionCheckTimeoutRef.current = null;
      }
    };
  }, []); // Empty deps - runs once

  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Login attempt started for:", email);
    
    // NIEUW: Reset any hanging states
    isLoggingOut.current = false;
    if (sessionCheckTimeoutRef.current) {
      clearTimeout(sessionCheckTimeoutRef.current);
      sessionCheckTimeoutRef.current = null;
    }
    
    setLoadingUser(true);
    
    try {
      if (!currentSubdomain || currentSubdomain === 'register') {
        throw new Error('Geen geldig subdomein gevonden voor login.');
      }

      // Get mosque for validation
      const { data: mosque, error: mosqueError } = await supabase
        .from('mosques')
        .select('id')
        .eq('subdomain', currentSubdomain.toLowerCase().trim())
        .single();
      
      if (mosqueError || !mosque) {
        throw new Error(`Moskee met subdomein '${currentSubdomain}' niet gevonden.`);
      }

      console.log("[AuthContext] Mosque found, performing login...");

      // Perform login
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
        throw new Error('Ongeldige inlogpoging, geen gebruiker of sessie ontvangen.');
      }

      console.log("[AuthContext] Supabase auth successful, validating app user...");

      // Validate app user belongs to correct mosque
      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseAuthUser.id)
        .eq('mosque_id', mosque.id)
        .single();

      if (appUserError || !appUser) {
        await supabase.auth.signOut();
        throw new Error('Gebruiker gevonden in authenticatiesysteem, maar niet in applicatiedatabase voor deze moskee of gegevens inconsistent.');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', appUser.id);

      console.log("[AuthContext] Login successful for:", appUser.name, appUser.role);
      
      // Auth state change listener will handle the rest
      return true;

    } catch (error) {
      console.error('AuthContext login error:', error);
      forceResetAuth();
      throw error;
    }
  }, [currentSubdomain, forceResetAuth]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    isLoggingOut.current = true;
    
    try {
      // Clear user state immediately
      setCurrentUser(null);
      setLoadingUser(false);
      
      // Clear ALL auth-related localStorage immediately
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear any pending timeouts
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
        sessionCheckTimeoutRef.current = null;
      }
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during Supabase signOut:", error);
      }
      
      // Force navigate to login immediately
      console.log("[AuthContext] Force navigating to login");
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error("Logout error:", error);
      navigate('/login', { replace: true });
    } finally {
      // Reset logout flag much faster
      setTimeout(() => {
        isLoggingOut.current = false;
        console.log("[AuthContext] Logout flag reset");
      }, 100); // VERLAAGD van 1000ms naar 100ms
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

  const value = {
    currentUser,
    currentSubdomain,
    loadingUser,
    login: handleLogin,
    logout: handleLogout,
    switchSubdomain,
    setCurrentUser,
    setLoadingUser,
    forceResetAuth // NIEUW: Expose force reset functie
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