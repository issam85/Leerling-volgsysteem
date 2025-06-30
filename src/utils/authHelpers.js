// src/utils/authHelpers.js

// Strong password validation
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Wachtwoord moet minimaal 8 karakters lang zijn');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één hoofdletter bevatten');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één kleine letter bevatten');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één cijfer bevatten');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Wachtwoord moet minimaal één speciaal teken bevatten');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /123456/, /password/, /admin/, /qwerty/, /abc123/,
    /111111/, /000000/, /letmein/, /welcome/
  ];
  
  if (weakPatterns.some(pattern => pattern.test(password.toLowerCase()))) {
    errors.push('Wachtwoord mag geen veelgebruikte zwakke patronen bevatten');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    strength: calculatePasswordStrength(password)
  };
};

const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

export const generateTempPassword = () => {
  // Generate a stronger temporary password with guaranteed character types
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789'; // Exclude 0, 1 to avoid confusion
  const symbols = '!@#$%^&*';
  
  let password = '';
  
  // Ensure at least one character from each type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 4; i < 14; i++) { // 14 character total length
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
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