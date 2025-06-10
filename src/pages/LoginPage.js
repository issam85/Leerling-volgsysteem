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

    // Conditional rendering gebaseerd op het laden van moskee-data
    if (realData.loading && !realData.mosque) {
        return <LoadingSpinner message="Organisatiegegevens laden..." />;
    }

    // =======================================================
    // START VERVANGING: De nieuwe, elegante return statement
    // =======================================================
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center max-w-7xl mx-auto">
                
                {/* KOLOM 1: De "Branding" Kolom */}
                <div className="hidden lg:block text-left">
                    <div className="flex items-center text-lg font-medium text-gray-500">
                        <Building className="w-8 h-8 mr-3 text-emerald-500" />
                        <span>Inlogportaal voor</span>
                    </div>
                    <h1 className="mt-4 text-6xl font-bold tracking-tight text-gray-900">
                        {realData.mosque?.name || 'Uw Organisatie'}
                    </h1>
                    <p className="mt-2 text-3xl font-light text-gray-500">
                        {realData.mosque?.city}
                    </p>
                </div>

                {/* KOLOM 2: De Inlog-Actie Kolom */}
                <div className="w-full max-w-md mx-auto">
                    {/* De kaart die het formulier bevat */}
                    <div className="bg-white p-8 shadow-xl rounded-2xl">
                        <div className="text-center mb-8">
                            <img className="mx-auto h-12 w-auto" src={appLogo} alt="MijnLVS Logo" />
                            <h2 className="mt-6 text-2xl font-bold text-gray-900">
                                Welkom terug
                            </h2>
                            <p className="lg:hidden mt-2 text-sm text-gray-500">
                                Portaal voor {realData.mosque?.name || 'uw organisatie'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Emailadres" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                placeholder="uwnaam@example.com" autoComplete="email"
                            />
                            <Input
                                label="Wachtwoord" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                placeholder="Uw wachtwoord" autoComplete="current-password"
                            />
                            
                            {error && <p className="text-red-600 text-sm text-center bg-red-50 p-2.5 rounded-md">{error}</p>}

                            <Button type="submit" variant="primary" fullWidth size="lg" disabled={loadingUser}>
                                {loadingUser ? 'Bezig...' : 'Veilig Inloggen'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    </div>

                    {/* Links onder de kaart */}
                    <div className="mt-8 text-center text-sm space-y-4">
                        <p>
                            <button onClick={handleEmergencyReset} className="font-medium text-gray-500 hover:text-emerald-600">
                                Wachtwoord vergeten?
                            </button>
                        </p>
                        <p>
                            <button onClick={() => switchSubdomain('register')} className="font-medium text-gray-500 hover:text-emerald-600">
                                Andere organisatie of nieuwe registratie?
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
    // =======================================================
    // EINDE VERVANGING
    // =======================================================
};

export default LoginPage;