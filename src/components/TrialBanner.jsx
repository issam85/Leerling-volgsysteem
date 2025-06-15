import React from 'react';
import { AlertTriangle, Crown } from 'lucide-react';

const TrialBanner = ({ trialStatus }) => {
    if (!trialStatus || trialStatus.isProfessional) return null;
    
    const { daysRemaining, planType } = trialStatus;
    
    if (daysRemaining <= 3) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                    <div className="flex-1">
                        <p className="text-yellow-800">
                            <strong>⏰ Nog {daysRemaining} dagen</strong> van uw gratis proefperiode!
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                            Upgrade naar Professional voor onbeperkt aantal leerlingen en alle functies.
                        </p>
                    </div>
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Nu
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-blue-800">
                        🎯 <strong>Trial periode:</strong> Nog {daysRemaining} dagen over
                    </p>
                    <p className="text-blue-700 text-sm">
                        Maximaal {trialStatus.maxStudents} leerlingen • {trialStatus.maxTeachers} leraren
                    </p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                    Meer over Professional
                </button>
            </div>
        </div>
    );
};

export default TrialBanner;