// src/features/admin/teachers/AddTeacherModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const AddTeacherModal = ({ isOpen, onClose, onSubmit, initialData, modalError: apiErrorProp, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Optioneel veld
  const [sendEmailCheckbox, setSendEmailCheckbox] = useState(true);
  const [formValidationError, setFormValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setEmail(initialData?.email || '');
      setPhone(initialData?.phone || '');
      setSendEmailCheckbox(!initialData); // Standaard true voor nieuwe, false voor edit
      setFormValidationError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    if (!name.trim() || !email.trim()) {
      setFormValidationError('Naam en email zijn verplichte velden.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setFormValidationError('Voer een geldig emailadres in.');
      return;
    }

    const success = await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(), // Stuur mee
        sendEmail: sendEmailCheckbox
    });
    // Parent (TeachersTab) handelt sluiten van modal af
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Leraar Bewerken" : "Nieuwe Leraar Toevoegen"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuleren</Button>
          <Button variant="primary" type="submit" form="addTeacherForm" disabled={isLoading}>
            {isLoading ? (initialData ? "Opslaan..." : "Toevoegen...") : (initialData ? "Wijzigingen Opslaan" : "Leraar Toevoegen")}
          </Button>
        </>
      }
    >
      <form id="addTeacherForm" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Volledige Naam"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={formValidationError && !name.trim() ? "Naam is verplicht" : ""}
        />
        <Input
          label="Emailadres"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          error={formValidationError && (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) ? "Een geldig emailadres is verplicht" : ""}
        />
        <Input
          label="Telefoonnummer (optioneel)"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {!initialData && (
            <div className="flex items-center pt-2">
                <input
                id="sendWelcomeEmailTeacher"
                name="sendWelcomeEmailTeacher"
                type="checkbox"
                checked={sendEmailCheckbox}
                onChange={(e) => setSendEmailCheckbox(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-offset-0"
                />
                <label htmlFor="sendWelcomeEmailTeacher" className="ml-2 block text-sm text-gray-900">
                Welkomstmail met inloggegevens versturen
                </label>
            </div>
        )}
        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiErrorProp}</p>}
        {formValidationError && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};

export default AddTeacherModal;