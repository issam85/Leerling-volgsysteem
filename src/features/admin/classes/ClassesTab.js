// src/features/admin/classes/ClassesTab.js - AANGEPAST VOOR BACKEND V3
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import Button from '../../../components/Button';
import AddClassModal from './AddClassModal';
import AdminLayout from '../../../layouts/AdminLayout'; // ✅ TOEGEVOEGD
import { BookOpen, Plus, User as UserIcon, Edit3, Trash2, Archive, AlertCircle } from 'lucide-react'; // Archive icoon voor deactiveren
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/LoadingSpinner';

const ClassesTab = () => {
  const { realData, loadData } = useData();
  const { users, classes, mosque, loading: dataLoading, error: dataError } = realData;

  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

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
    setActionLoading(true);
    
    try {
      const payload = {
        name: classDataFromModal.name,
        teacher_id: classDataFromModal.teacherId,
        description: classDataFromModal.description,
        // De 'active' state wordt nu ook meegestuurd bij het bewerken
        active: classDataFromModal.active !== undefined ? classDataFromModal.active : true,
      };

      let result;
      if (editingClass) {
        // AANGEPAST: De URL is nu simpeler omdat de basis in server.js staat.
        result = await apiCall(`/api/classes/${editingClass.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        payload.mosque_id = mosque.id;
        // AANGEPAST: De URL is nu simpeler.
        result = await apiCall(`/api/classes`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (result.success || result.class) {
        setShowAddClassModal(false);
        setEditingClass(null);
        await loadData();
        return true;
      } else {
        throw new Error(result.error || "Kon klas niet verwerken.");
      }
    } catch (err) {
      setModalErrorText(err.message || `Fout bij het ${editingClass ? 'bewerken' : 'aanmaken'} van de klas.`);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // HIER ZIT DE WIJZIGING: Van DELETE naar DEACTIVATE
  // ==========================================================
  const handleDeactivateClass = async (classToDeactivate) => {
    if (!window.confirm(`Weet u zeker dat u klas "${classToDeactivate.name}" wilt deactiveren? De klas wordt verborgen, maar niet permanent verwijderd.`)) return;
    
    setActionLoading(true);
    setPageError('');
    try {
      // AANGEPAST: De API call is nu een PUT naar een nieuw endpoint.
      await apiCall(`/api/classes/${classToDeactivate.id}/deactivate`, { method: 'PUT' });
      await loadData(); // Herlaad de data om de klas uit de lijst te zien verdwijnen
    } catch (err) {
      setPageError(`Fout bij deactiveren van klas: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };
  // ==========================================================
  // EINDE VAN DE WIJZIGING
  // ==========================================================

  if (dataLoading && (!classes || classes.length === 0)) {
    return <LoadingSpinner message="Klassen en leraren laden..." />;
  }

  // LET OP: de backend stuurt nu alleen actieve klassen, dus we hoeven hier niet meer te filteren.
  const activeClasses = classes || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {actionLoading && <LoadingSpinner message="Bezig met verwerken..." />}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="page-title">Klassen Beheer</h2>
          <Button onClick={handleOpenAddModal} variant="primary" icon={Plus} disabled={actionLoading}>
            Nieuwe Klas
          </Button>
        </div>

        {pageError && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircle size={20} className="mr-2" /> {pageError}
          </div>
        )}

        {!dataLoading && teachers.length === 0 ? (
            <div className="card text-center">
                <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Eerst leraren toevoegen</h3>
                <p className="text-gray-600 mb-4">U dient leraren toe te voegen voordat u klassen kunt aanmaken.</p>
                <Button onClick={() => navigate('/admin/teachers')} variant="primary">Naar Leraren</Button>
            </div>
        ) : !dataLoading && activeClasses.length === 0 ? (
          <div className="card text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen klassen</h3>
            <p className="text-gray-600">Klik op "Nieuwe Klas" om uw eerste klas aan te maken.</p>
          </div>
        ) : activeClasses.length > 0 ? (
          <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klasnaam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leraar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leerlingen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Omschrijving</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeClasses.map(cls => {
                  const teacherName = cls.teacher?.name || <span className="italic text-red-500">Geen</span>;
                  // De `students(count)` relatie in de backend `select` zou dit moeten vullen
                  const studentCount = cls.students?.[0]?.count ?? 0;

                  return (
                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacherName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{studentCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={cls.description}>{cls.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button onClick={() => handleOpenEditModal(cls)} variant="ghost" size="sm" className="p-1.5" title="Bewerken" disabled={actionLoading}><Edit3 size={16} /></Button>
                        {/* AANGEPAST: De knop roept nu de 'deactivate' functie aan */}
                        <Button onClick={() => handleDeactivateClass(cls)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Deactiveren" disabled={actionLoading}><Archive size={16} /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {showAddClassModal && (
            <AddClassModal
              isOpen={showAddClassModal}
              onClose={() => { setShowAddClassModal(false); setEditingClass(null); }}
              onSubmit={handleClassSubmit}
              teachers={teachers}
              initialData={editingClass}
              modalError={modalErrorText}
              isLoading={actionLoading}
          />
        )}
      </div>
    </AdminLayout>
  );

};


export default ClassesTab; // Zorg dat deze export er ook is.