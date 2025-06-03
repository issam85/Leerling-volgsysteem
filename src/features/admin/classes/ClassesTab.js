// src/features/admin/classes/ClassesTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import Button from '../../../components/Button';
import AddClassModal from './AddClassModal';
import { BookOpen, Plus, User as UserIcon, Edit3, Trash2, AlertCircle } from 'lucide-react'; // Users is hier niet direct nodig
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/LoadingSpinner';

const ClassesTab = () => {
  const { realData, loadData } = useData();
  // Haal specifiek de benodigde data uit realData om re-renders te minimaliseren
  const { users, classes, mosque, loading: dataLoading, error: dataError } = realData;

  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  // Filter leraren alleen als 'users' data beschikbaar is
  const teachers = users ? users.filter(u => u.role === 'teacher') : [];

  useEffect(() => {
    if (dataError) setPageError(dataError);
    else setPageError('');
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
        teacher_id: classDataFromModal.teacherId,
        description: classDataFromModal.description || '',
      };

      let result;
      if (editingClass) {
        result = await apiCall(`/api/classes/${editingClass.id}`, { // Backend: PUT /api/classes/:id
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        payload.mosque_id = mosque.id;
        result = await apiCall(`/api/classes`, { // Backend: POST /api/classes
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (result.success || result.class) {
        setShowAddClassModal(false);
        setEditingClass(null);
        await loadData();
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
    if (!window.confirm("Weet u zeker dat u deze klas wilt verwijderen? Dit kan invloed hebben op gekoppelde leerlingen.")) return;
    if (!mosque || !mosque.id) { alert("Moskee informatie niet beschikbaar."); return; }
    setActionLoading(true);
    try {
      const result = await apiCall(`/api/classes/${classIdToDelete}`, { method: 'DELETE' }); // Backend: DELETE /api/classes/:id
      if (result.success) {
        await loadData();
      } else {
        throw new Error(result.error || "Kon klas niet verwijderen.");
      }
    } catch (err) {
      console.error("Error deleting class:", err);
      setPageError(`Fout bij verwijderen van klas: ${err.message}`);
    }
    setActionLoading(false);
  };

  // Laadcondities:
  // dataLoading is true initieel en tijdens fetches.
  // classes kan leeg zijn, zelfs als dataLoading false is (als er gewoon geen klassen zijn).
  if (dataLoading && (!classes || classes.length === 0) && (!users || users.length === 0) ) {
    return <LoadingSpinner message="Klassen en leraren laden..." />;
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

      {/* Conditionele rendering voor lege staten */}
      {!dataLoading && teachers.length === 0 ? (
        <div className="card text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Eerst leraren toevoegen</h3>
          <p className="text-gray-600 mb-4">U dient leraren toe te voegen voordat u klassen kunt aanmaken.</p>
          <Button onClick={() => navigate('/admin/teachers')} variant="primary">Naar Leraren</Button>
        </div>
      ) : !dataLoading && classes && classes.length === 0 ? (
        <div className="card text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen klassen</h3>
          <p className="text-gray-600">Klik op "Nieuwe Klas" om uw eerste klas aan te maken.</p>
        </div>
      ) : classes && classes.length > 0 ? ( // Alleen tabel tonen als er klassen zijn
        <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klasnaam</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leraar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leerlingen</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Omschrijving</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map(cls => {
                const teacherName = cls.teacher?.name || <span className="italic text-red-500">Geen</span>;
                let studentCount = 0;
                if (cls.students && Array.isArray(cls.students) && cls.students.length > 0 && cls.students[0].hasOwnProperty('count')) {
                  studentCount = cls.students[0].count;
                } else if (cls.students && typeof cls.students.count === 'number') {
                  studentCount = cls.students.count;
                } else if (cls.students && Array.isArray(cls.students)) {
                  studentCount = cls.students.length; // Fallback als het een array van objecten is
                }
                console.log("Klas:", cls.name, "| Raw cls.students:", JSON.stringify(cls.students), "| Calculated studentCount:", studentCount);

                return (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={cls.id}>
                      {cls.id ? cls.id.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cls.name || <span className="italic text-gray-400">Naamloos</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {teacherName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {studentCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={cls.description || ''}>
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
      ) : null} {/* Einde conditionele rendering van tabel */}

      {showAddClassModal && (
          <AddClassModal
            isOpen={showAddClassModal}
            onClose={() => { setShowAddClassModal(false); setEditingClass(null); setModalErrorText(''); }}
            onSubmit={handleClassSubmit}
            teachers={teachers}
            initialData={editingClass}
            modalError={modalErrorText}
            isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ClassesTab;