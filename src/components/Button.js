import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', size = 'md', className = '', disabled = false, icon: Icon, fullWidth = false, ...props }) => {
  const baseStyles = 'font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out inline-flex items-center justify-center';

  const variantStyles = {
    primary: `bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 ${disabled ? 'bg-emerald-400 hover:bg-emerald-400 cursor-not-allowed opacity-70' : ''}`,
    secondary: `bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400 border border-gray-300 ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' : ''}`,
    danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 ${disabled ? 'bg-red-400 hover:bg-red-400 cursor-not-allowed opacity-70' : ''}`,
    ghost: `bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-emerald-500 ${disabled ? 'text-gray-400 hover:bg-transparent cursor-not-allowed opacity-70' : ''}`,
    link: `bg-transparent text-emerald-600 hover:text-emerald-700 hover:underline focus:ring-emerald-500 p-0 ${disabled ? 'text-emerald-400 hover:text-emerald-400 cursor-not-allowed opacity-70' : ''}`,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs', // Kleiner gemaakt
    md: 'px-4 py-2 text-sm',   // Kleiner gemaakt
    lg: 'px-5 py-2.5 text-base',// Kleiner gemaakt
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {Icon && <Icon className={`w-4 h-4 ${children ? (size === 'sm' ? 'mr-1.5' : 'mr-2') : ''} flex-shrink-0`} />}
      {children}
    </button>
  );
};

export default Button;