// src/features/admin/students/AddStudentModal.js - VERBETERDE VERSIE
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { User, Users, GraduationCap, Phone, FileText } from 'lucide-react';

const AddStudentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  parents, 
  classes, 
  modalError: apiErrorProp, 
  isLoading 
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    name: '', // Voor backward compatibility
    parentId: '',
    classId: '',
    date_of_birth: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  });
  const [formValidationError, setFormValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Als we editing zijn en de student heeft first_name/last_name, gebruik die
      // Anders probeer de volledige naam te splitsen
      let firstName = '';
      let lastName = '';
      let fullName = '';

      if (initialData) {
        firstName = initialData.first_name || '';
        lastName = initialData.last_name || '';
        fullName = initialData.name || '';

        // Als we geen first/last hebben maar wel een volledige naam, probeer te splitsen
        if (!firstName && !lastName && fullName) {
          const nameParts = fullName.trim().split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = fullName;
          }
        }
      }

      setFormData({
        first_name: firstName,
        last_name: lastName,
        name: fullName, // Behoud voor backward compatibility
        parentId: initialData?.parent_id || '',
        classId: initialData?.class_id || '',
        date_of_birth: initialData?.date_of_birth || '',
        emergency_contact: initialData?.emergency_contact || '',
        emergency_phone: initialData?.emergency_phone || '',
        notes: initialData?.notes || '',
      });
      setFormValidationError('');
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update de volledige naam wanneer first_name of last_name verandert
      if (name === 'first_name' || name === 'last_name') {
        const firstName = name === 'first_name' ? value : prev.first_name;
        const lastName = name === 'last_name' ? value : prev.last_name;
        newData.name = `${firstName} ${lastName}`.trim();
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');

    // Validatie
    if (!formData.first_name.trim()) {
      setFormValidationError('Voornaam is verplicht.');
      return;
    }
    if (!formData.last_name.trim()) {
      setFormValidationError('Achternaam is verplicht.');
      return;
    }
    if (!formData.parentId) {
      setFormValidationError('Ouder selecteren is verplicht.');
      return;
    }
    if (!formData.classId) {
      setFormValidationError('Klas selecteren is verplicht.');
      return;
    }

    // Bereid data voor voor verzending
    const submissionData = {
      ...formData,
      name: `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
    };

    const success = await onSubmit(submissionData);
  };

  // Helper functie om parent info te tonen
  const getParentDisplayInfo = (parent) => {
    const childCount = parent.childCount || 0;
    return `${parent.name} (${parent.email}) - ${childCount} kind${childCount !== 1 ? 'eren' : ''}`;
  };

  // Filter actieve klassen en sorteer ze
  const availableClasses = classes
    ?.filter(cls => cls.active !== false)
    ?.sort((a, b) => a.name.localeCompare(b.name)) || [];

  // Sorteer parents alfabetisch
  const sortedParents = parents
    ?.sort((a, b) => a.name.localeCompare(b.name)) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Leerling Bewerken" : "Nieuwe Leerling Toevoegen"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuleren
          </Button>
          <Button variant="primary" type="submit" form="addStudentForm" disabled={isLoading}>
            {isLoading ? (
              initialData ? "Opslaan..." : "Toevoegen..."
            ) : (
              initialData ? "Wijzigingen Opslaan" : "Leerling Toevoegen"
            )}
          </Button>
        </>
      }
    >
      <form id="addStudentForm" onSubmit={handleSubmit} className="space-y-6">
        
        {/* Persoonlijke Gegevens Sectie */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <User className="w-5 h-5 text-emerald-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-700">Persoonlijke Gegevens</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Voornaam *" 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              required 
              placeholder="bijv. Ahmed"
            />
            <Input 
              label="Achternaam *" 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              required 
              placeholder="bijv. Al-Hassan"
            />
          </div>

          <div className="mt-4">
            <Input 
              label="Geboortedatum" 
              name="date_of_birth" 
              type="date" 
              value={formData.date_of_birth} 
              onChange={handleChange}
            />
          </div>

          {/* Preview van volledige naam */}
          {(formData.first_name || formData.last_name) && (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
              <strong>Volledige naam:</strong> {formData.first_name} {formData.last_name}
            </div>
          )}
        </div>

        {/* Koppeling Sectie */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-700">Koppeling</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentParent" className="block text-sm font-medium text-gray-700 mb-2">
                Ouder/Verzorger *
              </label>
              <select 
                id="studentParent" 
                name="parentId" 
                value={formData.parentId} 
                onChange={handleChange} 
                required 
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  formValidationError && !formData.parentId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Selecteer ouder/verzorger --</option>
                {sortedParents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.email})
                  </option>
                ))}
              </select>
              {sortedParents.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Geen ouders beschikbaar. Voeg eerst ouders toe.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700 mb-2">
                Klas *
              </label>
              <select 
                id="studentClass" 
                name="classId" 
                value={formData.classId} 
                onChange={handleChange} 
                required 
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  formValidationError && !formData.classId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Selecteer klas --</option>
                {availableClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {availableClasses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Geen klassen beschikbaar. Voeg eerst klassen toe.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Noodcontact Sectie */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Phone className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-700">Noodcontact (Optioneel)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Naam Noodcontact" 
              name="emergency_contact" 
              value={formData.emergency_contact} 
              onChange={handleChange}
              placeholder="bijv. Oma Fatima"
            />
            <Input 
              label="Telefoon Noodcontact" 
              name="emergency_phone" 
              type="tel" 
              value={formData.emergency_phone} 
              onChange={handleChange}
              placeholder="bijv. 06-12345678"
            />
          </div>
        </div>

        {/* Notities Sectie */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <FileText className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-700">Extra Informatie (Optioneel)</h3>
          </div>
          
          <Input 
            label="Notities" 
            name="notes" 
            type="textarea" 
            value={formData.notes} 
            onChange={handleChange} 
            rows="3"
            placeholder="Bijv. allergieën, bijzonderheden, medische informatie..."
          />
        </div>

        {/* Error Messages */}
        {apiErrorProp && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800 text-sm font-medium">❌ {apiErrorProp}</p>
          </div>
        )}
        
        {formValidationError && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800 text-sm font-medium">❌ {formValidationError}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-xs text-gray-600">
            <strong>💡 Tip:</strong> Zorg ervoor dat de ouder/verzorger al is toegevoegd aan het systeem voordat u een leerling aanmaakt. 
            De bijdrage van de ouder wordt automatisch herberekend op basis van het aantal kinderen.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default AddStudentModal;