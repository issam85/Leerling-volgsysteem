// src/pages/LoginPage.js - Met Emergency Reset functionaliteit
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext'; 
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import LogoMijnLVS from '../assets/logo-mijnlvs.png'; // zorg dat dit pad klopt

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showEmergencyReset, setShowEmergencyReset] = useState(false);
  const { login, currentUser, loadingUser, currentSubdomain, switchSubdomain, hardResetAuth } = useAuth();
  const { realData } = useData(); 
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (currentUser && !loadingUser) {
      console.log("[LoginPage] User found, navigating to dashboard:", currentUser.role);
      navigate(from, { replace: true });
    }
  }, [currentUser, loadingUser, navigate, from]);

  // EXTRA: Force navigation if user exists maar we nog op login zijn
  useEffect(() => {
    if (currentUser) {
      console.log("[LoginPage] FORCE CHECK: User exists, forcing navigation");
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          console.log("[LoginPage] FORCE NAVIGATION to dashboard");
          window.location.href = '/dashboard';
        }
      }, 500);
    }
  }, [currentUser]);

  // Timer voor emergency reset knop
  useEffect(() => {
    let timer;
    if (loadingUser) {
      // Toon reset knop na 2 seconden laden (nog sneller)
      timer = setTimeout(() => {
        setShowEmergencyReset(true);
      }, 2000);
    } else {
      setShowEmergencyReset(false);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loadingUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowEmergencyReset(false); // Reset emergency button
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Inloggen mislukt. Controleer uw gegevens.');
    }
  };

  const handleEmergencyReset = () => {
    console.log("[LoginPage] Emergency reset triggered by user");
    setError('');
    setShowEmergencyReset(false);
    
    if (hardResetAuth) {
      hardResetAuth();
    }
    
    // NUCLEAR OPTION: Gewoon pagina herladen
    console.log("[LoginPage] Nuclear option: reloading page");
    window.location.reload();
  };

  // EXTRA: Auto-reload na 6 seconden loading
  useEffect(() => {
    let autoReloadTimer;
    if (loadingUser) {
      autoReloadTimer = setTimeout(() => {
        console.warn("[LoginPage] AUTO-RELOAD after 6 seconds of loading");
        window.location.reload();
      }, 6000);
    }
    
    return () => {
      if (autoReloadTimer) {
        clearTimeout(autoReloadTimer);
      }
    };
  }, [loadingUser]);

  if (loadingUser && !currentUser) { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md text-center">
          <LoadingSpinner message="Gebruikerssessie controleren..." />
          
          {/* ALTIJD ZICHTBARE reset knop tijdens loading */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              💡 Laden duurt lang?
            </p>
            <Button
              onClick={handleEmergencyReset}
              variant="ghost"
              className="text-blue-700 hover:text-blue-900 border border-blue-300 hover:border-blue-400 bg-blue-100 hover:bg-blue-200 text-sm py-2 px-4"
            >
              🔄 Reset en probeer opnieuw
            </Button>
          </div>
          
          {/* Extra urgente reset knop na 4 seconden */}
          {showEmergencyReset && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-3">
                🚨 Nog steeds aan het laden?
              </p>
              <p className="text-xs text-red-700 mb-4">
                Er lijkt een probleem te zijn. Klik hieronder voor een volledige reset.
              </p>
              <Button
                onClick={handleEmergencyReset}
                variant="ghost"
                className="text-red-700 hover:text-red-900 border border-red-300 hover:border-red-400 bg-red-100 hover:bg-red-200 text-sm py-2 px-4 font-semibold"
              >
                🔥 Geforceerde reset
              </Button>
            </div>
          )}
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
              <p>Loading: {loadingUser ? 'true' : 'false'}</p>
              <p>Current User: {currentUser ? 'exists' : 'null'}</p>
              <p>Subdomain: {currentSubdomain}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isRegisterSubdomain = currentSubdomain === 'register';

  const title = isRegisterSubdomain
    ? 'MijnLVS'
    : realData.mosque?.name || currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1);

  const subtitle = isRegisterSubdomain
    ? 'Overzicht en structuur voor jouw organisatie'
    : realData.mosque?.city;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          {isRegisterSubdomain ? (
            <img
              src={LogoMijnLVS}
              alt="MijnLVS Logo"
              className="mx-auto h-16 w-auto mb-4"
            />
          ) : (
            <div className="inline-block p-3 bg-emerald-500 rounded-full mb-4 shadow-md">
              {/* Back-up icoon voor andere subdomeinen */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Emailadres"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="uwnaam@example.com"
            autoComplete="email"
          />
          <Input
            label="Wachtwoord"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Uw wachtwoord"
            autoComplete="current-password"
          />
          {error && <p className="text-red-600 text-sm text-center bg-red-50 p-2.5 rounded-md">{error}</p>}
          <Button type="submit" variant="primary" fullWidth disabled={loadingUser} className="py-3 text-base">
            {loadingUser ? 'Bezig met inloggen...' : 'Inloggen'}
          </Button>
        </form>

        {/* Manual Emergency Reset - altijd beschikbaar onderaan */}
        <div className="mt-4 text-center">
          <button
            onClick={handleEmergencyReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
            title="Reset alle inlogsessies en probeer opnieuw"
          >
            Problemen met inloggen? Klik hier om te resetten
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
          <p>Nieuwe gebruiker? Uw beheerder maakt een account voor u aan.</p>
          <p>Na aanmelding ontvangt u uw inloggegevens per e-mail.</p>
        </div>

        {process.env.NODE_ENV === 'development' && currentSubdomain !== 'register' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-semibold mb-1">DEV: Demo ({currentSubdomain})</p>
            <div className="text-xs space-y-0.5 text-gray-600">
              <p><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            variant="link"
            className="text-emerald-600 hover:text-emerald-700"
            onClick={() => switchSubdomain('register')}
          >
            Andere organisatie of Registreren?
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;