// src/features/admin/students/AddStudentModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const AddStudentModal = ({ isOpen, onClose, onSubmit, initialData, parents, classes, modalError: apiErrorProp, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    parentId: '', // Wordt UUID string
    classId: '',  // Wordt UUID string
    date_of_birth: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  });
  const [formValidationError, setFormValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    if (!formData.name.trim() || !formData.parentId || !formData.classId) {
      setFormValidationError('Naam, ouder en klas zijn verplichte velden.');
      return;
    }
    // Stuur formData direct door, parent handelt parsen en opschonen af
    const success = await onSubmit(formData);
    // Parent (StudentsTab) handelt sluiten van modal af
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Leerling Bewerken" : "Nieuwe Leerling Toevoegen"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuleren</Button>
          <Button variant="primary" type="submit" form="addStudentForm" disabled={isLoading}>
            {isLoading ? (initialData ? "Opslaan..." : "Toevoegen...") : (initialData ? "Wijzigingen Opslaan" : "Leerling Toevoegen")}
          </Button>
        </>
      }
    >
      <form id="addStudentForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Volledige Naam Leerling *" name="name" value={formData.name} onChange={handleChange} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div>
                <label htmlFor="studentParent" className="block text-sm font-medium text-gray-700 mb-1">Ouder *</label>
                <select id="studentParent" name="parentId" value={formData.parentId} onChange={handleChange} required className={`input-field ${formValidationError && !formData.parentId ? 'border-red-500' : ''}`}>
                    <option value="">-- Selecteer ouder --</option>
                    {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700 mb-1">Klas *</label>
                <select id="studentClass" name="classId" value={formData.classId} onChange={handleChange} required className={`input-field ${formValidationError && !formData.classId ? 'border-red-500' : ''}`}>
                    <option value="">-- Selecteer klas --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </div>
        <Input label="Geboortedatum" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
        <Input label="Contact Noodgeval (Naam)" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
        <Input label="Contact Noodgeval (Telefoon)" name="emergency_phone" type="tel" value={formData.emergency_phone} onChange={handleChange} />
        <Input label="Notities (optioneel)" name="notes" type="textarea" value={formData.notes} onChange={handleChange} rows="2" />

        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiErrorProp}</p>}
        {formValidationError && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};

export default AddStudentModal;