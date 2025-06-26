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

  // ✅ NIEUWE STATE VOOR SUBSCRIPTION MANAGEMENT
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

  // ✅ NIEUWE FUNCTIE: Subscription info ophalen
  const fetchSubscriptionInfo = async () => {
    try {
      const response = await apiCall('/api/payments/stripe/subscription-status');
      setSubscriptionInfo(response);
      console.log('[SettingsTab] Subscription info loaded:', response);
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  // ✅ NIEUWE FUNCTIE: Cancellation email
  const handleRequestCancellation = () => {
    const subject = encodeURIComponent(`Abonnement Opzeggen - ${mosque?.name || 'MijnLVS'}`);
    const body = encodeURIComponent(`Beste MijnLVS team,

Ik wil graag mijn Professional abonnement opzeggen voor:

Organisatie: ${mosque?.name || ''}
Subdomein: ${mosque?.subdomain || ''}.mijnlvs.nl
Contact Email: ${mosque?.email || ''}
Administrator: ${mosque?.contact_committee_name || 'Niet opgegeven'}

Reden voor opzegging:
[Vul hier uw reden in]

Gewenste einddatum:
[Vul hier uw gewenste einddatum in]

Met vriendelijke groet,
${mosque?.contact_committee_name || 'Administrator'}`);

    window.open(`mailto:i.abdellaoui@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setShowCancelConfirm(false);
  };

  // Effect om form states te vullen wanneer mosque data uit context verandert
  useEffect(() => {
    if (mosque) {
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

      // ✅ NIEUW: Subscription info laden
      fetchSubscriptionInfo();
    } else {
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
    }
  }, [mosque]);

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
      <div className="space-y-8 max-w-3xl mx-auto pb-10">
        {actionLoading && <LoadingSpinner message="Bezig met opslaan..." />}
        <h2 className="page-title">Systeem Instellingen</h2>

        {formMessage.text && (
          <div className={`p-4 mb-6 rounded-md text-sm flex items-center shadow ${formMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
            {formMessage.type === 'success' ? <CheckCircle size={20} className="mr-3 flex-shrink-0"/> : <AlertCircle size={20} className="mr-3 flex-shrink-0"/>}
            {formMessage.text}
          </div>
        )}

        {/* Moskee Informatie Kaart - AANGEPAST NAAR "ALGEMENE GEGEVENS" */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center"> 
                <Building size={28} className="text-emerald-600 mr-3" /> 
                <h3 className="text-xl font-semibold text-gray-700">Algemene Gegevens</h3> 
              </div>
              <Button onClick={handleSaveMosqueDetails} variant="primary" icon={Save} size="md" disabled={actionLoading}> 
                Opslaan 
              </Button>
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

        {/* NIEUWE KAART VOOR CONTACTPERSONEN */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center"> 
                <Users size={28} className="text-sky-600 mr-3" /> 
                <h3 className="text-xl font-semibold text-gray-700">Contactpersonen</h3> 
              </div>
              <Button onClick={handleSaveMosqueDetails} variant="primary" icon={Save} size="md" disabled={actionLoading}> 
                Opslaan 
              </Button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Deze gegevens worden getoond op het ouder-dashboard, zodat zij weten met wie ze contact moeten opnemen.
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

        {/* ✅ NIEUWE KAART: ABONNEMENT BEHEER */}
        {subscriptionInfo && (
          <div className="card">
            <div className="flex items-center mb-6"> 
              <CreditCard size={28} className="text-blue-600 mr-3" /> 
              <h3 className="text-xl font-semibold text-gray-700">Abonnement Beheer</h3> 
            </div>
            
            <div className="space-y-4">
              {/* Subscription Status */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="font-semibold">
                      {subscriptionInfo.subscription_status === 'active' && (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle size={16} className="mr-1"/>
                          Professional Actief
                        </span>
                      )}
                      {subscriptionInfo.subscription_status === 'trialing' && (
                        <span className="text-blue-600 flex items-center">
                          <AlertCircle size={16} className="mr-1"/>
                          Proefperiode
                        </span>
                      )}
                      {subscriptionInfo.subscription_status === 'canceled' && (
                        <span className="text-red-600 flex items-center">
                          <XCircle size={16} className="mr-1"/>
                          Geannuleerd
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {subscriptionInfo.subscription_details && (
                    <div>
                      <span className="text-sm text-gray-600">Volgende Betaling:</span>
                      <div className="font-medium">
                        {new Date(subscriptionInfo.subscription_details.current_period_end).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  )}
                </div>
                
                {subscriptionInfo.subscription_details && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Bedrag:</span>
                    <span className="font-semibold ml-2">
                      €{subscriptionInfo.subscription_details.amount}/maand
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {subscriptionInfo.has_active_subscription && (
                  <>
                    {/* Stripe Portal Button */}
                    <Button
                      onClick={async () => {
                        try {
                          setActionLoading(true);
                          const portalResponse = await apiCall('/api/payments/stripe/create-portal-session', {
                            method: 'POST'
                          });
                          if (portalResponse.url) {
                            window.open(portalResponse.url, '_blank');
                          }
                        } catch (error) {
                          setFormMessage({ 
                            type: 'error', 
                            text: 'Kon billing portal niet openen. Probeer het later opnieuw.' 
                          });
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      variant="secondary"
                      icon={ExternalLink}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      Beheer Betaling & Facturen
                    </Button>

                    {/* Cancel Request Button */}
                    <Button
                      onClick={() => setShowCancelConfirm(true)}
                      variant="outline"
                      icon={AlertTriangle}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Abonnement Opzeggen
                    </Button>
                  </>
                )}
                
                {subscriptionInfo.subscription_status === 'trialing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-800 font-medium">Proefperiode Actief</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          U bent momenteel in de 14-dagen proefperiode. Na de proefperiode wordt automatisch uw Professional abonnement gestart.
                        </p>
                        {subscriptionInfo.trial_ends_at && (
                          <p className="text-blue-600 text-xs mt-2 font-medium">
                            Proefperiode eindigt: {new Date(subscriptionInfo.trial_ends_at).toLocaleDateString('nl-NL')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bijdrage Instellingen Kaart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center"> 
                <SlidersHorizontal size={28} className="text-purple-600 mr-3" /> 
                <h3 className="text-xl font-semibold text-gray-700">Bijdrage per Aantal Kinderen (€)</h3> 
              </div>
              <Button onClick={handleSaveContributionSettings} variant="primary" icon={Save} size="md" disabled={actionLoading}> 
                Instellingen Opslaan 
              </Button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Definieer hier de jaarlijkse bijdrage. Deze bedragen worden gebruikt om automatisch de 'Te Betalen Bijdrage' voor ouders te berekenen bij het toevoegen/verwijderen van leerlingen.
          </p>
          <div className="space-y-3">
            <Input label="Bijdrage voor 1 Kind" name="contribution_1_child" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_1_child} onChange={handleContributionChange} />
            <Input label="Bijdrage voor 2 Kinderen" name="contribution_2_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_2_children} onChange={handleContributionChange} />
            <Input label="Bijdrage voor 3 Kinderen" name="contribution_3_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_3_children} onChange={handleContributionChange} />
            <Input label="Bijdrage voor 4 Kinderen" name="contribution_4_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_4_children} onChange={handleContributionChange} />
            <Input label="Bijdrage voor 5+ Kinderen" name="contribution_5_plus_children" type="number" min="0" step="0.01" value={contributionSettingsForm.contribution_5_plus_children} onChange={handleContributionChange} />
          </div>
        </div>

        {/* Microsoft 365 Email Kaart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center"> 
                <Mail size={28} className="text-blue-600 mr-3" /> 
                <h3 className="text-xl font-semibold text-gray-700">Microsoft 365 Email</h3> 
              </div>
              <Button onClick={() => setShowM365ConfigModal(true)} variant="secondary" icon={Edit} size="md" disabled={actionLoading}> 
                {displayM365Config.configured ? 'Configuratie Bewerken' : 'Configureren'} 
              </Button>
          </div>
          <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> 
                <span>Status:</span> 
                {displayM365Config.configured ? 
                  <span className="flex items-center font-semibold text-green-600">
                    <CheckCircle size={16} className="mr-1.5"/>Geconfigureerd
                  </span> : 
                  <span className="flex items-center font-semibold text-red-600">
                    <XCircle size={16} className="mr-1.5"/>Niet geconfigureerd
                  </span>
                } 
              </div>
              {displayM365Config.configured && displayM365Config.senderEmail && ( 
                <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> 
                  <span>Afzender Email (M365):</span> 
                  <span className="font-medium text-gray-700">{displayM365Config.senderEmail}</span> 
                </div> 
              )}
          </div>
        </div>

        {/* Systeem Status Kaart */}
        <div className="card">
          <div className="flex items-center mb-4"> 
            <ServerCog size={28} className="text-gray-600 mr-3" /> 
            <h3 className="text-xl font-semibold text-gray-700">Systeem Status</h3> 
          </div>
          <div className="space-y-2 text-sm"> 
            <div className="flex justify-between items-center p-3 rounded bg-gray-50 border"> 
              <span>Backend API:</span> 
              <span className="flex items-center font-semibold text-green-600">
                <CheckCircle size={16} className="mr-1.5"/>Verbonden
              </span> 
            </div> 
          </div>
        </div>

        {/* ✅ CANCELLATION CONFIRMATION MODAL */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Abonnement Opzeggen
                </h3>
                <p className="text-gray-600 text-sm">
                  U staat op het punt een email te versturen om uw Professional abonnement op te zeggen.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-yellow-800 font-medium">Belangrijk om te weten:</h4>
                    <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                      <li>• Uw account blijft actief tot het einde van de betaalperiode</li>
                      <li>• Al uw gegevens blijven bewaard</li>
                      <li>• U kunt altijd weer upgraden naar Professional</li>
                      <li>• Na opzegging: max 10 leerlingen, 2 leraren</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCancelConfirm(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleRequestCancellation}
                  variant="primary"
                  icon={ExternalLink}
                  className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                >
                  Verstuur Email
                </Button>
              </div>
            </div>
          </div>
        )}

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