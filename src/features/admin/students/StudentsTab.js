// src/features/admin/students/StudentsTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import AddStudentModal from './AddStudentModal';
import { Users as StudentIcon, Plus, Edit3, Trash2, UserCircle, BookOpen as ClassIcon, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const StudentsTab = () => {
  const { realData, loadData } = useData();
  const { users, students, classes, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const parents = users.filter(u => u.role === 'parent');

  useEffect(() => {
    if (dataError) setPageError(dataError); else setPageError('');
  }, [dataError]);

  const handleOpenAddModal = () => {
    if (parents.length === 0) {
      alert('Voeg eerst ouders toe voordat u leerlingen kunt aanmaken.');
      navigate('/admin/parents');
      return;
    }
    if (classes.length === 0) {
      alert('Voeg eerst klassen toe voordat u leerlingen kunt aanmaken.');
      navigate('/admin/classes');
      return;
    }
    setEditingStudent(null);
    setShowAddStudentModal(true);
    setModalErrorText('');
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setShowAddStudentModal(true);
    setModalErrorText('');
  };

  const handleStudentSubmit = async (studentDataFromModal) => {
    setModalErrorText('');
    if (!studentDataFromModal.name.trim() || !studentDataFromModal.parentId || !studentDataFromModal.classId) {
      setModalErrorText('Naam, ouder en klas zijn verplicht.');
      return false;
    }
    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar.");
      return false;
    }
    setActionLoading(true);

    try {
      const payload = {
        name: studentDataFromModal.name.trim(),
        parent_id: studentDataFromModal.parentId, // UUID string
        class_id: studentDataFromModal.classId,   // UUID string
        date_of_birth: studentDataFromModal.date_of_birth || null,
        emergency_contact: studentDataFromModal.emergency_contact || null,
        emergency_phone: studentDataFromModal.emergency_phone || null,
        notes: studentDataFromModal.notes || null,
      };

      let result;
      if (editingStudent) {
        // PUT naar /api/students/:studentId (BACKEND MOET DIT IMPLEMENTEREN)
        result = await apiCall(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        payload.mosque_id = mosque.id; // Vereist door je backend /api/students POST
        // POST naar /api/students
        result = await apiCall(`/api/students`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (result.success || result.student) {
        setShowAddStudentModal(false);
        setEditingStudent(null);
        await loadData(); // Belangrijk: laad opnieuw om amount_due update te zien
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon leerling niet verwerken.");
      }
    } catch (err) {
      console.error('Error submitting student:', err);
      setModalErrorText(err.message || `Fout bij het ${editingStudent ? 'bewerken' : 'toevoegen'} van de leerling.`);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteStudent = async (studentIdToDelete) => {
    if (!window.confirm("Weet u zeker dat u deze leerling wilt verwijderen? Dit zal ook invloed hebben op de 'te betalen bijdrage' van de ouder.")) return;
    if (!mosque || !mosque.id) { alert("Moskee informatie niet beschikbaar."); return; }
    setActionLoading(true);
    try {
      // DELETE naar /api/students/:studentId (BACKEND MOET DIT IMPLEMENTEREN)
      // Je backend moet ook de amount_due van de ouder bijwerken na verwijdering.
      const result = await apiCall(`/api/students/${studentIdToDelete}`, { method: 'DELETE' });
      if (result.success || response.status === 204) {
        await loadData(); // Belangrijk voor amount_due update
      } else {
        throw new Error(result.error || "Kon leerling niet verwijderen.");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
      setPageError(`Fout bij verwijderen van leerling: ${err.message}`);
    }
    setActionLoading(false);
  };

  if (dataLoading && !students.length) {
    return <LoadingSpinner message="Leerlingen laden..." />;
  }

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Leerlingenbeheer</h2>
        <Button onClick={handleOpenAddModal} variant="primary" icon={Plus} className="w-full sm:w-auto" disabled={actionLoading}>
          Nieuwe Leerling
        </Button>
      </div>

      {pageError && (
         <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      { (parents.length === 0 || classes.length === 0) && !dataLoading && students.length === 0 ? (
         <div className="card text-center">
          <StudentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Voorwaarden niet voldaan</h3>
          {parents.length === 0 && <p className="text-gray-600 mb-2">U dient eerst ouders toe te voegen.</p>}
          {classes.length === 0 && <p className="text-gray-600">U dient eerst klassen aan te maken.</p>}
          <div className="mt-4 space-x-2">
            {parents.length === 0 && <Button onClick={() => navigate('/admin/parents')} variant="secondary">Naar Ouders</Button>}
            {classes.length === 0 && <Button onClick={() => navigate('/admin/classes')} variant="secondary">Naar Klassen</Button>}
          </div>
        </div>
      ) : students.length === 0 && !dataLoading ? (
        <div className="card text-center">
          <StudentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen leerlingen</h3>
          <p className="text-gray-600">Voeg leerlingen toe en koppel ze aan ouders en klassen.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam Leerling</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ouder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geboortedatum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betalingsstatus Ouder</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => {
                // Je backend stuurt al geneste parent en class info mee
                const parentName = student.parent?.name || <span className="italic text-red-500">Geen</span>;
                const className = student.class?.name || <span className="italic text-gray-400">Geen</span>;
                const paymentInfo = student.parent_id ? calculateParentPaymentStatus(student.parent_id, users, payments) : null;
                
                let statusColorClass = 'text-gray-600 bg-gray-100';
                if (paymentInfo?.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
                else if (paymentInfo?.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
                else if (paymentInfo?.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={student.id}>{student.id.substring(0,8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="flex items-center"><ClassIcon size={16} className="mr-1.5 text-blue-500 flex-shrink-0"/>{className}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="flex items-center"><UserCircle size={16} className="mr-1.5 text-orange-500 flex-shrink-0"/>{parentName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('nl-NL') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {paymentInfo ? (
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-tight font-semibold rounded-full ${statusColorClass} capitalize`}>
                          {paymentInfo.paymentStatus.replace('_', ' ')}
                        </span>
                      ) : <span className="italic text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <Button onClick={() => handleOpenEditModal(student)} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1.5" title="Bewerken" disabled={actionLoading}> <Edit3 size={16} /> </Button>
                      <Button onClick={() => handleDeleteStudent(student.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Verwijderen" disabled={actionLoading}> <Trash2 size={16} /> </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddStudentModal && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => { setShowAddStudentModal(false); setEditingStudent(null); setModalErrorText(''); }}
          onSubmit={handleStudentSubmit}
          initialData={editingStudent}
          parents={parents} // Geef de lijst van ouders mee
          classes={classes} // Geef de lijst van klassen mee
          modalError={modalErrorText}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default StudentsTab;