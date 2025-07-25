// src/features/admin/settings/SettingsTab.js - VOLLEDIG MET SUBSCRIPTION MANAGEMENT
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import Button from '../../../components/Button';
import M365ConfigModal from './M365ConfigModal';
import AdminLayout from '../../../layouts/AdminLayout';
import { 
  Building, Mail, ServerCog, CheckCircle, XCircle, Edit, AlertCircle, Save, 
  SlidersHorizontal, Users, CreditCard, AlertTriangle, ExternalLink 
} from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Input from '../../../components/Input';

const SettingsTab = () => {
  // ✅ GECORRIGEERD: refreshAfterM365Update toegevoegd aan destructuring
  const { realData, loadData, refreshAfterM365Update } = useData();
  const { mosque, loading: dataLoading, error: dataError } = realData;

  const [showM365ConfigModal, setShowM365ConfigModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // ✅ SIMPELE STATE - geen complexe subscription management meer
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // State voor moskee basisgegevens formulier - UITGEBREID MET NIEUWE VELDEN
  const [mosqueDetailsForm, setMosqueDetailsForm] = useState({
    name: '', 
    address: '', 
    city: '', 
    zipcode: '', 
    phone: '', 
    email: '', 
    website: '',
    contact_committee_name: '',
    contact_committee_email: ''
  });

  // State voor M365 configuratie (voor weergave en doorgeven aan modal)
  const [displayM365Config, setDisplayM365Config] = useState({
    tenantId: '', clientId: '', configured: false, senderEmail: ''
  });

  // State voor bijdrage staffel formulier
  const [contributionSettingsForm, setContributionSettingsForm] = useState({
    contribution_1_child: '',
    contribution_2_children: '',
    contribution_3_children: '',
    contribution_4_children: '',
    contribution_5_plus_children: '',
  });

  // ✅ VERWIJDERD: Complexe subscription functies niet meer nodig

  // Effect om form states te vullen wanneer mosque data uit context verandert
  // Only update form when mosque data is first loaded or mosque.id changes
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  
  useEffect(() => {
    if (mosque && mosque.id && !isFormInitialized) {
      console.log("[SettingsTab] useEffect triggered by 'mosque' update. Populating forms. New mosque data:", JSON.stringify(mosque, null, 2));
      // UITGEBREID MET NIEUWE VELDEN
      setMosqueDetailsForm({
        name: mosque.name || '',
        address: mosque.address || '',
        city: mosque.city || '',
        zipcode: mosque.zipcode || '',
        phone: mosque.phone || '',
        email: mosque.email || '',
        website: mosque.website || '',
        contact_committee_name: mosque.contact_committee_name || '',
        contact_committee_email: mosque.contact_committee_email || ''
      });
      setDisplayM365Config({
        tenantId: mosque.m365_tenant_id || '',
        clientId: mosque.m365_client_id || '',
        configured: mosque.m365_configured || false,
        senderEmail: mosque.m365_sender_email || '',
      });
      setContributionSettingsForm({
        contribution_1_child: mosque.contribution_1_child !== null ? String(mosque.contribution_1_child) : '150',
        contribution_2_children: mosque.contribution_2_children !== null ? String(mosque.contribution_2_children) : '300',
        contribution_3_children: mosque.contribution_3_children !== null ? String(mosque.contribution_3_children) : '450',
        contribution_4_children: mosque.contribution_4_children !== null ? String(mosque.contribution_4_children) : '450',
        contribution_5_plus_children: mosque.contribution_5_plus_children !== null ? String(mosque.contribution_5_plus_children) : '450',
      });
      setIsFormInitialized(true);
    } else if (!mosque) {
        console.log("[SettingsTab] useEffect: mosque data is null or undefined. Resetting forms.");
        setMosqueDetailsForm({ 
          name: '', 
          address: '', 
          city: '', 
          zipcode: '', 
          phone: '', 
          email: '', 
          website: '',
          contact_committee_name: '',
          contact_committee_email: ''
        });
        setDisplayM365Config({ tenantId: '', clientId: '', configured: false, senderEmail: '' });
        setContributionSettingsForm({ contribution_1_child: '150', contribution_2_children: '300', contribution_3_children: '450', contribution_4_children: '450', contribution_5_plus_children: '450' });
        setSubscriptionInfo(null);
        setIsFormInitialized(false);
    }
  }, [mosque?.id, isFormInitialized]);

  // ✅ GECORRIGEERD: handleM365ConfigSave functie
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
    if (!displayM365Config.configured && !configDataFromModal.clientSecret.trim()) { 
      setFormMessage({ type: 'error', text: 'Client Secret is verplicht voor de eerste configuratie.'}); 
      return false; 
    }
    
    setActionLoading(true);
    try {
      const payload = {
        m365_tenant_id: configDataFromModal.tenantId,
        m365_client_id: configDataFromModal.clientId,
        m365_sender_email: configDataFromModal.senderEmail,
        m365_configured: true, // ✅ Expliciet op true zetten
      };
      
      if (configDataFromModal.clientSecret && configDataFromModal.clientSecret.trim() !== '') {
        payload.m365_client_secret = configDataFromModal.clientSecret;
      }
      
      console.log("[SettingsTab] Saving M365 settings, payload:", JSON.stringify(payload, null, 2));
      
      // 1. Sla de M365 configuratie op
      const result = await apiCall(`/api/mosques/${mosque.id}/m365-settings`, { 
        method: 'PUT', 
        body: JSON.stringify(payload) 
      });
      
      console.log("[SettingsTab] M365 save result:", result);
      
      if (result.success && result.data) {
        // 2. ✅ GECORRIGEERD: Gebruik de functie die we bovenaan hebben gedestructureerd
        console.log("[SettingsTab] M365 saved successfully. Refreshing data with cache-busting...");
        
        const freshMosqueData = await refreshAfterM365Update(); // Nu correct!
        
        console.log("[SettingsTab] Fresh mosque data after M365 update. M365 Configured:", freshMosqueData?.m365_configured);
        
        setFormMessage({ type: 'success', text: 'Microsoft 365 configuratie opgeslagen!' });
        setShowM365ConfigModal(false);
        return true;
      } else { 
        throw new Error(result.error || "Kon M365 configuratie niet opslaan."); 
      }
    } catch (err) {
      console.error('Error saving M365 config:', err);
      setFormMessage({ type: 'error', text: `Fout bij opslaan M365: ${err.message}` });
      return false;
    } finally {
      setActionLoading(false);
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
      console.log("[SettingsTab] Saving Mosque details, payload:", JSON.stringify(mosqueDetailsForm, null, 2));
      const result = await apiCall(`/api/mosques/${mosque.id}`, { method: 'PUT', body: JSON.stringify(mosqueDetailsForm) });
      if (result.id || (result.success && result.data)) {
        setFormMessage({ type: 'success', text: 'Moskeegegevens succesvol opgeslagen!' });
        await loadData();
      } else { throw new Error(result.error || "Kon moskeegegevens niet opslaan."); }
    } catch (err) {
      console.error("Error saving mosque details:", err);
      setFormMessage({ type: 'error', text: `Fout bij opslaan moskeegegevens: ${err.message}`});
    } finally {
      setActionLoading(false);
    }
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
            setFormMessage({ type: 'error', text: `Ongeldige waarde voor ${key.replace('contribution_', '').replace(/_/g, ' ')}. Voer een positief getal of 0 in.` });
            break;
        }
        payload[key] = value;
    }
    if (!isValid) return;
    
    setActionLoading(true);
    try {
      console.log("[SettingsTab] Saving Contribution settings, payload:", JSON.stringify(payload, null, 2));
      const result = await apiCall(`/api/mosques/${mosque.id}/contribution-settings`, { method: 'PUT', body: JSON.stringify(payload) });
      if (result.success && result.data) {
        setFormMessage({ type: 'success', text: 'Instellingen voor bijdrage succesvol opgeslagen!' });
        await loadData();
      } else { throw new Error(result.error || "Kon bijdrage-instellingen niet opslaan."); }
    } catch (err) {
      console.error("Error saving contribution settings:", err);
      setFormMessage({ type: 'error', text: `Fout bij opslaan bijdrage-instellingen: ${err.message}`});
    } finally {
      setActionLoading(false);
    }
  };

  if (dataLoading && !mosque) return <LoadingSpinner message="Instellingen laden..." />;
  if (dataError && !mosque) return <div className="card text-red-600"><AlertCircle className="inline mr-2"/>Fout bij laden van moskee-instellingen: {dataError}</div>;
  if (!mosque) return <div className="card text-orange-600"><AlertCircle className="inline mr-2"/>Moskee informatie niet gevonden. Kan instellingen niet tonen.</div>;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto pb-10">
        {actionLoading && <LoadingSpinner message="Bezig met opslaan..." />}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Instellingen</h1>
          <p className="text-gray-600">Beheer uw organisatie instellingen en configuratie</p>
        </div>

        {/* Global Message */}
        {formMessage.text && (
          <div className={`p-4 mb-8 rounded-lg text-sm flex items-center shadow-sm ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {formMessage.type === 'success' ? <CheckCircle size={20} className="mr-3 flex-shrink-0"/> : <AlertCircle size={20} className="mr-3 flex-shrink-0"/>}
            {formMessage.text}
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid lg:grid-cols-2 gap-8">{/* Left Column */}
          <div className="space-y-6">{/* Algemene Gegevens */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building size={24} className="text-emerald-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Algemene Gegevens</h3>
                  </div>
                  <Button 
                    onClick={handleSaveMosqueDetails} 
                    variant="primary" 
                    icon={Save} 
                    size="sm" 
                    disabled={actionLoading}
                  >
                    Opslaan
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <Input label="Naam Moskee *" name="name" value={mosqueDetailsForm.name} onChange={handleMosqueDetailsChange} />
                <Input label="Adres" name="address" value={mosqueDetailsForm.address} onChange={handleMosqueDetailsChange} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Stad" name="city" value={mosqueDetailsForm.city} onChange={handleMosqueDetailsChange} />
                  <Input label="Postcode" name="zipcode" value={mosqueDetailsForm.zipcode} onChange={handleMosqueDetailsChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Telefoon" name="phone" type="tel" value={mosqueDetailsForm.phone} onChange={handleMosqueDetailsChange} />
                  <Input label="Contact Email" name="email" type="email" value={mosqueDetailsForm.email} onChange={handleMosqueDetailsChange} />
                </div>
                <Input 
                  label="Website (optioneel)" 
                  name="website" 
                  type="url" 
                  value={mosqueDetailsForm.website} 
                  onChange={handleMosqueDetailsChange} 
                  placeholder="https://www.voorbeeld.nl"
                />
              </div>
            </div>

            {/* Contactpersonen */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users size={24} className="text-sky-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Contactpersonen</h3>
                  </div>
                  <Button 
                    onClick={handleSaveMosqueDetails} 
                    variant="primary" 
                    icon={Save} 
                    size="sm" 
                    disabled={actionLoading}
                  >
                    Opslaan
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Deze gegevens worden getoond op het ouder-dashboard voor contactinformatie.
                </p>
                <div className="space-y-4">
                  <Input 
                    label="Naam Commissie/Contactpersoon" 
                    name="contact_committee_name" 
                    value={mosqueDetailsForm.contact_committee_name} 
                    onChange={handleMosqueDetailsChange} 
                    placeholder="Bijv. Onderwijscommissie"
                  />
                  <Input 
                    label="Emailadres Commissie/Contactpersoon" 
                    name="contact_committee_email" 
                    type="email" 
                    value={mosqueDetailsForm.contact_committee_email} 
                    onChange={handleMosqueDetailsChange} 
                    placeholder="Bijv. onderwijs@uwdomein.nl"
                  />
                </div>
              </div>
            </div>

            {/* Bijdrage Instellingen */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <SlidersHorizontal size={24} className="text-purple-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Bijdrage Instellingen</h3>
                  </div>
                  <Button 
                    onClick={handleSaveContributionSettings} 
                    variant="primary" 
                    icon={Save} 
                    size="sm" 
                    disabled={actionLoading}
                  >
                    Opslaan
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Definieer de jaarlijkse bijdrage per aantal kinderen (€).
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="1 Kind" name="contribution_1_child" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_1_child} onChange={handleContributionChange} />
                    <Input label="2 Kinderen" name="contribution_2_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_2_children} onChange={handleContributionChange} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="3 Kinderen" name="contribution_3_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_3_children} onChange={handleContributionChange} />
                    <Input label="4 Kinderen" name="contribution_4_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_4_children} onChange={handleContributionChange} />
                    <Input label="5+ Kinderen" name="contribution_5_plus_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_5_plus_children} onChange={handleContributionChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Microsoft 365 Email */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail size={24} className="text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Microsoft 365 Email</h3>
                  </div>
                  <Button 
                    onClick={() => setShowM365ConfigModal(true)} 
                    variant="secondary" 
                    icon={Edit} 
                    size="sm" 
                    disabled={actionLoading}
                  >
                    {displayM365Config.configured ? 'Bewerken' : 'Configureren'}
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    {displayM365Config.configured ? (
                      <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle size={16} className="mr-1.5"/>
                        Geconfigureerd
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 font-medium">
                        <XCircle size={16} className="mr-1.5"/>
                        Niet geconfigureerd
                      </span>
                    )}
                  </div>
                  {displayM365Config.configured && displayM365Config.senderEmail && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Afzender Email:</span>
                      <span className="font-medium text-gray-900">{displayM365Config.senderEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Abonnement Beheer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <CreditCard size={24} className="text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Abonnement</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bedrag:</span>
                      <span className="font-semibold text-lg text-gray-900">€25/maand</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Abonnement opzeggen?</strong><br />
                      Stuur een email naar{' '}
                      <a href="mailto:info@mijnlvs.nl" className="text-blue-600 underline font-medium">
                        info@mijnlvs.nl
                      </a>{' '}
                      om uw abonnement op te zeggen.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Systeem Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ServerCog size={24} className="text-gray-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Systeem Status</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Backend API:</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <CheckCircle size={16} className="mr-1.5"/>
                    Verbonden
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ VERWIJDERD: Cancellation modal - niet meer nodig */}

        {/* M365 Config Modal */}
        {showM365ConfigModal && mosque && (
          <M365ConfigModal
            isOpen={showM365ConfigModal}
            onClose={() => setShowM365ConfigModal(false)}
            onSubmit={handleM365ConfigSave}
            initialConfig={displayM365Config}
            isLoading={actionLoading}
            mosqueName={mosque.name || "Test Moskee"}
            mosqueId={mosque.id}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsTab;