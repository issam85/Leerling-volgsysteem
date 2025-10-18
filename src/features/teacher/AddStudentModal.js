// src/features/teacher/AddStudentModal.js - FIXED VERSION
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { apiCall } from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const AddStudentModal = ({ isOpen, onClose, classId, className }) => {
  const { realData, loadData } = useData();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    notes: '',
    parent_email: '' // Om bestaande ouder te vinden of nieuwe aan te maken
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Naam is verplicht');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // ✅ FIX 1: Correct API route
      // ❌ OLD: `/api/mosques/${realData.mosque.id}/students`
      // ✅ NEW: `/api/students/mosque/${realData.mosque.id}`
      
      // ✅ FIX 2: Cleaned up payload - removed added_by_teacher_id and active
      const payload = {
        name: formData.name.trim(),
        class_id: classId,
        date_of_birth: formData.date_of_birth || null,
        notes: formData.notes.trim() || null,
        parent_email: formData.parent_email.trim() || null
        // ✅ REMOVED: added_by_teacher_id and active (backend sets these automatically)
      };

      const result = await apiCall(`/api/students/mosque/${realData.mosque.id}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        // ✅ Enhanced success message based on backend response
        let message = `${result.student.name} succesvol toegevoegd!`;
        
        if (result.parent_created) {
          message += ` Nieuwe ouder account aangemaakt.`;
        }
        
        if (result.contribution_updated) {
          message += ` Ouder bijdrage herberekend.`;
        }
        
        setSuccessMessage(message);
        
        // Refresh data om nieuwe student te tonen
        await loadData();
        
        // Reset form
        setFormData({
          name: '',
          date_of_birth: '',
          notes: '',
          parent_email: ''
        });

        // Auto-close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
        
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
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={
      <div className="flex items-center">
        <UserPlus className="mr-2 text-emerald-600" size={24} />
        {t('student.addStudentToClass')} {className}
      </div>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-2 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            * {t('student.studentName')}
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('student.studentNamePlaceholder')}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('student.dateOfBirthOptional')}
          </label>
          <Input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            disabled={loading}
            placeholder={t('student.dateFormat')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('student.parentEmailOptional')}
          </label>
          <Input
            type="email"
            name="parent_email"
            value={formData.parent_email}
            onChange={handleChange}
            placeholder={t('student.parentEmailPlaceholder')}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('student.parentEmailHint')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('student.notesOptional')}
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder={t('student.notesPlaceholder')}
            rows={3}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading || !formData.name.trim() || successMessage}
            className="flex-1 sm:flex-none"
          >
            {loading ? t('common.loading') : successMessage ? t('common.success') : t('student.addStudentButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {successMessage ? t('common.close') : t('common.cancel')}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {t('student.addStudentNotice').replace('{className}', className)}
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default AddStudentModal;