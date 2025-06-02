import React, { useState } from 'react';
import { BookOpen, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api'; // Voor de daadwerkelijke registratie call
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const RegistrationPage = () => {
  const { switchSubdomain } = useAuth();
  const [formData, setFormData] = useState({
    mosqueName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    address: '',
    city: '',
    zipcode: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'mosqueName' && !formData.subdomain) {
        // Auto-genereer subdomein, maar gebruiker kan het aanpassen
        const generatedSubdomain = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setFormData(prev => ({ ...prev, subdomain: generatedSubdomain }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    // Validatie
    if (!formData.mosqueName || !formData.subdomain || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      setError('Alle velden met * zijn verplicht.');
      return;
    }
    if (formData.adminPassword.length < 8) {
        setError('Wachtwoord moet minimaal 8 karakters lang zijn.');
        return;
    }
    // TODO: Voeg meer validatie toe (email formaat, subdomein formaat/beschikbaarheid)

    setLoading(true);
    try {
      // Dit endpoint moet je in je backend maken: POST /api/mosques/register
      // Het moet een nieuwe moskee en een admin user aanmaken.
      const result = await apiCall('/api/mosques/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (result.success) {
        setSuccessMessage(`Registratie succesvol! U kunt nu inloggen op ${result.mosqueSubdomain || formData.subdomain}.mijnlvs.nl.`);
        // Optioneel: reset formulier of stuur door naar login van het nieuwe subdomein
        // switchSubdomain(result.mosqueSubdomain || formData.subdomain);
      } else {
        setError(result.error || 'Registratie mislukt. Probeer het opnieuw.');
      }
    } catch (err) {
      setError(err.message || 'Er is een onbekende fout opgetreden.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 py-8">
      {loading && <LoadingSpinner message="Registratie verwerken..." />}
      <div className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-emerald-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-800">Leerling Volgsysteem</h1>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => switchSubdomain('al-noor')} variant="secondary" size="sm">Al-Noor Demo</Button>
              <Button onClick={() => switchSubdomain('al-hijra')} variant="secondary" size="sm">Al-Hijra Demo</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Registreer Uw Moskee</h1>
          <p className="text-lg text-gray-600">Start vandaag met een modern leerlingvolgsysteem.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-6">
            <Building2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700">Registratieformulier</h2>
          </div>

          {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
          {successMessage && <p className="mb-4 text-green-700 bg-green-100 p-3 rounded-md text-center">{successMessage}</p>}

          {!successMessage && (
            <form onSubmit={handleRegister} className="space-y-5">
              <fieldset className="border border-gray-300 p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-700 px-2">Moskee Gegevens</legend>
                <div className="space-y-4 mt-2">
                    <Input label="Naam van de Moskee *" name="mosqueName" value={formData.mosqueName} onChange={handleChange} required />
                    <Input label="Gewenst Subdomein (voor mijlvs.nl) *" name="subdomain" value={formData.subdomain} onChange={handleChange} placeholder="bijv. alistiqama" required />
                    <Input label="Adres (straat & nr)" name="address" value={formData.address} onChange={handleChange} />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Postcode" name="zipcode" value={formData.zipcode} onChange={handleChange} />
                        <Input label="Stad" name="city" value={formData.city} onChange={handleChange} />
                    </div>
                    <Input label="Telefoonnummer Moskee" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
              </fieldset>

              <fieldset className="border border-gray-300 p-4 rounded-md">
                <legend className="text-lg font-medium text-gray-700 px-2">Admin Account</legend>
                <div className="space-y-4 mt-2">
                    <Input label="Naam Beheerder *" name="adminName" value={formData.adminName} onChange={handleChange} required />
                    <Input label="Emailadres Beheerder *" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} required />
                    <Input label="Wachtwoord Beheerder *" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} required />
                </div>
              </fieldset>
              <p className="text-xs text-gray-500">Met * gemarkeerde velden zijn verplicht.</p>
              <Button type="submit" variant="primary" fullWidth disabled={loading} className="py-3 text-base">
                {loading ? 'Registratie wordt verwerkt...' : 'Registratie Aanvragen'}
              </Button>
            </form>
          )}
           <p className="mt-8 text-center text-sm text-gray-500">
            Heeft uw moskee al een account?{" "}
            <Button variant="link" onClick={() => switchSubdomain('al-hijra')}>Log hier in</Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;