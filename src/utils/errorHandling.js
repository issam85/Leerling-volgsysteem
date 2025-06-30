// src/utils/errorHandling.js - Secure error handling and sanitization
const isProduction = process.env.NODE_ENV === 'production';

// Sensitive information patterns that should be redacted
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
  /\b(?:password|token|key|secret|api[_-]?key)\b.*?[:=]\s*['"]?([^'"\s,}]+)/gi, // API keys/passwords
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, // Bearer tokens
  /\b[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\b/gi, // UUIDs (potentially sensitive)
];

// Error messages that shouldn't be shown to users in production
const TECHNICAL_ERROR_INDICATORS = [
  'stack trace',
  'sql error',
  'database error',
  'connection refused',
  'timeout',
  'internal server error',
  'null pointer',
  'undefined is not a function',
  'cannot read property',
  'network error',
  'cors error'
];

// User-friendly error messages for production
const USER_FRIENDLY_ERRORS = {
  network: 'Er is een verbindingsprobleem. Controleer uw internetverbinding en probeer opnieuw.',
  authentication: 'Uw sessie is verlopen. Log opnieuw in om door te gaan.',
  authorization: 'U heeft geen toestemming voor deze actie.',
  validation: 'De ingevoerde gegevens zijn niet geldig. Controleer uw invoer.',
  server: 'Er is een probleem opgetreden op de server. Probeer het later opnieuw.',
  timeout: 'De aanvraag duurt te lang. Probeer het opnieuw.',
  generic: 'Er is een onverwachte fout opgetreden. Probeer het later opnieuw.'
};

/**
 * Sanitize error messages to remove sensitive information
 */
export const sanitizeError = (error, context = '') => {
  if (!error) return null;

  let message = typeof error === 'string' ? error : (error.message || error.toString());
  
  // Remove sensitive patterns
  SENSITIVE_PATTERNS.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });

  // In production, replace technical errors with user-friendly messages
  if (isProduction) {
    const lowerMessage = message.toLowerCase();
    
    if (TECHNICAL_ERROR_INDICATORS.some(indicator => lowerMessage.includes(indicator))) {
      // Categorize error type and return appropriate user-friendly message
      if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
        return USER_FRIENDLY_ERRORS.network;
      }
      if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized')) {
        return USER_FRIENDLY_ERRORS.authentication;
      }
      if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission')) {
        return USER_FRIENDLY_ERRORS.authorization;
      }
      if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
        return USER_FRIENDLY_ERRORS.validation;
      }
      if (lowerMessage.includes('timeout')) {
        return USER_FRIENDLY_ERRORS.timeout;
      }
      if (lowerMessage.includes('server') || lowerMessage.includes('internal')) {
        return USER_FRIENDLY_ERRORS.server;
      }
      
      return USER_FRIENDLY_ERRORS.generic;
    }
  }

  return message;
};

/**
 * Log errors securely with context
 */
export const logError = (error, context = '', additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: sanitizeError(error),
    ...additionalInfo
  };

  if (!isProduction) {
    // In development, log full error details
    console.error(`[ERROR] ${context}:`, error);
    console.error('[ERROR] Additional info:', additionalInfo);
  } else {
    // In production, log sanitized version
    console.error('[ERROR]', errorInfo);
  }

  // Could integrate with external error tracking service here
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Handle API errors with proper sanitization
 */
export const handleApiError = (error, context = '') => {
  const sanitizedMessage = sanitizeError(error, context);
  logError(error, `API Error - ${context}`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText
  });

  return {
    message: sanitizedMessage,
    isRetryable: isRetryableError(error),
    category: categorizeError(error)
  };
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error) => {
  if (!error.response) return true; // Network errors are generally retryable
  
  const status = error.response.status;
  // Retry on server errors (5xx) and some client errors
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Categorize errors for better handling
 */
const categorizeError = (error) => {
  if (!error.response) return 'network';
  
  const status = error.response.status;
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status >= 400 && status < 500) return 'client';
  if (status >= 500) return 'server';
  
  return 'unknown';
};

/**
 * Create a secure error response for APIs
 */
export const createErrorResponse = (error, defaultMessage = 'Er is een fout opgetreden') => {
  const sanitized = sanitizeError(error);
  
  return {
    success: false,
    error: sanitized || defaultMessage,
    timestamp: new Date().toISOString(),
    // Don't include stack traces or detailed info in production
    ...(isProduction ? {} : { originalError: error.toString() })
  };
};

/**
 * Global error handler for unhandled errors
 */
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
    event.preventDefault(); // Prevent default browser handling
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    logError(event.error, 'JavaScript Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};

export default {
  sanitizeError,
  logError,
  handleApiError,
  createErrorResponse,
  setupGlobalErrorHandling,
  USER_FRIENDLY_ERRORS
};