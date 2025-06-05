// src/contexts/AuthContext.js - MINIMALE FIX - alleen logout aangepast
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

  // FUNCTIE: Reset functie voor emergencies
  const hardResetAuth = useCallback(() => {
    console.log("[AuthContext] HARD RESET AUTH");
    
    // Stop alle timers
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }
    
    // Reset flags
    isLoggingOut.current = false;
    
    // Clear state
    setCurrentUser(null);
    setLoadingUser(false);
    
    // Clear auth localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log("[AuthContext] Hard reset complete");
  }, []);

  // EMERGENCY TIMEOUT - alleen voor initial load
  useEffect(() => {
    if (loadingUser) {
      emergencyTimeoutRef.current = setTimeout(() => {
        console.warn("[AuthContext] EMERGENCY TIMEOUT - 6 seconds");
        hardResetAuth();
      }, 6000);
    } else {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
      }
    };
  }, [loadingUser, hardResetAuth]);

  // INITIAL SETUP
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log("[AuthContext] Initialization...");

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

    // Simple session check
    const checkInitialSession = async () => {
      try {
        console.log("[AuthContext] Checking initial session...");
        
        if (isLoggingOut.current) {
          setLoadingUser(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn("[AuthContext] Session error:", error);
          setLoadingUser(false);
          return;
        }
        
        if (session?.user && !isLoggingOut.current) {
          console.log("[AuthContext] Session found, getting app user...");
          
          const { data: appUser, error: appUserError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (appUser && !isLoggingOut.current) {
            setCurrentUser(appUser);
            localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser));
            console.log("[AuthContext] Initial user set:", appUser.name, appUser.role);
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
    
    setTimeout(checkInitialSession, 200);
  }, []);

  // AUTH LISTENER
  useEffect(() => {
    if (authListenerRef.current) {
      try {
        if (typeof authListenerRef.current.unsubscribe === 'function') {
          authListenerRef.current.unsubscribe();
        } else if (typeof authListenerRef.current === 'function') {
          authListenerRef.current();
        }
      } catch (e) {
        console.warn("[AuthContext] Cleanup error:", e);
      }
    }

    console.log("[AuthContext] Setting up auth listener...");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth event:", event);
        
        if (isLoggingOut.current && event !== 'SIGNED_OUT') {
          return;
        }
        
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname);

        try {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            console.log("[AuthContext] AUTH EVENT with session:", event);
            
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUser) {
              console.log("[AuthContext] Setting user from", event + ":", appUser.name, appUser.role);
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              setLoadingUser(false);
              
              // Navigation voor beide events
              if (window.location.pathname === '/login') {
                console.log("[AuthContext] Navigating to dashboard from", event);
                setTimeout(() => {
                  navigate('/dashboard', { replace: true });
                }, 100);
              }
            } else {
              console.warn("[AuthContext] No app user found");
              hardResetAuth();
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("[AuthContext] SIGNED_OUT event");
            hardResetAuth();
            
            if (window.location.pathname !== '/login' && activeSubdomain !== 'register') {
              navigate('/login', { replace: true });
            }
          }
        } catch (error) {
          console.error("[AuthContext] Error in auth state change:", error);
          hardResetAuth();
        }
      }
    );

    authListenerRef.current = subscription;

    return () => {
      if (authListenerRef.current) {
        try {
          if (typeof authListenerRef.current.unsubscribe === 'function') {
            authListenerRef.current.unsubscribe();
          } else if (typeof authListenerRef.current === 'function') {
            authListenerRef.current();
          }
        } catch (e) {
          console.warn("[AuthContext] Cleanup error:", e);
        }
        authListenerRef.current = null;
      }
    };
  }, [navigate, hardResetAuth]);

  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Login attempt for:", email);
    
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

      console.log("[AuthContext] Login completed successfully for:", appUser.name, appUser.role);
      
      return true;

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [currentSubdomain]);

  // 🚨 ENIGE VERANDERING: Verbeterde logout functie
  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    isLoggingOut.current = true;
    
    try {
      // STAP 1: Direct state clearen
      setCurrentUser(null);
      setLoadingUser(false);
      
      // STAP 2: LocalStorage clearen
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // STAP 3: Supabase logout (fire and forget)
      supabase.auth.signOut().catch(e => console.warn("Supabase logout error:", e));
      
      // STAP 4: Direct navigeren
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.warn("Logout error:", error);
      // Zelfs bij error, forceer logout
      setCurrentUser(null);
      setLoadingUser(false);
      navigate('/login', { replace: true });
    } finally {
      // Reset logout flag na korte delay
      setTimeout(() => {
        isLoggingOut.current = false;
      }, 500);
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