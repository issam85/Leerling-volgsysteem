// src/components/landing/FAQ.js
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqData = [
    {
        question: "Wat is MijnLVS precies?",
        answer: "MijnLVS is een alles-in-één leerlingvolgsysteem speciaal ontworpen voor Islamitisch onderwijs. Het helpt moskeeën en onderwijsinstellingen met het beheren van leerlinggegevens, het volgen van Qor'aan memorisatie, het beheren van financiën en het communiceren met ouders."
    },
    {
        question: "Is mijn data veilig?",
        answer: "Ja, absoluut. Wij nemen dataveiligheid zeer serieus. Alle data wordt versleuteld opgeslagen op servers binnen de EU. We voldoen aan de AVG (GDPR) en passen de laatste veiligheidsmaatregelen toe om uw gegevens te beschermen."
    },
    {
        question: "Kan ik MijnLVS eerst uitproberen?",
        answer: "Zeker! We bieden een gratis en vrijblijvende proefperiode van 14 dagen aan. U kunt alle functies van het Professioneel Plan testen met maximaal 10 leerlingen. U heeft geen betaalgegevens nodig om te starten."
    },
    {
        question: "Hoe werkt de Qor'aan Memorisatie Tracker?",
        answer: "Onze unieke tracker stelt leraren in staat om per leerling de voortgang van de Qor'aan memorisatie bij te houden, van Surah tot Surah. U kunt ook de kwaliteit van de recitatie (tajweed, vloeiendheid) beoordelen. Ouders kunnen deze voortgang direct inzien via hun eigen portaal."
    },
    {
        question: "Zit ik vast aan een lang contract?",
        answer: "Nee, het Professioneel Plan is een maandelijks abonnement dat u op elk moment kunt opzeggen. We geloven in de kwaliteit van ons product en willen dat u blijft omdat u tevreden bent, niet omdat u vastzit aan een contract."
    },
    {
        question: "Bieden jullie ook ondersteuning?",
        answer: "Ja, wij bieden ondersteuning aan al onze klanten. Gebruikers van het Professioneel Plan krijgen priority support via e-mail en telefoon. We helpen u graag met al uw vragen."
    }
];

const FaqItem = ({ faq, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-200 py-4 sm:py-6">
            <button
                className="w-full flex justify-between items-center text-left text-base sm:text-lg font-semibold text-gray-800 touch-manipulation"
                onClick={onClick}
            >
                <span className="pr-4 leading-tight">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-3 sm:mt-4' : 'max-h-0'}`}
            >
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {faq.answer}
                </p>
            </div>
        </div>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const handleClick = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-12 sm:py-16 lg:py-20 bg-white">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        Veelgestelde Vragen
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Heeft u een vraag? Hier vindt u de antwoorden op de meest gestelde vragen.
                    </p>
                </div>
                <div className="max-w-3xl mx-auto">
                    {faqData.map((faq, index) => (
                        <FaqItem
                            key={index}
                            faq={faq}
                            isOpen={openIndex === index}
                            onClick={() => handleClick(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
