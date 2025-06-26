// src/pages/LoginPage.js - Met Wachtwoord Vergeten functionaliteit

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../supabaseClient'; // ✅ TOEGEVOEGD voor password reset
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import appLogo from '../assets/logo-mijnlvs.png';
import { Building, ArrowRight, Mail } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const errorRef = useRef('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    const originalSetError = setError;
    const trackedSetError = (value) => {
    console.log(`🔍 [DEBUG] setError called with: "${value}"`);
    console.trace('setError call stack:');
    
        // ✅ BLOKKEER LEGE STRINGS TIJDELIJK
        if (value === '') {
            console.log("🚫 [DEBUG] BLOCKED: Attempt to clear error state!");
            console.trace('BLOCKED setError("") call stack:');
            return; // Niet uitvoeren als het een lege string is
        }
        
        originalSetError(value);
    };
       
    
    // ✅ NIEUWE STATE VOOR WACHTWOORD RESET
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetError, setResetError] = useState('');
    
    const { login, currentUser, loadingUser, currentSubdomain, switchSubdomain, resetLoadingUser } = useAuth();
    const { realData } = useData(); 
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/dashboard";
    const setErrorSafe = (errorMessage) => {
        console.log("🔍 [DEBUG] setErrorSafe called with:", errorMessage);
        errorRef.current = errorMessage;
        trackedSetError(errorMessage);


        // Force another update with a slight delay
        setTimeout(() => {
        console.log("🔍 [DEBUG] setErrorSafe timeout - forcing state update");
            trackedSetError(errorMessage);
            setForceUpdate(prev => prev + 1); // Force re-render
        }, 1);
    };

    useEffect(() => {
        console.log("🔍 [UseEffect] Navigation check:", {
            currentUser: !!currentUser,
            loadingUser,
            errorState: error,
            errorRef: errorRef.current,
            shouldNavigate: currentUser && !loadingUser && !errorRef.current
        });
        
        if (currentUser && !loadingUser && !errorRef.current) {
            console.log("[LoginPage] User found, navigating to dashboard:", currentUser.role);
            navigate(from, { replace: true });
        }
    }, [currentUser, loadingUser, navigate, from, error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError('');
        setIsSubmitting(true);
        
        try {
            console.log("[LoginPage] Starting login process...");
            await login(email, password);
            console.log("[LoginPage] Login successful");
            
            setTimeout(() => {
                if (window.location.pathname === '/login') {
                    console.log("[LoginPage] BACKUP navigation to dashboard");
                    navigate('/dashboard', { replace: true });
                }
            }, 1000);
            
        } catch (err) {
            console.log("🔍 [DEBUG] CATCH BLOCK REACHED!");
            console.log("🔍 [DEBUG] Error message:", err.message);
            
            const errorMessage = err.message || 'Inloggen mislukt. Controleer uw gegevens.';
            
            // STOP alle loading states eerst
            setIsSubmitting(false);
            resetLoadingUser();
            
            // Gebruik de veilige error setter
            setErrorSafe(errorMessage);
            
            // Force updates met de ref
            setTimeout(() => {
                setErrorSafe(errorMessage);
                console.log("🔍 [DEBUG] Error set again after 10ms");
            }, 10);
            
            // Force update na 100ms
            setTimeout(() => {
                setErrorSafe(errorMessage);
                console.log("🔍 [DEBUG] Error set again after 100ms");
            }, 100);
            
            // Force een component re-render
            setTimeout(() => {
                setForceUpdate(prev => prev + 1);
                console.log("🔍 [DEBUG] Forced component update");
            }, 50);
            
            return; // Exit vroeg uit de functie
        }
        
        // Alleen uitgevoerd bij success
        setIsSubmitting(false);
    };
    // ✅ NIEUWE FUNCTIE: Wachtwoord reset
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setResetError('');
        setResetSuccess('');

        if (!resetEmail) {
            setResetError('Vul uw emailadres in');
            setResetLoading(false);
            return;
        }

        try {
            console.log('🔧 [FORGOT PASSWORD] Sending reset email to:', resetEmail);
            
            // Bepaal de juiste redirect URL gebaseerd op de huidige hostname
            const currentHostname = window.location.hostname;
            let redirectUrl;
            
            if (currentHostname === 'mijnlvs.nl' || currentHostname === 'www.mijnlvs.nl') {
                redirectUrl = 'https://mijnlvs.nl/reset-password';
            } else if (currentHostname.includes('mijnlvs.nl')) {
                redirectUrl = `https://${currentHostname}/reset-password`;
            } else {
                // Voor development/localhost
                redirectUrl = `${window.location.origin}/reset-password`;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: redirectUrl
            });

            if (error) {
                throw error;
            }

            console.log('✅ [FORGOT PASSWORD] Reset email sent successfully');
            setResetSuccess(`Een reset link is verstuurd naar ${resetEmail}. Check uw email en spam folder!`);
            
            // Reset form na 8 seconden
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetSuccess('');
            }, 8000);
            
        } catch (err) {
            console.error('❌ [FORGOT PASSWORD] Error:', err);
            setResetError(err.message || 'Er is een fout opgetreden bij het versturen van de reset email');
        } finally {
            setResetLoading(false);
        }
    };

    // Loading state
    if (loadingUser && !currentUser) { 
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md text-center">
                    <LoadingSpinner message="Gebruikerssessie controleren..." />
                </div>
            </div>
        );
    }

    // Conditional rendering gebaseerd op het laden van organisatie-data
    if (realData.loading && !realData.mosque) {
        return <LoadingSpinner message="Organisatiegegevens laden..." />;
    }

    console.log("🔍 [DEBUG] Render - Current error state:", error);
    console.log("🔍 [DEBUG] Render - Should show error:", !!error);
    console.log("🔍 [DEBUG] Render - Error length:", error?.length);

    return (
        <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
            {/* KOLOM 1: Premium Branding Sectie */}
            <div className="hidden lg:flex lg:flex-col justify-between bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-8 xl:p-12">
                <div>
                    <div className="flex items-center text-lg font-medium">
                        <Building className="w-8 h-8 mr-3 bg-white/20 p-1.5 rounded-lg" />
                        <span>Inlogportaal voor</span>
                    </div>
                    <h1 className="mt-4 text-5xl font-bold tracking-tight">
                        {realData.mosque?.name || 'Uw Organisatie'}
                    </h1>
                    <p className="mt-2 text-2xl text-emerald-200">
                        {realData.mosque?.city || 'Uw Stad'}
                    </p>
                    
                    <div className="mt-12 space-y-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-2 h-2 bg-emerald-300 rounded-full mt-2 mr-4"></div>
                            <div>
                                <h3 className="text-lg font-semibold">Veilige toegang</h3>
                                <p className="text-emerald-100 text-sm">Beveiligde login voor leraren, ouders en beheerders</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-2 h-2 bg-emerald-300 rounded-full mt-2 mr-4"></div>
                            <div>
                                <h3 className="text-lg font-semibold">Altijd up-to-date</h3>
                                <p className="text-emerald-100 text-sm">Real-time inzicht in voortgang en aanwezigheid</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-2 h-2 bg-emerald-300 rounded-full mt-2 mr-4"></div>
                            <div>
                                <h3 className="text-lg font-semibold">Makkelijk beheer</h3>
                                <p className="text-emerald-100 text-sm">Centrale administratie voor alle aspecten van uw onderwijs</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-sm text-emerald-300">
                    <p>Mogelijk gemaakt door MijnLVS</p>
                </div>
            </div>

            {/* KOLOM 2: Login/Reset Formulier */}
            <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <img className="mx-auto h-16 w-auto mb-6" src={appLogo} alt="MijnLVS Logo" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {showForgotPassword ? 'Wachtwoord Vergeten?' : 'Welkom terug'}
                        </h2>
                        <p className="text-gray-600">
                            {showForgotPassword 
                                ? 'Vul uw emailadres in om een reset link te ontvangen'
                                : `Log in op uw ${realData.mosque?.name || 'organisatie'} account`
                            }
                        </p>
                        {/* Subtitel voor mobiele weergave */}
                        {!showForgotPassword && (
                            
                            <p className="lg:hidden mt-4 text-sm text-gray-500 p-4 bg-emerald-50 rounded-lg">
                                📚 Portaal voor {realData.mosque?.name || 'uw organisatie'}
                            </p>
                        )}
                    </div>
                    {/* Voeg dit toe BOVEN je normale formulier, tijdelijk voor testing */}
                    <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded">
                        <p className="text-sm mb-2">🔧 ERROR STATE TESTS:</p>
                        <div className="space-x-2">
                            <button 
                                type="button"
                                onClick={() => {
                                    console.log("TEST: Setting error directly");
                                    trackedSetError("DIRECT TEST: Dit is een test error!");
                                }}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded"
                            >
                                Test Direct Error
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    console.log("TEST: Setting error with timeout");
                                    setTimeout(() => {
                                        trackedSetError("TIMEOUT TEST: Dit is een test error!");
                                        console.log("TEST: Error set via timeout");
                                    }, 100);
                                }}
                                className="px-3 py-1 bg-yellow-500 text-white text-xs rounded"
                            >
                                Test Timeout Error
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    console.log("TEST: Clearing error");
                                    trackedSetError("");
                                }}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded"
                            >
                                Clear Error
                            </button>
                        </div>
                        <p className="text-xs mt-2">Current error in test: "{error}" (length: {error?.length || 0})</p>
                    </div>

                    {/* ✅ WACHTWOORD VERGETEN FORMULIER */}
                    {showForgotPassword ? (
                        <div className="space-y-6">
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <Input
                                    label="Emailadres"
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    placeholder="uw@email.com"
                                    autoComplete="email"
                                />

                                {resetError && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-700 text-sm text-center">{resetError}</p>
                                    </div>
                                )}

                                {resetSuccess && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-700 text-sm text-center">{resetSuccess}</p>
                                        <p className="text-green-600 text-xs text-center mt-2">
                                            💡 Tip: Check ook uw spam/ongewenste mail folder
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    disabled={resetLoading}
                                    className="py-4 text-lg font-semibold"
                                >
                                    {resetLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Reset link versturen...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <Mail className="w-5 h-5 mr-2" />
                                            Reset Link Versturen
                                        </span>
                                    )}
                                </Button>
                            </form>

                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmail('');
                                        setResetError('');
                                        setResetSuccess('');
                                    }}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                >
                                    ← Terug naar inloggen
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ✅ NORMALE LOGIN FORMULIER */
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                            
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm text-center">{error}</p>
                                    {/* Debug info */}
                                    <p className="text-xs text-gray-500 mt-1">Debug: Error length = {error.length}</p>
                                </div>
                            )}

                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <p>Debug Info:</p>
                                <p>Error state: "{error}"</p>
                                <p>Error exists: {String(!!error)}</p>
                                <p>IsSubmitting: {String(isSubmitting)}</p>
                            </div>

                            <Button 
                                type="submit" 
                                variant="primary" 
                                fullWidth 
                                size="lg" 
                                disabled={isSubmitting || loadingUser}
                                className="py-4 text-lg font-semibold"
                            >
                                {isSubmitting || loadingUser ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Bezig met inloggen...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        🔐 Veilig Inloggen
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </span>
                                )}
                            </Button>

                            {/* ✅ WACHTWOORD VERGETEN LINK */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                >
                                    Wachtwoord vergeten?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Development Demo Info */}
                    {process.env.NODE_ENV === 'development' && currentSubdomain !== 'register' && !showForgotPassword && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 font-semibold mb-2">🔧 Ontwikkeling: Demo Account ({currentSubdomain})</p>
                            <div className="text-xs space-y-1 text-blue-600">
                                <p><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</p>
                                <p><strong>Leraar:</strong> leraar@{currentSubdomain}.nl / leraar</p>
                                <p><strong>Ouder:</strong> ouder@{currentSubdomain}.nl / ouder</p>
                            </div>
                        </div>
                    )}

                    {/* Action Links - alleen tonen bij normale login view */}
                    {!showForgotPassword && (
                        <div className="mt-8 space-y-4 text-center">
                            <div className="flex flex-col space-y-2">
                                <button 
                                    onClick={() => switchSubdomain('register')} 
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                >
                                    ➕ Nieuwe organisatie registreren
                                </button>
                                <p className="text-xs text-gray-400">
                                    Of schakel naar een andere bestaande organisatie
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;