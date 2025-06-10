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
    
    // State voor slimme subdomein switching
    const [showSubdomainInput, setShowSubdomainInput] = useState(false);
    const [switchSubdomainValue, setSwitchSubdomainValue] = useState('');
    
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

    const handleSwitchToSubdomain = () => {
        if (switchSubdomainValue.trim()) {
            switchSubdomain(switchSubdomainValue.trim().toLowerCase());
        }
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

    return (
        <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
            {/* KOLOM 1: De "Branding" Kolom */}
            <div className="hidden lg:flex lg:flex-col justify-between bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-8 xl:p-12">
                <div>
                    <div className="flex items-center text-lg font-medium">
                        <Building className="w-8 h-8 mr-3 bg-white/20 p-1.5 rounded-lg" />
                        <span>Portaal voor</span>
                    </div>
                    <h1 className="mt-4 text-5xl font-bold tracking-tight">
                        {realData.mosque?.name || 'Uw Organisatie'}
                    </h1>
                    <p className="mt-2 text-2xl text-emerald-200">
                        {realData.mosque?.city}
                    </p>
                </div>
                <div className="text-sm text-emerald-300">
                    <p>Mogelijk gemaakt door MijnLVS</p>
                </div>
            </div>

            {/* KOLOM 2: De Inlog-Actie Kolom */}
            <div className="flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="text-center">
                        <img className="mx-auto h-12 w-auto mb-4" src={appLogo} alt="MijnLVS Logo" />
                        <h2 className="text-2xl font-bold text-gray-900">
                            Inloggen op uw account
                        </h2>
                        {/* Subtitel voor mobiele weergave */}
                        <p className="lg:hidden mt-2 text-sm text-gray-500">
                            Portaal voor {realData.mosque?.name || 'uw organisatie'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
                            <p className="text-red-600 text-sm text-center bg-red-50 p-2.5 rounded-md">
                                {error}
                            </p>
                        )}

                        <Button 
                            type="submit" 
                            variant="primary" 
                            fullWidth 
                            size="lg" 
                            disabled={loadingUser}
                        >
                            {loadingUser ? 'Bezig...' : 'Veilig Inloggen'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    {/* Emergency Reset */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={handleEmergencyReset}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                            title="Reset alle inlogsessies en probeer opnieuw"
                        >
                            Problemen met inloggen? Klik hier om te resetten
                        </button>
                    </div>

                    {/* Development Demo Info */}
                    {process.env.NODE_ENV === 'development' && currentSubdomain !== 'register' && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200 text-center">
                            <p className="text-xs text-gray-500 font-semibold mb-1">DEV: Demo ({currentSubdomain})</p>
                            <div className="text-xs space-y-0.5 text-gray-600">
                                <p><strong>Admin:</strong> admin@{currentSubdomain}.nl / admin</p>
                            </div>
                        </div>
                    )}

                    {/* Slimme Subdomein Switching */}
                    <div className="text-center mt-8">
                        {!showSubdomainInput ? (
                            <p className="text-sm text-gray-600">
                                Andere organisatie?{' '}
                                <button
                                    onClick={() => setShowSubdomainInput(true)}
                                    className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:underline"
                                >
                                    Wissel van organisatie
                                </button>
                                {' of '}
                                <button 
                                    onClick={() => switchSubdomain('register')} 
                                    className="font-medium text-emerald-600 hover:text-emerald-500"
                                >
                                    Registreer nieuwe organisatie
                                </button>
                            </p>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <label htmlFor="switch-subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                                    Naar welke organisatie wilt u?
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="switch-subdomain"
                                        name="switchSubdomain"
                                        value={switchSubdomainValue}
                                        onChange={(e) => setSwitchSubdomainValue(e.target.value)}
                                        placeholder="bijv. al-noor"
                                        className="flex-grow"
                                    />
                                    <Button 
                                        onClick={handleSwitchToSubdomain} 
                                        disabled={!switchSubdomainValue.trim()}
                                        size="sm"
                                    >
                                        Ga verder
                                    </Button>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <button
                                        onClick={() => setShowSubdomainInput(false)}
                                        className="text-xs text-gray-500 hover:underline"
                                    >
                                        Annuleren
                                    </button>
                                    <button
                                        onClick={() => switchSubdomain('register')}
                                        className="text-xs text-emerald-600 hover:underline"
                                    >
                                        Of registreer nieuwe organisatie
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;