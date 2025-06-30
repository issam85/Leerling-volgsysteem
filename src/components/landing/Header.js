// src/components/landing/Header.js
import React from 'react';
import appLogo from '../../assets/logo-mijnlvs.png';
import Button from '../Button';

const Header = ({ onLoginClick, onStartDemoClick }) => {
    return (
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <img className="h-10 w-auto" src={appLogo} alt="MijnLVS" />
                        <span className="ml-3 text-xl font-bold text-gray-900">MijnLVS</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors">Features</a>
                            <a href="#prijzen" className="text-gray-600 hover:text-emerald-600 transition-colors">Prijzen</a>
                            <a href="#faq" className="text-gray-600 hover:text-emerald-600 transition-colors">FAQ</a>
                            <Button onClick={onLoginClick} variant="ghost">Inloggen</Button>
                            <Button onClick={onStartDemoClick} variant="primary">Demo Starten</Button>
                        </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
