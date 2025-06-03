// src/features/admin/settings/SettingsTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import Button from '../../../components/Button';
import M365ConfigModal from './M365ConfigModal';
import { Building, Mail, ServerCog, CheckCircle, XCircle, Edit, AlertCircle, Save, SlidersHorizontal } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Input from '../../../components/Input';

const SettingsTab = () => {
  const { realData, loadData } = useData();
  const { mosque, loading: dataLoading, error: dataError } = realData; // currentUser is niet direct nodig hier, wel mosque.id

  const [showM365ConfigModal, setShowM365ConfigModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const [mosqueDetailsForm, setMosqueDetailsForm] = useState({
    name: '', address: '', city: '', zipcode: '', phone: '', email: '', website: ''
  });

  const [currentM365Config, setCurrentM365Config] = useState({
    tenantId: '', clientId: '', configured: false, senderEmail: ''
  });

  const [contributionSettingsForm, setContributionSettingsForm] = useState({
    contribution_1_child: '',
    contribution_2_children: '',
    contribution_3_children: '',
    contribution_4_children: '',
    contribution_5_plus_children: '',
  });

  useEffect(() => {
    if (mosque) {
      setMosqueDetailsForm({
        name: mosque.name || '',
        address: mosque.address || '',
        city: mosque.city || '',
        zipcode: mosque.zipcode || '',
        phone: mosque.phone || '',
        email: mosque.email || '', // Dit is het algemene contact email van de moskee
        website: mosque.website || '',
      });
      setCurrentM365Config({
        tenantId: mosque.m365_tenant_id || '',
        clientId: mosque.m365_client_id || '',
        configured: mosque.m365_configured || false,
        senderEmail: mosque.m365_sender_email || '', // De afzender voor M365 emails
      });
      setContributionSettingsForm({
        contribution_1_child: mosque.contribution_1_child !== null ? String(mosque.contribution_1_child) : '150',
        contribution_2_children: mosque.contribution_2_children !== null ? String(mosque.contribution_2_children) : '300',
        contribution_3_children: mosque.contribution_3_children !== null ? String(mosque.contribution_3_children) : '450',
        contribution_4_children: mosque.contribution_4_children !== null ? String(mosque.contribution_4_children) : '450',
        contribution_5_plus_children: mosque.contribution_5_plus_children !== null ? String(mosque.contribution_5_plus_children) : '450',
      });
    }
  }, [mosque]);

  const handleM365ConfigSave = async (configDataFromModal) => {
    setFormMessage({ type: '', text: '' });
    if (!mosque || !mosque.id) { setFormMessage({ type: 'error', text: 'Moskee ID niet gevonden.' }); return false; }
    if (!configDataFromModal.tenantId || !configDataFromModal.clientId || !configDataFromModal.senderEmail) { setFormMessage({ type: 'error', text: 'Tenant ID, Client ID en Afzender Email zijn verplicht.'}); return false; }
    if (!currentM365Config.configured && !configDataFromModal.clientSecret) { setFormMessage({ type: 'error', text: 'Client Secret is verplicht voor de eerste configuratie.'}); return false; }
    setActionLoading(true);
    try {
      const payload = {
        m365_tenant_id: configDataFromModal.tenantId,
        m365_client_id: configDataFromModal.clientId,
        m365_sender_email: configDataFromModal.senderEmail,
        m365_configured: true,
      };
      if (configDataFromModal.clientSecret && configDataFromModal.clientSecret.trim() !== '') {
        payload.m365_client_secret = configDataFromModal.clientSecret;
      }
      const result = await apiCall(`/api/mosques/${mosque.id}/m365-settings`, { method: 'PUT', body: JSON.stringify(payload) });
      if (result.success || result.data) {
        setFormMessage({ type: 'success', text: 'Microsoft 365 configuratie opgeslagen!' });
        setShowM365ConfigModal(false);
        await loadData();
        setActionLoading(false);
        return true;
      } else { throw new Error(result.error || "Kon M365 configuratie niet opslaan."); }
    } catch (err) {
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
    if (!mosque || !mosque.id) { setFormMessage({ type: 'error', text: 'Moskee ID niet gevonden.' }); return; }
    if (!mosqueDetailsForm.name.trim()) { setFormMessage({ type: 'error', text: 'Moskeenaam is verplicht.' }); return; }
    setActionLoading(true);
    try {
      const result = await apiCall(`/api/mosques/${mosque.id}`, { method: 'PUT', body: JSON.stringify(mosqueDetailsForm) });
      if (result.id || result.success) {
        setFormMessage({ type: 'success', text: 'Moskeegegevens succesvol opgeslagen!' });
        await loadData();
      } else { throw new Error(result.error || "Kon moskeegegevens niet opslaan."); }
    } catch (err) {
      setFormMessage({ type: 'error', text: `Fout bij opslaan moskeegegevens: ${err.message}`});
    }
    setActionLoading(false);
  };

  const handleContributionChange = (e) => {
    setContributionSettingsForm({ ...contributionSettingsForm, [e.target.name]: e.target.value });
  };

  const handleSaveContributionSettings = async () => {
    setFormMessage({ type: '', text: '' });
    if (!mosque || !mosque.id) { setFormMessage({ type: 'error', text: 'Moskee ID niet gevonden.' }); return; }
    const payload = {};
    let isValid = true;
    for (const key in contributionSettingsForm) {
        const value = parseFloat(contributionSettingsForm[key]);
        if (isNaN(value) || value < 0) {
            isValid = false;
            setFormMessage({ type: 'error', text: `Ongeldige waarde voor ${key.replace('contribution_', '').replace('_', ' ')}. Voer een positief getal of 0 in.` });
            break;
        }
        payload[key] = value;
    }
    if (!isValid) return;
    setActionLoading(true);
    try {
      const result = await apiCall(`/api/mosques/${mosque.id}/contribution-settings`, { method: 'PUT', body: JSON.stringify(payload) });
      if (result.success) {
        setFormMessage({ type: 'success', text: 'Instellingen voor bijdrage succesvol opgeslagen!' });
        await loadData();
      } else { throw new Error(result.error || "Kon bijdrage-instellingen niet opslaan."); }
    } catch (err) {
      setFormMessage({ type: 'error', text: `Fout bij opslaan bijdrage-instellingen: ${err.message}`});
    }
    setActionLoading(false);
  };

  if (dataLoading && !mosque) return <LoadingSpinner message="Instellingen laden..." />;
  if (dataError && !mosque) return <div className="card text-red-600"><AlertCircle className="inline mr-2"/>Fout bij laden van moskee-instellingen: {dataError}</div>;
  if (!mosque) return <div className="card text-orange-600"><AlertCircle className="inline mr-2"/>Moskee informatie niet gevonden.</div>;

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      {actionLoading && <LoadingSpinner message="Bezig met opslaan..." />}
      <h2 className="page-title">Systeem Instellingen</h2>

      {formMessage.text && (
        <div className={`p-4 rounded-md text-sm flex items-center shadow ${formMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
          {formMessage.type === 'success' ? <CheckCircle size={20} className="mr-3 flex-shrink-0"/> : <AlertCircle size={20} className="mr-3 flex-shrink-0"/>}
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
            <Input label="Contact Email" name="email" type="email" value={mosqueDetailsForm.email} onChange={handleMosqueDetailsChange} />
          </div>
          <Input label="Website (optioneel)" name="website" type="url" value={mosqueDetailsForm.website} onChange={handleMosqueDetailsChange} placeholder="https://www.voorbeeld.nl"/>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center"> <SlidersHorizontal size={28} className="text-purple-600 mr-3" /> <h3 className="text-xl font-semibold text-gray-700">Bijdrage per Aantal Kinderen (€)</h3> </div>
            <Button onClick={handleSaveContributionSettings} variant="primary" icon={Save} size="md" disabled={actionLoading}> Instellingen Opslaan </Button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Definieer hier de jaarlijkse bijdrage op basis van het aantal ingeschreven (actieve) kinderen per ouder. Deze bedragen worden gebruikt om automatisch de 'Te Betalen Bijdrage' voor ouders te berekenen.</p>
        <div className="space-y-3">
          <Input label="Bijdrage voor 1 Kind" name="contribution_1_child" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_1_child} onChange={handleContributionChange} />
          <Input label="Bijdrage voor 2 Kinderen" name="contribution_2_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_2_children} onChange={handleContributionChange} />
          <Input label="Bijdrage voor 3 Kinderen" name="contribution_3_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_3_children} onChange={handleContributionChange} />
          <Input label="Bijdrage voor 4 Kinderen" name="contribution_4_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_4_children} onChange={handleContributionChange} />
          <Input label="Bijdrage voor 5 of Meer Kinderen" name="contribution_5_plus_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_5_plus_children} onChange={handleContributionChange} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center"> <Mail size={28} className="text-blue-600 mr-3" /> <h3 className="text-xl font-semibold text-gray-700">Microsoft 365 Email</h3> </div>
            <Button onClick={() => setShowM365ConfigModal(true)} variant="secondary" icon={Edit} size="md" disabled={actionLoading}> {currentM365Config.configured ? 'Configuratie Bewerken' : 'Configureren'} </Button>
        </div>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> <span>Status:</span> {currentM365Config.configured ? <span className="flex items-center font-semibold text-green-600"><CheckCircle size={16} className="mr-1.5"/>Geconfigureerd</span> : <span className="flex items-center font-semibold text-red-600"><XCircle size={16} className="mr-1.5"/>Niet geconfigureerd</span>} </div>
            {currentM365Config.configured && currentM365Config.senderEmail && ( <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> <span>Afzender Email (M365):</span> <span className="font-medium text-gray-700">{currentM365Config.senderEmail}</span> </div> )}
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
        />
      )}
    </div>
  );
};

export default SettingsTab;