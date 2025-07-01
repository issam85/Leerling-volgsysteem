import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', mobileFullScreen = false }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  // Mobile full-screen logic
  const modalClasses = mobileFullScreen 
    ? 'bg-white w-full h-full md:rounded-xl md:shadow-xl md:max-h-[90vh] md:w-auto md:max-w-2xl flex flex-col transform transition-all duration-300 md:scale-95 md:opacity-0 md:animate-modalFadeIn'
    : `bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modalFadeIn`;

  const containerClasses = mobileFullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 md:flex md:items-center md:justify-center md:p-4 z-50 transition-opacity duration-300'
    : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300';

  return (
    <div
      className={containerClasses}
      onClick={mobileFullScreen ? undefined : onClose} // Don't close on mobile full-screen
    >
      <div
        className={modalClasses}
        onClick={(e) => e.stopPropagation()} // Voorkom sluiten bij klikken binnen de modal
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title && (
          <div className="p-4 md:p-6 border-b flex justify-between items-center flex-shrink-0">
            <h3 id="modal-title" className="text-lg md:text-xl font-semibold text-gray-800 truncate pr-4">{title}</h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 flex-shrink-0"
                aria-label="Sluiten"
            >
                ×
            </button>
          </div>
        )}
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && (
          <div className="p-4 md:p-6 border-t bg-gray-50 md:rounded-b-xl flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes modalFadeIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalFadeIn {
          animation: modalFadeIn 0.3s forwards;
        }
      `}</style>
    </div>
  );
};
export default Modal;