import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { apiCall } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

const getSubdomainFromHostname = (hostname) => {
  const parts = hostname.split('.');
  if (hostname === 'localhost' || hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      // Voor localhost of direct IP, probeer localStorage of default
      return localStorage.getItem('currentSubdomainForDev') || 'al-hijra'; // Default voor dev
  }
  if (parts.length >= 3 && parts[0] !== 'www') { // Typisch sub.mijndomein.nl
    if (['al-hijra', 'al-noor', 'register'].includes(parts[0])) {
      return parts[0];
    }
  }
  // Fallback als geen bekend subdomein, of basisdomein (mijnlvs.nl)
  // Op mijnlvs.nl zelf zou je misschien naar 'register' willen redirecten.
  return 'register'; // Of een andere logische default
};


export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSubdomain, setCurrentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const detectedSubdomain = getSubdomainFromHostname(window.location.hostname);
    if (window.location.hostname === 'localhost') {
        // Om subdomain te simuleren in dev
        const storedDevSubdomain = localStorage.getItem('currentSubdomainForDev');
        if (storedDevSubdomain && storedDevSubdomain !== detectedSubdomain) {
            setCurrentSubdomain(storedDevSubdomain);
        } else if (!storedDevSubdomain) {
            localStorage.setItem('currentSubdomainForDev', detectedSubdomain); // Sla de default op
        }
    } else {
        setCurrentSubdomain(detectedSubdomain);
    }

    const userStorageKey = `currentUser_${detectedSubdomain}`;
    const savedUser = localStorage.getItem(userStorageKey);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem(userStorageKey);
      }
    }
    setLoadingUser(false);
  }, [location.pathname]); // Re-check op pathname change kan helpen bij SPA navigatie die subdomein zou moeten veranderen

  const handleLogin = useCallback(async (email, password) => {
    setLoadingUser(true);
    try {
      const result = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          subdomain: currentSubdomain,
        }),
      });
      // Je backend geeft { success: true, user: ... } terug
      if (result.success && result.user) {
        setCurrentUser(result.user);
        localStorage.setItem(`currentUser_${currentSubdomain}`, JSON.stringify(result.user));
        setLoadingUser(false);
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
        return true;
      } else {
        // Als backend { success: false, error: "message"} teruggeeft
        throw new Error(result.error || 'Ongeldige inloggegevens');
      }
    } catch (error) {
      console.error('Login error:', error);
      setCurrentUser(null);
      setLoadingUser(false);
      throw error; // Wordt gevangen in LoginPage
    }
  }, [currentSubdomain, navigate, location.state]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(`currentUser_${currentSubdomain}`);
    // Andere contexts resetten indien nodig (bijv. DataContext)
    navigate('/login');
  }, [navigate, currentSubdomain]);

  const switchSubdomain = useCallback((newSubdomain) => {
    const currentHostname = window.location.hostname;
    if (currentHostname === 'localhost') {
        localStorage.setItem('currentSubdomainForDev', newSubdomain);
        window.location.reload(); // Simuleer herlaad voor dev
        return;
    }

    const parts = currentHostname.split('.');
    let newHost;
    if (parts.length >= 3 && parts[0] !== 'www') { // sub.domein.tld
        newHost = `${newSubdomain}.${parts.slice(1).join('.')}`;
    } else if (parts.length === 2) { // domein.tld (wordt sub.domein.tld)
        newHost = `${newSubdomain}.${currentHostname}`;
    } else { // Onverwachte host, fallback
        console.warn("Cannot determine how to switch subdomain for hostname:", currentHostname);
        newHost = currentHostname; // Geen verandering
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