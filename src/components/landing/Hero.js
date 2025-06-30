// src/components/landing/Hero.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BarChart3, ArrowRight, ChevronLeft, ChevronRight, Star, Shield, Award } from 'lucide-react';
import appLogo from '../../assets/logo-mijnlvs.png';

const heroSlides = [
    {
        title: "Het complete systeem voor uw Islamitisch onderwijs",
        subtitle: "Beheer leerlingen, voortgang, financiën en communicatie vanuit één professioneel platform",
        highlight: "Qor'aan Memorisatie Tracker",
        icon: BookOpen,
        gradient: "from-emerald-600 to-teal-600",
    },
    {
        title: "Directe communicatie met alle ouders",
        subtitle: "Verstuur updates, rapporten en mededelingen naar ouders met een enkele klik",
        highlight: "Email & Ouder Portaal",
        icon: Users,
        gradient: "from-blue-600 to-purple-600",
    },
    {
        title: "Professionele rapporten en analyses",
        subtitle: "Automatische voortgangsrapporten en inzichtelijke dashboards voor betere besluitvorming",
        highlight: "Slimme Analytics",
        icon: BarChart3,
        gradient: "from-orange-600 to-red-600",
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
        <div className="relative overflow-hidden bg-gray-900 min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center">
            {heroSlides.map((slide, index) => {
                const IconComponent = slide.icon;
                return (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}></div>
                        <div className="absolute inset-0 bg-black/30"></div>
                        
                        <div className="relative z-10 h-full flex items-center">
                            <div className="container mx-auto px-4 sm:px-6">
                                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                                    <div className="text-center lg:text-left">
                                        <div className="flex items-center justify-center lg:justify-start mb-4 sm:mb-6">
                                            <div className="bg-white/20 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                                                <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                            </div>
                                            <span className="text-white/90 font-medium text-sm sm:text-base">{slide.highlight}</span>
                                        </div>
                                        
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                                            {slide.title}
                                        </h1>
                                        <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl lg:max-w-none mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
                                            {slide.subtitle}
                                        </p>
                                        
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8">
                                            <button 
                                                onClick={onStartProfessional}
                                                disabled={isProcessingPayment}
                                                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-emerald-600 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                                            >
                                                <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                <span className="hidden sm:inline">{isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan - €25/maand'}</span>
                                                <span className="sm:hidden">{isProcessingPayment ? 'Laden...' : 'Start Pro - €25/maand'}</span>
                                            </button>
                                            
                                            <Link to="/register" className="w-full sm:w-auto">
                                                <button className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-white/20 border-2 border-white rounded-xl hover:bg-white/30 transition-all duration-200">
                                                    <span className="hidden sm:inline">14-dagen gratis proberen</span>
                                                    <span className="sm:hidden">Gratis proberen</span>
                                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                                                </button>
                                            </Link>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center space-y-2 sm:space-y-0 sm:space-x-6 lg:space-x-8 text-xs sm:text-sm text-white/80">
                                            <span className="flex items-center">
                                                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                Veilig & Betrouwbaar
                                            </span>
                                            <span className="flex items-center">
                                                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                Direct beschikbaar
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-8 sm:mt-12 lg:mt-0 flex items-center justify-center">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 w-full max-w-xs sm:max-w-sm">
                                            <img src={appLogo} alt="MijnLVS Logo" className="w-full h-auto" />
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
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-200 z-20 touch-manipulation"
                aria-label="Vorige slide"
            >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <button 
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-200 z-20 touch-manipulation"
                aria-label="Volgende slide"
            >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            {/* Slide Indicators */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 z-20">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 touch-manipulation ${
                            index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Ga naar slide ${index + 1}`}
                    />
                ))}
            </div>
            
            {/* Login Button - Hidden on mobile */}
            <div className="absolute top-4 right-4 z-20 hidden sm:block">
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

