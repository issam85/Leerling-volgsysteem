import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      onClick={onClose} // Klik buiten de modal om te sluiten
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modalFadeIn`}
        onClick={(e) => e.stopPropagation()} // Voorkom sluiten bij klikken binnen de modal
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title && (
          <div className="p-6 border-b flex justify-between items-center">
            <h3 id="modal-title" className="text-xl font-semibold text-gray-800">{title}</h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Sluiten"
            >
                ×
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && (
          <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
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