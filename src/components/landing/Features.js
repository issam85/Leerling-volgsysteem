// src/components/landing/Features.js
import React from 'react';
import { BookOpen, Users, BarChart3 } from 'lucide-react';

const Features = () => {
    return (
        <section id="features" className="py-12 bg-white">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <BookOpen className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-semibold">Qor'aan Voortgang</h3>
                        <p className="text-sm text-gray-600">Volg memorisatie en recitatie per leerling</p>
                    </div>
                    <div>
                        <Users className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-semibold">Ouder Portaal</h3>
                        <p className="text-sm text-gray-600">Transparante communicatie met alle ouders</p>
                    </div>
                    <div>
                        <BarChart3 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-semibold">Slimme Rapporten</h3>
                        <p className="text-sm text-gray-600">Automatische voortgangsrapporten genereren</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
