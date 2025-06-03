// src/pages/LoginPage.js
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
  const { login, currentUser, loadingUser, currentSubdomain, switchSubdomain } = useAuth();
  const { realData } = useData(); 
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (currentUser && !loadingUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, loadingUser, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Inloggen mislukt. Controleer uw gegevens.');
    }
  };

  if (loadingUser && !currentUser) { 
    return <LoadingSpinner message="Authenticatie controleren..." />;
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
