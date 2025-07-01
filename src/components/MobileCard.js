// Mobile Card Component for responsive data display
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Base MobileCard component
const MobileCard = ({ children, className = '', expandable = false, expanded = false, onToggleExpand, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${expandable ? 'cursor-pointer' : ''} ${className}`}
      onClick={expandable ? onToggleExpand : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

// Header component for avatar, title, and subtitle
const MobileCardHeader = ({ avatar, title, subtitle, status, rightContent, className = '' }) => {
  return (
    <div className={`flex items-center p-4 ${className}`}>
      {avatar && (
        <div className="flex-shrink-0 mr-3">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {title}
          </h3>
          {rightContent && (
            <div className="flex-shrink-0 ml-2">
              {rightContent}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate mt-1">
            {subtitle}
          </p>
        )}
        {status && (
          <div className="mt-2">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

// Content section for field/value pairs
const MobileCardContent = ({ children, className = '' }) => {
  return (
    <div className={`px-4 pb-4 space-y-2 ${className}`}>
      {children}
    </div>
  );
};

// Individual field component
const MobileCardField = ({ icon, label, value, className = '' }) => {
  return (
    <div className={`flex items-center text-sm ${className}`}>
      {icon && (
        <div className="flex-shrink-0 mr-2 text-gray-400">
          {icon}
        </div>
      )}
      <span className="text-gray-500 mr-2">{label}:</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
};

// Actions section for buttons
const MobileCardActions = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end space-x-2 px-4 py-3 bg-gray-50 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Individual action button component
const MobileCardAction = ({ icon, label, onClick, className = '', variant = 'default', disabled = false, ...props }) => {
  const baseClasses = 'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
    primary: 'text-white bg-blue-600 border border-transparent hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'text-blue-700 bg-blue-50 border border-transparent hover:bg-blue-100 focus:ring-blue-500',
    danger: 'text-red-700 bg-red-50 border border-transparent hover:bg-red-100 focus:ring-red-500',
    success: 'text-green-700 bg-green-50 border border-transparent hover:bg-green-100 focus:ring-green-500',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </button>
  );
};

// Expandable content section
const MobileCardExpandable = ({ children, expanded = false, className = '' }) => {
  if (!expanded) return null;
  
  return (
    <div className={`border-t border-gray-200 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
};

// Expandable trigger (chevron icon)
const MobileCardExpandTrigger = ({ expanded = false, className = '' }) => {
  return (
    <div className={`flex items-center justify-center p-2 ${className}`}>
      {expanded ? (
        <ChevronUp size={16} className="text-gray-400" />
      ) : (
        <ChevronDown size={16} className="text-gray-400" />
      )}
    </div>
  );
};

// Divider component
const MobileCardDivider = ({ className = '' }) => {
  return <div className={`border-t border-gray-200 ${className}`} />;
};

// Export components
MobileCard.Header = MobileCardHeader;
MobileCard.Content = MobileCardContent;
MobileCard.Field = MobileCardField;
MobileCard.Actions = MobileCardActions;
MobileCard.Action = MobileCardAction;
MobileCard.Expandable = MobileCardExpandable;
MobileCard.ExpandTrigger = MobileCardExpandTrigger;
MobileCard.Divider = MobileCardDivider;

export default MobileCard;