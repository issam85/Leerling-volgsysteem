import React from 'react';

// Security utility functions
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Basic XSS prevention - remove script tags and javascript: protocols
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
};

const validateInput = (value, type, maxLength = 5000, validateOnChange = false) => {
  if (!value) return { isValid: true, sanitized: value };
  
  const stringValue = String(value);
  
  // Length validation - alleen waarschuwen, niet blokkeren
  if (stringValue.length > maxLength) {
    return { isValid: false, error: `Input is te lang (max ${maxLength} karakters)` };
  }
  
  // Check for serious security issues
  if (stringValue.includes('<script') || stringValue.includes('javascript:')) {
    return { isValid: false, error: 'Beveiligingsprobleem gedetecteerd' };
  }
  
  // Type-specific validation - alleen als validateOnChange true is
  if (validateOnChange && type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Alleen valideren als het veld niet leeg is en er een @ in zit
    if (stringValue.includes('@') && !emailRegex.test(stringValue)) {
      return { isValid: false, error: 'Ongeldig emailadres' };
    }
  }
  
  // Sanitize and return
  return { isValid: true, sanitized: sanitizeInput(stringValue) };
};

const Input = ({ label, id, type = 'text', value, onChange, placeholder, error, required, disabled, className = '', rows = 3, name, maxLength, validateOnChange = false, ...props }) => {
  
  const handleChange = (e) => {
    if (disabled) return; // Prevent change if disabled

    const inputValue = e.target.value;
    
    // Perform security validation and sanitization
    const validation = validateInput(inputValue, type, maxLength, validateOnChange);
    
    if (!validation.isValid) {
      // Log warning but still allow input for basic typing
      console.warn('Input validation failed:', validation.error);
      
      // Only block if it's a serious security issue, not basic validation
      if (validation.error.includes('script') || validation.error.includes('javascript')) {
        return; // Block malicious input
      }
      
      // For other validation errors (like length), allow input but don't sanitize
      if (onChange) {
        onChange(e); // Use original event
      }
      return;
    }
    
    // Create new event with sanitized value
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: validation.sanitized
      }
    };
    
    if (onChange) {
      onChange(sanitizedEvent);
    }
  };

  const commonProps = {
    id: id || name, // Gebruik name als id als id niet gegeven is
    name: name || id,
    value: value || '',
    onChange: handleChange,
    placeholder: placeholder,
    required: required,
    disabled: disabled,
    maxLength: maxLength || 5000, // Default max length for security
    className: `input-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`,
    ...props,
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={commonProps.id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea {...commonProps} rows={rows}></textarea>
      ) : (
        <input type={type} {...commonProps} />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;