// src/pages/RegistrationPage.js - UPDATED voor consistentie met payment linking fixes

import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import appLogo from '../assets/logo-mijnlvs.png';
import { Building, UserCircle, CheckCircle, ArrowLeft, CreditCard, AlertCircle, X, LogIn } from 'lucide-react';

// Login Modal Component (unchanged)
const LoginModal = ({ isOpen, onClose, onSwitchSubdomain }) => {
  const [subdomain, setSubdomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSubdomain('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subdomain.trim()) {
      setError('Vul een subdomein in');
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(subdomain.trim())) {
      setError('Subdomein mag alleen letters, cijfers en koppelstreepjes bevatten');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSwitchSubdomain(subdomain.trim().toLowerCase());
    } catch (err) {
      setError('Er ging iets mis bij het omschakelen');
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6 pr-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Inloggen bij bestaande organisatie
          </h3>
          <p className="text-gray-600 text-sm">
            Vul het subdomein van uw organisatie in om door te gaan naar de inlogpagina
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Subdomein van uw organisatie"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="bijv. al-noor"
              disabled={isLoading}
              autoFocus
            />
            {subdomain && (
              <p className="mt-1 text-xs text-gray-500">
                🌐 Uw loginpagina: <span className="font-medium">{subdomain.toLowerCase()}.mijnlvs.nl</span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !subdomain.trim()}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Omschakelen...
                </span>
              ) : (
                'Ga naar Login'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            💡 Weet je het subdomein niet? Neem contact op met de beheerder van je organisatie.
          </p>
        </div>
      </div>
    </div>
  );
};

// Stepper Component (unchanged)
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

// ✅ UPDATED Payment Status Component - Better messaging
const PaymentStatusCard = ({ status, message, isLoading, onRetry, linkingMethod }) => {
  if (status === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-emerald-800 font-medium">🎉 Professional Account Actief!</h4>
            <p className="text-emerald-700 text-sm mt-1">{message}</p>
            <p className="text-emerald-600 text-xs mt-2 font-medium">
              ✅ Onbeperkt aantal leerlingen en leraren
            </p>
            {/* ✅ NEW: Show linking method for debugging */}
            {linkingMethod && (
              <p className="text-emerald-500 text-xs mt-1">
                🔗 Gekoppeld via: {linkingMethod}
              </p>
            )}
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
            <p className="text-yellow-600 text-xs mt-2">
              💡 Uw account werkt nu als gratis proefversie (max 10 leerlingen)
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-yellow-800 underline text-sm mt-2 hover:text-yellow-900"
              >
                Opnieuw controleren
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

// Main Component
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

  const [isLinkingPayment, setIsLinkingPayment] = useState(false);
  const [linkingComplete, setLinkingComplete] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);

  const clearUrlParameters = () => {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const trackingId = urlParams.get('tracking_id');
    const sessionId = urlParams.get('session_id'); // ✅ NEW: Also extract session_id
    
    if (paymentSuccess === 'true' && (trackingId || sessionId)) {
      console.log('[Registration] Payment parameters detected:', { 
        paymentSuccess, 
        trackingId: trackingId?.substring(0, 10),
        sessionId: sessionId?.substring(0, 15) // ✅ NEW: Log session_id
      });
      
      // ✅ STORE payment session data for later use
      setPaymentSession({
        session_id: sessionId,
        tracking_id: trackingId,
        payment_success: paymentSuccess,
        timestamp: new Date().toISOString()
      });
      
      // Don't clear URL parameters yet - we need them for linking
    }
  }, []);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchToLogin = async (subdomain) => {
    try {
      const cleanSubdomain = subdomain.trim().toLowerCase().replace('.nl', '');
      await switchSubdomain(cleanSubdomain);
      setShowLoginModal(false);
    } catch (error) {
      throw error;
    }
  };

  const handleSwitchWithDelay = (subdomain) => {
    const cleanSubdomain = subdomain.trim().toLowerCase().replace('.nl', '');
    
    setTimeout(() => {
      switchSubdomain(cleanSubdomain);
    }, 1000);
  };

  // ✅ UPDATED: Payment linking functie - gebruikt nu de verbeterde service
  const attemptPaymentLinking = async (mosqueData) => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('tracking_id');
    const sessionId = urlParams.get('session_id'); // ✅ NEW: Get session_id
    const paymentSuccess = urlParams.get('payment_success');

    if (paymentSuccess === 'true' && (sessionId || trackingId)) {
      console.log('[Registration] Attempting session-based payment linking...', { 
        trackingId: trackingId?.substring(0, 10), 
        sessionId: sessionId?.substring(0, 15),
        mosqueId: mosqueData.id 
      });
      
      setIsLinkingPayment(true);
      
      try {
        // ✅ NEW: Use session-based linking endpoint
        const result = await apiCall('/api/payments/stripe/link-by-session', {
          method: 'POST',
          body: JSON.stringify({
            mosque_id: mosqueData.id,
            session_id: sessionId,          // ✅ PRIMARY: Session ID first
            tracking_id: trackingId,        // ✅ BACKUP: Tracking ID fallback  
            admin_email: mosqueData.email   // ✅ LAST RESORT: Email timing
          })
        });

        if (result.success) {
          console.log('[Registration] ✅ Session-based payment linking SUCCESS!');
          setPaymentStatus({
            status: 'success',
            message: `Uw ${result.plan_type || 'Professional'} account is direct actief! Geen restricties op aantallen.`,
            subscriptionStatus: 'active',
            planType: result.plan_type,
            linkingMethod: result.linking_method || 'session_id'
          });
        } else {
          console.warn('[Registration] Session-based linking failed, trying fallback...', result.message);
          
          // ✅ FALLBACK: Try the old retry endpoint as backup
          const fallbackResult = await apiCall('/api/payments/stripe/retry-payment-linking', {
            method: 'POST',
            body: JSON.stringify({
              mosqueId: mosqueData.id,
              adminEmail: mosqueData.email,
              trackingId: trackingId,
              sessionId: sessionId
            })
          });
          
          if (fallbackResult.success) {
            console.log('[Registration] ✅ Fallback linking SUCCESS!');
            setPaymentStatus({
              status: 'success',
              message: `Uw ${fallbackResult.result?.planType || 'Professional'} account is direct actief!`,
              subscriptionStatus: 'active',
              planType: fallbackResult.result?.planType,
              linkingMethod: 'fallback_retry'
            });
          } else {
            setPaymentStatus({
              status: 'failed',
              message: result.message || 'Betaling wordt nog verwerkt. Uw Professional account wordt automatisch geactiveerd zodra de verwerking voltooid is.',
              suggestion: 'Log over een paar minuten opnieuw in om de status te controleren.',
              queued_for_retry: result.queued_for_retry
            });
          }
        }
      } catch (error) {
        console.error('[Registration] Error in session-based linking:', error);
        setPaymentStatus({
          status: 'failed',
          message: 'Er was een probleem bij het verwerken van uw betaling. Uw account werkt nu als proefversie, maar uw Professional account wordt geactiveerd zodra de betaling is verwerkt.',
          suggestion: 'Log over een paar minuten opnieuw in om de status te controleren.'
        });
      } finally {
        setIsLinkingPayment(false);
        setLinkingComplete(true);
        clearUrlParameters(); // ✅ NOW clear URL parameters
      }
    }
  };

  const retryPaymentLinking = async () => {
    if (registeredMosque) {
      await attemptPaymentLinking(registeredMosque);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
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
      const urlParams = new URLSearchParams(window.location.search);
      const trackingId = urlParams.get('tracking_id');
      const sessionId = urlParams.get('session_id');
      const paymentSuccess = urlParams.get('payment_success') === 'true';

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
        contactEmail: formData.contactEmail.trim().toLowerCase() || formData.adminEmail.trim().toLowerCase(),
        trackingId: trackingId,
        sessionId: sessionId,        // ✅ ENSURE session_id is included
        paymentSuccess: paymentSuccess,
        paymentSession: paymentSession // ✅ NEW: Include full payment session data
      };

      console.log("REGISTRATION PAYLOAD TO BACKEND:", {
        ...payload,
        trackingId: trackingId ? `${trackingId.substring(0, 10)}...` : null,
        sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : null,
        paymentSuccess
      });

      const result = await apiCall('/api/mosques/register', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });
      
      if (result.success) {
        const mosqueData = result.mosque;
        setRegisteredMosque(mosqueData);
        
        // ✅ UPDATED: Betere success messaging gebaseerd op plan type
        if (result.payment_linked) {
          const planType = result.plan_type || 'Professional';
          const linkingMethod = result.linking_method || 'unknown';
          
          console.log(`[Registration] ✅ Payment linked via: ${linkingMethod}`);
          
          setSuccessMessage(`🎉 Welkom bij MijnLVS, ${mosqueData.name}! Uw ${planType} account is direct actief.`);
          setPaymentStatus({
            status: 'success',
            message: `Uw betaling is succesvol verwerkt via ${linkingMethod === 'session_id' ? 'session linking' : linkingMethod}. Uw ${planType} account is geactiveerd!`,
            subscriptionStatus: 'active',
            planType: planType,
            linkingMethod: linkingMethod
          });
          setLinkingComplete(true);
        } else {
          // Bestaande logic voor wanneer payment linking niet direct lukt
          setSuccessMessage(`Welkom bij MijnLVS, ${mosqueData.name}! Uw account is succesvol aangemaakt.`);
          
          // Als er payment parameters waren maar linking niet lukte
          if ((trackingId || sessionId) && paymentSuccess) {
            await attemptPaymentLinking(mosqueData);
          }
        }
        
        clearUrlParameters();
        nextStep();
        
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
            
            {isLinkingPayment && (
              <PaymentStatusCard 
                isLoading={true}
              />
            )}
            
            {linkingComplete && paymentStatus && (
              <PaymentStatusCard 
                status={paymentStatus.status}
                message={paymentStatus.message}
                linkingMethod={paymentStatus.linkingMethod} // ✅ NEW: Pass linking method
                onRetry={paymentStatus.status === 'failed' ? retryPaymentLinking : null}
              />
            )}
            
            <div className="mt-8">
              <Button 
                onClick={() => handleSwitchWithDelay(formData.subdomain)}
                variant="primary" 
                size="lg"
                className="w-full sm:w-auto"
              >
                {paymentStatus?.status === 'success' ? 
                  `Ga naar ${paymentStatus.planType || 'Professional'} Dashboard` : 
                  'Ga naar Inloggen'
                }
              </Button>
            </div>
            
            {/* ✅ UPDATED: Better success info */}
            {linkingComplete && paymentStatus?.status === 'success' && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg text-left">
                <h4 className="font-medium text-emerald-800 mb-2">
                  🚀 Uw {paymentStatus.planType || 'Professional'} Account is actief!
                </h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>✅ <strong>Onbeperkt</strong> aantal leerlingen en leraren</li>
                  <li>✅ Volledige financieel beheer</li>
                  <li>✅ Qor'aan voortgang tracking</li>
                  <li>✅ Professionele rapporten</li>
                  <li>✅ E-mail communicatie met ouders</li>
                  <li>✅ Geen restricties of limieten</li>
                </ul>
              </div>
            )}
            
            {linkingComplete && paymentStatus?.status === 'failed' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                <h4 className="font-medium text-blue-800 mb-2">💡 Wat nu?</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>• <strong>Nu:</strong> Proefversie actief (max 10 leerlingen, 2 leraren)</p>
                  <p>• <strong>Binnenkort:</strong> Automatische upgrade naar Professional zodra betaling is verwerkt</p>
                  <p>• <strong>Dan:</strong> Onbeperkt aantal leerlingen en leraren</p>
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

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchSubdomain={handleSwitchToLogin}
      />

      {/* Banner Column */}
      <div className="hidden lg:block lg:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-8 xl:p-12 flex flex-col justify-between">
          <div>
              <a href="/" className="inline-block hover:scale-110 transition-transform duration-200">
                  <img className="h-36 w-auto bg-white p-6 rounded-2xl shadow-lg" src={appLogo} alt="MijnLVS Logo" />
              </a>
              
              <h1 className="mt-10 text-3xl font-bold tracking-tight">
                  Het hart van uw Islamitisch onderwijs.
              </h1>
              <p className="mt-4 text-emerald-100">
                  MijnLVS is speciaal ontworpen voor moskeeën en onderwijsinstellingen die Arabische taal- en Qor'aanlessen verzorgen.
              </p>
              
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

      {/* Form Column */}
      <div className="lg:col-span-3 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-lg mx-auto">
          <div className="lg:hidden text-center mb-8">
            <a href="/" className="inline-block hover:scale-105 transition-transform duration-200">
              <img className="mx-auto h-20 w-auto bg-emerald-50 p-3 rounded-xl shadow-md" src={appLogo} alt="MijnLVS Logo" />
            </a>
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Nieuwe Organisatie Registreren</h2>
            
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

          {/* ✅ LOGIN SECTIE - alleen tonen voor stap 1 en 2 */}
          {step < 3 && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                Al een account?{' '}
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none focus:underline transition-colors"
                >
                  Ga naar inloggen
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;