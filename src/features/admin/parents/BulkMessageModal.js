// src/features/admin/parents/BulkMessageModal.js
import React, { useState } from 'react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { X, Send, Users, AlertCircle } from 'lucide-react';

const BulkMessageModal = ({
  isOpen,
  onClose,
  onSubmit,
  totalParents,
  isLoading,
  modalError
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validatie
    const newErrors = {};
    if (!formData.subject.trim()) {
      newErrors.subject = 'Onderwerp is verplicht';
    }
    if (!formData.body.trim()) {
      newErrors.body = 'Bericht is verplicht';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const success = await onSubmit(formData);

    if (success) {
      // Reset form bij succes
      setFormData({ subject: '', body: '' });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error voor dit veld
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ subject: '', body: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Bericht naar alle ouders
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Dit bericht wordt verstuurd naar alle {totalParents} ouders
              </p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Waarschuwing */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Let op: Bulk bericht naar alle ouders
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Dit bericht wordt verstuurd naar alle {totalParents} geregistreerde ouders in het systeem.
                  Controleer uw bericht zorgvuldig voordat u verzendt.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
              <AlertCircle size={20} className="mr-2" />
              {modalError}
            </div>
          )}

          {/* Subject Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Onderwerp *
            </label>
            <Input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Bijv: Belangrijke mededeling van Al-Hijra Onderwijs"
              error={errors.subject}
              disabled={isLoading}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.subject.length}/200 karakters
            </p>
          </div>

          {/* Body Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bericht *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => handleChange('body', e.target.value)}
              placeholder="Typ hier uw bericht voor alle ouders...

Voorbeelden:
- Mededelingen over lesrooster wijzigingen
- Informatie over evenementen
- Belangrijke berichten van de school"
              className={`w-full px-3 py-2 border rounded-md min-h-32 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-vertical ${
                errors.body
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              } ${isLoading ? 'bg-gray-50' : ''}`}
              disabled={isLoading}
              maxLength={2000}
            />
            {errors.body && (
              <p className="text-red-600 text-sm mt-1">{errors.body}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.body.length}/2000 karakters
            </p>
          </div>

          {/* Preview */}
          {formData.subject && formData.body && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Onderwerp:</strong> Belangrijk bericht van Al-Hijra Onderwijs: {formData.subject}</p>
                <p className="mt-2"><strong>Bericht (eerste 100 karakters):</strong></p>
                <p className="italic">
                  {formData.body.substring(0, 100)}{formData.body.length > 100 && '...'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary"
              disabled={isLoading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              disabled={isLoading || !formData.subject.trim() || !formData.body.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Bezig met versturen...' : `Verstuur naar ${totalParents} ouders`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkMessageModal;