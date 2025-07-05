import React from 'react';

const Input = ({ label, id, type = 'text', value, onChange, placeholder, error, required, disabled, className = '', rows = 3, name, maxLength, ...props }) => {
  
  const handleChange = (e) => {
    if (disabled) return;
    
    if (onChange) {
      onChange(e);
    }
  };

  const commonProps = {
    id: id || name,
    name: name || id,
    value: value || '',
    onChange: handleChange,
    placeholder: placeholder,
    required: required,
    disabled: disabled,
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