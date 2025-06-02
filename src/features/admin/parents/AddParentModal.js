// src/features/admin/parents/AddParentModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const AddParentModal = ({ isOpen, onClose, onSubmit, initialData, modalError: apiErrorProp, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    zipcode: '',
    city: '',
    amount_due_input: '0.00', // Gebruik een aparte state voor de input string
    sendEmail: true,
  });
  const [formValidationError, setFormValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        zipcode: initialData?.zipcode || '',
        city: initialData?.city || '',
        amount_due_input: initialData?.amount_due ? String(parseFloat(initialData.amount_due).toFixed(2)) : '0.00',
        sendEmail: !initialData,
      });
      setFormValidationError('');
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    const requiredFields = ['name', 'email', 'phone', 'address', 'zipcode', 'city', 'amount_due_input'];
    for (const field of requiredFields) {
      if (!formData[field] || !String(formData[field]).trim()) {
        setFormValidationError(`Veld "${field === 'amount_due_input' ? 'Maandelijkse Bijdrage' : field.charAt(0).toUpperCase() + field.slice(1)}" is verplicht.`);
        return;
      }
    }
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      setFormValidationError('Voer een geldig emailadres in.');
      return;
    }
    const parsedAmountDue = parseFloat(formData.amount_due_input);
    if (isNaN(parsedAmountDue) || parsedAmountDue < 0) {
      setFormValidationError('Voer een geldig bedrag in voor de maandelijkse bijdrage (0 of hoger).');
      return;
    }

    // Stuur de data door, inclusief de correct geparste amount_due
    const success = await onSubmit({ ...formData, amount_due_input: parsedAmountDue }); // Parent handelt sluiten af
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Ouder Bewerken" : "Nieuwe Ouder Toevoegen"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuleren</Button>
          <Button variant="primary" type="submit" form="addParentForm" disabled={isLoading}>
            {isLoading ? (initialData ? "Opslaan..." : "Toevoegen...") : (initialData ? "Wijzigingen Opslaan" : "Ouder Toevoegen")}
          </Button>
        </>
      }
    >
      <form id="addParentForm" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input label="Volledige Naam *" name="name" value={formData.name} onChange={handleChange} required />
          <Input label="Emailadres *" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="Telefoonnummer *" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
          <Input label="Maandelijkse Bijdrage (€) *" name="amount_due_input" type="number" value={formData.amount_due_input} onChange={handleChange} min="0" step="0.01" placeholder="0.00" required/>
        </div>
        <Input label="Adres (Straat en huisnummer) *" name="address" value={formData.address} onChange={handleChange} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input label="Postcode *" name="zipcode" value={formData.zipcode} onChange={handleChange} required />
          <Input label="Woonplaats *" name="city" value={formData.city} onChange={handleChange} required />
        </div>

        {!initialData && (
          <div className="flex items-center pt-2">
            <input id="sendWelcomeEmailParent" name="sendEmail" type="checkbox" checked={formData.sendEmail} onChange={handleChange} className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-offset-0"/>
            <label htmlFor="sendWelcomeEmailParent" className="ml-2 block text-sm text-gray-900">Welkomstmail met inloggegevens versturen</label>
          </div>
        )}
        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiErrorProp}</p>}
        {formValidationError && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};

export default AddParentModal;