// src/pages/LoginPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import appLogo from '../assets/logo-mijnlvs.png'; // MijnLVS logo
import { Building, ArrowRight } from 'lucide-react'; // Building icoon

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showEmergencyReset, setShowEmergencyReset] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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

    // Timer voor emergency reset knop
    useEffect(() => {
        let timer;
        if (loadingUser) {
            timer = setTimeout(() => {
                setShowEmergencyReset(true);
            }, 3000);
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
        setShowEmergencyReset(false);
        setIsSubmitting(true);
        
        try {
            console.log("[LoginPage] Starting login process...");
            await login(email, password);
            console.log("[LoginPage] Login successful - setting backup navigation");
            
            // Backup navigation na 1 seconde als auth listener faalt
            setTimeout(() => {
                if (window.location.pathname === '/login') {
                    console.log("[LoginPage] BACKUP navigation to dashboard");
                    navigate('/dashboard', { replace: true });
                }
            }, 1000);
            
        } catch (err) {
            setError(err.message || 'Inloggen mislukt. Controleer uw gegevens.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmergencyReset = () => {
        console.log("[LoginPage] Emergency reset triggered by user");
        setError('');
        setShowEmergencyReset(false);
        
        if (hardResetAuth) {
            hardResetAuth();
        }
        
        setTimeout(() => {
            window.location.reload();
        }, 300);
    };

    // Loading state
    if (loadingUser && !currentUser) { 
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md text-center">
                    <LoadingSpinner message="Gebruikerssessie controleren..." />
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-3">💡 Laden duurt lang?</p>
                        <Button
                            onClick={handleEmergencyReset}
                            variant="ghost"
                            className="text-blue-700 hover:text-blue-900 border border-blue-300 hover:border-blue-400 bg-blue-100 hover:bg-blue-200 text-sm py-2 px-4"
                        >
                            🔄 Reset en probeer opnieuw
                        </Button>
                    </div>
                    
                    {showEmergencyReset && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 mb-3">⚠️ Nog steeds aan het laden?</p>
                            <Button
                                onClick={handleEmergencyReset}
                                variant="ghost"
                                className="text-orange-700 hover:text-orange-900 border border-orange-300 hover:border-orange-400 bg-orange-100 hover:bg-orange-200 text-sm py-2 px-4"
                            >
                                🔄 Reset inlogstatus
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Conditional rendering gebaseerd op het laden van organisatie-data
    if (realData.loading && !realData.mosque) {
        return <LoadingSpinner message="Organisatiegegevens laden..." />;
    }

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
                    
                    {/* Toegevoegde content om het professioneler te maken */}
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

            {/* KOLOM 2: Login Formulier */}
            <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <img className="mx-auto h-16 w-auto mb-6" src={appLogo} alt="MijnLVS Logo" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Welkom terug
                        </h2>
                        <p className="text-gray-600">
                            Log in op uw {realData.mosque?.name || 'organisatie'} account
                        </p>
                        {/* Subtitel voor mobiele weergave */}
                        <p className="lg:hidden mt-4 text-sm text-gray-500 p-4 bg-emerald-50 rounded-lg">
                            📚 Portaal voor {realData.mosque?.name || 'uw organisatie'}
                        </p>
                    </div>

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
                            </div>
                        )}

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
                    </form>

                    {/* Development Demo Info */}
                    {process.env.NODE_ENV === 'development' && currentSubdomain !== 'register' && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 font-semibold mb-2">🔧 Ontwikkeling: Demo Account ({currentSubdomain})</p>
                            <div className="text-xs space-y-1 text-blue-600">
                                <p><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</p>
                                <p><strong>Leraar:</strong> leraar@{currentSubdomain}.nl / leraar</p>
                                <p><strong>Ouder:</strong> ouder@{currentSubdomain}.nl / ouder</p>
                            </div>
                        </div>
                    )}

                    {/* Action Links */}
                    <div className="mt-8 space-y-4 text-center">
                        <button
                            onClick={handleEmergencyReset}
                            className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors"
                        >
                            🔄 Problemen met inloggen? Reset sessie
                        </button>
                        
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
                </div>
            </div>
        </div>
    );
};

export default LoginPage;