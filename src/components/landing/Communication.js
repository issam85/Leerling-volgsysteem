// src/components/landing/Communication.js
import React from 'react';

const Communication = () => {
    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        ✉️ Directe Communicatie met Ouders
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Versterkt de betrokkenheid van ouders door naadloze communicatie tussen leraren en families
                    </p>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    <div className="order-2 lg:order-1 bg-gray-50 rounded-2xl p-4 sm:p-6 lg:p-8">
                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Nieuwe E-mail</h3>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded self-start">Leraar Portal</span>
                            </div>
                            
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-700">Aan:</label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border text-xs sm:text-sm text-gray-600">
                                        📧 Alle ouders Klas 3 (24 ouders)
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-700">Onderwerp:</label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border text-xs sm:text-sm text-gray-900">
                                        Qor'aan toets aanstaande vrijdag
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-700">Bericht:</label>
                                    <div className="mt-1 p-2 sm:p-3 bg-gray-50 rounded border text-xs sm:text-sm text-gray-700 leading-relaxed">
                                        <span className="hidden sm:inline">
                                            Assalamu Alaikum wa rahmatullahi wa barakatuh,<br/><br/>
                                            Aanstaande vrijdag hebben we een Qor'aan toets van Surah Al-Falaq. 
                                            Graag thuis extra oefenen...<br/><br/>
                                            Barakallahu feeki,<br/>
                                            Ustadh Omar
                                        </span>
                                        <span className="sm:hidden">
                                            Assalamu Alaikum,<br/><br/>
                                            Vrijdag Qor'aan toets van Surah Al-Falaq. 
                                            Graag thuis oefenen...<br/><br/>
                                            Ustadh Omar
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end">
                                    <button className="bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium">
                                        <span className="hidden sm:inline">📤 Verstuur naar 24 ouders</span>
                                        <span className="sm:hidden">📤 Verstuur</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-4 sm:space-y-6">
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Bulk E-mails naar Klas</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Leraren kunnen met één klik alle ouders van hun klas informeren over toetsen, activiteiten of belangrijke mededelingen</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Individuele Ouder Communicatie</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Persoonlijke berichten naar specifieke ouders over de voortgang of gedrag van hun kind</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Ouders Kunnen Reageren</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Ouders kunnen direct vanuit hun portaal contact opnemen met de leraar voor vragen of feedback</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Email Geschiedenis</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Alle communicatie wordt bewaard zodat u altijd kunt terugkijken wat er besproken is</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Praktijkvoorbeeld</h4>
                            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                                "Dankzij MijnLVS ben ik als ouder veel meer betrokken. Ik krijg direct updates over de Qor'aan voortgang van mijn dochter en kan de leraar makkelijk bereiken met vragen."
                            </p>
                            <p className="text-xs text-blue-600 mt-2">— Fatima, moeder van Aisha (8 jaar)</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Communication;
