// src/components/landing/Footer.js
import React from 'react';
import appLogo from '../../assets/logo-mijnlvs.png';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <img src={appLogo} className="h-8 mr-3" alt="MijnLVS" />
                        <span className="font-bold text-xl">MijnLVS</span>
                    </div>
                    <div className="text-sm text-gray-400">
                        <a href="mailto:i.abdellaoui@gmail.com" className="hover:text-white mr-6 transition-colors">
                            📧 i.abdellaoui@gmail.com
                        </a>
                        <a href="tel:0640246600" className="hover:text-white transition-colors">
                            📞 06-40246600
                        </a>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} MijnLVS. Alle rechten voorbehouden.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
