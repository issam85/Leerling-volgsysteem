// src/utils/authHelpers.js

export const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Stuurt een welkomstmail via de backend API.
// De backend zal de m365_client_secret uit de database halen o.b.v. mosqueIdForBackend.
// m365CredentialsForApi.clientSecret wordt hier genegeerd/niet meegestuurd voor deze flow.
export const sendUserWelcomeEmailViaBackend = async (
    apiCallFunction, // De `apiCall` helper
    recipientName,
    email,
    tempPassword,
    mosqueName,
    mosqueIdForBackend, // ID van de moskee om opgeslagen M365 config op te halen
    userRole, // 'teacher' of 'parent'
    // m365CredentialsForApi is nu minder relevant hier, tenzij je tenant/client ID ook per moskee zou opslaan
    // en die nog niet in het 'mosque' object zitten.
    // Voor nu gaan we ervan uit dat de backend de tenant/client ID ook uit de DB haalt o.b.v. mosqueId.
    // Of dat de frontend ze meegeeft (maar niet de secret).
    m365FromMosqueObject // Het mosque object uit realData, bevat m365_tenant_id, m365_client_id, m365_sender_email
) => {
  const subject = userRole === 'teacher'
    ? `Welkom bij ${mosqueName} - Uw leraar account`
    : `Welkom bij ${mosqueName} - Uw ouder account`;

  const loginUrl = window.location.origin + '/login'; // Basis login URL

  const body = `Beste ${recipientName},\n\n` +
    `Er is een account voor u aangemaakt voor het leerling volgsysteem van ${mosqueName}.\n\n` +
    `🔐 Uw inloggegevens:\n` +
    `Email: ${email}\n` +
    `Tijdelijk wachtwoord: ${tempPassword}\n\n` +
    `U kunt inloggen via: ${loginUrl}\n` +
    `Het wordt aangeraden uw wachtwoord te wijzigen na uw eerste login.\n\n` +
    `Met vriendelijke groet,\n` +
    `Administratie ${mosqueName}`;

  if (!m365FromMosqueObject?.m365_tenant_id || !m365FromMosqueObject?.m365_client_id || !m365FromMosqueObject?.m365_sender_email) {
      const errorMsg = "M365 credentials (Tenant ID, Client ID, of Sender Email) ontbreken in moskee object. Kan geen welkomstmail sturen.";
      console.error("[sendUserWelcomeEmailViaBackend]", errorMsg, m365FromMosqueObject);
      return { success: false, error: errorMsg, fallback: true };
  }

  try {
    // De backend /api/send-email-m365 zal de m365_client_secret uit de database halen
    // op basis van de meegegeven mosqueId. We sturen de secret hier NIET mee.
    const payload = {
        tenantId: m365FromMosqueObject.m365_tenant_id,
        clientId: m365FromMosqueObject.m365_client_id,
        // clientSecret: wordt NIET meegestuurd; backend haalt opgeslagen secret op
        to: email,
        subject: subject,
        body: body,
        mosqueName: mosqueName, // Voor logging
        mosqueId: mosqueIdForBackend, // BELANGRIJK voor backend om juiste config te vinden
        explicitSenderForTest: null, // Dit is geen test vanuit de modal
    };
    console.log("[sendUserWelcomeEmailViaBackend] Payload for /api/send-email-m365 (welcome email):", JSON.stringify(payload, null, 2));

    const result = await apiCallFunction('/api/send-email-m365', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (result.success) {
      console.log('[sendUserWelcomeEmailViaBackend] Welcome email reported as sent by backend API:', result.messageId);
      return { success: true, messageId: result.messageId, service: result.service };
    } else {
      console.error('[sendUserWelcomeEmailViaBackend] Backend API /api/send-email-m365 indicated failure:', result.error);
      throw new Error(result.error || 'Email versturen mislukt (backend respons).');
    }
  } catch (error) {
    console.error('[sendUserWelcomeEmailViaBackend] Error calling /api/send-email-m365 endpoint:', error);
    console.log('📧 FALLBACK - WELCOME EMAIL (not sent):', { to: email, subject, body });
    return { success: false, error: error.message, fallback: true };
  }
};