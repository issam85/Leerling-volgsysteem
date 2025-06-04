// src/pages/RegistrationPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall } from '../services/api'; // Zorg dat het pad correct is
import { useAuth } from '../contexts/AuthContext'; // Voor currentSubdomain
import Button from '../components/Button'; // Zorg dat het pad correct is
import Input from '../components/Input';   // Zorg dat het pad correct is
import LoadingSpinner from '../components/LoadingSpinner'; // Zorg dat het pad correct is
import appLogo from '../assets/logo-mijnlvs'; // Zorg dat het pad correct is

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    mosqueName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    address: '',
    city: '',
    zipcode: '',
    phone: '',
    website: '',
    contactEmail: '', // Contact e-mail voor de moskee zelf
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { currentSubdomain, switchSubdomain } = useAuth();

  useEffect(() => {
    // Als we op een ander subdomein dan 'register' zijn, redirect
    if (currentSubdomain && currentSubdomain !== 'register') {
      // Probeer naar het login scherm van het gedetecteerde subdomein te gaan
      // Dit vereist dat de switchSubdomain logica de pagina herlaadt of de AuthContext update.
      // Voor nu, simpelweg redirect naar /login op het huidige (verkeerde) subdomein.
      // Een betere UX zou zijn om de gebruiker een keuze te geven.
      console.warn(`RegistrationPage geladen op verkeerd subdomein: ${currentSubdomain}. Redirect naar login.`);
      navigate('/login');
    }
  }, [currentSubdomain, navigate]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      setLoading(false);
      return;
    }
    if (formData.adminPassword.length < 8) {
        setError('Wachtwoord moet minimaal 8 karakters lang zijn.');
        setLoading(false);
        return;
    }

    // Velden die de backend verwacht voor de /api/mosques/register route
    const payload = {
      mosqueName: formData.mosqueName.trim(),
      subdomain: formData.subdomain.trim().toLowerCase(),
      adminName: formData.adminName.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      adminPassword: formData.adminPassword, // Wachtwoord niet trimmen
      address: formData.address.trim(),
      city: formData.city.trim(),
      zipcode: formData.zipcode.trim().toUpperCase(),
      phone: formData.phone.trim(),
      website: formData.website.trim(),
      email: formData.contactEmail.trim().toLowerCase() || formData.adminEmail.trim().toLowerCase(), // Backend verwacht 'email' voor moskee contact
    };

    // ----- VOEG DEZE CONSOLE.LOG TOE -----
    console.log("REGISTRATION PAYLOAD TO BACKEND (Frontend):", JSON.stringify(payload, null, 2));
    // ------------------------------------

    // Client-side check voor de velden die de backend als strict vereist markeert
    // (mosqueName, subdomain, adminName, adminEmail, adminPassword)
    if (!payload.mosqueName || !payload.subdomain || !payload.adminName || !payload.adminEmail || !payload.adminPassword) {
        setError('Naam organisatie, subdomein, naam beheerder, email beheerder en wachtwoord beheerder zijn verplicht.');
        setLoading(false);
        return;
    }


    try {
      const result = await apiCall('/api/mosques/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // De backend stuurt nu {success: true, message: ..., mosque: ..., admin: ...} bij succes
      if (result.success) {
        setSuccessMessage(`Registratie succesvol voor ${result.mosque.name}! U kunt nu inloggen op https://${result.mosque.subdomain}.mijnlvs.nl/login met de admin gegevens.`);
        // Optioneel: reset formulier
        setFormData({
            mosqueName: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
            address: '', city: '', zipcode: '', phone: '', website: '', contactEmail: ''
        });
        // Niet direct navigeren, laat de succesmessage zien.
        // De gebruiker kan dan zelf naar de nieuwe subdomein URL gaan.
      } else {
        // Als de backend {success: false, error: "bericht"} stuurt
        setError(result.error || 'Registratie mislukt. Probeer het opnieuw.');
      }
    } catch (err) {
      console.error("Registration Page Submit Error:", err);
      setError(err.message || 'Er is een onbekende fout opgetreden tijdens de registratie.');
    } finally {
      setLoading(false);
    }
  };
  
  // Als we op een ander subdomein zijn, render niets of een melding, want App.js zou al moeten redirecten.
  if (currentSubdomain && currentSubdomain !== 'register') {
    return <LoadingSpinner message="Verkeerd subdomein, bezig met doorsturen..."/>; 
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {loading && <LoadingSpinner message="Registratie verwerken..." />}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <img className="mx-auto h-16 w-auto" src={appLogo} alt="MijnLVS Logo" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Nieuwe Moskee Registreren
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Al een account voor uw moskee?{' '}
          <button onClick={() => switchSubdomain('al-hijra')} className="font-medium text-emerald-600 hover:text-emerald-500">
            Ga naar inloggen
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          {!successMessage && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Organisatiegegevens</h3>
                <p className="mt-1 text-sm text-gray-500">Details van de moskee of onderwijsinstelling.</p>
              </div>

              <Input label="Naam organisatie *" name="mosqueName" value={formData.mosqueName} onChange={handleChange} required />
              <Input label="Gewenst subdomein * (bijv. al-noor)" name="subdomain" value={formData.subdomain} onChange={handleChange} required placeholder="alnoor (alleen letters, cijfers, koppelstreepjes)" />
              <p className="mt-1 text-xs text-gray-500">Uw unieke adres wordt: {formData.subdomain || "[subdomein]"}.mijnlvs.nl</p>
              
              <Input label="Adres (straat + huisnr)" name="address" value={formData.address} onChange={handleChange} />
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <Input label="Postcode" name="zipcode" value={formData.zipcode} onChange={handleChange} />
                <Input label="Plaats" name="city" value={formData.city} onChange={handleChange} />
              </div>
              <Input label="Telefoonnummer organisatie" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
              <Input label="Contact email organisatie" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} />
              <Input label="Website (optioneel)" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://www.voorbeeld.nl" />

              <div className="pt-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Beheerdergegevens</h3>
                <p className="mt-1 text-sm text-gray-500">De eerste beheerder voor dit account.</p>
              </div>

              <Input label="Naam beheerder *" name="adminName" value={formData.adminName} onChange={handleChange} required />
              <Input label="Emailadres beheerder *" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} required />
              <Input label="Wachtwoord beheerder *" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} required />
              <Input label="Bevestig wachtwoord *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
              
              <div>
                <Button type="submit" fullWidth variant="primary" size="lg" disabled={loading}>
                  {loading ? 'Registreren...' : 'Registreer Moskee'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;