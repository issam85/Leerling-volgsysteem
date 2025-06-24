// src/pages/LandingPage.js - Complete versie
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import appLogo from '../assets/logo-mijnlvs.png';
import Button from '../components/Button';
import { CheckCircle, BookOpen, Users, BarChart3, Building, ArrowRight } from 'lucide-react';

// Import je bestaande API service
import { apiCall } from '../services/api';

const LandingPage = () => {
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Stripe Checkout Handler voor Professioneel Plan
    const handleStartTrial = async () => {
        setIsProcessingPayment(true);
        try {
            const priceId = 'price_1RdFm2CHZ9R82JCdw329WusE';
            
            const result = await apiCall('/api/payments/stripe/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({ 
                    priceId,
                    skipTrial: false,  // ✅ Trial WEL toestaan
                    metadata: {
                        plan_type: 'professional',
                        source: 'landing_page_trial',
                        product_id: 'prod_SYMVWz9hrt46zg'
                    }
                })
            });
            
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Stripe trial checkout error:', error);
            setIsProcessingPayment(false);
        }
    };

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
            price: '€25',
            priceSuffix: '/ maand',
            features: ['Onbeperkt Aantal Leerlingen', 'Financieel Beheer', 'Qor\'aan Voortgang', 'Rapporten Module', 'Email Communicatie', 'Standaard Support'],
            cta: 'Kies Professioneel',
            handler: handleChooseProfessional,
            isFeatured: true,
            isStripeCheckout: true,
        },
        {
            name: 'Compleet',
            price: 'Maatwerk',
            priceSuffix: 'voor grote organisaties',
            features: ['Alles in Professioneel', 'Eigen Branding', 'API Toegang', 'Persoonlijke Onboarding', 'Prioriteitssupport'],
            cta: 'Neem Contact Op',
            link: 'mailto:i.abdellaoui@gmail.com',
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
                                <p className="mt-2 text-sm text-gray-500 text-center lg:text-left">
                                    Of ga direct naar 
                                    <button 
                                        onClick={handleChooseProfessional}
                                        disabled={isProcessingPayment}
                                        className="text-emerald-600 hover:underline ml-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessingPayment ? 'Bezig met laden...' : 'Professioneel Plan (€25/maand)'}
                                    </button>
                                </p>
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

            {/* Communicatie & Email Sectie */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            ✉️ Directe Communicatie met Ouders
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Versterkt de betrokkenheid van ouders door naadloze communicatie tussen leraren en families
                        </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Linkerkant: Visual Preview - Email Composer */}
                        <div className="bg-gray-50 rounded-2xl p-8">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Nieuwe E-mail</h3>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Leraar Portal</span>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Aan:</label>
                                        <div className="mt-1 p-2 bg-gray-50 rounded border text-sm text-gray-600">
                                            📧 Alle ouders Klas 3 (24 ouders)
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Onderwerp:</label>
                                        <div className="mt-1 p-2 bg-gray-50 rounded border text-sm text-gray-900">
                                            Qor'aan toets aanstaande vrijdag
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Bericht:</label>
                                        <div className="mt-1 p-3 bg-gray-50 rounded border text-sm text-gray-700 leading-relaxed">
                                            Assalamu Alaikum wa rahmatullahi wa barakatuh,<br/><br/>
                                            Aanstaande vrijdag hebben we een Qor'aan toets van Surah Al-Falaq. 
                                            Graag thuis extra oefenen...<br/><br/>
                                            Barakallahu feeki,<br/>
                                            Ustadh Omar
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                            📤 Verstuur naar 24 ouders
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rechterkant: Features */}
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Bulk E-mails naar Klas</h3>
                                    <p className="text-gray-600">Leraren kunnen met één klik alle ouders van hun klas informeren over toetsen, activiteiten of belangrijke mededelingen</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Individuele Ouder Communicatie</h3>
                                    <p className="text-gray-600">Persoonlijke berichten naar specifieke ouders over de voortgang of gedrag van hun kind</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Ouders Kunnen Reageren</h3>
                                    <p className="text-gray-600">Ouders kunnen direct vanuit hun portaal contact opnemen met de leraar voor vragen of feedback</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Email Geschiedenis</h3>
                                    <p className="text-gray-600">Alle communicatie wordt bewaard zodat u altijd kunt terugkijken wat er besproken is</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">💡 Praktijkvoorbeeld</h4>
                                <p className="text-sm text-blue-800">
                                    "Dankzij MijnLVS ben ik als ouder veel meer betrokken. Ik krijg direct updates over de Qor'aan voortgang van mijn dochter en kan de leraar makkelijk bereiken met vragen."
                                </p>
                                <p className="text-xs text-blue-600 mt-2">— Fatima, moeder van Aisha (8 jaar)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Qor'aan Memorisatie Tracking Sectie */}
            <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            📖 Qor'aan Memorisatie Tracker
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Het enige systeem in Nederland dat speciaal ontworpen is voor het volgen van Qor'aan memorisatie en recitatie per leerling
                        </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Linkerkant: Features */}
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Surah-per-Surah Tracking</h3>
                                    <p className="text-gray-600">Volg precies welke ayaat elke leerling heeft gememoriseerd, van Al-Fatiha tot An-Nas</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Recitatie Kwaliteit</h3>
                                    <p className="text-gray-600">Beoordeel tajweed, vloeiendheid en correctheid met een eenvoudig cijfersysteem</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Ouder Inzicht</h3>
                                    <p className="text-gray-600">Ouders zien real-time de Qor'aan voortgang van hun kind via het ouderportaal</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Automatische Rapporten</h3>
                                    <p className="text-gray-600">Genereer professionele voortgangsrapporten met Qor'aan statistieken per periode</p>
                                </div>
                            </div>
                        </div>

                        {/* Rechterkant: Visual Preview */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Ahmed's Qor'aan Voortgang</h3>
                                <p className="text-gray-600 text-sm">Klas 3 • Leraar: Ustadh Omar</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-gray-900">Surah Al-Fatiha</span>
                                        <div className="text-xs text-gray-500">7 ayaat</div>
                                    </div>
                                    <div className="text-green-600 font-bold">✓ Voltooid</div>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-gray-900">Surah An-Nas</span>
                                        <div className="text-xs text-gray-500">6 ayaat</div>
                                    </div>
                                    <div className="text-green-600 font-bold">✓ Voltooid</div>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-gray-900">Surah Al-Falaq</span>
                                        <div className="text-xs text-gray-500">5 ayaat • 3/5 geleerd</div>
                                    </div>
                                    <div className="text-blue-600 font-bold">60%</div>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-gray-900">Surah Al-Ikhlas</span>
                                        <div className="text-xs text-gray-500">4 ayaat</div>
                                    </div>
                                    <div className="text-gray-500">Nog niet gestart</div>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-emerald-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-emerald-600">19/22</div>
                                <div className="text-sm text-emerald-700">Ayaat gememoriseerd deze maand</div>
                            </div>
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
                                {tier.isStripeCheckout ? (
                                    <Button 
                                        fullWidth 
                                        variant={tier.isFeatured ? 'primary' : 'secondary'} 
                                        size="lg"
                                        onClick={tier.handler}
                                        disabled={isProcessingPayment}
                                    >
                                        {isProcessingPayment ? 'Bezig met laden...' : tier.cta}
                                    </Button>
                                ) : tier.link && tier.link.startsWith('mailto') ? (
                                    <a href={tier.link} className="block">
                                        <Button fullWidth variant={tier.isFeatured ? 'primary' : 'secondary'} size="lg">
                                            {tier.cta}
                                        </Button>
                                    </a>
                                ) : tier.link ? (
                                    <Link to={tier.link} className="block">
                                        <Button fullWidth variant={tier.isFeatured ? 'primary' : 'secondary'} size="lg">
                                            {tier.cta}
                                        </Button>
                                    </Link>
                                ) : null}
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
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={handleStartDemo}
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-emerald-600 bg-white border border-transparent rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
                        >
                            Gratis Registreren 
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                        
                        <a href="mailto:i.abdellaoui@gmail.com">
                            <button 
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
                            >
                                📞 Plan een demo gesprek
                            </button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <img src={appLogo} className="h-8 mr-3" alt="MijnLVS" />
                            <span className="font-bold text-xl">MijnLVS</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            <a href="mailto:i.abdellaoui@gmail.com" className="hover:text-white mr-6 transition-colors">
                                📧 i.abdellaoui@gmail.com
                            </a>
                            <a href="tel:0640246600" className="hover:text-white transition-colors">
                                📞 06-40246600
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