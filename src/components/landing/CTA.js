// src/components/landing/CTA.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Shield, Award, CheckCircle } from 'lucide-react';

const CTA = ({ onStartProfessional, onStartDemo, isProcessingPayment }) => {
    return (
        <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="container mx-auto px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                        Transformeer uw Islamitisch onderwijs vandaag nog
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Sluit u aan bij de groeiende groep onderwijsinstellingen die kiezen voor een modern en efficiënt beheer. Start met het Professioneel Plan en ervaar direct het verschil.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <button 
                            onClick={onStartProfessional}
                            disabled={isProcessingPayment}
                            className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-emerald-600 bg-white border border-transparent rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1"
                        >
                            <Star className="w-6 h-6 mr-3" />
                            {isProcessingPayment ? 'Bezig met laden...' : 'Start Professioneel Plan - €25/maand'}
                        </button>
                        
                        <div className="text-white/80 text-sm">of</div>
                        
                        <button 
                            onClick={onStartDemo}
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
    );
};

export default CTA;
