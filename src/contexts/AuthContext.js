// src/contexts/AuthContext.js - VOLLEDIGE VERSIE met loop fixes
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
  const isLoggingOut = useRef(false); // NEW: Track logout state

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

    // Initial session check
    const checkInitialSession = async () => {
      try {
        console.log("[AuthContext] Checking initial session...");
        
        // Don't check session if we're logging out
        if (isLoggingOut.current) {
          console.log("[AuthContext] Skipping initial session check - logout in progress");
          setLoadingUser(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
              console.log("[AuthContext] Initial appUser set:", appUser);
            } else {
              console.warn("[AuthContext] No matching appUser found. Logging out.");
              await supabase.auth.signOut();
              setCurrentUser(null);
              // Clear all auth localStorage
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
                  localStorage.removeItem(key);
                }
              });
            }
          } catch (dbError) {
            console.error("[AuthContext] Error fetching appUser:", dbError);
            await supabase.auth.signOut();
            setCurrentUser(null);
            // Clear all auth localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
          }
        }
      } catch (sessionError) {
        console.error("[AuthContext] Session check failed:", sessionError);
      } finally {
        if (!isLoggingOut.current) {
          setLoadingUser(false);
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
        if (isLoggingOut.current) {
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
              console.log("[AuthContext] SIGNED_IN: currentUser set:", appUser);
              
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
            setCurrentUser(null);
            
            // Clear ALL auth-related localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
            
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
        }
      }
    );

    return () => {
      console.log("[AuthContext] Cleaning up auth listener...");
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, []); // Empty deps - runs once

  const handleLogin = useCallback(async (email, password) => {
    setLoadingUser(true);
    console.log("[AuthContext] Direct Supabase login attempt for:", email);
    
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

      console.log("[AuthContext] Direct Supabase login successful for:", appUser.email);
      
      // Auth state change listener will handle the rest
      setLoadingUser(false);
      return true;

    } catch (error) {
      console.error('AuthContext direct Supabase login error:', error);
      setCurrentUser(null);
      localStorage.removeItem(`currentUser_${currentSubdomain}`);
      setLoadingUser(false);
      throw error;
    }
  }, [currentSubdomain]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    isLoggingOut.current = true; // Set logout flag
    
    try {
      // Clear user state immediately to prevent any loops
      setCurrentUser(null);
      setLoadingUser(false);
      
      // Clear ALL auth-related localStorage immediately
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Then sign out from Supabase (this will trigger SIGNED_OUT event)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during Supabase signOut:", error);
      }
      
      // Force navigate to login immediately
      console.log("[AuthContext] Force navigating to login");
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even on error, navigate to login
      navigate('/login', { replace: true });
    } finally {
      // Reset logout flag after a delay to ensure cleanup is complete
      setTimeout(() => {
        isLoggingOut.current = false;
      }, 1000);
    }
  }, [currentSubdomain, navigate]);

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