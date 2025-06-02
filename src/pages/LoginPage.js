import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext'; // Om moskeenaam te krijgen
import { BookOpen } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, currentUser, loadingUser, currentSubdomain, switchSubdomain } = useAuth();
  const { realData } = useData(); // Voor moskeenaam
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
      // Navigatie gebeurt door de useEffect of ProtectedRoute na succesvolle login
    } catch (err) {
      setError(err.message || 'Inloggen mislukt. Controleer uw gegevens.');
    }
  };

  if (loadingUser && !currentUser) { // Toon spinner alleen als we echt op user wachten en er nog geen is
    return <LoadingSpinner message="Authenticatie controleren..." />;
  }
  // Als user al bestaat (bijv. na refresh en localStorage), niet de login tonen.
  // Dit wordt nu afgehandeld door de useEffect hierboven.

  // Gebruik de moskeenaam uit realData indien beschikbaar, anders fallback op subdomein
  const mosqueTitle = realData.mosque?.name || (currentSubdomain !== 'register' ? `${currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)} LVS` : 'Leerling Volgsysteem');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-emerald-500 rounded-full mb-4 shadow-md">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{mosqueTitle}</h1>
          {realData.mosque && realData.mosque.city && <p className="text-sm text-gray-500">{realData.mosque.city}</p>}
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
        {currentSubdomain !== 'register' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Demo accounts ({currentSubdomain}):</p>
            <div className="text-xs space-y-1 text-gray-700">
                <div><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</div>
                {/* Voeg andere demo accounts toe indien nodig */}
            </div>
            </div>
        )}
        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => switchSubdomain('register')}
          >
            Andere moskee of Registreren?
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;