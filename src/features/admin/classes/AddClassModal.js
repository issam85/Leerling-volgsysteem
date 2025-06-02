// src/features/admin/classes/AddClassModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const AddClassModal = ({ isOpen, onClose, onSubmit, teachers, initialData, modalError: apiErrorProp, isLoading }) => {
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState(''); // Zal UUID string zijn
  const [description, setDescription] = useState('');
  const [formValidationError, setFormValidationError] = useState(''); // Voor client-side validatie

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setTeacherId(initialData?.teacher_id || ''); // teacher_id is al string (UUID)
      setDescription(initialData?.description || '');
      setFormValidationError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    if (!name.trim() || !teacherId) {
      setFormValidationError('Klasnaam en leraar zijn verplichte velden.');
      return;
    }
    // onSubmit is de functie van de parent (ClassesTab)
    // isLoading wordt beheerd door de parent
    const success = await onSubmit({ name: name.trim(), teacherId, description: description.trim() });
    if (success) {
      // Parent (ClassesTab) handelt het sluiten van de modal af.
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Klas Bewerken" : "Nieuwe Klas Toevoegen"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuleren</Button>
          <Button variant="primary" type="submit" form="addClassForm" disabled={isLoading}>
            {isLoading ? (initialData ? "Opslaan..." : "Aanmaken...") : (initialData ? "Wijzigingen Opslaan" : "Klas Aanmaken")}
          </Button>
        </>
      }
    >
      <form id="addClassForm" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Klas Naam"
          name="name" // name attribuut voor eventuele form handling
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. Beginners Koran, Arabisch Level 1"
          required
          error={formValidationError && !name.trim() ? "Klasnaam is verplicht" : ""}
        />
        <div>
          <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
            Selecteer Leraar <span className="text-red-500">*</span>
          </label>
          <select
            id="teacher"
            name="teacherId"
            value={teacherId} // teacherId is nu een string (UUID)
            onChange={(e) => setTeacherId(e.target.value)}
            required
            className={`input-field ${formValidationError && !teacherId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
          >
            <option value="">-- Kies een leraar --</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}> {/* teacher.id is al UUID string */}
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
          {formValidationError && !teacherId && <p className="mt-1 text-xs text-red-600">Leraar is verplicht</p>}
        </div>
        <Input
          label="Omschrijving (optioneel)"
          name="description"
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Korte omschrijving van de doelstellingen en inhoud van de klas."
          rows="3"
        />
        {/* API error from parent (ClassesTab) */}
        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiErrorProp}</p>}
        {/* Local form validation error (algemeen) */}
        {formValidationError && (name.trim() && teacherId) && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};

export default AddClassModal;