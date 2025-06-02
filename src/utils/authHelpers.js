// src/utils/authHelpers.js

export const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) { // Iets sterker wachtwoord
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Stuurt een welkomstmail via de backend API.
// `m365ForApiCall` moet { tenantId, clientId, clientSecret, senderEmail } bevatten die nodig zijn voor de /api/send-email-m365 call.
export const sendUserWelcomeEmailViaBackend = async (
    apiCallFunction, // De `apiCall` helper
    recipientName,
    email,
    tempPassword,
    mosqueName,
    userRole, // 'teacher' of 'parent'
    m365ForApiCall // Object met { tenantId, clientId, clientSecret, senderEmail }
) => {
  const subject = userRole === 'teacher'
    ? `Welkom bij ${mosqueName} - Uw leraar account`
    : `Welkom bij ${mosqueName} - Uw ouder account`;

  // TODO: Vervang [LOGIN_URL] met de daadwerkelijke login URL van je applicatie
  const loginUrl = window.location.origin + '/login';

  const body = `Beste ${recipientName},\n\n` +
    `Er is een account voor u aangemaakt voor het leerling volgsysteem van ${mosqueName}.\n\n` +
    `🔐 Uw inloggegevens:\n` +
    `Email: ${email}\n` +
    `Tijdelijk wachtwoord: ${tempPassword}\n\n` +
    `U kunt inloggen via: ${loginUrl}\n` +
    `Het wordt aangeraden uw wachtwoord te wijzigen na uw eerste login.\n\n` +
    `Met vriendelijke groet,\n` +
    `Administratie ${mosqueName}`;

  if (!m365ForApiCall.tenantId || !m365ForApiCall.clientId || !m365ForApiCall.clientSecret || !m365ForApiCall.senderEmail) {
      console.warn("M365 credentials niet volledig voor API call, kan geen welkomstmail sturen.", m365ForApiCall);
      // Je zou hier een error kunnen gooien of een fallback tonen.
      // Voor nu, de API call zal waarschijnlijk falen als de backend de secret vereist.
      // return { success: false, error: "M365 credentials incompleet voor API.", fallback: true };
  }

  try {
    console.log(`Attempting to send welcome email to ${email} via backend API (/api/send-email-m365)`);
    const result = await apiCallFunction('/api/send-email-m365', { // Dit is het backend endpoint
      method: 'POST',
      body: JSON.stringify({
        tenantId: m365ForApiCall.tenantId,
        clientId: m365ForApiCall.clientId,
        clientSecret: m365ForApiCall.clientSecret, // Backend verwacht dit in de body
        to: email,
        subject: subject,
        body: body,
        mosqueName: mosqueName // Voor logging in backend
      })
    });

    if (result.success) {
      console.log('Welcome email sent successfully via backend API:', result.messageId);
      return { success: true, messageId: result.messageId, service: result.service };
    } else {
      console.error('Backend API /api/send-email-m365 indicated failure:', result.error);
      throw new Error(result.error || 'Email versturen mislukt (backend respons).');
    }
  } catch (error) {
    console.error('Error calling /api/send-email-m365 endpoint:', error);
    console.log('📧 FALLBACK - WELCOME EMAIL (not sent):', { to: email, subject, body });
    return { success: false, error: error.message, fallback: true };
  }
};