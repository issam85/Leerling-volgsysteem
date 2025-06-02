// src/features/admin/classes/ClassesTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import Button from '../../../components/Button';
import AddClassModal from './AddClassModal';
import { BookOpen, Plus, User as UserIcon, Users, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/LoadingSpinner';

const ClassesTab = () => {
  const { realData, loadData } = useData();
  const { users, classes, students, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [pageError, setPageError] = useState(''); // Voor fouten op de pagina zelf
  const [modalErrorText, setModalErrorText] = useState(''); // Specifiek voor de modal
  const [actionLoading, setActionLoading] = useState(false); // Voor acties zoals toevoegen/verwijderen
  const navigate = useNavigate();

  const teachers = users.filter(u => u.role === 'teacher');

  useEffect(() => {
    if (dataError) setPageError(dataError); else setPageError('');
  }, [dataError]);

  const handleOpenAddModal = () => {
    if (teachers.length === 0) {
      alert('Voeg eerst leraren toe voordat u klassen kunt aanmaken.');
      navigate('/admin/teachers');
      return;
    }
    setEditingClass(null);
    setShowAddClassModal(true);
    setModalErrorText('');
  };

  const handleOpenEditModal = (cls) => {
    setEditingClass(cls);
    setShowAddClassModal(true);
    setModalErrorText('');
  };

  const handleClassSubmit = async (classDataFromModal) => {
    setModalErrorText('');
    if (!classDataFromModal.name || !classDataFromModal.teacherId) {
      setModalErrorText('Klasnaam en leraar zijn verplicht.');
      return false;
    }
    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar. Kan actie niet uitvoeren.");
      return false;
    }
    setActionLoading(true);
    try {
      const payload = {
        name: classDataFromModal.name,
        teacher_id: classDataFromModal.teacherId, // Is al UUID string
        description: classDataFromModal.description || '',
      };

      let result;
      if (editingClass) {
        // PUT request naar /api/classes/:classId (ZORG DAT DIT ENDPOINT BESTAAT IN BACKEND)
        result = await apiCall(`/api/classes/${editingClass.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        payload.mosque_id = mosque.id; // Vereist door je backend /api/classes POST
        // POST request naar /api/classes
        result = await apiCall(`/api/classes`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      // Je backend geeft { success: true, class: ... } of { error: ... }
      if (result.success || result.class) { // Check op class als success niet expliciet is maar wel data
        setShowAddClassModal(false);
        setEditingClass(null);
        await loadData(); // Herlaad alle data
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon klas niet verwerken.");
      }
    } catch (err) {
      console.error('Error submitting class:', err);
      setModalErrorText(err.message || `Fout bij het ${editingClass ? 'bewerken' : 'aanmaken'} van de klas.`);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteClass = async (classIdToDelete) => {
  // ... (confirm, mosque check, setActionLoading)
    try {
        const result = await apiCall(`/api/classes/${classIdToDelete}`, { method: 'DELETE' });
        // CORRECTIE HIER:
        if (result.success) { // Controleer op het 'success' veld van de apiCall response
        await loadData();
        } else {
        // Als result.success false is, zou result.error een message moeten hebben
        throw new Error(result.error || "Kon klas niet verwijderen (onbekende fout).");
        }
    } catch (err) {
        console.error("Error deleting class:", err);
        setPageError(`Fout bij verwijderen van klas: ${err.message}`);
    }
    setActionLoading(false);
    };

  if (dataLoading && !classes.length) {
    return <LoadingSpinner message="Klassen laden..." />;
  }

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig met verwerken..." />}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Klassen Beheer</h2>
        <Button onClick={handleOpenAddModal} variant="primary" icon={Plus} className="w-full sm:w-auto" disabled={actionLoading}>
          Nieuwe Klas
        </Button>
      </div>

      {pageError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      {teachers.length === 0 && !dataLoading ? (
        <div className="card text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Eerst leraren toevoegen</h3>
          <p className="text-gray-600 mb-4">U dient leraren toe te voegen voordat u klassen kunt aanmaken.</p>
          <Button onClick={() => navigate('/admin/teachers')} variant="primary">Naar Leraren</Button>
        </div>
      ) : classes.length === 0 && !dataLoading ? (
        <div className="card text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen klassen</h3>
          <p className="text-gray-600">Klik op "Nieuwe Klas" om uw eerste klas aan te maken.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klasnaam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leraar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leerlingen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Omschrijving</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map(cls => {
                // Je backend stuurt al geneste teacher en student info mee.
                const teacherName = cls.teacher?.name || <span className="italic text-red-500">Geen</span>;
                const studentCount = cls.students?.length || 0;
                return (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={cls.id}>{cls.id.substring(0,8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacherName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{studentCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={cls.description}>
                      {cls.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <Button onClick={() => handleOpenEditModal(cls)} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1.5" title="Bewerken" disabled={actionLoading}> <Edit3 size={16} /> </Button>
                      <Button onClick={() => handleDeleteClass(cls.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Verwijderen" disabled={actionLoading}> <Trash2 size={16} /> </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddClassModal && (
          <AddClassModal
            isOpen={showAddClassModal}
            onClose={() => { setShowAddClassModal(false); setEditingClass(null); setModalErrorText(''); }}
            onSubmit={handleClassSubmit}
            teachers={teachers} // Geef de lijst van leraren mee
            initialData={editingClass}
            modalError={modalErrorText}
            isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ClassesTab;