// src/contexts/AuthContext.js - FIXED VERSION met timeout en loop prevention
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
  
  // Use refs to prevent infinite loops
  const authListenerRef = useRef(null);
  const isProcessingAuth = useRef(false);
  const loadingTimeoutRef = useRef(null);

  // Force stop loading after 10 seconds to prevent infinite loops
  useEffect(() => {
    if (loadingUser) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("[AuthContext] Loading timeout reached, forcing stop");
        setLoadingUser(false);
      }, 10000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadingUser]);

  // Initial setup effect
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

    // Initial session check with timeout
    const checkInitialSession = async () => {
      if (isProcessingAuth.current) {
        console.log("[AuthContext] Already processing auth, skipping initial check");
        return;
      }
      
      setLoadingUser(true);
      isProcessingAuth.current = true;
      
      try {
        console.log("[AuthContext] Checking initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthContext] Error getting session:", error);
          setLoadingUser(false);
          isProcessingAuth.current = false;
          return;
        }
        
        console.log("[AuthContext] Initial session:", session ? 'Found' : 'None');
        
        if (session?.user) {
          try {
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUserError) {
              console.error("[AuthContext] Error fetching app user:", appUserError);
              await supabase.auth.signOut();
              setCurrentUser(null);
              localStorage.removeItem(`currentUser_${detectedSubdomain}`);
            } else if (appUser) {
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
            console.error("[AuthContext] Database error:", dbError);
            await supabase.auth.signOut();
            setCurrentUser(null);
            localStorage.removeItem(`currentUser_${detectedSubdomain}`);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (sessionError) {
        console.error("[AuthContext] Session check failed:", sessionError);
      } finally {
        setLoadingUser(false);
        isProcessingAuth.current = false;
      }
    };
    
    checkInitialSession();
  }, []); // Empty dependency array

  // Auth state listener effect
  useEffect(() => {
    // Cleanup existing listener
    if (authListenerRef.current) {
      console.log("[AuthContext] Cleaning up existing auth listener");
      authListenerRef.current.unsubscribe();
    }

    console.log("[AuthContext] Setting up new auth state listener...");
    
    authListenerRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth state changed:", event);
        
        // Prevent processing multiple auth events simultaneously
        if (isProcessingAuth.current) {
          console.log("[AuthContext] Already processing auth event, skipping");
          return;
        }
        
        isProcessingAuth.current = true;
        setLoadingUser(true);
        const activeSubdomain = getSubdomainFromHostname(window.location.hostname);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log("[AuthContext] Processing SIGNED_IN event");
            
            const { data: appUser, error: appUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (appUserError || !appUser) {
              console.error("[AuthContext] SIGNED_IN: Error fetching appUser:", appUserError);
              await supabase.auth.signOut();
              setCurrentUser(null);
              localStorage.removeItem(`currentUser_${activeSubdomain}`);
            } else {
              setCurrentUser(appUser);
              localStorage.setItem(`currentUser_${activeSubdomain}`, JSON.stringify(appUser));
              console.log("[AuthContext] SIGNED_IN: currentUser set:", appUser);
              
              // Navigate only if currently on login page
              if (window.location.pathname === '/login') {
                navigate('/dashboard', { replace: true });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("[AuthContext] Processing SIGNED_OUT event");
            setCurrentUser(null);
            localStorage.removeItem(`currentUser_${activeSubdomain}`);
            
            if (window.location.pathname !== '/login' && activeSubdomain !== 'register') {
              navigate('/login', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log("[AuthContext] Processing TOKEN_REFRESHED event");
            
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
          console.error("[AuthContext] Error in auth state change handler:", error);
        } finally {
          setLoadingUser(false);
          isProcessingAuth.current = false;
        }
      }
    );

    // Cleanup function
    return () => {
      if (authListenerRef.current) {
        console.log("[AuthContext] Cleaning up auth listener...");
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, []); // Empty dependency array to prevent re-registration

  const handleLogin = useCallback(async (email, password) => {
    if (isProcessingAuth.current) {
      throw new Error('Er wordt al een login verwerkt, wacht even...');
    }
    
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