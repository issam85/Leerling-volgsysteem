// src/components/landing/Pricing.js
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button';
import { CheckCircle, Star, ArrowRight } from 'lucide-react';

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
        handler: 'handleChooseProfessional',
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

const Pricing = ({ onChooseProfessional, onStartTrial, isProcessingPayment }) => {
    const getHandler = (handlerName) => {
        if (handlerName === 'handleChooseProfessional') return onChooseProfessional;
        if (handlerName === 'handleStartTrial') return onStartTrial;
        return null;
    };

    return (
        <div id="prijzen" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Kies het plan dat bij u past</h2>
                    <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">Start vandaag nog met het Professioneel Plan en transformeer uw Islamitisch onderwijs. Transparante prijzen, geen verborgen kosten.</p>
                </div>
                
                <div className="mb-8 sm:mb-12 text-center">
                    <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="hidden sm:inline">Aanbevolen: Start direct met het Professioneel Plan voor de beste ervaring</span>
                        <span className="sm:hidden">Aanbevolen: Professioneel Plan</span>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                    {pricingTiers.map(tier => (
                        <div key={tier.name} className={`w-full mx-auto border rounded-2xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex flex-col bg-white relative transform hover:scale-105 transition-all duration-200 ${tier.isFeatured ? 'border-emerald-500 border-2 shadow-2xl ring-4 ring-emerald-100 md:col-span-2 xl:col-span-1' : 'border-gray-200 hover:shadow-lg'}`}>
                            {tier.badge && (
                                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-bold text-white bg-emerald-500 rounded-full shadow-lg">
                                        {tier.badge}
                                    </span>
                                </div>
                            )}
                            
                            <div className="pt-2 sm:pt-4">
                                <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">{tier.name}</h3>
                                {tier.description && (
                                    <p className="text-gray-600 text-xs sm:text-sm text-center mb-3 sm:mb-4 leading-relaxed">{tier.description}</p>
                                )}
                            </div>
                            
                            <div className="text-center">
                                <span className={`text-3xl sm:text-4xl font-extrabold ${tier.isFeatured ? 'text-emerald-600' : 'text-gray-900'}`}>{tier.price}</span>
                                <span className="text-gray-500 ml-1 text-sm sm:text-base">{tier.priceSuffix}</span>
                            </div>
                            
                            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm flex-grow">
                                {tier.features.map(feature => (
                                    <li key={feature} className="flex items-start">
                                        <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 mt-0.5 ${tier.isFeatured ? 'text-emerald-500' : 'text-gray-400'}`} />
                                        <span className={`leading-relaxed ${tier.isFeatured ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            {tier.isStripeCheckout ? (
                                <Button 
                                    fullWidth 
                                    variant={tier.isFeatured ? 'primary' : 'secondary'} 
                                    size="lg"
                                    onClick={getHandler(tier.handler)}
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
                
                <div className="mt-8 sm:mt-12 lg:mt-16 text-center">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-emerald-200 max-w-2xl mx-auto">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Klaar om te beginnen?</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">Klaar om de volgende stap te zetten in de professionalisering van uw onderwijs?</p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                            <button 
                                onClick={onChooseProfessional}
                                disabled={isProcessingPayment}
                                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                            >
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span className="hidden sm:inline">{isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan Nu'}</span>
                                <span className="sm:hidden">{isProcessingPayment ? 'Laden...' : 'Start Pro Nu'}</span>
                            </button>
                            <Link to="/register" className="w-full sm:w-auto">
                                <button className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-200">
                                    <span className="hidden sm:inline">Of probeer 14 dagen gratis</span>
                                    <span className="sm:hidden">14 dagen gratis</span>
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
