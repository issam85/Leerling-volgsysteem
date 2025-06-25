// src/contexts/AuthContext.js - FINAL CORRECTED VERSION with backend API integration
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { apiCall } from '../services/api';

const AuthContext = createContext(null);

const getSubdomainFromHostname = (hostname) => {
  // Handle localhost/development environments
  if (hostname === 'localhost' || hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return localStorage.getItem('currentSubdomainForDev') || 'al-hijra';
  }

  const parts = hostname.split('.');
  
  // GENERIC LOGIC for production:
  // If hostname has 3+ parts (e.g. test.mijnlvs.nl) AND first part is not 'www'
  if (parts.length >= 3 && parts[0] !== 'www') {
    // First part is the subdomain
    return parts[0];
  }
  
  // For all other cases (e.g. mijnlvs.nl or www.mijnlvs.nl),
  // consider it the main domain and redirect to registration
  return 'register';
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSubdomain, setCurrentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[AuthContext] Setting up auth listener for session restoration.");
    
    // Initialize subdomain handling
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
    
    // Auth state listener for session restoration and external events
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
          // Clear stored user data
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('currentUser_')) {
              localStorage.removeItem(key);
            }
          });
        }

        // After first check, loading is complete
        setLoadingUser(false);
      }
    );

    return () => {
      console.log("[AuthContext] Cleaning up auth listener.");
      subscription?.unsubscribe();
    };
  }, []);

  // ✅ MAIN LOGIN FUNCTION - Uses backend API
  const handleLogin = useCallback(async (email, password) => {
    console.log("[AuthContext] Starting login via backend API...");
    setLoadingUser(true);

    try {
        if (!currentSubdomain || currentSubdomain === 'register') {
            throw new Error('Geen geldig subdomein gevonden voor login.');
        }
        
        console.log("🔍 [AuthContext DEBUG] About to call apiCall...");
        
        // ✅ Call our backend login endpoint
        const result = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password: password,
                subdomain: currentSubdomain,
            })
        });
        
        console.log("🔍 [AuthContext DEBUG] apiCall completed successfully:", result);

        // Backend should return: { success: true, user: {...}, session: {...} }
        if (result.success && result.user && result.session) {
            console.log("[AuthContext] Backend login successful. Setting session...");

            // 1. Tell supabase-js about the session (stores tokens in localStorage)
            const { error: sessionError } = await supabase.auth.setSession(result.session);
            if (sessionError) {
                throw new Error(`Kon de sessie niet instellen: ${sessionError.message}`);
            }
            
            // 2. Set currentUser state
            setCurrentUser(result.user);
            localStorage.setItem(`currentUser_${currentSubdomain}`, JSON.stringify(result.user));
            
            setLoadingUser(false);
            console.log("[AuthContext] Login successful for", result.user.name);
            
            return { success: true };

        } else {
            console.log("🔍 [AuthContext DEBUG] apiCall returned unsuccessful result:", result);
            throw new Error(result.error || "Inloggen mislukt. Onbekende fout van server.");
        }
    } catch (error) {
        console.log("🔍 [AuthContext DEBUG] CATCH BLOCK REACHED!");
        console.log("🔍 [AuthContext DEBUG] Error object:", error);
        console.log("🔍 [AuthContext DEBUG] Error message:", error.message);
        console.log("🔍 [AuthContext DEBUG] Error type:", typeof error);
        console.log("🔍 [AuthContext DEBUG] About to setLoadingUser(false) and throw...");
        
        console.error('Login error in handleLogin:', error.message);
        setLoadingUser(false);
        
        console.log("🔍 [AuthContext DEBUG] Now throwing error...");
        throw error; // Re-throw so LoginPage can catch and display
    }
}, [currentSubdomain]);

  const handleLogout = useCallback(async () => {
    console.log("[AuthContext] Logout initiated");
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      
      // Clear all stored user data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('currentUser_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      navigate('/login', { replace: true });
    } catch (error) {
      console.warn("Logout error:", error);
      // Even on error, force logout
      setCurrentUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const switchSubdomain = useCallback((newSubdomain) => {
    const currentHostname = window.location.hostname;

    // Handle localhost for development
    if (currentHostname === 'localhost' || currentHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        localStorage.setItem('currentSubdomainForDev', newSubdomain);
        window.location.reload();
        return;
    }

    const parts = currentHostname.split('.');
    let newHost;

    // Handle 'mijnlvs.nl' (2 parts) and 'www.mijnlvs.nl' (3 parts with www)
    if (parts.length === 2 || (parts.length === 3 && parts[0] === 'www')) {
        newHost = `${newSubdomain}.${parts.slice(-2).join('.')}`;
    } 
    // Handle replacing existing subdomain like 'register.mijnlvs.nl'
    else if (parts.length === 3) {
        newHost = `${newSubdomain}.${parts.slice(1).join('.')}`;
    } 
    // Fallback for unexpected structures
    else {
        console.warn("Cannot determine how to switch subdomain for hostname:", currentHostname);
        newHost = `${newSubdomain}.mijnlvs.nl`;
    }

    const port = window.location.port ? `:${window.location.port}` : '';
    
    // Redirect to login page of new subdomain
    window.location.href = `${window.location.protocol}//${newHost}${port}/login`;
  }, []);

  const hardResetAuth = useCallback(() => {
    console.warn("[AuthContext] HARD AUTH RESET - Clearing all auth state");
    
    // Force sign out from Supabase
    supabase.auth.signOut();
    
    setCurrentUser(null);
    setLoadingUser(false);
    
    // Clear ALL auth-related localStorage items
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

  // ✅ Enhanced error recovery
  const recoverFromAuthError = useCallback(async () => {
    console.log("[AuthContext] Attempting auth error recovery...");
    
    try {
      // Check if we have a valid session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AuthContext] Session recovery failed:", error);
        hardResetAuth();
        return;
      }
      
      if (session?.user) {
        // Try to fetch user data
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

  const value = {
    currentUser,
    currentSubdomain,
    loadingUser,
    login: handleLogin,
    logout: handleLogout,
    switchSubdomain,
    hardResetAuth,
    recoverFromAuthError, // ✅ New recovery function
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