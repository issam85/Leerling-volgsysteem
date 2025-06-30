// src/components/landing/Header.js
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import appLogo from '../../assets/logo-mijnlvs.png';
import Button from '../Button';

const Header = ({ onLoginClick, onStartDemoClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center py-3 sm:py-4">
                    <div className="flex items-center">
                        <img className="h-8 sm:h-10 w-auto" src={appLogo} alt="MijnLVS" />
                        <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900">MijnLVS</span>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors">Features</a>
                        <a href="#prijzen" className="text-gray-600 hover:text-emerald-600 transition-colors">Prijzen</a>
                        <a href="#faq" className="text-gray-600 hover:text-emerald-600 transition-colors">FAQ</a>
                        <Button onClick={onLoginClick} variant="ghost" size="sm">Inloggen</Button>
                        <Button onClick={onStartDemoClick} variant="primary" size="sm">Demo Starten</Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="p-2 rounded-md text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 py-4">
                        <div className="flex flex-col space-y-4">
                            <a 
                                href="#features" 
                                className="text-gray-600 hover:text-emerald-600 transition-colors px-2 py-2 rounded-md hover:bg-gray-50"
                                onClick={closeMenu}
                            >
                                Features
                            </a>
                            <a 
                                href="#prijzen" 
                                className="text-gray-600 hover:text-emerald-600 transition-colors px-2 py-2 rounded-md hover:bg-gray-50"
                                onClick={closeMenu}
                            >
                                Prijzen
                            </a>
                            <a 
                                href="#faq" 
                                className="text-gray-600 hover:text-emerald-600 transition-colors px-2 py-2 rounded-md hover:bg-gray-50"
                                onClick={closeMenu}
                            >
                                FAQ
                            </a>
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <Button 
                                    onClick={() => {
                                        onLoginClick();
                                        closeMenu();
                                    }} 
                                    variant="ghost" 
                                    fullWidth
                                >
                                    Inloggen
                                </Button>
                                <Button 
                                    onClick={() => {
                                        onStartDemoClick();
                                        closeMenu();
                                    }} 
                                    variant="primary" 
                                    fullWidth
                                >
                                    Demo Starten
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Header;
