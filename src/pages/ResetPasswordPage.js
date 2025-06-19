// src/pages/ResetPasswordPage.js
// ✅ VERSIE MET ECHTE SUPABASE INTEGRATIE
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // ✅ Correct pad naar jouw supabaseClient

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [tokenStatus, setTokenStatus] = useState('checking'); // 'checking', 'valid', 'invalid'
  const [passwordChanged, setPasswordChanged] = useState(false); // ✅ NIEUW: Track of wachtwoord is gewijzigd

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
      
      // ✅ Probeer de token te verifiëren
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
      
      // ✅ ECHTE SUPABASE PASSWORD UPDATE
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      console.log('✅ [RESET PASSWORD] Password updated successfully:', data);
      setPasswordChanged(true); // ✅ NIEUW: Markeer als succesvol gewijzigd
      setSuccess("🎉 Wachtwoord succesvol gewijzigd! Je wordt over 5 seconden doorgeleid naar de login pagina...");
      
      setTimeout(() => {
        // Sign out na successful password reset
        supabase.auth.signOut().then(() => {
          // ✅ VERBETERD: Intelligente redirect gebaseerd op huidige domein
          const currentHostname = window.location.hostname;
          
          if (currentHostname === 'mijnlvs.nl' || currentHostname === 'www.mijnlvs.nl') {
            // Als we op het hoofddomein zijn, blijf daar maar ga naar login
            window.location.href = 'https://mijnlvs.nl/login';
          } else if (currentHostname.includes('mijnlvs.nl')) {
            // Als we op een subdomein zijn, ga naar dat subdomein's login
            window.location.href = `https://${currentHostname}/login`;
          } else {
            // Fallback naar hoofddomein login
            window.location.href = 'https://mijnlvs.nl/login';
          }
        });
      }, 5000); // ✅ VERHOOGD: 5 seconden i.p.v. 3
      
    } catch (err) {
      console.error('❌ [RESET PASSWORD] Password update failed:', err);
      setError(`Fout bij het wijzigen van het wachtwoord: ${err.message}`);
    }

    setLoading(false);
  };

  const requestNewReset = () => {
    // Redirect naar login om nieuwe reset aan te vragen
    window.location.href = '/login';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
            MijnLVS
          </h1>
        </div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Nieuw Wachtwoord Instellen
        </h2>

        {/* ✅ DEBUG SECTIE */}
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f3f4f6',
          fontSize: '12px',
          borderRadius: '6px',
          whiteSpace: 'pre-line'
        }}>
          <strong>Debug Info:</strong>
          {debugInfo}
          <br/>
          <strong>Token Status:</strong> {tokenStatus}
        </div>
        
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {error}
            {(error.includes('verlopen') || error.includes('ongeldig')) && (
              <div style={{ marginTop: '8px' }}>
                <button 
                  onClick={requestNewReset}
                  style={{
                    fontSize: '14px',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Nieuwe reset link aanvragen
                </button>
              </div>
            )}
          </div>
        )}
        
        {success && (
          <div style={{
            padding: '16px', // ✅ Meer padding voor success bericht
            backgroundColor: passwordChanged ? '#dcfce7' : '#f0fdf4', // ✅ Andere kleur voor definitieve success
            color: passwordChanged ? '#15803d' : '#16a34a',
            borderRadius: '6px',
            marginBottom: '16px',
            border: passwordChanged ? '2px solid #16a34a' : 'none', // ✅ Border voor extra nadruk
            textAlign: 'center',
            fontSize: passwordChanged ? '16px' : '14px' // ✅ Groter font voor success
          }}>
            {success}
          </div>
        )}

        {tokenStatus === 'checking' && (
          <div style={{
            padding: '12px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            Bezig met valideren van reset link...
          </div>
        )}

        {tokenStatus === 'valid' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '8px'
              }}>
                Nieuw wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Minimaal 8 karakters"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '8px'
              }}>
                Bevestig nieuw wachtwoord
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Herhaal je nieuwe wachtwoord"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Bezig met opslaan...' : 'Wachtwoord Opslaan'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              fontSize: '14px',
              color: '#2563eb',
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Terug naar inloggen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;