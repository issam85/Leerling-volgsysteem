// src/utils/envValidation.js - Environment variable validation and security
const isProduction = process.env.NODE_ENV === 'production';

// Critical environment variables that must be present
const REQUIRED_ENV_VARS = {
  'REACT_APP_SUPABASE_URL': {
    required: true,
    description: 'Supabase project URL',
    validator: (value) => value && value.startsWith('https://') && value.includes('supabase.co')
  },
  'REACT_APP_SUPABASE_ANON_KEY': {
    required: true,
    description: 'Supabase anonymous key',
    validator: (value) => value && value.length > 50
  }
};

// Optional environment variables with fallbacks
const OPTIONAL_ENV_VARS = {
  'REACT_APP_API_BASE_URL': {
    required: false,
    description: 'Backend API base URL',
    fallback: 'https://moskee-backend-api-production.up.railway.app',
    validator: (value) => !value || (value.startsWith('http://') || value.startsWith('https://'))
  }
};

class EnvValidationError extends Error {
  constructor(message, missingVars = []) {
    super(message);
    this.name = 'EnvValidationError';
    this.missingVars = missingVars;
  }
}

export const validateEnvironmentVariables = () => {
  const errors = [];
  const warnings = [];
  const config = {};

  // Validate required variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, spec]) => {
    const value = process.env[key];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${key} (${spec.description})`);
      return;
    }

    if (spec.validator && !spec.validator(value)) {
      errors.push(`Invalid value for ${key}: ${spec.description}`);
      return;
    }

    config[key] = value;
  });

  // Validate optional variables and apply fallbacks
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, spec]) => {
    const value = process.env[key];
    
    if (!value) {
      if (spec.fallback) {
        config[key] = spec.fallback;
        if (!isProduction) {
          warnings.push(`Using fallback for ${key}: ${spec.fallback}`);
        }
      }
    } else {
      if (spec.validator && !spec.validator(value)) {
        warnings.push(`Invalid value for ${key}, using fallback: ${spec.fallback || 'none'}`);
        config[key] = spec.fallback || null;
      } else {
        config[key] = value;
      }
    }
  });

  // Handle validation results
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    
    if (isProduction) {
      // In production, this is critical - log and display user-friendly error
      console.error('[ENV] Critical configuration error - application cannot start');
      throw new EnvValidationError('Application configuration error', errors);
    } else {
      // In development, log detailed errors
      console.error('[ENV] Environment validation errors:', errors);
      throw new EnvValidationError(errorMessage, errors);
    }
  }

  // Log warnings in development
  if (!isProduction && warnings.length > 0) {
    console.warn('[ENV] Environment warnings:', warnings);
  }

  return {
    config,
    warnings,
    isValid: true
  };
};

export const getSecureConfig = () => {
  try {
    const { config } = validateEnvironmentVariables();
    return config;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // Return minimal safe config that won't crash the app
      return {
        REACT_APP_SUPABASE_URL: null,
        REACT_APP_SUPABASE_ANON_KEY: null,
        REACT_APP_API_BASE_URL: 'https://moskee-backend-api-production.up.railway.app'
      };
    }
    throw error;
  }
};

// Runtime health check
export const performRuntimeHealthCheck = () => {
  const issues = [];
  
  // Check if Supabase is accessible
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  if (!supabaseUrl) {
    issues.push('Supabase configuration missing');
  }

  // Check if we're in a secure context (HTTPS in production)
  if (isProduction && window.location.protocol !== 'https:') {
    issues.push('Application is not served over HTTPS in production');
  }

  // Check for mixed content issues
  if (window.location.protocol === 'https:' && process.env.REACT_APP_API_BASE_URL?.startsWith('http:')) {
    issues.push('Mixed content detected: HTTPS page with HTTP API');
  }

  return {
    healthy: issues.length === 0,
    issues
  };
};

export default {
  validateEnvironmentVariables,
  getSecureConfig,
  performRuntimeHealthCheck,
  EnvValidationError
};