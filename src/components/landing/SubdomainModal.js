// src/components/landing/SubdomainModal.js
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';

const SubdomainModal = ({ isOpen, onClose, onSubmit }) => {
    const [subdomain, setSubdomain] = useState('');
    const modalRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the input field when the modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (subdomain.trim()) {
            onSubmit(subdomain.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div 
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
                style={{ animationFillMode: 'forwards' }}
            >
                <div className="p-8 relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Inloggen bij uw organisatie</h2>
                    <p className="text-gray-600 mb-6">Voer het unieke subdomein van uw organisatie in om verder te gaan.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                            <input
                                ref={inputRef}
                                type="text"
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                                placeholder="bijv: al-noor"
                                className="flex-grow p-3 pl-4 bg-transparent border-none focus:outline-none focus:ring-0"
                            />
                            <span className="text-gray-500 pr-4">.mijnlvs.nl</span>
                        </div>
                        
                        <div className="mt-6">
                            <Button 
                                type="submit" 
                                fullWidth 
                                size="lg" 
                                variant="primary"
                                disabled={!subdomain.trim()}
                            >
                                <span>Ga Verder</span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </form>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        Weet u het subdomein niet? Neem contact op met de beheerder van uw organisatie.
                    </p>
                </div>
            </div>
            <style jsx>{`
                @keyframes fade-in-scale {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SubdomainModal;
