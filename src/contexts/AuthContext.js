// src/contexts/AuthContext.js - DEFINITIEVE FIX voor Supabase v2
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
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSubdomain, setCurrentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Effect voor het instellen van het subdomein en de initiële sessie check
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

    // Check de initiële Supabase sessie
    const checkInitialSession = async () => {
        setLoadingUser(true);
        try {
          console.log("[AuthContext] Checking initial session...");
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error("[AuthContext] Error getting session:", error);
            setLoadingUser(false);
            return;
          }
          
          console.log("[AuthContext] Initial session:", session ? 'Found' : 'None');
          if (session?.user) {
              try {
                  const { data: appUser, error } = await supabase
                      .from('users')
                      .select('*')
                      .eq('id', session.user.id)
                      .single();

                  if (error) throw error;
                  
                  if (appUser) {
                      setCurrentUser(appUser);
                      localStorage.setItem(`currentUser_${detectedSubdomain}`, JSON.stringify(appUser));
                      console.log("[AuthContext] Initial appUser set:", appUser);
                  } else {
                      console.warn("[AuthContext] No matching appUser found. Logging out.");
                      await supabase.auth.signOut();
                      setCurrentUser(null);
                      localStorage.removeItem(`currentUser_${detectedSubdomain}`);
                  }
              } catch (dbError) {
                  console.error("[AuthContext] Error fetching appUser:", dbError);
                  await supabase.auth.signOut();
                  setCurrentUser(null);
                  localStorage.removeItem(`currentUser_${detectedSubdomain}`);
              }
          }
        } catch (sessionError) {
          console.error("[AuthContext] Session check failed:", sessionError);
        } finally {
          setLoadingUser(false);
        }
    };
    
    checkInitialSession();
  }, []);

  // Effect voor Supabase auth state listener - FIXED voor v2
  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener...");
    
    // Supabase v2 syntax - subscription object wordt direct geretourneerd
    const subscription = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth state changed:", event, session ? 'Session exists' : 'No session');
        setLoadingUser(true);
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log("[AuthContext] User signed in, fetching app user...");
            try {
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
              } else {
                console.warn("[AuthContext] SIGNED_IN: No appUser found. Forcing logout.");
                await supabase.auth.signOut();
              }
            } catch (error) {
              console.error("[AuthContext] SIGNED_IN: Error fetching appUser:", error);
              await supabase.auth.signOut();
              setCurrentUser(null);
              localStorage.removeItem(`currentUser_${activeSubdomain}`);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("[AuthContext] User signed out");
            setCurrentUser(null);
            localStorage.removeItem(`currentUser_${activeSubdomain}`);
            if (location.pathname !== '/login' && activeSubdomain !== 'register') {
              navigate('/login', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log("[AuthContext] Token refreshed");
            try {
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
            } catch (error) {
                console.error("[AuthContext] TOKEN_REFRESHED: Error updating appUser:", error);
            }
          }
        } catch (error) {
          console.error("[AuthContext] Error in auth state change handler:", error);
        } finally {
          setLoadingUser(false);
        }
      }
    );

    // Cleanup - FIXED voor v2: direct unsubscribe op subscription
    return () => {
      console.log("[AuthContext] Cleaning up auth listener...");
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [navigate, location.pathname]);

  const handleLogin = useCallback(async (email, password) => {
    setLoadingUser(true);
    console.log("[AuthContext] Login attempt for:", email);
    
    try {
      const result = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          subdomain: currentSubdomain,
        }),
      });

      console.log("[AuthContext] Login API result:", result);

      if (result.success && result.user) {
        setLoadingUser(false);
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
        return true;
      } else {
        throw new Error(result.error || 'Ongeldige inloggegevens of serverfout.');
      }
    } catch (error) {
      console.error('AuthContext login error:', error);
      setCurrentUser(null);
      localStorage.removeItem(`currentUser_${currentSubdomain}`);
      setLoadingUser(false);
      throw error;
    }
  }, [currentSubdomain, navigate, location.state]);

  const handleLogout = useCallback(async () => {
    setLoadingUser(true);
    console.log("[AuthContext] Logout initiated");
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during Supabase signOut:", error);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoadingUser(false);
    }
  }, []);

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