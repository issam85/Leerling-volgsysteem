// src/features/admin/classes/AddClassModal.js - Met 'Actief' checkbox
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const AddClassModal = ({ isOpen, onClose, onSubmit, teachers, initialData, modalError: apiErrorProp, isLoading }) => {
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true); // Nieuwe state voor 'actief' status
  const [formValidationError, setFormValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setTeacherId(initialData?.teacher_id || '');
      setDescription(initialData?.description || '');
      // Zet de 'actief' status op basis van de data, of default naar true
      setIsActive(initialData ? initialData.active : true);
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
    // Geef ook de 'isActive' state mee
    await onSubmit({ name: name.trim(), teacherId, description: description.trim(), active: isActive });
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
            {isLoading ? "Opslaan..." : "Wijzigingen Opslaan"}
          </Button>
        </>
      }
    >
      <form id="addClassForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Klas Naam" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">Selecteer Leraar *</label>
          <select id="teacher" name="teacherId" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="input-field">
            <option value="">-- Kies een leraar --</option>
            {teachers.map(teacher => (<option key={teacher.id} value={teacher.id}>{teacher.name}</option>))}
          </select>
        </div>
        <Input label="Omschrijving" name="description" type="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" />
        
        {/* Nieuwe checkbox, alleen zichtbaar bij bewerken */}
        {initialData && (
          <div className="flex items-center pt-2">
            <input 
                id="classActive" 
                name="isActive" 
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="classActive" className="ml-2 block text-sm text-gray-900">Klas is Actief</label>
          </div>
        )}

        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiErrorProp}</p>}
        {formValidationError && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};