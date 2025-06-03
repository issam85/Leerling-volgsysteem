// src/features/admin/teachers/TeachersTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { generateTempPassword } from '../../../utils/authHelpers'; // Als je ook hier een welkomstmail zou sturen
import Button from '../../../components/Button';
import AddTeacherModal from './AddTeacherModal'; // Aangenomen dat je deze hebt
import { Users, Plus, Edit3, Trash2, KeyRound, AlertCircle } from 'lucide-react'; // KeyRound toegevoegd
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';


const TeachersTab = () => {
  const { realData, loadData } = useData();
  const { users, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pageMessage, setPageMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const teachers = users ? users.filter(u => u.role === 'teacher') : [];

  useEffect(() => {
    if (dataError) {
        setPageError(dataError);
        setPageMessage({ type: '', text: '' });
    } else {
        setPageError('');
    }
  }, [dataError]);

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setShowAddTeacherModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleOpenEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setShowAddTeacherModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleTeacherSubmit = async (teacherDataFromModal) => {
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
    console.log("[TeachersTab] teacherDataFromModal received:", JSON.stringify(teacherDataFromModal, null, 2));

    const requiredFields = ['name', 'email']; // Pas aan indien nodig
    for (const field of requiredFields) {
      if (!teacherDataFromModal[field] || !String(teacherDataFromModal[field]).trim()) {
        setModalErrorText(`Veld "${field.charAt(0).toUpperCase() + field.slice(1)}" is verplicht.`);
        return false;
      }
    }
    if (!/\S+@\S+\.\S+/.test(teacherDataFromModal.email.trim())) {
      setModalErrorText('Voer een geldig emailadres in.');
      return false;
    }

    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar.");
      return false;
    }
    setActionLoading(true);

    try {
      let result;
      const payloadBase = {
        name: teacherDataFromModal.name.trim(),
        email: teacherDataFromModal.email.trim(),
        phone: teacherDataFromModal.phone?.trim() || null, // Optioneel veld
        role: 'teacher',
      };

      if (editingTeacher) {
        result = await apiCall(`/api/users/${editingTeacher.id}`, {
          method: 'PUT',
          body: JSON.stringify(payloadBase),
        });
      } else {
        const tempPassword = generateTempPassword();
        const payload = { 
            ...payloadBase, 
            password: tempPassword, 
            mosque_id: mosque.id,
            // Stuur 'sendWelcomeEmail' mee als je die checkbox ook voor leraren hebt
            // sendWelcomeEmail: teacherDataFromModal.sendEmail 
        };
        result = await apiCall(`/api/users`, { method: 'POST', body: JSON.stringify(payload) });
        // Optioneel: Logica voor welkomstmail voor leraren, vergelijkbaar met ParentsTab,
        // maar de backend /api/users route stuurt nu alleen mail voor 'parent' rol.
        // Je zou de backend moeten aanpassen als leraren ook een automatische welkomstmail moeten krijgen.
      }

      if (result.success || result.user || result.data) {
        setShowAddTeacherModal(false);
        setEditingTeacher(null);
        await loadData();
        setPageMessage({ type: 'success', text: `Leraar succesvol ${editingTeacher ? 'bewerkt' : 'toegevoegd'}.` });
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon leraar niet verwerken.");
      }
    } catch (err) {
      console.error('Error submitting teacher:', err);
      setModalErrorText(err.message || `Fout bij het ${editingTeacher ? 'bewerken' : 'toevoegen'} van de leraar.`);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteTeacher = async (teacherIdToDelete) => {
    if (!window.confirm("Weet u zeker dat u deze leraar wilt verwijderen? Gekoppelde klassen zullen handmatig een nieuwe leraar moeten krijgen.")) return;
    
    setActionLoading(true);
    setPageError('');
    setPageMessage({ type: '', text: '' });
    try {
      const result = await apiCall(`/api/users/${teacherIdToDelete}`, { method: 'DELETE' });
      if (result.success) {
        await loadData();
        setPageMessage({ type: 'success', text: 'Leraar succesvol verwijderd.' });
      } else {
        throw new Error(result.error || "Kon leraar niet verwijderen.");
      }
    } catch (err) {
      console.error("Error deleting teacher:", err);
      setPageError(`Fout bij verwijderen van leraar: ${err.message}`);
    }
    setActionLoading(false);
  };

  const handleSendNewPassword = async (teacher) => {
    if (!window.confirm(`Weet u zeker dat u een nieuw tijdelijk wachtwoord wilt sturen naar ${teacher.name} (${teacher.email})? De leraar moet hiermee opnieuw inloggen en het wachtwoord wijzigen.`)) {
      return;
    }
    setActionLoading(true);
    setPageMessage({ type: '', text: '' });
    try {
      const result = await apiCall(`/api/users/${teacher.id}/send-new-password`, { method: 'POST' });
      if (result.success) {
        setPageMessage({ type: 'success', text: result.message });
      } else {
        let errMsg = result.error || 'Kon nieuw wachtwoord niet versturen.';
        if (result.details?.newPasswordForManualDelivery) {
            errMsg += ` U kunt het wachtwoord handmatig doorgeven: ${result.details.newPasswordForManualDelivery}`;
        }
        setPageMessage({ type: 'error', text: errMsg });
      }
    } catch (err) {
      console.error("Error sending new password to teacher:", err);
      setPageMessage({ type: 'error', text: `Fout bij versturen nieuw wachtwoord: ${err.message}` });
    }
    setActionLoading(false);
  };

  if (dataLoading && (!teachers || teachers.length === 0)) {
    return <LoadingSpinner message="Leraren laden..." />;
  }

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Leraren Beheer</h2>
        <Button onClick={handleOpenAddModal} variant="primary" icon={Plus} className="w-full sm:w-auto" disabled={actionLoading}>
          Nieuwe Leraar
        </Button>
      </div>

      {pageMessage.text && (
        <div className={`my-4 p-3 rounded-md text-sm ${pageMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {pageMessage.text}
        </div>
      )}

      {pageError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      {!dataLoading && teachers && teachers.length === 0 ? (
        <div className="card text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen leraren</h3>
          <p className="text-gray-600">Voeg leraren toe om klassen aan te kunnen maken.</p>
        </div>
      ) : teachers && teachers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefoon</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={teacher.id}>{teacher.id.substring(0,8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button 
                        onClick={() => handleSendNewPassword(teacher)} 
                        variant="ghost" 
                        size="sm" 
                        className="text-orange-600 hover:text-orange-800 p-1.5" 
                        title="Nieuw wachtwoord sturen"
                        disabled={actionLoading}
                    >
                        <KeyRound size={16} />
                    </Button>
                    <Button onClick={() => handleOpenEditModal(teacher)} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1.5" title="Bewerken" disabled={actionLoading}> <Edit3 size={16} /> </Button>
                    <Button onClick={() => handleDeleteTeacher(teacher.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Verwijderen" disabled={actionLoading}> <Trash2 size={16} /> </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showAddTeacherModal && (
        <AddTeacherModal
          isOpen={showAddTeacherModal}
          onClose={() => { setShowAddTeacherModal(false); setEditingTeacher(null); setModalErrorText(''); }}
          onSubmit={handleTeacherSubmit}
          initialData={editingTeacher}
          modalError={modalErrorText} // Property naam consistent houden
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default TeachersTab;