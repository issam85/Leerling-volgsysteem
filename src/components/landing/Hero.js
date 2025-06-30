// src/components/landing/Hero.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BarChart3, ArrowRight, ChevronLeft, ChevronRight, Star, Shield, Award, TrendingUp } from 'lucide-react';

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

const Hero = ({ onStartProfessional, onStartTrial, isProcessingPayment, onLoginClick }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    return (
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
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                                            <button 
                                                onClick={onStartProfessional}
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
            
            <div className="absolute top-4 right-4 z-20">
                <button 
                    onClick={onLoginClick} 
                    className="text-white/80 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200"
                >
                    Al klant? Inloggen →
                </button>
            </div>
        </div>
    );
};

export default Hero;
