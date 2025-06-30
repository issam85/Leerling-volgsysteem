// src/components/landing/QuranTracking.js
import React from 'react';

const QuranTracking = () => {
    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        📖 Qor'aan Memorisatie Tracker
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Het enige systeem in Nederland dat speciaal ontworpen is voor het volgen van Qor'aan memorisatie en recitatie per leerling
                    </p>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Surah-per-Surah Tracking</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Volg precies welke ayaat elke leerling heeft gememoriseerd, van Al-Fatiha tot An-Nas</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Recitatie Kwaliteit</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Beoordeel tajweed, vloeiendheid en correctheid met een eenvoudig cijfersysteem</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Ouder Inzicht</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Ouders zien real-time de Qor'aan voortgang van hun kind via het ouderportaal</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mt-2 mr-3 sm:mr-4 flex-shrink-0"></div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Automatische Rapporten</h3>
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Genereer professionele voortgangsrapporten met Qor'aan statistieken per periode</p>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
                        <div className="text-center mb-4 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Ahmed's Qor'aan Voortgang</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">Klas 3 • Leraar: Ustadh Omar</p>
                        </div>
                        
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                                <div>
                                    <span className="font-medium text-gray-900 text-sm sm:text-base">Surah Al-Fatiha</span>
                                    <div className="text-xs text-gray-500">7 ayaat</div>
                                </div>
                                <div className="text-green-600 font-bold text-xs sm:text-sm">✓ Voltooid</div>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                                <div>
                                    <span className="font-medium text-gray-900 text-sm sm:text-base">Surah An-Nas</span>
                                    <div className="text-xs text-gray-500">6 ayaat</div>
                                </div>
                                <div className="text-green-600 font-bold text-xs sm:text-sm">✓ Voltooid</div>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                                <div>
                                    <span className="font-medium text-gray-900 text-sm sm:text-base">Surah Al-Falaq</span>
                                    <div className="text-xs text-gray-500">5 ayaat • 3/5 geleerd</div>
                                </div>
                                <div className="text-blue-600 font-bold text-xs sm:text-sm">60%</div>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-medium text-gray-900 text-sm sm:text-base">Surah Al-Ikhlas</span>
                                    <div className="text-xs text-gray-500">4 ayaat</div>
                                </div>
                                <div className="text-gray-500 text-xs sm:text-sm">Nog niet gestart</div>
                            </div>
                        </div>
                        
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-emerald-50 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600">19/22</div>
                            <div className="text-xs sm:text-sm text-emerald-700">Ayaat gememoriseerd deze maand</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default QuranTracking;
