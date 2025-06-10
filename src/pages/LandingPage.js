// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import appLogo from '../assets/logo-mijnlvs.png';
import Button from '../components/Button';
import { CheckCircle, BookOpen, Users, BarChart3, Building, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const pricingTiers = [
        {
            name: 'Basis',
            price: 'Gratis',
            priceSuffix: 'tot 10 leerlingen',
            features: ['Leerlingen & Klassenbeheer', 'Basis Aanwezigheid', '1 Beheerder', 'Max 2 Leraren'],
            cta: 'Start Gratis Demo',
            link: '/register',
            isFeatured: false,
        },
        {
            name: 'Professioneel',
            price: '€29',
            priceSuffix: '/ maand',
            features: ['Onbeperkt Aantal Leerlingen', 'Financieel Beheer', 'Qor\'aan Voortgang', 'Rapporten Module', 'Email Communicatie', 'Standaard Support'],
            cta: 'Kies Professioneel',
            link: '/register',
            isFeatured: true,
        },
        {
            name: 'Compleet',
            price: 'Maatwerk',
            priceSuffix: 'voor grote organisaties',
            features: ['Alles in Professioneel', 'Eigen Branding', 'API Toegang', 'Persoonlijke Onboarding', 'Prioriteitssupport'],
            cta: 'Neem Contact Op',
            link: 'mailto:info@mijnlvs.nl',
            isFeatured: false,
        },
    ];

    const handleExistingLogin = () => {
        const subdomain = prompt('Voer het subdomein van uw organisatie in (bijv: al-noor):');
        if (subdomain && subdomain.trim()) {
            window.location.href = `https://${subdomain.trim().toLowerCase()}.mijnlvs.nl/login`;
        }
    };

    const handleStartDemo = () => {
        // Voor ontwikkeling: ga naar /register op hetzelfde domein
        // Voor productie: zou naar register.mijnlvs.nl kunnen gaan
        window.location.href = '/register';
    };

    return (
        <div className="bg-white text-gray-800">
            {/* Sticky Navigation */}
            <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-6">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <img className="h-10 w-auto" src={appLogo} alt="MijnLVS" />
                            <span className="ml-3 text-xl font-bold text-gray-900">MijnLVS</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors">Features</a>
                            <a href="#prijzen" className="text-gray-600 hover:text-emerald-600 transition-colors">Prijzen</a>
                            <Button onClick={handleExistingLogin} variant="ghost">Inloggen</Button>
                            <Button onClick={handleStartDemo} variant="primary">Demo Starten</Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section met Visual Dashboard */}
            <div className="relative bg-gradient-to-br from-gray-50 via-white to-emerald-50">
                <div className="container mx-auto px-6 py-20">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                        {/* Linkerkant: Content */}
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                                Het hart van uw Islamitisch onderwijs.
                            </h1>
                            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl lg:max-w-none mx-auto lg:mx-0">
                                MijnLVS biedt overzicht en structuur voor moskeeën en onderwijsinstellingen. Beheer leerlingen, voortgang, financiën en communicatie vanuit één centraal, modern platform.
                            </p>
                            <div className="mt-8">
                                <Link to="/register">
                                    <Button size="lg" className="text-lg py-4 px-8">
                                        Start je 14-daagse demo nu
                                    </Button>
                                </Link>
                            </div>
                            
                            {/* Trust indicators */}
                            <div className="mt-6 flex justify-center lg:justify-start items-center space-x-8 text-sm text-gray-500">
                                <span className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                                    Geen creditcard nodig
                                </span>
                                <span className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                                    Direct beschikbaar
                                </span>
                            </div>

                            {/* Existing customer login */}
                            <p className="mt-4 text-sm text-gray-500">
                                Al klant? 
                                <button 
                                    onClick={handleExistingLogin} 
                                    className="text-emerald-600 hover:underline ml-1 font-medium"
                                >
                                    Log hier in op uw organisatie
                                </button>
                            </p>
                        </div>

                        {/* Rechterkant: Visual Dashboard Preview */}
                        <div className="mt-12 lg:mt-0">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl transform rotate-6"></div>
                                <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                                    <div className="text-center">
                                        <Building className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Uw Moskee Dashboard</h3>
                                        <p className="text-gray-600 mb-6">Real-time inzicht in alle aspecten van uw onderwijs</p>
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="bg-emerald-50 p-4 rounded-lg">
                                                <div className="text-2xl font-bold text-emerald-600">156</div>
                                                <div className="text-sm text-gray-600">Actieve Leerlingen</div>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600">12</div>
                                                <div className="text-sm text-gray-600">Leraren</div>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg">
                                                <div className="text-2xl font-bold text-purple-600">94%</div>
                                                <div className="text-sm text-gray-600">Aanwezigheid</div>
                                            </div>
                                            <div className="bg-orange-50 p-4 rounded-lg">
                                                <div className="text-2xl font-bold text-orange-600">8.7</div>
                                                <div className="text-sm text-gray-600">Gem. Cijfer</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compacte Features Sectie */}
            <section id="features" className="py-12 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <BookOpen className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-semibold">Qor'aan Voortgang</h3>
                            <p className="text-sm text-gray-600">Volg memorisatie en recitatie per leerling</p>
                        </div>
                        <div>
                            <Users className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-semibold">Ouder Portaal</h3>
                            <p className="text-sm text-gray-600">Transparante communicatie met alle ouders</p>
                        </div>
                        <div>
                            <BarChart3 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-semibold">Slimme Rapporten</h3>
                            <p className="text-sm text-gray-600">Automatische voortgangsrapporten genereren</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <div id="prijzen" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Een plan voor elke organisatie</h2>
                        <p className="text-gray-600 mt-2">Kies het pakket dat bij u past. Eenvoudig, transparant en zonder verborgen kosten.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        {pricingTiers.map(tier => (
                            <div key={tier.name} className={`w-full max-w-sm border rounded-xl p-8 space-y-6 flex flex-col bg-white ${tier.isFeatured ? 'border-emerald-500 border-2 shadow-2xl' : 'border-gray-200'}`}>
                                {tier.isFeatured && <div className="text-center"><span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">Meest Gekozen</span></div>}
                                <h3 className="text-2xl font-bold text-center">{tier.name}</h3>
                                <div className="text-center">
                                    <span className="text-4xl font-extrabold">{tier.price}</span>
                                    <span className="text-gray-500 ml-1">{tier.priceSuffix}</span>
                                </div>
                                <ul className="space-y-3 text-sm flex-grow">
                                    {tier.features.map(feature => (
                                        <li key={feature} className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                {tier.link.startsWith('mailto') ? (
                                    <a href={tier.link} className="block">
                                        <Button fullWidth variant={tier.isFeatured ? 'primary' : 'secondary'} size="lg">
                                            {tier.cta}
                                        </Button>
                                    </a>
                                ) : (
                                    <Link to={tier.link} className="block">
                                        <Button fullWidth variant={tier.isFeatured ? 'primary' : 'secondary'} size="lg">
                                            {tier.cta}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Extra CTA Sectie */}
            <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                        Klaar om uw onderwijs te digitaliseren?
                    </h2>
                    <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                        Sluit u aan bij tientallen organisaties die hun administratie al hebben gemoderniseerd met MijnLVS
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                            onClick={handleStartDemo}
                            size="xl" 
                            className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold"
                        >
                            Start Nu Gratis <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <a href="mailto:info@mijnlvs.nl">
                            <Button 
                                variant="ghost" 
                                size="xl" 
                                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                            >
                                📞 Plan een demo gesprek
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Betere Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <img src={appLogo} className="h-8 mr-3" alt="MijnLVS" />
                            <span className="font-bold text-xl">MijnLVS</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            <a href="mailto:info@mijnlvs.nl" className="hover:text-white mr-6 transition-colors">
                                📧 info@mijnlvs.nl
                            </a>
                            <a href="tel:085-1234567" className="hover:text-white transition-colors">
                                📞 085-1234567
                            </a>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
                        © {new Date().getFullYear()} MijnLVS. Alle rechten voorbehouden.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;