// src/contexts/AuthContext.js - MINIMAL VERSION om loop te stoppen
import React, { createContext, useState, useContext, useCallback } from 'react';
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
  const [currentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
  const [loadingUser, setLoadingUser] = useState(false); // Start with FALSE to stop loop
  const navigate = useNavigate();

  const handleLogin = useCallback(async (email, password) => {
    setLoadingUser(true);
    console.log("[AuthContext] Minimal login attempt for:", email);
    
    try {
      // Validate subdomain
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

      // Get app user
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

      // Set user and navigate - MANUAL
      setCurrentUser(appUser);
      localStorage.setItem(`currentUser_${currentSubdomain}`, JSON.stringify(appUser));
      
      console.log("[AuthContext] Login successful, navigating to dashboard");
      navigate('/dashboard', { replace: true });
      
      setLoadingUser(false);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      setCurrentUser(null);
      localStorage.removeItem(`currentUser_${currentSubdomain}`);
      setLoadingUser(false);
      throw error;
    }
  }, [currentSubdomain, navigate]);

  const handleLogout = useCallback(async () => {
    setLoadingUser(true);
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      localStorage.removeItem(`currentUser_${currentSubdomain}`);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoadingUser(false);
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