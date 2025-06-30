// src/pages/LandingPage.js
import React, { useState } from 'react';
import { apiCall } from '../services/api';

import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Communication from '../components/landing/Communication';
import QuranTracking from '../components/landing/QuranTracking';
import Pricing from '../components/landing/Pricing';
import CTA from '../components/landing/CTA';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import SubdomainModal from '../components/landing/SubdomainModal';

const LandingPage = () => {
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isSubdomainModalOpen, setIsSubdomainModalOpen] = useState(false);

    const handleStripeCheckout = async (skipTrial) => {
        setIsProcessingPayment(true);
        try {
            const priceId = 'price_1RdFm2CHZ9R82JCdw329WusE'; // LIVE price ID
            
            const result = await apiCall('/api/payments/stripe/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({ 
                    priceId,
                    skipTrial,
                    metadata: {
                        plan_type: 'professional',
                        source: skipTrial ? 'landing_page_direct_payment' : 'landing_page_trial',
                        product_id: 'prod_SYMVWz9hrt46zg'
                    }
                })
            });
            
            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error('Geen checkout URL ontvangen');
            }
        } catch (error) {
            console.error('Stripe checkout error:', error);
            alert(error.message || 'Er ging iets mis bij het starten van de betaling.');
            setIsProcessingPayment(false);
        }
    };

    const handleChooseProfessional = () => handleStripeCheckout(true);
    const handleStartTrial = () => handleStripeCheckout(false);

    const handleOpenLoginModal = () => {
        setIsSubdomainModalOpen(true);
    };

    const handleSubdomainSubmit = (subdomain) => {
        window.location.href = `https://${subdomain}.mijnlvs.nl/login`;
    };

    const handleStartDemo = () => {
        window.location.href = '/register';
    };

    return (
        <div className="bg-white text-gray-800">
            <Header onLoginClick={handleOpenLoginModal} onStartDemoClick={handleStartDemo} />
            <main>
                <Hero 
                    onStartProfessional={handleChooseProfessional}
                    onStartTrial={handleStartTrial}
                    isProcessingPayment={isProcessingPayment}
                    onLoginClick={handleOpenLoginModal}
                />
                <Communication />
                <QuranTracking />
                <Pricing 
                    onChooseProfessional={handleChooseProfessional}
                    onStartTrial={handleStartTrial}
                    isProcessingPayment={isProcessingPayment}
                />
                <FAQ />
                <CTA 
                    onStartProfessional={handleChooseProfessional}
                    onStartDemo={handleStartDemo}
                    isProcessingPayment={isProcessingPayment}
                />
            </main>
            <Footer />
            <SubdomainModal 
                isOpen={isSubdomainModalOpen}
                onClose={() => setIsSubdomainModalOpen(false)}
                onSubmit={handleSubdomainSubmit}
            />
        </div>
    );
};

export default LandingPage;
