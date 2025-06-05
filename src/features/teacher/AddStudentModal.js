// src/features/teacher/AddStudentModal.js - Modal voor leraar om leerling toe te voegen aan klas
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { apiCall } from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

const AddStudentModal = ({ isOpen, onClose, classId, className }) => {
  const { realData, loadData } = useData();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    notes: '',
    parent_email: '' // Om bestaande ouder te vinden of nieuwe aan te maken
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Naam is verplicht');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        class_id: classId,
        date_of_birth: formData.date_of_birth || null,
        notes: formData.notes.trim() || null,
        parent_email: formData.parent_email.trim() || null,
        added_by_teacher_id: currentUser.id,
        active: true
      };

      const result = await apiCall(`/api/mosques/${realData.mosque.id}/students`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        // Refresh data om nieuwe student te tonen
        await loadData();
        
        // Reset form en sluit modal
        setFormData({
          name: '',
          date_of_birth: '',
          notes: '',
          parent_email: ''
        });
        onClose();
      } else {
        throw new Error(result.error || 'Kon leerling niet toevoegen');
      }
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.message || 'Er ging iets mis bij het toevoegen van de leerling');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date_of_birth: '',
      notes: '',
      parent_email: ''
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={
      <div className="flex items-center">
        <UserPlus className="mr-2 text-emerald-600" size={24} />
        Leerling Toevoegen aan {className}
      </div>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Naam van de leerling *
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Volledige naam van de leerling"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geboortedatum (optioneel)
          </label>
          <Input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ouder email (optioneel)
          </label>
          <Input
            type="email"
            name="parent_email"
            value={formData.parent_email}
            onChange={handleChange}
            placeholder="email@voorbeeld.nl"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Als het email adres al bestaat, wordt de leerling gekoppeld aan die ouder. 
            Anders kan de administratie later een ouder account aanmaken.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notities (optioneel)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Eventuele bijzonderheden over de leerling..."
            rows={3}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex-1 sm:flex-none"
          >
            {loading ? 'Toevoegen...' : 'Leerling Toevoegen'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Annuleren
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Let op:</strong> De leerling wordt direct toegevoegd aan uw klas "{className}". 
            De administratie kan later de details aanvullen en een ouder account koppelen.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default AddStudentModal;