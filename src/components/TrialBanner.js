// src/components/TrialBanner.js - VERBETERDE VERSIE
import React, { useState } from 'react';
import { AlertTriangle, Crown, CheckCircle, X, ExternalLink } from 'lucide-react';
import Button from './Button';

const TrialBanner = ({ trialStatus }) => {
    const [dismissed, setDismissed] = useState(false);
    
    // Niet tonen als dismissed, geen status, of professional account
    if (dismissed || !trialStatus || trialStatus.isProfessional) {
        return null;
    }
    
    const { daysRemaining, isExpired, planType, maxStudents, maxTeachers } = trialStatus;
    
    // Bepaal banner variant gebaseerd op dagen over
    const getBannerConfig = () => {
        if (isExpired) {
            return {
                bgColor: 'bg-red-50',
                borderColor: 'border-red-400',
                textColor: 'text-red-800',
                iconColor: 'text-red-400',
                icon: AlertTriangle,
                title: '🚨 Proefperiode verlopen',
                message: 'Uw gratis proefperiode is afgelopen. Upgrade naar Professional om door te gaan.',
                buttonText: 'Upgrade Nu',
                buttonVariant: 'primary',
                urgent: true,
                dismissible: false
            };
        } else if (daysRemaining <= 3) {
            return {
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-400',
                textColor: 'text-yellow-800',
                iconColor: 'text-yellow-400',
                icon: AlertTriangle,
                title: `⏰ Nog ${daysRemaining} dag${daysRemaining !== 1 ? 'en' : ''} over`,
                message: 'Uw proefperiode loopt binnenkort af. Upgrade naar Professional voor alle functies.',
                buttonText: 'Upgrade Nu',
                buttonVariant: 'primary',
                urgent: true,
                dismissible: false
            };
        } else if (daysRemaining <= 7) {
            return {
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-400',
                textColor: 'text-orange-800',
                iconColor: 'text-orange-400',
                icon: AlertTriangle,
                title: `⚡ Trial periode: Nog ${daysRemaining} dagen over`,
                message: `Maximaal ${maxStudents || 10} leerlingen • ${maxTeachers || 2} leraren`,
                buttonText: 'Meer over Professional',
                buttonVariant: 'secondary',
                urgent: false,
                dismissible: true
            };
        } else {
            return {
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-400',
                textColor: 'text-blue-800',
                iconColor: 'text-blue-400',
                icon: CheckCircle,
                title: `🎯 Trial periode: Nog ${daysRemaining} dagen over`,
                message: `Maximaal ${maxStudents || 10} leerlingen • ${maxTeachers || 2} leraren`,
                buttonText: 'Meer over Professional',
                buttonVariant: 'secondary',
                urgent: false,
                dismissible: true
            };
        }
    };

    const config = getBannerConfig();
    const IconComponent = config.icon;

    const handleUpgradeClick = () => {
        // TODO: Implementeer upgrade logica - bijvoorbeeld naar een pricing pagina
        // window.open('/pricing', '_blank');
        console.log('Upgrade button clicked');
        alert('Upgrade functionaliteit wordt binnenkort toegevoegd!');
    };

    const handleLearnMoreClick = () => {
        // TODO: Implementeer "meer informatie" logica
        // window.open('/professional-features', '_blank');
        console.log('Learn more button clicked');
        alert('Meer informatie over Professional functies komt binnenkort!');
    };

    const handleButtonClick = () => {
        if (config.buttonText.includes('Upgrade')) {
            handleUpgradeClick();
        } else {
            handleLearnMoreClick();
        }
    };

    return (
        <div className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-6 rounded-r-md shadow-sm`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                    <IconComponent className={`w-5 h-5 ${config.iconColor} mr-3 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                        <p className={`${config.textColor} font-semibold text-sm leading-tight`}>
                            {config.title}
                        </p>
                        <p className={`${config.textColor.replace('-800', '-700')} text-sm mt-1 leading-tight`}>
                            {config.message}
                        </p>
                        {config.urgent && (
                            <p className={`${config.textColor.replace('-800', '-600')} text-xs mt-2 font-medium`}>
                                💡 Professional geeft u onbeperkt aantal leerlingen, volledige financieel beheer en professionele rapporten.
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <Button
                        onClick={handleButtonClick}
                        variant={config.buttonVariant}
                        size="sm"
                        icon={config.buttonText.includes('Upgrade') ? Crown : ExternalLink}
                        className={`whitespace-nowrap ${config.urgent ? 'animate-pulse' : ''}`}
                    >
                        {config.buttonText}
                    </Button>
                    
                    {config.dismissible && (
                        <button
                            onClick={() => setDismissed(true)}
                            className={`${config.iconColor} hover:${config.textColor} p-1 rounded transition-colors`}
                            title="Banner sluiten"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrialBanner;