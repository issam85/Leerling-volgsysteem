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

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

      {/* KOLOM 1: De "Banner" - Zichtbaar op grote schermen */}
      <div className="hidden lg:block lg:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-8 xl:p-12 flex flex-col justify-between">
        <div>
          <img className="h-12 w-auto bg-white p-2 rounded-lg" src={appLogo} alt="MijnLVS Logo" />
          <h1 className="mt-8 text-3xl font-bold tracking-tight">
            Een modern systeem voor een moderne organisatie.
          </h1>
          <p className="mt-4 text-emerald-100">
            MijnLVS biedt alle tools die je nodig hebt om de administratie, communicatie en voortgang van je leerlingen efficiënt te beheren.
          </p>
          <ul className="mt-8 space-y-4 text-emerald-50">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
              <span><strong className="text-white">Overzicht voor leraren:</strong> Volg aanwezigheid en voortgang per leerling.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
              <span><strong className="text-white">Inzicht voor ouders:</strong> Bekijk rapporten en communiceer direct.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
              <span><strong className="text-white">Efficiëntie voor de administratie:</strong> Beheer betalingen en gebruikers centraal.</span>
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
          {/* Logo voor mobiele weergave */}
          <div className="lg:hidden text-center mb-8">
            <img className="mx-auto h-16 w-auto" src={appLogo} alt="MijnLVS Logo" />
            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Nieuwe Organisatie Registreren</h2>
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

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Al een account?{' '}
              <button onClick={() => switchSubdomain('al-hijra')} className="font-medium text-emerald-600 hover:text-emerald-500">
                Ga naar inloggen
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;