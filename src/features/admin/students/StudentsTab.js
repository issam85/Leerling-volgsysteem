// src/features/admin/students/StudentsTab.js - Complete Updated Version
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import AddStudentModal from './AddStudentModal';
import { Users as StudentIcon, Plus, Edit3, Trash2, UserCircle, BookOpen as ClassIcon, AlertCircle, Calendar } from 'lucide-react';
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
  const [pageMessage, setPageMessage] = useState({ type: '', text: '' });
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const navigate = useNavigate();

  const parents = users ? users.filter(u => u.role === 'parent') : [];

  useEffect(() => {
    if (dataError) {
      setPageError(dataError);
      setPageMessage({ type: '', text: '' });
    } else {
      setPageError('');
    }
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
    setPageMessage({ type: '', text: '' });
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setShowAddStudentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleStudentSubmit = async (studentDataFromModal) => {
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
    
    // Validation
    const requiredFields = ['name', 'parentId', 'classId'];
    for (const field of requiredFields) {
      if (!studentDataFromModal[field] || !String(studentDataFromModal[field]).trim()) {
        let fieldLabel = field;
        if (field === 'parentId') fieldLabel = 'Ouder';
        if (field === 'classId') fieldLabel = 'Klas';
        setModalErrorText(`Veld "${fieldLabel}" is verplicht.`);
        return false;
      }
    }

    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar. Kan actie niet uitvoeren.");
      return false;
    }
    
    setActionLoading(true);

    try {
        let result;
        const payload = {
            name: studentDataFromModal.name.trim(),
            parent_id: studentDataFromModal.parentId,
            class_id: studentDataFromModal.classId,
            date_of_birth: studentDataFromModal.date_of_birth || null,
            emergency_contact: studentDataFromModal.emergency_contact || null,
            emergency_phone: studentDataFromModal.emergency_phone || null,
            notes: studentDataFromModal.notes || null,
        };

        if (editingStudent) {
            // Include old parent_id for recalculation if changed
            if (editingStudent.parent_id !== payload.parent_id) {
                payload.parent_id_before_update = editingStudent.parent_id;
            }
            // UPDATED: Use correct endpoint
            result = await apiCall(`/api/students/${editingStudent.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            payload.mosque_id = mosque.id;
            // UPDATED: Use correct endpoint
            result = await apiCall(`/api/students`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        if (result.success || result.student || result.data) {
            setShowAddStudentModal(false);
            setEditingStudent(null);
            await loadData(); // Important: reload to see amount_due update
            setPageMessage({ 
                type: 'success', 
                text: `Leerling succesvol ${editingStudent ? 'bewerkt' : 'toegevoegd'}.` 
            });
            setActionLoading(false);
            return true;
        } else {
            throw new Error(result.error || "Kon leerling niet verwerken. Onbekende fout van server.");
        }
    } catch (err) {
        console.error('Error submitting student:', err);
        setModalErrorText(err.message || `Fout bij het ${editingStudent ? 'bewerken' : 'toevoegen'} van de leerling.`);
        setActionLoading(false);
        return false;
    }
  };

  const handleDeleteStudent = async (studentIdToDelete) => {
    if (!window.confirm("Weet u zeker dat u deze leerling wilt verwijderen? Dit zal ook de bijdrage van de ouder herberekenen.")) {
        return;
    }
    
    if (!mosque || !mosque.id) {
        setPageError("Moskee informatie niet beschikbaar. Kan actie niet uitvoeren.");
        return;
    }
    
    setActionLoading(true);
    setPageError('');
    setPageMessage({ type: '', text: '' });
    
    try {
        // UPDATED: Use correct endpoint  
        const result = await apiCall(`/api/students/${studentIdToDelete}`, { 
            method: 'DELETE' 
        });
        
        if (result.success) {
            await loadData();
            setPageMessage({ type: 'success', text: 'Leerling succesvol verwijderd.' });
        } else {
            throw new Error(result.error || "Kon leerling niet verwijderen (onbekende fout).");
        }
    } catch (err) {
        console.error("Error deleting student:", err);
        setPageError(`Fout bij verwijderen van leerling: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  // NEW FUNCTION: View attendance history
  const viewAttendanceHistory = async (studentId) => {
    try {
        setActionLoading(true);
        const response = await apiCall(`/api/students/${studentId}/attendance-history?limit=20`);
        
        // Store the history and show modal
        setAttendanceHistory({
            [studentId]: response || []
        });
        setShowAttendanceModal(true);
        
        console.log('Attendance history loaded:', response);
    } catch (error) {
        console.error('Fout bij ophalen attendance history:', error);
        setPageError(`Fout bij ophalen aanwezigheidsgeschiedenis: ${error.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  if (dataLoading && (!students || students.length === 0)) {
    return <LoadingSpinner message="Leerlingen laden..." />;
  }

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Leerlingenbeheer</h2>
        <Button 
          onClick={handleOpenAddModal} 
          variant="primary" 
          icon={Plus} 
          className="w-full sm:w-auto" 
          disabled={actionLoading}
        >
          Nieuwe Leerling
        </Button>
      </div>

      {pageMessage.text && (
        <div className={`my-4 p-3 rounded-md text-sm ${
          pageMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {pageMessage.text}
        </div>
      )}

      {pageError && (
         <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      {(parents.length === 0 || classes.length === 0) && !dataLoading && (!students || students.length === 0) ? (
         <div className="card text-center">
          <StudentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Voorwaarden niet voldaan</h3>
          {parents.length === 0 && <p className="text-gray-600 mb-2">U dient eerst ouders toe te voegen.</p>}
          {classes.length === 0 && <p className="text-gray-600">U dient eerst klassen aan te maken.</p>}
          <div className="mt-4 space-x-2">
            {parents.length === 0 && (
              <Button onClick={() => navigate('/admin/parents')} variant="secondary">
                Naar Ouders
              </Button>
            )}
            {classes.length === 0 && (
              <Button onClick={() => navigate('/admin/classes')} variant="secondary">
                Naar Klassen
              </Button>
            )}
          </div>
        </div>
      ) : (!students || students.length === 0) && !dataLoading ? (
        <div className="card text-center">
          <StudentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen leerlingen</h3>
          <p className="text-gray-600">Voeg leerlingen toe en koppel ze aan ouders en klassen.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam Leerling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ouder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geboortedatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betalingsstatus Ouder
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students && students.map(student => {
                  // Backend sends nested parent and class info
                  const parentName = student.parent?.name || <span className="italic text-red-500">Geen</span>;
                  const className = student.class?.name || <span className="italic text-gray-400">Geen</span>;
                  const paymentInfo = student.parent_id ? calculateParentPaymentStatus(student.parent_id, users, payments) : null;
                  
                  let statusColorClass = 'text-gray-600 bg-gray-100';
                  if (paymentInfo?.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
                  else if (paymentInfo?.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
                  else if (paymentInfo?.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={student.id}>
                        {student.id ? student.id.substring(0,8) + '...' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="flex items-center">
                            <ClassIcon size={16} className="mr-1.5 text-blue-500 flex-shrink-0"/>
                            {className}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="flex items-center">
                            <UserCircle size={16} className="mr-1.5 text-orange-500 flex-shrink-0"/>
                            {parentName}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {student.date_of_birth 
                            ? new Date(student.date_of_birth).toLocaleDateString('nl-NL') 
                            : '-'
                          }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {paymentInfo ? (
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-tight font-semibold rounded-full ${statusColorClass} capitalize`}>
                            {paymentInfo.paymentStatus.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="italic text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button 
                          onClick={() => viewAttendanceHistory(student.id)}
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-800 p-1.5" 
                          title="Bekijk aanwezigheid" 
                          disabled={actionLoading}
                        > 
                          <Calendar size={16} /> 
                        </Button>
                        <Button 
                          onClick={() => handleOpenEditModal(student)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800 p-1.5" 
                          title="Bewerken" 
                          disabled={actionLoading}
                        > 
                          <Edit3 size={16} /> 
                        </Button>
                        <Button 
                          onClick={() => handleDeleteStudent(student.id)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800 p-1.5" 
                          title="Verwijderen" 
                          disabled={actionLoading}
                        > 
                          <Trash2 size={16} /> 
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => { 
            setShowAddStudentModal(false); 
            setEditingStudent(null); 
            setModalErrorText(''); 
          }}
          onSubmit={handleStudentSubmit}
          initialData={editingStudent}
          parents={parents}
          classes={classes}
          modalError={modalErrorText}
          isLoading={actionLoading}
        />
      )}

      {/* Attendance History Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Aanwezigheidsgeschiedenis</h3>
              <Button
                onClick={() => setShowAttendanceModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-2">
              {Object.values(attendanceHistory)[0]?.length > 0 ? (
                Object.values(attendanceHistory)[0].map((record, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">
                      {new Date(record.les?.les_datum).toLocaleDateString('nl-NL')}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      record.status === 'aanwezig' ? 'bg-green-100 text-green-800' :
                      record.status === 'te_laat' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Geen aanwezigheidsgegevens beschikbaar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsTab;