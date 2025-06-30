// src/components/landing/Features.js
import React from 'react';
import { Shield, User, Users, DollarSign, BookOpen, MessageSquare, Clipboard, TrendingUp, CheckSquare } from 'lucide-react';

const featureData = [
    {
        icon: Shield,
        title: "Admin Dashboard",
        description: "Centraal beheer voor de hele organisatie. Volledige controle en overzicht.",
        items: [
            { icon: DollarSign, text: "Betalingen & Financiën" },
            { icon: Users, text: "Ouderbeheer" },
            { icon: User, text: "Leerlingbeheer" },
            { icon: Clipboard, text: "Klassen & Groepen" }
        ],
        color: "blue"
    },
    {
        icon: User,
        title: "Leraar Portaal",
        description: "Alle tools die een leraar nodig heeft voor effectief en modern onderwijs.",
        items: [
            { icon: CheckSquare, text: "Absentie Registratie" },
            { icon: BookOpen, text: "Qor'aan Voortgang Tracker" },
            { icon: MessageSquare, text: "Communicatie met Ouders" },
            { icon: TrendingUp, text: "Individuele Rapporten" }
        ],
        color: "emerald"
    },
    {
        icon: Users,
        title: "Ouder Portaal",
        description: "Houdt ouders betrokken en geïnformeerd over de voortgang van hun kind.",
        items: [
            { icon: TrendingUp, text: "Inzicht in Voortgang" },
            { icon: CheckSquare, text: "Absentie Overzicht" },
            { icon: MessageSquare, text: "Berichten van Leraar" },
            { icon: DollarSign, text: "Facturen & Betalingen" }
        ],
        color: "purple"
    }
];

const FeatureCard = ({ feature }) => {
    const IconComponent = feature.icon;
    const colorMap = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-200',
            iconBg: 'bg-blue-100'
        },
        emerald: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-100'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-200',
            iconBg: 'bg-purple-100'
        }
    };
    const colors = colorMap[feature.color] || colorMap.blue;

    return (
        <div className={`rounded-2xl p-8 flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 ${colors.bg}`}>
            <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full mr-4 ${colors.iconBg}`}>
                    <IconComponent className={`w-8 h-8 ${colors.text}`} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                </div>
            </div>
            <p className="text-gray-600 mb-6 flex-grow">{feature.description}</p>
            <ul className="space-y-3">
                {feature.items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                        <li key={index} className="flex items-center">
                            <div className={`p-1.5 rounded-full mr-3 ${colors.iconBg}`}>
                                <ItemIcon className={`w-4 h-4 ${colors.text}`} />
                            </div>
                            <span className="text-gray-700">{item.text}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const Features = () => {
    return (
        <section id="features" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Eén Systeem, Drie Portalen
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        MijnLVS is ontworpen om de unieke behoeften van elke rol binnen uw organisatie te ondersteunen.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featureData.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
