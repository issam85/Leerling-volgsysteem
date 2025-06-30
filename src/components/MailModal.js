// src/components/MailModal.js
import React, { useState, useEffect } from 'react';
import Button from './Button'; // Zorg dat pad klopt
import { Send, X } from 'lucide-react';

const MailModal = ({ isOpen, onClose, onSend, isLoading, title, recipientInfo }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSubject('');
      setBody('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      alert('Onderwerp en bericht zijn verplicht.');
      return;
    }
    onSend({ subject: subject.trim(), body: body.trim() });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyPress}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={20} /><span className="sr-only">Sluiten</span>
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {recipientInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Aan:</strong> {recipientInfo}
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onderwerp *</label>
            <input 
              type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Onderwerp van uw email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
              disabled={isLoading} maxLength={200}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bericht *</label>
            <textarea 
              value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Typ hier uw bericht..."
              className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 resize-none disabled:bg-gray-100"
              disabled={isLoading} maxLength={2000}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button onClick={onClose} variant="secondary" disabled={isLoading}>Annuleren</Button>
          <Button onClick={handleSend} icon={Send} disabled={isLoading || !subject.trim() || !body.trim()}>
            {isLoading ? 'Versturen...' : 'Versturen'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MailModal;