// src/features/admin/parents/AddParentModal.js - UITGEBREIDE VERSIE met apart voornaam/achternaam
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';

const AddParentModal = ({ isOpen, onClose, onSubmit, initialData, modalError: apiErrorProp, isLoading }) => {
  const [formData, setFormData] = useState({
    // ✅ NIEUWE VELDEN: Apart first_name en last_name
    first_name: '',
    last_name: '',
    name: '', // Blijft behouden voor backward compatibility
    email: '',
    phone: '',
    address: '',
    zipcode: '',
    city: '',
    sendEmail: true,
  });
  const [formValidationError, setFormValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Bestaande ouder bewerken
        setFormData({
          first_name: initialData.first_name || initialData.name?.split(' ')[0] || '',
          last_name: initialData.last_name || initialData.name?.split(' ').slice(1).join(' ') || '',
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          zipcode: initialData.zipcode || '',
          city: initialData.city || '',
          sendEmail: false, // Voor bestaande ouders, geen email versturen
        });
      } else {
        // Nieuwe ouder
        setFormData({
          first_name: '',
          last_name: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          zipcode: '',
          city: '',
          sendEmail: true,
        });
      }
      setFormValidationError('');
    }
  }, [isOpen, initialData]);

  // ✅ Auto-update volledige naam wanneer voornaam of achternaam wijzigt
  useEffect(() => {
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    if (fullName && fullName !== formData.name) {
      setFormData(prev => ({ ...prev, name: fullName }));
    }
  }, [formData.first_name, formData.last_name]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Speciale behandeling voor naam velden
    if (name === 'first_name' || name === 'last_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    
    // Validatie voor nieuwe velden
    if (!formData.first_name || !formData.first_name.trim()) {
      setFormValidationError('Voornaam is verplicht.');
      return;
    }
    
    if (!formData.last_name || !formData.last_name.trim()) {
      setFormValidationError('Achternaam is verplicht.');
      return;
    }
    
    // Bestaande validaties
    const requiredFields = ['email', 'phone', 'address', 'zipcode', 'city'];
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

    // Zorg ervoor dat de volledige naam correct is samengesteld
    const dataToSubmit = {
      ...formData,
      name: `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
    };

    await onSubmit(dataToSubmit);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Ouder Bewerken" : "Nieuwe Ouder Toevoegen"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuleren
          </Button>
          <Button variant="primary" type="submit" form="addParentForm" disabled={isLoading}>
            {isLoading ? (initialData ? "Opslaan..." : "Toevoegen...") : (initialData ? "Wijzigingen Opslaan" : "Ouder Toevoegen")}
          </Button>
        </>
      }
    >
      <form id="addParentForm" onSubmit={handleSubmit} className="space-y-4">
        {/* ✅ NIEUWE NAAM SECTIE: Apart voornaam en achternaam */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input 
            label="Voornaam *" 
            name="first_name" 
            value={formData.first_name} 
            onChange={handleChange} 
            required 
            placeholder="Jan"
            className="capitalize"
          />
          <Input 
            label="Achternaam *" 
            name="last_name" 
            value={formData.last_name} 
            onChange={handleChange} 
            required 
            placeholder="Jansen"
            className="capitalize"
          />
        </div>

        {/* Automatisch gegenereerde volledige naam (alleen ter info) */}
        {(formData.first_name || formData.last_name) && (
          <div className="bg-gray-50 p-3 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volledige Naam (automatisch)
            </label>
            <div className="text-sm text-gray-600 italic">
              {`${formData.first_name} ${formData.last_name}`.trim() || 'Vul voornaam en achternaam in'}
            </div>
          </div>
        )}

        {/* Contact informatie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input 
            label="Emailadres *" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            placeholder="ouder@email.com"
          />
          <Input 
            label="Telefoonnummer *" 
            name="phone" 
            type="tel" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
            placeholder="0612345678"
          />
        </div>
        
        {/* Adres informatie */}
        <Input 
          label="Adres (Straat en huisnummer) *" 
          name="address" 
          value={formData.address} 
          onChange={handleChange} 
          required 
          placeholder="Voorbeeldstraat 123"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input 
            label="Postcode *" 
            name="zipcode" 
            value={formData.zipcode} 
            onChange={handleChange} 
            required 
            placeholder="1234 AB"
            className="uppercase"
          />
          <Input 
            label="Woonplaats *" 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            required 
            placeholder="Amsterdam"
            className="capitalize"
          />
        </div>
        
        {/* Email versturen checkbox (alleen voor nieuwe ouders) */}
        {!initialData && (
          <div className="flex items-center pt-2">
            <input 
              id="sendWelcomeEmailParent" 
              name="sendEmail" 
              type="checkbox" 
              checked={formData.sendEmail} 
              onChange={handleChange} 
              className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-offset-0"
            />
            <label htmlFor="sendWelcomeEmailParent" className="ml-2 block text-sm text-gray-900">
              Welkomstmail met inloggegevens versturen
            </label>
          </div>
        )}

        {/* Error berichten */}
        {apiErrorProp && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                ❌
              </div>
              <div className="ml-2">
                {apiErrorProp}
              </div>
            </div>
          </div>
        )}
        
        {formValidationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                ⚠️
              </div>
              <div className="ml-2">
                {formValidationError}
              </div>
            </div>
          </div>
        )}

        {/* Help tekst */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
          <div className="text-sm text-blue-700">
            <strong>💡 Tips:</strong>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              <li>De volledige naam wordt automatisch samengesteld uit voornaam en achternaam</li>
              <li>Alle velden met een * zijn verplicht</li>
              {!initialData && (
                <li>Een tijdelijk wachtwoord wordt automatisch gegenereerd en verstuurd</li>
              )}
            </ul>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddParentModal;