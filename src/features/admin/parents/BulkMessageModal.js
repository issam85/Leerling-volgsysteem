// src/features/admin/parents/BulkMessageModal.js
import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { X, Send, Users, AlertCircle, Check, Search } from 'lucide-react';

const BulkMessageModal = ({
  isOpen,
  onClose,
  onSubmit,
  allParents,
  isLoading,
  modalError
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });

  const [selectedParents, setSelectedParents] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [parentSearch, setParentSearch] = useState('');

  const [errors, setErrors] = useState({});

  // Initialize selected parents when modal opens
  useEffect(() => {
    if (isOpen && allParents?.length > 0) {
      // Select all parents by default
      setSelectedParents(allParents.map(p => p.id));
      setSelectAll(true);
    }
  }, [isOpen, allParents]);

  // Filter parents based on search
  const filteredParents = allParents?.filter(parent => {
    if (!parentSearch) return true;
    const searchLower = parentSearch.toLowerCase();
    return (
      parent.name?.toLowerCase().includes(searchLower) ||
      parent.first_name?.toLowerCase().includes(searchLower) ||
      parent.last_name?.toLowerCase().includes(searchLower) ||
      parent.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

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
    if (selectedParents.length === 0) {
      newErrors.recipients = 'Selecteer minimaal één ouder';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const success = await onSubmit({
      ...formData,
      selectedParentIds: selectedParents
    });

    if (success) {
      // Reset form bij succes
      setFormData({ subject: '', body: '' });
      setSelectedParents([]);
      setSelectAll(false);
      setParentSearch('');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedParents([]);
    } else {
      setSelectedParents(filteredParents.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleParentToggle = (parentId) => {
    setSelectedParents(prev => {
      const newSelection = prev.includes(parentId)
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId];

      // Update selectAll state
      setSelectAll(newSelection.length === filteredParents.length);
      return newSelection;
    });
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
      setSelectedParents([]);
      setSelectAll(false);
      setParentSearch('');
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
                Bericht naar ouders
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecteer naar welke ouders je dit bericht wilt sturen
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
          {/* Ouder Selectie */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Ontvangers selecteren</h3>
              <div className="text-sm text-gray-600">
                {selectedParents.length} van {allParents?.length || 0} geselecteerd
              </div>
            </div>

            {/* Zoek en Selecteer Alles */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Zoek ouders op naam of email..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Selecteer alle{parentSearch ? ' getoonde' : ''} ouders
                  </span>
                </label>
                {errors.recipients && (
                  <p className="text-red-600 text-sm">{errors.recipients}</p>
                )}
              </div>
            </div>

            {/* Ouders Lijst */}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {filteredParents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {parentSearch ? 'Geen ouders gevonden met deze zoekterm' : 'Geen ouders beschikbaar'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredParents.map((parent) => (
                    <label key={parent.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedParents.includes(parent.id)}
                        onChange={() => handleParentToggle(parent.id)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-3"
                        disabled={isLoading}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {parent.first_name && parent.last_name
                            ? `${parent.first_name} ${parent.last_name}`
                            : parent.name
                          }
                        </div>
                        <div className="text-xs text-gray-500 truncate">{parent.email}</div>
                      </div>
                      {selectedParents.includes(parent.id) && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </label>
                  ))}
                </div>
              )}
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
          {formData.subject && formData.body && selectedParents.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Naar:</strong> {selectedParents.length} geselecteerde ouder{selectedParents.length !== 1 ? 's' : ''}</p>
                <p><strong>Onderwerp:</strong> Belangrijk bericht van Al-Hijra Vlaardingen: {formData.subject}</p>
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
              disabled={isLoading || !formData.subject.trim() || !formData.body.trim() || selectedParents.length === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Bezig met versturen...' : `Verstuur naar ${selectedParents.length} ouder${selectedParents.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkMessageModal;