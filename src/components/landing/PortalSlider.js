// src/components/landing/PortalSlider.js
import React, { useState } from 'react';
import { Shield, User, Users, ArrowLeft, ArrowRight } from 'lucide-react';

const portalData = [
    {
        icon: Shield,
        title: "Admin Dashboard",
        description: "Krijg volledig overzicht en controle over de administratie. Beheer financiën, gebruikers en klassen moeiteloos vanuit één centraal punt.",
        features: ["Betalingen & Facturatie", "Ouder- & Leerlingbeheer", "Klassen & Groepen Indelen", "Centrale Aankondigingen"],
        color: "blue",
        image: "https://placehold.co/1200x800/e0f2fe/0284c7?text=Screenshot+Admin+Dashboard"
    },
    {
        icon: User,
        title: "Leraar Portaal",
        description: "Een krachtige omgeving voor leraren om de voortgang van leerlingen te volgen, aanwezigheid te registreren en effectief te communiceren.",
        features: ["Qor'aan Voortgang Tracker", "Digitale Absentieregistratie", "Communicatie met Ouders", "Rapporten Genereren"],
        color: "emerald",
        image: "https://placehold.co/1200x800/ecfdf5/059669?text=Screenshot+Leraar+Portaal"
    },
    {
        icon: Users,
        title: "Ouder Portaal",
        description: "Verhoog de betrokkenheid van ouders door ze direct inzicht te geven in de ontwikkeling, aanwezigheid en resultaten van hun kind.",
        features: ["Real-time Voortgang Inzien", "Absentieoverzicht Bekijken", "Facturen en Betalingen", "Berichten van Leraar Ontvangen"],
        color: "purple",
        image: "https://placehold.co/1200x800/f3e8ff/8b5cf6?text=Screenshot+Ouder+Portaal"
    }
];

const PortalSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % portalData.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + portalData.length) % portalData.length);
    };

    const slide = portalData[currentSlide];
    const IconComponent = slide.icon;
    const colorMap = {
        blue: { text: 'text-blue-600', ring: 'ring-blue-500' },
        emerald: { text: 'text-emerald-600', ring: 'ring-emerald-500' },
        purple: { text: 'text-purple-600', ring: 'ring-purple-500' }
    };
    const colors = colorMap[slide.color];

    return (
        <section id="features" className="py-20 bg-gray-50 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Ontworpen voor Iedere Rol
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Verken de krachtige, op maat gemaakte portalen die MijnLVS biedt voor beheerders, leraren en ouders.
                    </p>
                </div>

                <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side: Content */}
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center mb-4">
                                <IconComponent className={`w-10 h-10 mr-4 ${colors.text}`} />
                                <h3 className="text-4xl font-bold text-gray-900">{slide.title}</h3>
                            </div>
                            <p className="text-lg text-gray-600 mb-6">{slide.description}</p>
                            <ul className="space-y-3">
                                {slide.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-gray-700">
                                        <div className={`w-2 h-2 rounded-full mr-3 ${colors.text === 'text-blue-600' ? 'bg-blue-500' : colors.text === 'text-emerald-600' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right Side: Image */}
                        <div className="relative w-full h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
                            <img 
                                src={slide.image} 
                                alt={`Screenshot of ${slide.title}`}
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="absolute bottom-8 right-8 flex items-center space-x-4">
                         <button 
                            onClick={prevSlide}
                            className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-all text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                            aria-label="Vorige slide"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-all text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                            aria-label="Volgende slide"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PortalSlider;
