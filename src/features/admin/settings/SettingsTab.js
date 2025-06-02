// src/features/admin/settings/SettingsTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import Button from '../../../components/Button';
import M365ConfigModal from './M365ConfigModal';
import { Building, Mail, ServerCog, CheckCircle, XCircle, Edit, AlertCircle, Save } from 'lucide-react'; // ServerCog, Save
import LoadingSpinner from '../../../components/LoadingSpinner';
import Input from '../../../components/Input';

const SettingsTab = () => {
  const { realData, loadData } = useData();
  const { mosque, loading: dataLoading, error: dataError } = realData;
  const [showM365ConfigModal, setShowM365ConfigModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const [mosqueDetailsForm, setMosqueDetailsForm] = useState({
    name: '', address: '', city: '', zipcode: '', phone: '', email: '', website: ''
  });

  const [currentM365Config, setCurrentM365Config] = useState({
    tenantId: '', clientId: '', configured: false, senderEmail: ''
  });

  useEffect(() => {
    if (mosque) {
      setMosqueDetailsForm({
        name: mosque.name || '',
        address: mosque.address || '',
        city: mosque.city || '',
        zipcode: mosque.zipcode || '',
        phone: mosque.phone || '',
        email: mosque.email || '',
        website: mosque.website || '',
      });
      setCurrentM365Config({
        tenantId: mosque.m365_tenant_id || '',
        clientId: mosque.m365_client_id || '',
        configured: mosque.m365_configured || false,
        senderEmail: mosque.m365_sender_email || '',
      });
    }
  }, [mosque]);

  const handleM365ConfigSave = async (configDataFromModal) => {
    setFormMessage({ type: '', text: '' });
    if (!mosque || !mosque.id) {
      setFormMessage({ type: 'error', text: 'Moskee ID niet gevonden.' });
      return false;
    }
    if (!configDataFromModal.tenantId || !configDataFromModal.clientId || !configDataFromModal.senderEmail) {
      setFormMessage({ type: 'error', text: 'Tenant ID, Client ID en Afzender Email zijn verplicht.'});
      return false;
    }
    // Client Secret is alleen nodig als het *nieuw* wordt ingesteld of *expliciet gewijzigd*.
    // Als M365 al geconfigureerd was en clientSecret in de modal leeg is, sturen we het niet mee.
    // Je backend moet dit ook zo interpreteren: als m365_client_secret niet in payload zit, niet updaten.
    if (!currentM365Config.configured && !configDataFromModal.clientSecret) {
      setFormMessage({ type: 'error', text: 'Client Secret is verplicht voor de eerste configuratie.'});
      return false;
    }
    setActionLoading(true);
    try {
      const payload = {
        m365_tenant_id: configDataFromModal.tenantId,
        m365_client_id: configDataFromModal.clientId,
        m365_sender_email: configDataFromModal.senderEmail,
        m365_configured: true, // Wordt geconfigureerd bij opslaan
      };
      // Stuur clientSecret alleen mee als het is ingevuld
      if (configDataFromModal.clientSecret && configDataFromModal.clientSecret.trim() !== '') {
        payload.m365_client_secret = configDataFromModal.clientSecret;
      }

      // PUT naar /api/mosques/:mosqueId/m365-settings (BACKEND MOET DIT IMPLEMENTEREN)
      const result = await apiCall(`/api/mosques/${mosque.id}/m365-settings`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (result.success || result.data) { // Of andere succesindicatie van backend
        setFormMessage({ type: 'success', text: 'Microsoft 365 configuratie opgeslagen!' });
        setShowM365ConfigModal(false);
        await loadData(); // Herlaad data om bijgewerkte config te zien
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon M365 configuratie niet opslaan.");
      }
    } catch (err) {
      console.error('Error saving M365 config:', err);
      setFormMessage({ type: 'error', text: `Fout bij opslaan M365: ${err.message}` });
      setActionLoading(false);
      return false;
    }
  };

  const handleMosqueDetailsChange = (e) => {
    setMosqueDetailsForm({ ...mosqueDetailsForm, [e.target.name]: e.target.value });
  };

  const handleSaveMosqueDetails = async () => {
    setFormMessage({ type: '', text: '' });
    if (!mosque || !mosque.id) {
      setFormMessage({ type: 'error', text: 'Moskee ID niet gevonden.' }); return;
    }
    if (!mosqueDetailsForm.name.trim()) {
      setFormMessage({ type: 'error', text: 'Moskeenaam is verplicht.' }); return;
    }
    setActionLoading(true);
    try {
      // PUT naar /api/mosques/:mosqueId (BACKEND MOET DIT IMPLEMENTEREN)
      const result = await apiCall(`/api/mosques/${mosque.id}`, {
        method: 'PUT',
        body: JSON.stringify(mosqueDetailsForm), // Stuur alle formulier velden
      });
      if (result.id || result.success) { // Supabase PUT geeft vaak de geüpdatete record terug
        setFormMessage({ type: 'success', text: 'Moskeegegevens succesvol opgeslagen!' });
        await loadData();
      } else {
        throw new Error(result.error || "Kon moskeegegevens niet opslaan.");
      }
    } catch (err) {
      console.error("Error saving mosque details:", err);
      setFormMessage({ type: 'error', text: `Fout bij opslaan moskeegegevens: ${err.message}`});
    }
    setActionLoading(false);
  };

  if (dataLoading && !mosque) {
    return <LoadingSpinner message="Instellingen laden..." />;
  }
  if (dataError && !mosque) { // Fout bij laden van moskee zelf
    return <div className="card text-red-600"><AlertCircle className="inline mr-2"/>Fout bij laden van moskee-instellingen: {dataError}</div>;
  }
  if (!mosque) { // Moskee niet gevonden na poging tot laden
    return <div className="card text-orange-600"><AlertCircle className="inline mr-2"/>Moskee informatie niet gevonden. Kan instellingen niet tonen.</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {actionLoading && <LoadingSpinner message="Bezig met opslaan..." />}
      <h2 className="page-title">Systeem Instellingen</h2>

      {formMessage.text && (
        <div className={`p-4 rounded-md text-sm flex items-center ${formMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {formMessage.type === 'success' ? <CheckCircle size={20} className="mr-2"/> : <AlertCircle size={20} className="mr-2"/>}
          {formMessage.text}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center"> <Building size={28} className="text-emerald-600 mr-3" /> <h3 className="text-xl font-semibold text-gray-700">Moskee Informatie</h3> </div>
            <Button onClick={handleSaveMosqueDetails} variant="primary" icon={Save} size="md" disabled={actionLoading}> Opslaan </Button>
        </div>
        <div className="space-y-4">
          <Input label="Naam Moskee *" name="name" value={mosqueDetailsForm.name} onChange={handleMosqueDetailsChange} />
          <Input label="Adres" name="address" value={mosqueDetailsForm.address} onChange={handleMosqueDetailsChange} />
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Stad" name="city" value={mosqueDetailsForm.city} onChange={handleMosqueDetailsChange} />
            <Input label="Postcode" name="zipcode" value={mosqueDetailsForm.zipcode} onChange={handleMosqueDetailsChange} />
          </div>
           <div className="grid md:grid-cols-2 gap-4">
            <Input label="Telefoon" name="phone" type="tel" value={mosqueDetailsForm.phone} onChange={handleMosqueDetailsChange} />
            <Input label="Email" name="email" type="email" value={mosqueDetailsForm.email} onChange={handleMosqueDetailsChange} />
          </div>
          <Input label="Website (optioneel)" name="website" type="url" value={mosqueDetailsForm.website} onChange={handleMosqueDetailsChange} placeholder="https://www.voorbeeld.nl"/>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center"> <Mail size={28} className="text-blue-600 mr-3" /> <h3 className="text-xl font-semibold text-gray-700">Microsoft 365 Email</h3> </div>
            <Button onClick={() => setShowM365ConfigModal(true)} variant="secondary" icon={Edit} size="md" disabled={actionLoading}> {currentM365Config.configured ? 'Configuratie Bewerken' : 'Configureren'} </Button>
        </div>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> <span>Status:</span> {currentM365Config.configured ? <span className="flex items-center font-semibold text-green-600"><CheckCircle size={16} className="mr-1.5"/>Geconfigureerd</span> : <span className="flex items-center font-semibold text-red-600"><XCircle size={16} className="mr-1.5"/>Niet geconfigureerd</span>} </div>
            {currentM365Config.configured && currentM365Config.senderEmail && ( <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> <span>Afzender Email:</span> <span className="font-medium text-gray-700">{currentM365Config.senderEmail}</span> </div> )}
            {/* Tenant ID en Client ID kunnen getoond worden als ze geconfigureerd zijn, maar niet de secret */}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center mb-4"> <ServerCog size={28} className="text-gray-600 mr-3" /> <h3 className="text-xl font-semibold text-gray-700">Systeem Status</h3> </div>
         <div className="space-y-2 text-sm"> <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> <span>Backend API:</span> <span className="flex items-center font-semibold text-green-600"><CheckCircle size={16} className="mr-1.5"/>Verbonden</span> </div> </div>
      </div>

      {showM365ConfigModal && (
        <M365ConfigModal
          isOpen={showM365ConfigModal}
          onClose={() => setShowM365ConfigModal(false)}
          onSubmit={handleM365ConfigSave}
          initialConfig={currentM365Config}
          isLoading={actionLoading}
          mosqueName={mosque?.name || "Test Moskee"}
          // sendTestEmailViaBackend prop om de test email via de backend te sturen
          // Dit vereist een backend endpoint die de M365 test uitvoert.
          // Je backend heeft al /api/send-email-m365, dus we kunnen die hergebruiken.
          // De modal zelf zal apiCall gebruiken.
        />
      )}
    </div>
  );
};

export default SettingsTab;