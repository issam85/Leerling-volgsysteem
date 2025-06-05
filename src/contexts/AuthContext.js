// src/contexts/AuthContext.js - GEBALANCEERDE FIX
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
  const loginInProgress = useRef(false); // NEW: Track login progress

  // FUNCTIE: Smart reset (alleen als echt nodig)
  const smartResetAuth = useCallback((reason = 'unknown') => {
    console.log("[AuthContext] SMART RESET AUTH - Reason:", reason);
    
    // Stop alle timers
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }
    
    // Reset flags
    isLoggingOut.current = false;
    loginInProgress.current = false;
    
    // Clear state
    setCurrentUser(null);
    setLoadingUser(false);
    
    // Clear only auth-related localStorage, not everything
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Force sign out van Supabase (in background)
    supabase.auth.signOut().catch(e => console.warn("Signout error during reset:", e));
    
    console.log("[AuthContext] Smart reset complete");
  }, []);

  // TIMEOUT ALLEEN VOOR INITIAL LOADING, NIET TIJDENS LOGIN
  useEffect(() => {
    if (loadingUser && !loginInProgress.current) {
      emergencyTimeoutRef.current = setTimeout(() => {
        console.warn("[AuthContext] EMERGENCY TIMEOUT - 4 seconds for initial load");
        smartResetAuth('emergency_timeout');
      }, 4000); // Verder verlaagd naar 4 seconden
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
  }, [loadingUser, smartResetAuth]);

  // INITIAL SETUP - meer defensief
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

    // SAFE session check
    const checkInitialSession = async () => {
      try {
        console.log("[AuthContext] Checking initial session...");
        
        if (isLoggingOut.current) {
          setLoadingUser(false);
          return;
        }
        
        // Session check met timeout - GUARANTEED om loading te stoppen
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000) // Verlaagd naar 3 seconden
        );
        
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          const { data: { session }, error } = result;
          
          if (error) {
            console.warn("[AuthContext] Session error:", error);
            return; // Will hit finally block
          }
          
          if (session?.user && !isLoggingOut.current) {
            console.log("[AuthContext] Session found, getting app user...");
            
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
                console.log("[AuthContext] Initial user set:", appUser.name, appUser.role);
              } else {
                console.warn("[AuthContext] No app user found for session user");
                await supabase.auth.signOut();
              }
            } catch (dbError) {
              console.error("[AuthContext] Error fetching app user:", dbError);
              await supabase.auth.signOut();
            }
          } else {
            console.log("[AuthContext] No initial session found");
          }
        } catch (sessionError) {
          console.warn("[AuthContext] Session check failed:", sessionError.message);
          // Continue to finally block - will stop loading
        }
        
      } catch (outerError) {
        console.warn("[AuthContext] Outer session check error:", outerError.message);
      } finally {
        // GUARANTEED loading stop - no matter what happens above
        console.log("[AuthContext] Session check complete - stopping loading");
        if (!isLoggingOut.current) {
          setLoadingUser(false);
        }
      }
    };
    
    // Kleine delay om race conditions te voorkomen
    setTimeout(checkInitialSession, 200);
  }, []);

  // AUTH LISTENER - defensief
  useEffect(() => {
    if (authListenerRef.current) {
      authListenerRef.current.unsubscribe();
    }

    console.log("[AuthContext] Setting up auth listener...");
    
    authListenerRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth event:", event, session ? 'with session' : 'no session');
        
        // Skip events tijdens logout behalve SIGNED_OUT
        if (isLoggingOut.current && event !== 'SIGNED_OUT') {
          console.log("[AuthContext] Skipping event during logout:", event);
          return;
        }
        
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log("[AuthContext] SIGNED_IN event - fetching app user");
            loginInProgress.current = false; // Reset login progress
            
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUserError) {
              console.error("[AuthContext] App user error:", appUserError);
              throw appUserError;
            }

            if (appUser) {
              console.log("[AuthContext] Setting user from SIGNED_IN:", appUser.name, appUser.role);
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              setLoadingUser(false);
              
              // Navigate alleen als we op login pagina zijn
              if (window.location.pathname === '/login') {
                console.log("[AuthContext] Navigating from login to dashboard");
                navigate('/dashboard', { replace: true });
              }
            } else {
              console.warn("[AuthContext] No app user found in SIGNED_IN");
              smartResetAuth('no_app_user');
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("[AuthContext] SIGNED_OUT event");
            smartResetAuth('signed_out');
            
            // Navigate naar login alleen als niet al daar
            if (window.location.pathname !== '/login' && activeSubdomain !== 'register') {
              navigate('/login', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log("[AuthContext] TOKEN_REFRESHED");
            
            const { data: appUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (appUser) {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
            }
          }
        } catch (error) {
          console.error("[AuthContext] Error in auth state change:", error);
          smartResetAuth('auth_error');
        }
      }
    );

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [navigate, smartResetAuth]);

  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Login attempt for:", email);
    
    // Set login in progress flag
    loginInProgress.current = true;
    isLoggingOut.current = false;
    setLoadingUser(true);
    
    // Clear emergency timeout tijdens login
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }
    
    try {
      if (!currentSubdomain || currentSubdomain === 'register') {
        throw new Error('Geen geldig subdomein gevonden voor login.');
      }

      console.log("[AuthContext] Checking mosque for subdomain:", currentSubdomain);

      // Get mosque
      const { data: mosque, error: mosqueError } = await supabase
        .from('mosques')
        .select('id')
        .eq('subdomain', currentSubdomain.toLowerCase().trim())
        .single();
      
      if (mosqueError || !mosque) {
        throw new Error(`Moskee met subdomein '${currentSubdomain}' niet gevonden.`);
      }

      console.log("[AuthContext] Mosque found, performing authentication...");

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

      console.log("[AuthContext] Authentication successful, validating app user...");

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
      
      // Auth listener will handle the rest
      return true;

    } catch (error) {
      console.error('Login error:', error);
      loginInProgress.current = false;
      setLoadingUser(false);
      throw error;
    }
  }, [currentSubdomain]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    isLoggingOut.current = true;
    loginInProgress.current = false;
    
    smartResetAuth('manual_logout');
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout error:", error);
    }
    
    navigate('/login', { replace: true });
    
    setTimeout(() => {
      isLoggingOut.current = false;
    }, 500);
  }, [navigate, smartResetAuth]);

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

  // Emergency reset for manual use
  const hardResetAuth = useCallback(() => {
    smartResetAuth('manual_hard_reset');
  }, [smartResetAuth]);

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