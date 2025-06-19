// src/pages/ResetPasswordPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Zorg dat dit pad klopt

// ✅ FALLBACK: Gebruik basis HTML elementen als componenten niet bestaan
const Input = ({ label, type, value, onChange, required, disabled, placeholder }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Button = ({ children, type, fullWidth, disabled, onClick }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`${fullWidth ? 'w-full' : ''} py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ✅ DEBUG: Log alles wat er gebeurt
  useEffect(() => {
    console.log('🔧 [RESET PASSWORD] Component mounted');
    console.log('🔧 [RESET PASSWORD] Current URL:', window.location.href);
    console.log('🔧 [RESET PASSWORD] Search params:', window.location.search);
    console.log('🔧 [RESET PASSWORD] Hash:', window.location.hash);
    
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    console.log('🔧 [RESET PASSWORD] URL Params:', { error, errorCode, errorDescription, token, type });

    if (error) {
      console.log('❌ [RESET PASSWORD] URL Error detected:', { error, errorCode, errorDescription });
      
      if (errorCode === 'otp_expired') {
        setError('De reset link is verlopen of ongeldig. Vraag een nieuwe password reset aan.');
      } else {
        setError(`Fout: ${errorDescription || error}`);
      }
      return;
    }

    // Check for token in URL params (query string method)
    if (token && type === 'recovery') {
      console.log('✅ [RESET PASSWORD] Valid recovery token found in URL params');
      setIsValidToken(true);
      
      // Set session with the token - Supabase should handle this automatically
      supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ [RESET PASSWORD] Error verifying token:', error);
          setError('Er is een fout opgetreden bij het valideren van de reset link.');
        } else {
          console.log('✅ [RESET PASSWORD] Token verified successfully:', data);
          setIsValidToken(true);
        }
      });
      return;
    }

    // Check for access_token and refresh_token in URL (hash-based - fallback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');

    console.log('🔧 [RESET PASSWORD] Hash Params:', { accessToken: accessToken?.substring(0, 20) + '...', refreshToken: refreshToken?.substring(0, 20) + '...', hashType });

    if (accessToken && hashType === 'recovery') {
      console.log('✅ [RESET PASSWORD] Valid recovery token found in URL hash');
      setIsValidToken(true);
      
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          console.error('❌ [RESET PASSWORD] Error setting session:', error);
          setError('Er is een fout opgetreden bij het valideren van de reset link.');
        } else {
          console.log('✅ [RESET PASSWORD] Session set successfully');
        }
      });
    } else {
      console.log('⚠️ [RESET PASSWORD] No valid token found, waiting for auth state change...');
    }
  }, [searchParams]);

  // Luister naar auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log("Password recovery event gedetecteerd");
        setIsValidToken(true);
      } else if (event === 'SIGNED_IN' && session) {
        console.log("User signed in during password recovery");
        setIsValidToken(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validatie
    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 karakters lang zijn.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      setLoading(false);
      return;
    }

    try {
      // Update het wachtwoord
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess("Je wachtwoord is succesvol gewijzigd! Je wordt doorgeleid...");
      
      // Wacht even en leid door naar login
      setTimeout(async () => {
        // Sign out de gebruiker na successful password reset
        await supabase.auth.signOut();
        
        // Bepaal waar je de gebruiker naartoe wilt sturen
        const currentDomain = window.location.hostname;
        
        if (currentDomain.includes('mijnlvs.nl') && currentDomain !== 'mijnlvs.nl') {
          // Als we op een subdomein zijn, ga terug naar dat subdomein's login
          window.location.href = `https://${currentDomain}/login`;
        } else {
          // Anders ga naar het hoofddomein
          window.location.href = 'https://mijnlvs.nl/login';
        }
      }, 2000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError(`Fout bij het wijzigen van het wachtwoord: ${error.message}`);
    }

    setLoading(false);
  };

  const requestNewReset = () => {
    // Leid door naar de forgot password pagina
    const currentDomain = window.location.hostname;
    if (currentDomain.includes('mijnlvs.nl') && currentDomain !== 'mijnlvs.nl') {
      window.location.href = `https://${currentDomain}/forgot-password`;
    } else {
      window.location.href = 'https://mijnlvs.nl/forgot-password';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        {/* ✅ EENVOUDIGE HEADER ZONDER LOGO (voor debugging) */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">MijnLVS</h1>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Nieuw Wachtwoord Instellen
        </h2>

        {/* ✅ DEBUG INFORMATIE (tijdelijk) */}
        <div className="mb-4 p-3 bg-gray-100 text-xs rounded">
          <strong>Debug Info:</strong><br/>
          URL: {window.location.href}<br/>
          Valid Token: {isValidToken ? 'Ja' : 'Nee'}<br/>
          Loading: {loading ? 'Ja' : 'Nee'}<br/>
          Error: {error || 'Geen'}<br/>
          Success: {success || 'Geen'}
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {error}
            {error.includes('verlopen') && (
              <button 
                onClick={requestNewReset}
                className="block w-full mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Nieuwe reset link aanvragen
              </button>
            )}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md mb-4">
            {success}
          </div>
        )}

        {!error && !success && !isValidToken && (
          <div className="p-3 bg-blue-100 text-blue-700 rounded-md mb-4">
            Bezig met valideren van reset link...
          </div>
        )}

        {isValidToken && !success && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <Input
              label="Nieuw wachtwoord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Minimaal 8 karakters"
            />
            
            <Input
              label="Bevestig nieuw wachtwoord"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Herhaal je nieuwe wachtwoord"
            />
            
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Bezig met opslaan...' : 'Wachtwoord Opslaan'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button 
            onClick={() => window.location.href = 'https://mijnlvs.nl/login'}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Terug naar inloggen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;