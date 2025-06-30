// src/contexts/AuthContext.js - FIXED VERSION - Clean error handling zonder race conditions

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { apiCall } from '../services/api';

const AuthContext = createContext(null);

const getSubdomainFromHostname = (hostname) => {
  if (hostname === 'localhost' || hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return localStorage.getItem('currentSubdomainForDev') || 'al-hijra';
  }

  const parts = hostname.split('.');
  
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
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
        console.log(`[AuthContext] Auth event: ${event}. Session available: ${!!session}`);

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
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('currentUser_')) {
              localStorage.removeItem(key);
            }
          });
        }

        setLoadingUser(false);
      }
    );

    return () => {
      console.log("[AuthContext] Cleaning up auth listener.");
      subscription?.unsubscribe();
    };
  }, []);

  // ✅ FIXED: Clean login function - alleen error handling, geen navigatie
  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Starting login via backend API...");

    try {
        if (!currentSubdomain || currentSubdomain === 'register') {
            throw new Error('Geen geldig subdomein gevonden voor login.');
        }
        
        console.log("[AuthContext] Calling backend login API...");
        
        const result = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password: password,
                subdomain: currentSubdomain,
            })
        });
        
        console.log("[AuthContext] API call completed:", result);

        if (result.success && result.user && result.session) {
            console.log("[AuthContext] Backend login successful. Setting session...");

            // 1. Stel Supabase sessie in
            const { error: sessionError } = await supabase.auth.setSession(result.session);
            if (sessionError) {
                throw new Error(`Kon de sessie niet instellen: ${sessionError.message}`);
            }
            
            // 2. Stel currentUser state in
            setCurrentUser(result.user);
            localStorage.setItem(`currentUser_${currentSubdomain}`, JSON.stringify(result.user));
            
            console.log("[AuthContext] Login successful for", result.user.name);
            
            // ✅ FIXED: Geen navigatie hier - dat doet LoginPage.js
            return { success: true };

        } else {
            throw new Error(result.error || "Inloggen mislukt. Onbekende fout van server.");
        }
    } catch (error) {
        console.error('[AuthContext] Login error:', error.message);
        
        // ✅ FIXED: Gewoon de error doorsturen, geen loading state management
        throw error;
    }
}, [currentSubdomain]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      navigate('/login', { replace: true });
    } catch (error) {
      console.warn("Logout error:", error);
      setCurrentUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const switchSubdomain = useCallback((newSubdomain) => {
    const currentHostname = window.location.hostname;

    if (currentHostname === 'localhost' || currentHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        localStorage.setItem('currentSubdomainForDev', newSubdomain);
        window.location.reload();
        return;
    }

    const parts = currentHostname.split('.');
    let newHost;

    if (parts.length === 2 || (parts.length === 3 && parts[0] === 'www')) {
        newHost = `${newSubdomain}.${parts.slice(-2).join('.')}`;
    } 
    else if (parts.length === 3) {
        newHost = `${newSubdomain}.${parts.slice(1).join('.')}`;
    } 
    else {
        console.warn("Cannot determine how to switch subdomain for hostname:", currentHostname);
        newHost = `${newSubdomain}.mijnlvs.nl`;
    }

    const port = window.location.port ? `:${window.location.port}` : '';
    window.location.href = `${window.location.protocol}//${newHost}${port}/login`;
  }, []);

  const hardResetAuth = useCallback(() => {
    console.warn("[AuthContext] HARD AUTH RESET - Clearing all auth state");
    
    supabase.auth.signOut();
    setCurrentUser(null);
    setLoadingUser(false);
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('currentUser_') || 
          key.startsWith('sb-') || 
          key.startsWith('currentSubdomainForDev')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log("[AuthContext] Hard reset complete - reloading page");
    window.location.reload();
  }, []);

  const recoverFromAuthError = useCallback(async () => {
    console.log("[AuthContext] Attempting auth error recovery...");
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AuthContext] Session recovery failed:", error);
        hardResetAuth();
        return;
      }
      
      if (session?.user) {
        const { data: appUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (appUser) {
          setCurrentUser(appUser);
          setLoadingUser(false);
          console.log("[AuthContext] Recovery successful for:", appUser.name);
        } else {
          console.warn("[AuthContext] User not found during recovery");
          hardResetAuth();
        }
      } else {
        console.log("[AuthContext] No session during recovery");
        setCurrentUser(null);
        setLoadingUser(false);
      }
    } catch (error) {
      console.error("[AuthContext] Recovery failed:", error);
      hardResetAuth();
    }
  }, [hardResetAuth]);

  const resetLoadingUser = useCallback(() => {
    console.log("[AuthContext] Manually resetting loadingUser to false");
    setLoadingUser(false);
  }, []);

  const value = {
      currentUser,
      currentSubdomain,
      loadingUser,
      login: handleLogin,
      logout: handleLogout,
      switchSubdomain,
      hardResetAuth,
      recoverFromAuthError,
      resetLoadingUser,
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