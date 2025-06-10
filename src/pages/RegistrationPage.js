// src/pages/RegistrationPage.js

import React, { useState } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import appLogo from '../assets/logo-mijnlvs.png';
import { Building, UserCircle, CheckCircle, ArrowLeft } from 'lucide-react';

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
  const { switchSubdomain } = useAuth();

  // START -- NIEUWE CODE: State voor de slimme login link
  const [showSubdomainInput, setShowSubdomainInput] = useState(false);
  const [loginSubdomain, setLoginSubdomain] = useState('');
  // EINDE -- NIEUWE CODE

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Validatie op de laatste stap
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen.'); return;
    }
    if (formData.adminPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 karakters lang zijn.'); return;
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
        setSuccessMessage(`Registratie succesvol voor ${result.mosque.name}! U kunt nu inloggen op https://${result.mosque.subdomain}.mijnlvs.nl met de admin gegevens.`);
        nextStep(); // Ga naar de succes-stap
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
                <p className="text-gray-600 max-w-lg mx-auto">{successMessage}</p>
                <div className="mt-8">
                    <Button onClick={() => switchSubdomain(formData.subdomain.trim().toLowerCase())} variant="primary" size="lg">
                        Direct naar Inloggen
                    </Button>
                </div>
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

          {/* ======================================================= */}
          {/* START VERVANGING: Dit is de nieuwe, slimme login sectie */}
          {/* ======================================================= */}
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
          {/* ======================================================= */}
          {/* EINDE VERVANGING                                      */}
          {/* ======================================================= */}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;