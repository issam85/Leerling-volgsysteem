// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext'; 
import { BookOpen } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const mosqueTitle = realData.mosque?.name || (currentSubdomain !== 'register' ? `${currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)}` : 'Leerling Volgsysteem');
  const mosqueCity = realData.mosque?.city;


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-emerald-500 rounded-full mb-4 shadow-md">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{mosqueTitle}</h1>
          {mosqueCity && <p className="text-sm text-gray-500">{mosqueCity}</p>}
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
            <p>
                Nieuwe gebruiker? Uw beheerder maakt een account voor u aan.
            </p>
            <p>
                Na aanmelding ontvangt u uw inloggegevens per e-mail.
            </p>
        </div>

        {/* Toon demo accounts alleen in development omgeving en niet op de register pagina */}
        {process.env.NODE_ENV === 'development' && currentSubdomain !== 'register' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-semibold mb-1">DEV: Demo ({currentSubdomain})</p>
            <div className="text-xs space-y-0.5 text-gray-600">
                <p><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</p>
                {/* Voeg hier eventueel een leraar demo account toe als je die hebt */}
                {/* <p><strong>Leraar:</strong> leraar@{currentSubdomain}.nl / leraar</p> */}
            </div>
            </div>
        )}
        
        <div className="mt-8 text-center">
          <Button
            variant="link"
            className="text-emerald-600 hover:text-emerald-700"
            onClick={() => switchSubdomain('register')} // Leid naar de "hub" of registratiepagina
          >
            Andere moskee of Registreren?
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;