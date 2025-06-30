// src/pages/LandingPage.js - Complete versie
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import appLogo from '../assets/logo-mijnlvs.png';
import Button from '../components/Button';
import { CheckCircle, BookOpen, Users, BarChart3, Building, ArrowRight, ChevronLeft, ChevronRight, Star, TrendingUp, Award, Shield } from 'lucide-react';

// Import je bestaande API service
import { apiCall } from '../services/api';

const LandingPage = () => {
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const heroSlides = [
        {
            title: "Het complete systeem voor uw Islamitisch onderwijs",
            subtitle: "Beheer leerlingen, voortgang, financiën en communicatie vanuit één professioneel platform",
            highlight: "Qor'aan Memorisatie Tracker",
            icon: BookOpen,
            gradient: "from-emerald-600 to-teal-600",
            stats: { label: "156 Actieve Leerlingen", value: "94% Aanwezigheid" }
        },
        {
            title: "Directe communicatie met alle ouders",
            subtitle: "Verstuur updates, rapporten en mededelingen naar ouders met een enkele klik",
            highlight: "Email & Ouder Portaal",
            icon: Users,
            gradient: "from-blue-600 to-purple-600",
            stats: { label: "24 Ouders bereikt", value: "98% Open rate" }
        },
        {
            title: "Professionele rapporten en analyses",
            subtitle: "Automatische voortgangsrapporten en inzichtelijke dashboards voor betere besluitvorming",
            highlight: "Slimme Analytics",
            icon: BarChart3,
            gradient: "from-orange-600 to-red-600",
            stats: { label: "12 Leraren actief", value: "8.7 Gem. cijfer" }
        }
    ];
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);
    
    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };
    
    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

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

    const handleChooseProfessional = async () => {
        setIsProcessingPayment(true);
        try {
            const priceId = 'price_1RdFm2CHZ9R82JCdw329WusE'; // De LIVE price ID
            
            // ✅ Roep je backend aan en vertel dat de proefperiode overgeslagen moet worden
            const result = await apiCall('/api/payments/stripe/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({ 
                    priceId,
                    skipTrial: true,  // ✅ STUUR DEZE PARAMETER MEE
                    metadata: {
                        plan_type: 'professional',
                        source: 'landing_page_direct_payment', // Maak de bron duidelijker
                        product_id: 'prod_SYMVWz9hrt46zg'
                    }
                })
            });
            
            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error('Geen checkout URL ontvangen');
            }
        } catch (error) {
            console.error('Stripe checkout error:', error);
            
            let errorMessage = 'Er ging iets mis bij het starten van de betaling.';
            if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
            setIsProcessingPayment(false);
        }
    };

    const pricingTiers = [
        {
            name: 'Professioneel',
            price: '€25',
            priceSuffix: '/ maand',
            features: [
                'Onbeperkt Aantal Leerlingen', 
                'Qor\'aan Memorisatie Tracker', 
                'Financieel Beheer & Betalingen', 
                'Email Communicatie naar Ouders', 
                'Professionele Rapporten', 
                'Aanwezigheid Tracking',
                'Ouder Portaal Toegang',
                'Priority Support'
            ],
            cta: 'Start Professioneel Plan',
            handler: handleChooseProfessional,
            isFeatured: true,
            isStripeCheckout: true,
            badge: 'Meest Populair',
            description: 'Perfect voor moskeeën en onderwijsinstellingen'
        },
        {
            name: 'Gratis Demo',
            price: 'Gratis',
            priceSuffix: '14 dagen proberen',
            features: ['Alle Pro functies', 'Beperkt tot 10 leerlingen', 'Basis Support', 'Geen betaalgegevens vereist'],
            cta: 'Start Gratis Demo',
            link: '/register',
            isFeatured: false,
            description: 'Test alle functionaliteiten zonder kosten'
        },
        {
            name: 'Enterprise',
            price: 'Maatwerk',
            priceSuffix: 'voor grote organisaties',
            features: [
                'Alles in Professioneel', 
                'Eigen Branding & Logo', 
                'API Toegang & Integraties', 
                'Persoonlijke Onboarding', 
                'Dedicated Account Manager',
                'Custom Features',
                'SLA Garantie'
            ],
            cta: 'Plan een Demo',
            link: 'mailto:i.abdellaoui@gmail.com',
            isFeatured: false,
            description: 'Volledig op maat gemaakte oplossingen'
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

            {/* Hero Slider Banner */}
            <div className="relative overflow-hidden">
                {heroSlides.map((slide, index) => {
                    const IconComponent = slide.icon;
                    return (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-transform duration-700 ease-in-out transform ${
                                index === currentSlide ? 'translate-x-0' : 
                                index < currentSlide ? '-translate-x-full' : 'translate-x-full'
                            }`}
                        >
                            <div className={`bg-gradient-to-br ${slide.gradient} text-white relative`}>
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="container mx-auto px-6 py-24 lg:py-32 relative z-10">
                                    <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                                        {/* Linkerkant: Content */}
                                        <div className="text-center lg:text-left">
                                            <div className="flex items-center justify-center lg:justify-start mb-6">
                                                <div className="bg-white/20 p-3 rounded-full mr-4">
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>
                                                <span className="text-white/90 font-medium">{slide.highlight}</span>
                                            </div>
                                            
                                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                                                {slide.title}
                                            </h1>
                                            <p className="text-lg md:text-xl text-white/90 max-w-3xl lg:max-w-none mx-auto lg:mx-0 mb-8">
                                                {slide.subtitle}
                                            </p>
                                            
                                            {/* Primary CTA - Pro Plan */}
                                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                                                <button 
                                                    onClick={handleChooseProfessional}
                                                    disabled={isProcessingPayment}
                                                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-emerald-600 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                                                >
                                                    <Star className="w-5 h-5 mr-2" />
                                                    {isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan - €25/maand'}
                                                </button>
                                                
                                                <Link to="/register">
                                                    <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-white/20 border-2 border-white rounded-xl hover:bg-white/30 transition-all duration-200">
                                                        14-dagen gratis proberen
                                                        <ArrowRight className="w-5 h-5 ml-2" />
                                                    </button>
                                                </Link>
                                            </div>
                                            
                                            {/* Trust indicators */}
                                            <div className="flex justify-center lg:justify-start items-center space-x-8 text-sm text-white/80">
                                                <span className="flex items-center">
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Veilig & Betrouwbaar
                                                </span>
                                                <span className="flex items-center">
                                                    <Award className="w-4 h-4 mr-2" />
                                                    Direct beschikbaar
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rechterkant: Stats Card */}
                                        <div className="mt-12 lg:mt-0">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                                                <div className="text-center">
                                                    <TrendingUp className="w-16 h-16 text-white mx-auto mb-4" />
                                                    <h3 className="text-2xl font-bold text-white mb-2">Live Dashboard</h3>
                                                    <p className="text-white/80 mb-6">Real-time inzicht in uw onderwijs</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                                            <div className="text-2xl font-bold text-white">{slide.stats.label.split(' ')[0]}</div>
                                                            <div className="text-sm text-white/80">{slide.stats.label.split(' ').slice(1).join(' ')}</div>
                                                        </div>
                                                        <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                                            <div className="text-2xl font-bold text-white">{slide.stats.value.split(' ')[0]}</div>
                                                            <div className="text-sm text-white/80">{slide.stats.value.split(' ').slice(1).join(' ')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {/* Navigation Controls */}
                <button 
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 z-20"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button 
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 z-20"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
                
                {/* Slide Indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
                
                {/* Existing customer login - repositioned */}
                <div className="absolute top-4 right-4 z-20">
                    <button 
                        onClick={handleExistingLogin} 
                        className="text-white/80 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200"
                    >
                        Al klant? Inloggen →
                    </button>
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
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Kies het plan dat bij u past</h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">Start vandaag nog met het Professioneel Plan en transformeer uw Islamitisch onderwijs. Transparante prijzen, geen verborgen kosten.</p>
                    </div>
                    
                    {/* Featured Pro Plan Highlight */}
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-semibold">
                            <Star className="w-5 h-5 mr-2" />
                            Aanbevolen: Start direct met het Professioneel Plan voor de beste ervaring
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-8">
                        {pricingTiers.map(tier => (
                            <div key={tier.name} className={`w-full max-w-sm border rounded-2xl p-8 space-y-6 flex flex-col bg-white relative transform hover:scale-105 transition-all duration-200 ${tier.isFeatured ? 'border-emerald-500 border-2 shadow-2xl ring-4 ring-emerald-100' : 'border-gray-200 hover:shadow-lg'}`}>
                                {tier.badge && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="px-4 py-2 text-sm font-bold text-white bg-emerald-500 rounded-full shadow-lg">
                                            {tier.badge}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="pt-4">
                                    <h3 className="text-2xl font-bold text-center mb-2">{tier.name}</h3>
                                    {tier.description && (
                                        <p className="text-gray-600 text-sm text-center mb-4">{tier.description}</p>
                                    )}
                                </div>
                                
                                <div className="text-center">
                                    <span className={`text-4xl font-extrabold ${tier.isFeatured ? 'text-emerald-600' : 'text-gray-900'}`}>{tier.price}</span>
                                    <span className="text-gray-500 ml-1">{tier.priceSuffix}</span>
                                </div>
                                
                                <ul className="space-y-3 text-sm flex-grow">
                                    {tier.features.map(feature => (
                                        <li key={feature} className="flex items-start">
                                            <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${tier.isFeatured ? 'text-emerald-500' : 'text-gray-400'}`} />
                                            <span className={tier.isFeatured ? 'text-gray-900 font-medium' : 'text-gray-700'}>{feature}</span>
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
                                        className={tier.isFeatured ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 shadow-xl' : ''}
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
                    
                    {/* Bottom CTA for Pro Plan */}
                    <div className="mt-16 text-center">
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-200 max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Klaar om te beginnen?</h3>
                            <p className="text-gray-600 mb-6">Join honderden moskeeën die al gebruik maken van MijnLVS voor hun onderwijsmanagement</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={handleChooseProfessional}
                                    disabled={isProcessingPayment}
                                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                                >
                                    <Star className="w-5 h-5 mr-2" />
                                    {isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan Nu'}
                                </button>
                                <Link to="/register">
                                    <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-200">
                                        Of probeer 14 dagen gratis
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra CTA Sectie */}
            <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                            Transformeer uw Islamitisch onderwijs vandaag nog
                        </h2>
                        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            Join honderden moskeeën die al gebruik maken van MijnLVS. Start met het Professioneel Plan en ervaar direct het verschil.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <button 
                                onClick={handleChooseProfessional}
                                disabled={isProcessingPayment}
                                className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-emerald-600 bg-white border border-transparent rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1"
                            >
                                <Star className="w-6 h-6 mr-3" />
                                {isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan - €25/maand'}
                            </button>
                            
                            <div className="text-white/80 text-sm">of</div>
                            
                            <button 
                                onClick={handleStartDemo}
                                className="inline-flex items-center justify-center px-10 py-5 text-lg font-medium text-white bg-white/20 border-2 border-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 backdrop-blur-sm"
                            >
                                Probeer 14 dagen gratis
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                        
                        <div className="mt-8 flex justify-center items-center space-x-8 text-sm text-white/70">
                            <span className="flex items-center">
                                <Shield className="w-4 h-4 mr-2" />
                                Veilig & Betrouwbaar
                            </span>
                            <span className="flex items-center">
                                <Award className="w-4 h-4 mr-2" />
                                Direct Beschikbaar
                            </span>
                            <span className="flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Geen Setup Kosten
                            </span>
                        </div>
                        
                        <div className="mt-6">
                            <a href="mailto:i.abdellaoui@gmail.com" className="text-white/80 hover:text-white underline text-lg">
                                📞 Of plan een persoonlijke demo: i.abdellaoui@gmail.com
                            </a>
                        </div>
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