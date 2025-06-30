// src/features/admin/settings/M365ConfigModal.js - VOLLEDIG GECORRIGEERD
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
      // Set default test email address
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
    
    // Validation checks
    if (!configForm.tenantId.trim() || !configForm.clientId.trim() || !configForm.senderEmail.trim()) {
      setFormValidationError('Tenant ID, Client ID en Afzender Email zijn verplicht.'); 
      return;
    }
    if (!initialConfig?.configured && !configForm.clientSecret.trim()) {
      setFormValidationError('Client Secret is verplicht voor de eerste configuratie.'); 
      return;
    }
    if (!/\S+@\S+\.\S+/.test(configForm.senderEmail.trim())) {
      setFormValidationError('Voer een geldig afzender emailadres in.'); 
      return;
    }
    
    const success = await onSubmit(configForm);
    // Parent (SettingsTab) handelt sluiten af bij succes
  };

  const handleTestEmail = async () => {
    setTestEmailStatus({ type: '', message: '' });
    
    // Validation checks for test email
    if (!testEmailAddress.trim() || !/\S+@\S+\.\S+/.test(testEmailAddress.trim())) {
      setTestEmailStatus({ type: 'error', message: 'Voer een geldig test emailadres in.' }); 
      return;
    }
    if (!configForm.tenantId || !configForm.clientId || !configForm.senderEmail) {
      setTestEmailStatus({ type: 'error', message: 'Vul eerst Tenant ID, Client ID en Afzender Email in de configuratievelden.'}); 
      return;
    }
    if (!initialConfig?.configured && !configForm.clientSecret.trim()) {
      setTestEmailStatus({ type: 'error', message: 'Client Secret (uit formulier) is vereist voor de eerste test als M365 nog niet geconfigureerd is in de database.' });
      return;
    }
    
    setIsTesting(true);
    try {
      const payloadForTest = {
        // ✅ AANGEPAST: Gebruik de parameter namen die de backend verwacht
        tenantId: configForm.tenantId,
        clientId: configForm.clientId,
        clientSecret: configForm.clientSecret, // Stuur de (mogelijk lege) secret uit het formulier mee
        to: testEmailAddress,
        subject: `🧪 Test Email - ${mosqueName} LVS M365 Configuratie`,
        body: `
          <h2>Test Email - ${mosqueName} Leerling Volgsysteem</h2>
          <p>Beste beheerder,</p>
          <p>Dit is een test email van het <strong>${mosqueName}</strong> Leerling Volgsysteem om de Microsoft 365 emailconfiguratie te verifiëren.</p>
          <p>Als u deze email ontvangt, werkt de configuratie correct!</p>
          <hr>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Afzender gebruikt voor deze test: <code>${configForm.senderEmail}</code></li>
            <li>Test uitgevoerd op: ${new Date().toLocaleString('nl-NL')}</li>
            <li>Systeem: ${mosqueName} LVS</li>
          </ul>
          <hr>
          <p>Met vriendelijke groet,<br>Het Leerling Volgsysteem</p>
        `,
        mosqueName: mosqueName,
        mosqueId: mosqueId,
        senderEmail: configForm.senderEmail // ✅ AANGEPAST: gebruik senderEmail in plaats van explicitSenderForTest
      };
      
      console.log("[M365Modal] PAYLOAD FOR TEST EMAIL:", JSON.stringify(payloadForTest, null, 2));

      // ✅ GECORRIGEERD: Gebruik het juiste backend endpoint
      const result = await apiCall(`/api/email/test-m365`, {
        method: 'POST',
        body: JSON.stringify(payloadForTest)
      });

      if (result.success) {
        setTestEmailStatus({ 
          type: 'success', 
          message: `Test email succesvol verzonden naar ${testEmailAddress} via ${result.service || 'Microsoft Graph'}!` 
        });
      } else {
        throw new Error(result.error || 'Test email versturen mislukt (backend respons).');
      }
    } catch (err) {
      console.error("Test email error in M365ConfigModal:", err);
      
      // Betere error messages voor gebruiker
      let userMessage = `Test mislukt: ${err.message}`;
      
      if (err.message?.includes('404') || err.message?.includes('Route not found')) {
        userMessage = 'Test mislukt: Email service niet beschikbaar. Neem contact op met de beheerder.';
      } else if (err.message?.includes('401') || err.message?.includes('Authentication failed')) {
        userMessage = 'Test mislukt: Authenticatie gefaald. Controleer Tenant ID, Client ID en Client Secret.';
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        userMessage = 'Test mislukt: Geen toestemming. Controleer of Mail.Send rechten zijn toegekend en admin consent is gegeven.';
      } else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        userMessage = 'Test mislukt: Netwerkfout. Controleer internetverbinding en probeer opnieuw.';
      }
      
      setTestEmailStatus({ type: 'error', message: userMessage });
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
          <Button variant="ghost" onClick={onClose} disabled={isLoading || isTesting}>
            Annuleren
          </Button>
          <Button variant="primary" type="submit" form="m365ConfigForm" disabled={isLoading || isTesting}>
            {isLoading ? "Opslaan..." : "Configuratie Opslaan"}
          </Button>
        </>
      }
    >
      <form id="m365ConfigForm" onSubmit={handleSubmit} className="space-y-5">
        {/* Instructies */}
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

        {/* Configuration Form Fields */}
        <Input 
          label="Microsoft Entra Directory (Tenant) ID *" 
          name="tenantId" 
          value={configForm.tenantId} 
          onChange={handleChange} 
          placeholder="a3d49557-3f9e-4e22-9de..."
          required 
        />
        
        <Input 
          label="Application (Client) ID *" 
          name="clientId" 
          value={configForm.clientId} 
          onChange={handleChange} 
          placeholder="b81ac785-bb0f-4e4e-924..."
          required 
        />
        
        <Input 
          label="Client Secret Value *" 
          name="clientSecret" 
          type="password" 
          value={configForm.clientSecret} 
          onChange={handleChange} 
          placeholder={initialConfig?.configured ? "Laat leeg om huidige secret te behouden" : "Kopieer 'Value' van nieuwe secret"}
        />
        
        <Input 
          label="Afzender Emailadres (Vanuit M365) *" 
          name="senderEmail" 
          type="email" 
          value={configForm.senderEmail} 
          onChange={handleChange} 
          placeholder="bijv. noreply@uwdomein.com" 
          required 
        />

        {/* Form Validation Error */}
        {formValidationError && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800 text-sm font-medium">{formValidationError}</p>
          </div>
        )}
        
        {/* Test Email Section */}
        <div className="pt-5 border-t mt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Test Email Versturen</h4>
            <p className="text-xs text-gray-500 mb-4">
              Sla eerst de configuratie op als u wijzigingen heeft gemaakt voordat u test. 
              Als de Client Secret hierboven leeg is, zal de test proberen de reeds opgeslagen secret te gebruiken 
              (indien M365 al geconfigureerd was).
            </p>
            
            <div className="flex flex-col sm:flex-row items-end gap-2">
                <Input 
                  label="Test Ontvanger Email" 
                  name="testEmailAddress" 
                  type="email" 
                  value={testEmailAddress} 
                  onChange={(e) => setTestEmailAddress(e.target.value)} 
                  placeholder="uw-email@example.com" 
                  className="flex-grow"
                />
                <Button 
                  onClick={handleTestEmail} 
                  variant="secondary" 
                  size="md" 
                  disabled={isTesting || isLoading || !configForm.tenantId || !configForm.clientId || !configForm.senderEmail} 
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                >
                    {isTesting ? "Testen..." : "Verstuur Test Email"}
                </Button>
            </div>
            
            {/* Test Email Status */}
            {testEmailStatus.message && (
                <div className={`mt-3 p-3 rounded-md border text-sm ${
                  testEmailStatus.type === 'success' 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}>
                    <div className="flex items-start">
                      <span className={`inline-block w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                        testEmailStatus.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                      }`}></span>
                      <span>{testEmailStatus.message}</span>
                    </div>
                </div>
            )}
        </div>
      </form>
    </Modal>
  );
};

export default M365ConfigModal;