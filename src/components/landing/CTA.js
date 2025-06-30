// src/components/landing/CTA.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Shield, Award, CheckCircle } from 'lucide-react';

const CTA = ({ onStartProfessional, onStartDemo, isProcessingPayment }) => {
    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="container mx-auto px-4 sm:px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                        Transformeer uw Islamitisch onderwijs vandaag nog
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                        Sluit u aan bij de groeiende groep onderwijsinstellingen die kiezen voor een modern en efficiënt beheer. Start met het Professioneel Plan en ervaar direct het verschil.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                        <button 
                            onClick={onStartProfessional}
                            disabled={isProcessingPayment}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-4 sm:py-5 text-base sm:text-lg lg:text-xl font-bold text-emerald-600 bg-white border border-transparent rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1"
                        >
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                            <span className="hidden sm:inline">{isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan - €25/maand'}</span>
                            <span className="sm:hidden">{isProcessingPayment ? 'Laden...' : 'Start Pro - €25/maand'}</span>
                        </button>
                        
                        <div className="text-white/80 text-xs sm:text-sm">of</div>
                        
                        <button 
                            onClick={onStartDemo}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-4 sm:py-5 text-base sm:text-lg font-medium text-white bg-white/20 border-2 border-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 backdrop-blur-sm"
                        >
                            <span className="hidden sm:inline">Probeer 14 dagen gratis</span>
                            <span className="sm:hidden">14 dagen gratis</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </button>
                    </div>
                    
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 lg:space-x-8 text-xs sm:text-sm text-white/70">
                        <span className="flex items-center">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Veilig & Betrouwbaar
                        </span>
                        <span className="flex items-center">
                            <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Direct Beschikbaar
                        </span>
                        <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Geen Setup Kosten
                        </span>
                    </div>
                    
                    <div className="mt-4 sm:mt-6">
                        <a href="mailto:i.abdellaoui@gmail.com" className="text-white/80 hover:text-white underline text-sm sm:text-base lg:text-lg">
                            <span className="hidden sm:inline">📞 Of plan een persoonlijke demo: i.abdellaoui@gmail.com</span>
                            <span className="sm:hidden">📞 Plan demo: i.abdellaoui@gmail.com</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
