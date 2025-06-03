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
    sendEmail: true, // Standaard aangevinkt voor nieuwe ouder
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
        sendEmail: !initialData, // Alleen standaard aanvinken bij nieuwe ouder, anders default van state (true)
      });
      setFormValidationError(''); 
      // apiErrorProp wordt extern beheerd, hier niet resetten
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
    
    const requiredFields = ['name', 'email', 'phone', 'address', 'zipcode', 'city'];
    for (const field of requiredFields) {
      if (!formData[field] || !String(formData[field]).trim()) {
        let fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
        if (field === 'zipcode') fieldLabel = 'Postcode';
        setFormValidationError(`Veld "${fieldLabel}" is verplicht.`);
        return;
      }
    }
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      setFormValidationError('Voer een geldig emailadres in.');
      return;
    }

    // De onSubmit (handleParentSubmit in ParentsTab) retourneert true/false
    // wat gebruikt kan worden om te bepalen of de modal gesloten moet worden.
    // In ParentsTab wordt dit al afgehandeld (setShowAddParentModal(false)).
    await onSubmit(formData); 
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose} // onClose wordt aangeroepen door Modal component zelf bij escape of buiten klikken
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
          <Input label="Volledige Naam *" name="name" value={formData.name} onChange={handleChange} required placeholder="Jan Jansen"/>
          <Input label="Emailadres *" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="ouder@email.com"/>
        </div>
        <Input label="Telefoonnummer *" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="0612345678"/>
        <Input label="Adres (Straat en huisnummer) *" name="address" value={formData.address} onChange={handleChange} required placeholder="Voorbeeldstraat 123"/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input label="Postcode *" name="zipcode" value={formData.zipcode} onChange={handleChange} required placeholder="1234 AB"/>
          <Input label="Woonplaats *" name="city" value={formData.city} onChange={handleChange} required placeholder="Amsterdam"/>
        </div>
        
        {!initialData && ( // Alleen tonen voor nieuwe ouder
          <div className="flex items-center pt-2">
            <input 
                id="sendWelcomeEmailParent" 
                name="sendEmail" 
                type="checkbox" 
                checked={formData.sendEmail} 
                onChange={handleChange} 
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-offset-0"
            />
            <label htmlFor="sendWelcomeEmailParent" className="ml-2 block text-sm text-gray-900">Welkomstmail met inloggegevens versturen</label>
          </div>
        )}

        {/* Toon API error van de prop (door ParentsTab gezet) */}
        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm mt-2">{apiErrorProp}</p>}
        {/* Toon client-side validatiefout */}
        {formValidationError && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};

export default AddParentModal;