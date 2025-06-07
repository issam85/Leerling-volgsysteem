// src/contexts/AuthContext.js - VEREENVOUDIGDE EN ROBUUSTE VERSIE

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
    const [currentSubdomain, setCurrentSubdomain] = useState(() => getSubdomainFromHostname(window.location.hostname));
    const [loadingUser, setLoadingUser] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // De onAuthStateChange listener is de ENIGE 'source of truth' voor de auth status.
        // Het handelt de initiële sessie (INITIAL_SESSION), inloggen (SIGNED_IN) en uitloggen (SIGNED_OUT) perfect af.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthContext] Auth event: ${event}`);
            
            if (session?.user) {
                // Gebruiker is ingelogd, haal de details op uit de 'users' tabel.
                const { data: appUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                setCurrentUser(appUser || null); // Zet gebruiker, of null als niet gevonden in onze DB.
            } else {
                // Geen sessie, gebruiker is niet ingelogd.
                setCurrentUser(null);
            }
            // Klaar met de initiële check.
            setLoadingUser(false);
        });

        return () => {
            // Maak de listener schoon als het component wordt verwijderd.
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // De onAuthStateChange listener hierboven regelt de rest.
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null); // Forceer direct de state naar null voor snelle UI update.
        navigate('/login', { replace: true });
    };
    
    // De rest van de functies blijven hetzelfde...
    const switchSubdomain = (newSubdomain) => { /* ... je bestaande code ... */ };

    const value = { currentUser, loadingUser, currentSubdomain, login, logout, switchSubdomain };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};