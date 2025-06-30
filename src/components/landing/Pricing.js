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
        <div id="prijzen" className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Kies het plan dat bij u past</h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">Start vandaag nog met het Professioneel Plan en transformeer uw Islamitisch onderwijs. Transparante prijzen, geen verborgen kosten.</p>
                </div>
                
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
                
                <div className="mt-16 text-center">
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-200 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Klaar om te beginnen?</h3>
                        <p className="text-gray-600 mb-6">Join honderden moskeeën die al gebruik maken van MijnLVS voor hun onderwijsmanagement</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={onChooseProfessional}
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
    );
};

export default Pricing;
