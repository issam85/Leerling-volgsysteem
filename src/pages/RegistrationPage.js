// src/pages/RegistrationPage.js

import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import appLogo from '../assets/logo-mijnlvs.png';
import { Building, UserCircle, CheckCircle, ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';

// De Stepper Component
const Stepper = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Organisatie', icon: Building },
    { number: 2, title: 'Beheerder', icon: UserCircle },
    { number: 3, title: 'Klaar!', icon: CheckCircle },
  ];

  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
        {steps.map((stepInfo) => (
          <li key={stepInfo.title} className="md:flex-1">
            {currentStep > stepInfo.number ? (
              <div className="group flex flex-col border-l-4 border-emerald-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0">
                <span className="text-sm font-medium text-emerald-600">{`Stap ${stepInfo.number}`}</span>
                <span className="text-sm font-medium">{stepInfo.title}</span>
              </div>
            ) : currentStep === stepInfo.number ? (
              <div className="flex flex-col border-l-4 border-emerald-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0" aria-current="step">
                <span className="text-sm font-medium text-emerald-600">{`Stap ${stepInfo.number}`}</span>
                <span className="text-sm font-medium">{stepInfo.title}</span>
              </div>
            ) : (
              <div className="group flex flex-col border-l-4 border-gray-200 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0">
                <span className="text-sm font-medium text-gray-500">{`Stap ${stepInfo.number}`}</span>
                <span className="text-sm font-medium">{stepInfo.title}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Payment Status Component
const PaymentStatusCard = ({ status, message, isLoading, onRetry }) => {
  if (status === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-emerald-800 font-medium">🎉 Professional Account Actief!</h4>
            <p className="text-emerald-700 text-sm mt-1">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-yellow-800 font-medium">Betaling wordt nog verwerkt</h4>
            <p className="text-yellow-700 text-sm mt-1">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-yellow-800 underline text-sm mt-2 hover:text-yellow-900"
              >
                Opnieuw proberen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0 animate-pulse" />
          <div>
            <h4 className="text-blue-800 font-medium">Betaling controleren...</h4>
            <p className="text-blue-700 text-sm mt-1">We controleren of uw betaling succesvol is verwerkt.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// De Hoofdcomponent
const RegistrationPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mosqueName: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
    address: '', city: '', zipcode: '', phone: '', website: '', contactEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [registeredMosque, setRegisteredMosque] = useState(null);
  const { switchSubdomain } = useAuth();

  // Payment linking state
  const [isLinkingPayment, setIsLinkingPayment] = useState(false);
  const [linkingComplete, setLinkingComplete] = useState(false);

  // START -- NIEUWE CODE: State voor de slimme login link
  const [showSubdomainInput, setShowSubdomainInput] = useState(false);
  const [loginSubdomain, setLoginSubdomain] = useState('');
  // EINDE -- NIEUWE CODE

  // Check voor payment parameters bij het laden van de pagina
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const trackingId = urlParams.get('tracking_id');
    
    if (paymentSuccess === 'true' && trackingId) {
      console.log('[Registration] Payment parameters detected:', { paymentSuccess, trackingId });
    }
  }, []);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // START -- NIEUWE CODE: Functie om naar het ingevoerde subdomein te gaan
  const handleSwitchToLogin = () => {
    if (loginSubdomain.trim()) {
      switchSubdomain(loginSubdomain.trim().toLowerCase());
    }
  };
  // EINDE -- NIEUWE CODE

  // Functie om payment linking te proberen
  const attemptPaymentLinking = async (mosqueData) => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('tracking_id');
    const paymentSuccess = urlParams.get('payment_success');

    if (paymentSuccess === 'true' && trackingId) {
      console.log('[Registration] Attempting payment linking with tracking ID:', trackingId);
      
      setIsLinkingPayment(true);
      
      try {
        const result = await apiCall('/api/payments/stripe/link-pending-payment', {
          method: 'POST',
          body: JSON.stringify({
            mosqueId: mosqueData.id,
            userEmail: mosqueData.admin_email,
            trackingId: trackingId
          })
        });

        if (result.success) {
          console.log('[Registration] Payment linked successfully!');
          setPaymentStatus({
            status: 'success',
            message: result.message,
            subscriptionStatus: result.subscription_status
          });
        } else {
          console.warn('[Registration] Payment linking failed:', result.message);
          setPaymentStatus({
            status: 'failed',
            message: result.message || 'Betaling wordt nog verwerkt. Probeer over een paar minuten opnieuw in te loggen.',
            suggestion: result.suggestion
          });
        }
      } catch (error) {
        console.error('[Registration] Error linking payment:', error);
        setPaymentStatus({
          status: 'failed',
          message: 'Er was een probleem bij het verwerken van uw betaling. Uw account is aangemaakt, maar probeer over een paar minuten opnieuw in te loggen.',
          suggestion: 'Als het probleem aanhoudt, neem dan contact met ons op.'
        });
      } finally {
        setIsLinkingPayment(false);
        setLinkingComplete(true);
      }
    }
  };

  // Retry payment linking
  const retryPaymentLinking = async () => {
    if (registeredMosque) {
      await attemptPaymentLinking(registeredMosque);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validatie op de laatste stap
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen.'); 
      return;
    }
    if (formData.adminPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 karakters lang zijn.'); 
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const payload = {
        mosqueName: formData.mosqueName.trim(), 
        subdomain: formData.subdomain.trim().toLowerCase(), 
        adminName: formData.adminName.trim(), 
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminPassword: formData.adminPassword, 
        address: formData.address.trim(), 
        city: formData.city.trim(), 
        zipcode: formData.zipcode.trim().toUpperCase(),
        phone: formData.phone.trim(), 
        website: formData.website.trim(), 
        email: formData.contactEmail.trim().toLowerCase() || formData.adminEmail.trim().toLowerCase(),
      };

      console.log("REGISTRATION PAYLOAD TO BACKEND (Frontend):", JSON.stringify(payload, null, 2));

      const result = await apiCall('/api/mosques/register', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });
      
      if (result.success) {
        const mosqueData = result.mosque;
        setRegisteredMosque(mosqueData);
        
        // Basis success message
        setSuccessMessage(`Welkom bij MijnLVS, ${mosqueData.name}! Uw account is succesvol aangemaakt.`);
        
        // Ga naar succes stap
        nextStep();
        
        // Probeer payment linking als er payment parameters zijn
        await attemptPaymentLinking(mosqueData);
        
      } else { 
        throw new Error(result.error || 'Registratie mislukt.'); 
      }
    } catch (err) { 
      setError(err.message || 'Er is een onbekende fout opgetreden.');
    } finally { 
      setLoading(false); 
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Organisatiegegevens</h3>
            <Input label="Naam organisatie" name="mosqueName" value={formData.mosqueName} onChange={handleChange} required />
            <Input label="Gewenst subdomein (bijv. al-noor)" name="subdomain" value={formData.subdomain} onChange={handleChange} required placeholder="alnoor (alleen letters, cijfers, koppelstreepjes)" />
            <p className="mt-1 text-xs text-gray-500">Uw unieke adres wordt: {formData.subdomain || "[subdomein]"}.mijnlvs.nl</p>
            <Input label="Adres (straat + huisnr)" name="address" value={formData.address} onChange={handleChange} />
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <Input label="Postcode" name="zipcode" value={formData.zipcode} onChange={handleChange} />
              <Input label="Plaats" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <Input label="Telefoonnummer organisatie" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            <Input label="Contact email organisatie" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} />
            <Input label="Website (optioneel)" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://www.voorbeeld.nl" />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Gegevens van de Beheerder</h3>
            <Input label="Naam beheerder" name="adminName" value={formData.adminName} onChange={handleChange} required />
            <Input label="Emailadres beheerder" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} required />
            <Input label="Wachtwoord beheerder" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} required />
            <Input label="Bevestig wachtwoord" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
        );
      case 3:
        return (
          <div className="text-center py-10">
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registratie succesvol!</h2>
            <p className="text-gray-600 max-w-lg mx-auto mb-6">{successMessage}</p>
            
            {/* Payment Status Display */}
            {isLinkingPayment && (
              <PaymentStatusCard 
                isLoading={true}
              />
            )}
            
            {linkingComplete && paymentStatus && (
              <PaymentStatusCard 
                status={paymentStatus.status}
                message={paymentStatus.message}
                onRetry={paymentStatus.status === 'failed' ? retryPaymentLinking : null}
              />
            )}
            
            {/* Login Button */}
            <div className="mt-8">
              <Button 
                onClick={() => switchSubdomain(formData.subdomain.trim().toLowerCase())} 
                variant="primary" 
                size="lg"
                className="w-full sm:w-auto"
              >
                {paymentStatus?.status === 'success' ? 'Ga naar Professional Dashboard' : 'Ga naar Inloggen'}
              </Button>
            </div>
            
            {/* Additional Info for Payment Cases */}
            {linkingComplete && paymentStatus?.status === 'success' && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg text-left">
                <h4 className="font-medium text-emerald-800 mb-2">🚀 Uw Professional Account is actief!</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>✅ Onbeperkt aantal leerlingen</li>
                  <li>✅ Volledige financieel beheer</li>
                  <li>✅ Qor'aan voortgang tracking</li>
                  <li>✅ Professionele rapporten</li>
                  <li>✅ E-mail communicatie met ouders</li>
                </ul>
              </div>
            )}
            
            {linkingComplete && paymentStatus?.status === 'failed' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                <h4 className="font-medium text-blue-800 mb-2">💡 Wat nu?</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>• Uw account is aangemaakt en u kunt direct beginnen met de gratis proefperiode</p>
                  <p>• Als u heeft betaald, wordt uw Professional account automatisch geactiveerd zodra de betaling is verwerkt</p>
                  <p>• Log over een paar minuten opnieuw in om de status te controleren</p>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-5">
      {loading && <LoadingSpinner message="Registratie verwerken..." />}

      {/* ==================================================================== */}
      {/* KOLOM 1: De "Banner" - Zichtbaar op grote schermen (NIEUWE VERSIE) */}
      {/* ==================================================================== */}
      <div className="hidden lg:block lg:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-8 xl:p-12 flex flex-col justify-between">
          <div>
              {/* Logo is nu extra groot, klikbaar en heeft meer ruimte */}
              <a href="/" className="inline-block hover:scale-110 transition-transform duration-200">
                  <img className="h-36 w-auto bg-white p-6 rounded-2xl shadow-lg" src={appLogo} alt="MijnLVS Logo" />
              </a>
              
              {/* Nieuwe, gerichte headline en sub-headline */}
              <h1 className="mt-10 text-3xl font-bold tracking-tight">
                  Het hart van uw Islamitisch onderwijs.
              </h1>
              <p className="mt-4 text-emerald-100">
                  MijnLVS is speciaal ontworpen voor moskeeën en onderwijsinstellingen die Arabische taal- en Qor'aanlessen verzorgen.
              </p>
              
              {/* Nieuwe, specifiekere bullet points */}
              <ul className="mt-8 space-y-4 text-emerald-50">
                  <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                      <span><strong className="text-white">Qor'aan & Rapporten:</strong> Volg de voortgang en aanwezigheid per leerling.</span>
                  </li>
                  <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                      <span><strong className="text-white">Inzicht voor Ouders:</strong> Ouders blijven betrokken bij de ontwikkeling van hun kind.</span>
                  </li>
                  <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                      <span><strong className="text-white">Efficiënt Beheer:</strong> Centrale administratie voor lesgeld, klassen en gebruikers.</span>
                  </li>
              </ul>
          </div>
          <div className="text-sm text-emerald-200 mt-8">
              © {new Date().getFullYear()} MijnLVS. Alle rechten voorbehouden.
          </div>
      </div>

      {/* KOLOM 2: De Formulier Wizard */}
      <div className="lg:col-span-3 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-lg mx-auto">
          {/* Logo voor mobiele weergave - ook klikbaar en groter */}
          <div className="lg:hidden text-center mb-8">
            <a href="/" className="inline-block hover:scale-105 transition-transform duration-200">
              <img className="mx-auto h-20 w-auto bg-emerald-50 p-3 rounded-xl shadow-md" src={appLogo} alt="MijnLVS Logo" />
            </a>
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Nieuwe Organisatie Registreren</h2>
            
            {/* Breadcrumb voor mobiel */}
            <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
              <a href="/" className="hover:text-emerald-600 transition-colors">
                🏠 Hoofdpagina
              </a>
              <span className="mx-2">→</span>
              <span className="text-gray-700">Registratie</span>
            </div>
          </div>

          <div className="mb-8">
            <Stepper currentStep={step} />
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">{error}</div>
          )}
          
          {/* De formulier logica */}
          <form onSubmit={handleSubmit}>
            {renderStep()}
            
            {step < 3 && (
              <div className="mt-8 pt-5 border-t flex justify-between items-center">
                {step > 1 ? (
                  <Button onClick={prevStep} variant="secondary" icon={ArrowLeft}>Vorige</Button>
                ) : (
                  <div></div>
                )}
                
                {step === 1 && <Button onClick={nextStep} variant="primary">Volgende</Button>}
                {step === 2 && <Button type="submit" variant="primary" disabled={loading}>Registratie Afronden</Button>}
              </div>
            )}
          </form>
          {step < 3 && (
            <div className="text-center mt-8">
              {!showSubdomainInput ? (
                <p className="text-sm text-gray-600">
                  Al een account?{' '}
                  <button
                    onClick={() => setShowSubdomainInput(true)}
                    className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:underline"
                  >
                    Ga naar inloggen
                  </button>
                </p>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label htmlFor="login-subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                    Wat is het subdomein van uw organisatie?
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="login-subdomain"
                      name="loginSubdomain"
                      value={loginSubdomain}
                      onChange={(e) => setLoginSubdomain(e.target.value)}
                      placeholder="bijv. al-noor"
                      className="flex-grow"
                    />
                    <Button onClick={handleSwitchToLogin} disabled={!loginSubdomain.trim()}>
                      Ga verder
                    </Button>
                  </div>
                  <button
                    onClick={() => setShowSubdomainInput(false)}
                    className="text-xs text-gray-500 hover:underline mt-2"
                  >
                    Annuleren
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;