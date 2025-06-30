// src/components/landing/Communication.js
import React from 'react';

const Communication = () => {
    return (
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
    );
};

export default Communication;
