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

const validateInput = (value, type, maxLength = 1000) => {
  if (!value) return { isValid: true, sanitized: value };
  
  const stringValue = String(value);
  
  // Length validation
  if (stringValue.length > maxLength) {
    return { isValid: false, error: `Input is te lang (max ${maxLength} karakters)` };
  }
  
  // Type-specific validation
  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      return { isValid: false, error: 'Ongeldig emailadres' };
    }
  }
  
  // Sanitize and return
  return { isValid: true, sanitized: sanitizeInput(stringValue) };
};

const Input = ({ label, id, type = 'text', value, onChange, placeholder, error, required, disabled, className = '', rows = 3, name, maxLength, ...props }) => {
  
  const handleChange = (e) => {
    if (disabled) return; // Prevent change if disabled

    const inputValue = e.target.value;
    
    // Perform security validation and sanitization
    const validation = validateInput(inputValue, type, maxLength);
    
    if (!validation.isValid) {
      // You could set an error state here if needed
      console.warn('Input validation failed:', validation.error);
      return; // Don't update if validation fails
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
    maxLength: maxLength || 1000, // Default max length for security
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