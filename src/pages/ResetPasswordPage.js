// src/pages/ResetPasswordPage.js
// ✅ CONSISTENT MET JOUW DESIGN STYLE
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import appLogo from '../assets/logo-mijnlvs.png';
import { Shield, ArrowRight } from 'lucide-react';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [tokenStatus, setTokenStatus] = useState('checking');
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    // ✅ CHECK BEIDE: URL PARAMS EN HASH PARAMS
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check URL parameters eerst
    let token = urlParams.get('token');
    let type = urlParams.get('type');
    let urlError = urlParams.get('error');
    
    // Als niet gevonden, check hash parameters
    if (!token) {
      token = hashParams.get('access_token');
      type = hashParams.get('type');
    }
    
    const info = `
      URL: ${window.location.href}
      URL Hash: ${window.location.hash}
      URL Search: ${window.location.search}
      Token: ${token ? 'Aanwezig' : 'Niet gevonden'}
      Type: ${type || 'Niet gevonden'}
      URL Error: ${urlError || 'Geen'}
    `;
    
    setDebugInfo(info);
    console.log('🔧 [RESET PASSWORD] Debug info:', info);

    if (urlError) {
      setError(`URL bevat error: ${urlError}`);
      setTokenStatus('invalid');
      return;
    }

    if (!token) {
      setError('Geen geldige reset token gevonden in URL');
      setTokenStatus('invalid');
      return;
    }

    // ✅ VERSCHILLENDE VERIFICATIE METHODES PROBEREN
    if (hashParams.get('access_token')) {
      // Hash-based token (access_token + refresh_token)
      verifyHashToken(hashParams);
    } else if (urlParams.get('token')) {
      // Query parameter token
      verifyResetToken(token);
    } else {
      setError('Onbekend token formaat');
      setTokenStatus('invalid');
    }
  }, []);

  const verifyHashToken = async (hashParams) => {
    try {
      console.log('🔧 [RESET PASSWORD] Verifying hash-based token...');
      
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (!accessToken || !refreshToken) {
        throw new Error('Access token of refresh token ontbreekt');
      }
      
      // Set session met de tokens uit de URL
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        throw error;
      }

      console.log('✅ [RESET PASSWORD] Hash token verified successfully:', data);
      setTokenStatus('valid');
      setSuccess('Reset token is geldig! Je kunt nu een nieuw wachtwoord instellen.');
      
    } catch (err) {
      console.error('❌ [RESET PASSWORD] Hash token verification failed:', err);
      setError(`Hash token verificatie fout: ${err.message}`);
      setTokenStatus('invalid');
    }
  };

  const verifyResetToken = async (token) => {
    try {
      console.log('🔧 [RESET PASSWORD] Verifying token with Supabase...');
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        console.error('❌ [RESET PASSWORD] Token verification failed:', error);
        
        if (error.message.includes('expired')) {
          setError('De reset link is verlopen. Vraag een nieuwe reset link aan.');
        } else if (error.message.includes('invalid')) {
          setError('De reset link is ongeldig. Vraag een nieuwe reset link aan.');
        } else {
          setError(`Token verificatie fout: ${error.message}`);
        }
        setTokenStatus('invalid');
        return;
      }

      console.log('✅ [RESET PASSWORD] Token verified successfully:', data);
      setTokenStatus('valid');
      setSuccess('Reset token is geldig! Je kunt nu een nieuw wachtwoord instellen.');
      
    } catch (err) {
      console.error('❌ [RESET PASSWORD] Unexpected error during token verification:', err);
      setError(`Onverwachte fout: ${err.message}`);
      setTokenStatus('invalid');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      console.log('🔧 [RESET PASSWORD] Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      console.log('✅ [RESET PASSWORD] Password updated successfully:', data);
      setPasswordChanged(true);
      setSuccess("🎉 Wachtwoord succesvol gewijzigd! Je wordt over 5 seconden doorgeleid naar de login pagina...");
      
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          const currentHostname = window.location.hostname;
          
          if (currentHostname === 'mijnlvs.nl' || currentHostname === 'www.mijnlvs.nl') {
            window.location.href = 'https://mijnlvs.nl/login';
          } else if (currentHostname.includes('mijnlvs.nl')) {
            window.location.href = `https://${currentHostname}/login`;
          } else {
            window.location.href = 'https://mijnlvs.nl/login';
          }
        });
      }, 5000);
      
    } catch (err) {
      console.error('❌ [RESET PASSWORD] Password update failed:', err);
      setError(`Fout bij het wijzigen van het wachtwoord: ${err.message}`);
    }

    setLoading(false);
  };

  const requestNewReset = () => {
    const currentHostname = window.location.hostname;
    if (currentHostname.includes('mijnlvs.nl') && currentHostname !== 'mijnlvs.nl') {
      window.location.href = `https://${currentHostname}/login`;
    } else {
      window.location.href = 'https://mijnlvs.nl/login';
    }
  };

  // Loading state voor token verificatie
  if (tokenStatus === 'checking') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md text-center">
          <LoadingSpinner message="Reset link valideren..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* KOLOM 1: Premium Branding Sectie */}
      <div className="hidden lg:flex lg:flex-col justify-between bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-8 xl:p-12">
        <div>
          <div className="flex items-center text-lg font-medium">
            <Shield className="w-8 h-8 mr-3 bg-white/20 p-1.5 rounded-lg" />
            <span>Veilig wachtwoord resetten</span>
          </div>
          <h1 className="mt-4 text-5xl font-bold tracking-tight">
            Nieuw Wachtwoord
          </h1>
          <p className="mt-2 text-2xl text-emerald-200">
            Stel een nieuw, veilig wachtwoord in
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-emerald-300 rounded-full mt-2 mr-4"></div>
              <div>
                <h3 className="text-lg font-semibold">Beveiligde verbinding</h3>
                <p className="text-emerald-100 text-sm">Je wachtwoord wordt veilig versleuteld opgeslagen</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-emerald-300 rounded-full mt-2 mr-4"></div>
              <div>
                <h3 className="text-lg font-semibold">Eenmalige link</h3>
                <p className="text-emerald-100 text-sm">Deze reset link is slechts eenmaal te gebruiken</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-emerald-300 rounded-full mt-2 mr-4"></div>
              <div>
                <h3 className="text-lg font-semibold">Direct toegang</h3>
                <p className="text-emerald-100 text-sm">Na het resetten kun je direct inloggen</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-emerald-300">
          <p>Mogelijk gemaakt door MijnLVS</p>
        </div>
      </div>

      {/* KOLOM 2: Reset Formulier */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img className="mx-auto h-16 w-auto mb-6" src={appLogo} alt="MijnLVS Logo" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nieuw Wachtwoord
            </h2>
            <p className="text-gray-600">
              Stel een nieuw, veilig wachtwoord in voor uw account
            </p>
          </div>

          {/* Debug info - alleen in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-700 font-semibold mb-2">🔧 Debug Info:</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">{debugInfo}</pre>
              <p className="text-xs text-gray-600 mt-2"><strong>Token Status:</strong> {tokenStatus}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
              {(error.includes('verlopen') || error.includes('ongeldig')) && (
                <div className="mt-3">
                  <Button
                    onClick={requestNewReset}
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:text-red-900 border border-red-300 hover:border-red-400"
                  >
                    Nieuwe reset link aanvragen
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {success && (
            <div className={`mb-6 p-4 border rounded-lg text-center ${
              passwordChanged 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <p className={passwordChanged ? 'text-base font-medium' : 'text-sm'}>{success}</p>
            </div>
          )}

          {tokenStatus === 'valid' && !passwordChanged && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <Input
                label="Nieuw wachtwoord"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Minimaal 8 karakters"
                autoComplete="new-password"
              />
              
              <Input
                label="Bevestig nieuw wachtwoord"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Herhaal je nieuwe wachtwoord"
                autoComplete="new-password"
              />
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={loading}
                className="py-4 text-lg font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wachtwoord wordt opgeslagen...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    🔐 Wachtwoord Opslaan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Back to login link */}
          <div className="mt-8 text-center">
            <button
              onClick={requestNewReset}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              ← Terug naar inloggen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;