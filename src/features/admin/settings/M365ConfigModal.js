// src/features/admin/settings/M365ConfigModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { apiCall } from '../../../services/api';

const M365ConfigModal = ({ isOpen, onClose, onSubmit, initialConfig, isLoading, mosqueName, mosqueId }) => {
  const [configForm, setConfigForm] = useState({
    tenantId: '', clientId: '', clientSecret: '', senderEmail: ''
  });
  const [formValidationError, setFormValidationError] = useState('');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState({ type: '', message: '' });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log("[M365Modal] Opening with initialConfig:", initialConfig);
      setConfigForm({
        tenantId: initialConfig?.tenantId || '',
        clientId: initialConfig?.clientId || '',
        senderEmail: initialConfig?.senderEmail || '',
        // BELANGRIJK: De clientSecret wordt ALTIJD gereset naar een lege string.
        // De gebruiker moet deze expliciet invoeren als ze hem willen wijzigen.
        clientSecret: '', 
      });
      // De rest blijft hetzelfde...
      setTestEmailAddress(initialConfig?.senderEmail || `admin@${(mosqueName || 'jouwmoskee').toLowerCase().replace(/\s+/g, '')}.com`);
      setFormValidationError('');
      setTestEmailStatus({ type: '', message: '' });
    }
  }, [isOpen, initialConfig, mosqueName]);

  const handleChange = (e) => {
    setConfigForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    if (!configForm.tenantId.trim() || !configForm.clientId.trim() || !configForm.senderEmail.trim()) {
      setFormValidationError('Tenant ID, Client ID en Afzender Email zijn verplicht.'); return;
    }
    if (!initialConfig?.configured && !configForm.clientSecret.trim()) {
      setFormValidationError('Client Secret is verplicht voor de eerste configuratie.'); return;
    }
    if (!/\S+@\S+\.\S+/.test(configForm.senderEmail.trim())) {
      setFormValidationError('Voer een geldig afzender emailadres in.'); return;
    }
    const success = await onSubmit(configForm);
    // Parent (SettingsTab) handelt sluiten af bij succes
  };

  const handleTestEmail = async () => {
    setTestEmailStatus({ type: '', message: '' });
    if (!testEmailAddress.trim() || !/\S+@\S+\.\S+/.test(testEmailAddress.trim())) {
      setTestEmailStatus({ type: 'error', message: 'Voer een geldig test emailadres in.' }); return;
    }
    if (!configForm.tenantId || !configForm.clientId || !configForm.senderEmail) {
      setTestEmailStatus({ type: 'error', message: 'Vul eerst Tenant ID, Client ID en Afzender Email in de configuratievelden.'}); return;
    }
    if (!initialConfig?.configured && !configForm.clientSecret.trim()) {
      setTestEmailStatus({ type: 'error', message: 'Client Secret (uit formulier) is vereist voor de eerste test als M365 nog niet geconfigureerd is in de database.' });
      return;
    }
    setIsTesting(true);
    try {
      const payloadForTest = {
        tenantId: configForm.tenantId,
        clientId: configForm.clientId,
        clientSecret: configForm.clientSecret, // Stuur de (mogelijk lege) secret uit het formulier mee
        to: testEmailAddress,
        subject: `🧪 Test Email - ${mosqueName} LVS M365 Configuratie`,
        body: `Beste beheerder,\n\nDit is een test email van het ${mosqueName} Leerling Volgsysteem om de Microsoft 365 emailconfiguratie te verifiëren.\n\nAls u deze email ontvangt, werkt de configuratie correct.\nAfzender die voor deze test is gebruikt (of zou moeten zijn): ${configForm.senderEmail}\n\nMet vriendelijke groet,\nHet Leerling Volgsysteem`,
        mosqueName: mosqueName,
        mosqueId: mosqueId,
        explicitSenderForTest: configForm.senderEmail // STUUR DIT MEE
      };
      console.log("[M365Modal] PAYLOAD FOR TEST EMAIL:", JSON.stringify(payloadForTest, null, 2)); // DEBUG

      const result = await apiCall(`/api/send-email-m365`, {
        method: 'POST',
        body: JSON.stringify(payloadForTest)
      });

      if (result.success) {
        setTestEmailStatus({ type: 'success', message: `Test email succesvol verzonden naar ${testEmailAddress} via ${result.service || 'Microsoft Graph'}!` });
      } else {
        throw new Error(result.error || 'Test email versturen mislukt (backend respons).');
      }
    } catch (err) {
      console.error("Test email error in M365ConfigModal:", err);
      setTestEmailStatus({ type: 'error', message: `Test mislukt: ${err.message}` });
    }
    setIsTesting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Microsoft 365 Email Configuratie"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading || isTesting}>Annuleren</Button>
          <Button variant="primary" type="submit" form="m365ConfigForm" disabled={isLoading || isTesting}>
            {isLoading ? "Opslaan..." : "Configuratie Opslaan"}
          </Button>
        </>
      }
    >
      <form id="m365ConfigForm" onSubmit={handleSubmit} className="space-y-5">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <h4 className="font-semibold mb-1">Instructies:</h4>
            <ol className="list-decimal list-inside space-y-0.5">
                <li>Ga naar <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">Azure Portal</a> → Microsoft Entra ID → App registrations.</li>
                <li>Maak een nieuwe registratie of selecteer een bestaande.</li>
                <li>Noteer de <strong>Application (Client) ID</strong> en <strong>Directory (Tenant) ID</strong>.</li>
                <li>Ga naar "Certificates & secrets" → "Client secrets" → "New client secret". Kopieer de <strong>Value</strong> (dit is uw Client Secret).</li>
                <li>Ga naar "API permissions" → "Add a permission" → "Microsoft Graph" → "Application permissions".</li>
                <li>Zoek en selecteer <strong>Mail.Send</strong>. Klik "Add permissions".</li>
                <li>Klik "Grant admin consent for [Your Tenant]".</li>
                <li>Vul onderstaande velden in. De Client Secret wordt opgeslagen bij de eerste configuratie of als u het veld expliciet invult om het te wijzigen.</li>
            </ol>
        </div>

        <Input label="Microsoft Entra Directory (Tenant) ID *" name="tenantId" value={configForm.tenantId} onChange={handleChange} required />
        <Input label="Application (Client) ID *" name="clientId" value={configForm.clientId} onChange={handleChange} required />
        <Input label="Client Secret Value *" name="clientSecret" type="password" value={configForm.clientSecret} onChange={handleChange} placeholder={initialConfig?.configured ? "Laat leeg om huidige secret te behouden" : "Kopieer 'Value' van nieuwe secret"}/>
        <Input label="Afzender Emailadres (Vanuit M365) *" name="senderEmail" type="email" value={configForm.senderEmail} onChange={handleChange} placeholder="bijv. noreply@uwdomein.com" required />

        {formValidationError && <p className="text-red-600 bg-red-100 p-2 rounded-md text-sm">{formValidationError}</p>}
        
        <div className="pt-5 border-t mt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Test Email Versturen</h4>
            <p className="text-xs text-gray-500 mb-2">Sla eerst de configuratie op als u wijzigingen heeft gemaakt voordat u test. Als de Client Secret hierboven leeg is, zal de test proberen de reeds opgeslagen secret te gebruiken (indien M365 al geconfigureerd was).</p>
            <div className="flex flex-col sm:flex-row items-end gap-2">
                <Input label="Test Ontvanger Email" name="testEmailAddress" type="email" value={testEmailAddress} onChange={(e) => setTestEmailAddress(e.target.value)} placeholder="uw-email@example.com" className="flex-grow"/>
                <Button onClick={handleTestEmail} variant="secondary" size="md" disabled={isTesting || isLoading || !configForm.tenantId || !configForm.clientId || !configForm.senderEmail} className="w-full sm:w-auto mt-2 sm:mt-0">
                    {isTesting ? "Testen..." : "Verstuur Test Email"}
                </Button>
            </div>
            {testEmailStatus.message && (
                <p className={`text-sm mt-2 p-2.5 rounded-md ${testEmailStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {testEmailStatus.message}
                </p>
            )}
        </div>
      </form>
    </Modal>
  );
};

export default M365ConfigModal;