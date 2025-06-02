import React from 'react';

const Input = ({ label, id, type = 'text', value, onChange, placeholder, error, required, className = '', rows = 3, name, ...props }) => {
  const commonProps = {
    id: id || name, // Gebruik name als id als id niet gegeven is
    name: name || id,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    required: required,
    className: `input-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'} ${className}`,
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