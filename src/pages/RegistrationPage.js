// src/pages/RegistrationPage.jsx
import React, { useState } from 'react';
import { BookOpen, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const RegistrationPage = () => {
  const { switchSubdomain } = useAuth();
  const [formData, setFormData] = useState({
    orgName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    address: '',
    city: '',
    zipcode: '',
    phone: '',
    contactEmail: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'orgName' && !formData.subdomain) {
      const generatedSubdomain = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData((prev) => ({ ...prev, subdomain: generatedSubdomain }));
    }

    if (name === 'adminEmail' && !formData.contactEmail) {
      setFormData((prev) => ({ ...prev, contactEmail: value }));
    }
  };

  const validateForm = () => {
    if (!formData.orgName || !formData.subdomain || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      return 'Velden met * zijn verplicht.';
    }

    if (formData.adminPassword.length < 8) {
      return 'Wachtwoord moet minimaal 8 karakters lang zijn.';
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.subdomain)) {
      return 'Subdomein mag alleen kleine letters, cijfers en koppeltekens bevatten, en mag niet starten of eindigen met een koppelteken.';
    }

    return '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall('/api/mosques/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (result.success) {
        setSuccessMessage(result.message || `Registratie succesvol! Subdomein: ${result.mosque?.subdomain || formData.subdomain}.`);
      } else {
        setError(result.error || 'Registratie mislukt. Probeer het opnieuw.');
      }
    } catch (err) {
      let displayError = err.message || 'Er is een fout opgetreden.';
      if (displayError.toLowerCase().includes('emailadres is al geregistreerd')) {
        displayError = 'Dit e-mailadres is al in gebruik.';
      } else if (displayError.toLowerCase().includes('subdomein is al in gebruik')) {
        displayError = 'Dit subdomein is al bezet.';
      }
      setError(displayError);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 py-8">
      {loading && <LoadingSpinner message="Registratie verwerken..." />}
      <header className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            <h1 className="ml-3 text-xl font-bold text-gray-800">Leerling Volgsysteem</h1>
          </div>
          <div className="space-x-2">
            <Button onClick={() => switchSubdomain('al-noor')} variant="secondary" size="sm">Al-Noor Demo</Button>
            <Button onClick={() => switchSubdomain('al-hijra')} variant="secondary" size="sm">Al-Hijra Demo</Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Registreer Uw Organisatie</h1>
          <p className="text-lg text-gray-600">Begin vandaag nog met een modern leerlingvolgsysteem.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-6">
            <Building2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700">Registratieformulier</h2>
          </div>

          {error && <p className="mb-4 text-red-700 bg-red-100 p-3 rounded-md text-center font-medium">{error}</p>}
          {successMessage && <p className="mb-4 text-green-700 bg-green-100 p-3 rounded-md text-center font-medium">{successMessage}</p>}

          {!successMessage && (
            <form onSubmit={handleRegister} className="space-y-5">
              <fieldset className="border border-gray-300 p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-700 px-2">Organisatiegegevens</legend>
                <div className="space-y-4 mt-2">
                  <Input label="Naam organisatie *" name="orgName" value={formData.orgName} onChange={handleChange} required />
                  <Input label="Gewenst subdomein *" name="subdomain" value={formData.subdomain} onChange={handleChange} placeholder="uniek, zonder spaties" required />
                  <Input label="Adres" name="address" value={formData.address} onChange={handleChange} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Postcode" name="zipcode" value={formData.zipcode} onChange={handleChange} />
                    <Input label="Plaats" name="city" value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Telefoonnummer" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                    <Input label="Contact email" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} />
                  </div>
                  <Input label="Website (optioneel)" name="website" type="url" value={formData.website} onChange={handleChange} />
                </div>
              </fieldset>

              <fieldset className="border border-gray-300 p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-700 px-2">Beheerder</legend>
                <div className="space-y-4 mt-2">
                  <Input label="Naam beheerder *" name="adminName" value={formData.adminName} onChange={handleChange} required />
                  <Input label="Email beheerder *" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} required />
                  <Input label="Wachtwoord *" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} required />
                </div>
              </fieldset>

              <p className="text-xs text-gray-500">Velden gemarkeerd met * zijn verplicht.</p>
              <Button type="submit" variant="primary" fullWidth disabled={loading} className="py-3 text-base">
                {loading ? 'Bezig met registreren...' : 'Registratie aanvragen'}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-500">
            Heeft uw organisatie al een account?{' '}
            <Button variant="link" onClick={() => switchSubdomain('al-hijra')}>Log hier in</Button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegistrationPage;
