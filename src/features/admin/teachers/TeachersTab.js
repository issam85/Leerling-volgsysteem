// src/features/admin/teachers/TeachersTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { generateTempPassword } from '../../../utils/authHelpers';
import AdminLayout from '../../../layouts/AdminLayout';
import Button from '../../../components/Button';
import AddTeacherModal from './AddTeacherModal';
import { Users, Plus, Edit3, Trash2, KeyRound, AlertCircle, Crown, Lock } from 'lucide-react';
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
  
  // ✅ TRIAL LIMIT LOGIC
  const isTrialMosque = mosque?.subscription_type === 'trial';
  const maxTeachersForTrial = 2;
  const currentTeacherCount = teachers.length;
  const isAtTeacherLimit = isTrialMosque && currentTeacherCount >= maxTeachersForTrial;
  const canAddMoreTeachers = !isTrialMosque || currentTeacherCount < maxTeachersForTrial;

  useEffect(() => {
    if (dataError) {
        setPageError(dataError);
        setPageMessage({ type: '', text: '' });
    } else {
        setPageError('');
    }
  }, [dataError]);

  const handleOpenAddModal = () => {
    // ✅ Prevent opening modal if at limit
    if (isAtTeacherLimit) {
      setPageMessage({ 
        type: 'error', 
        text: `Trial versie beperkt tot maximaal ${maxTeachersForTrial} leraren. Upgrade naar een betaald abonnement voor meer leraren.` 
      });
      return;
    }

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

    const requiredFields = ['name', 'email'];
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

    // ✅ Double-check limit before creating new teacher
    if (!editingTeacher && isAtTeacherLimit) {
      setModalErrorText(`Trial versie beperkt tot maximaal ${maxTeachersForTrial} leraren. Upgrade voor meer leraren.`);
      return false;
    }

    setActionLoading(true);

    try {
      let result;
      const payloadBase = {
        name: teacherDataFromModal.name.trim(),
        email: teacherDataFromModal.email.trim(),
        phone: teacherDataFromModal.phone?.trim() || null,
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
        };
        result = await apiCall(`/api/users`, { method: 'POST', body: JSON.stringify(payload) });
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
      
      // ✅ Handle specific backend limit error
      if (err.message && err.message.includes('limiet') || err.message.includes('TEACHER_LIMIT_REACHED')) {
        setModalErrorText(`Trial versie beperkt tot maximaal ${maxTeachersForTrial} leraren. Upgrade naar een betaald abonnement voor meer leraren.`);
      } else {
        setModalErrorText(err.message || `Fout bij het ${editingTeacher ? 'bewerken' : 'toevoegen'} van de leraar.`);
      }
      
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

  // ✅ Helper function to render trial limitation notice
  const renderTrialLimitNotice = () => {
    if (!isTrialMosque) return null;

    return (
      <div className={`p-4 rounded-lg border-2 ${isAtTeacherLimit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} mb-6`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isAtTeacherLimit ? (
              <Lock className="h-6 w-6 text-red-600" />
            ) : (
              <Crown className="h-6 w-6 text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${isAtTeacherLimit ? 'text-red-800' : 'text-amber-800'}`}>
              Trial Versie - Leraren Limiet
            </h3>
            <div className="mt-1">
              <p className={`text-sm ${isAtTeacherLimit ? 'text-red-700' : 'text-amber-700'}`}>
                <span className="font-medium">{currentTeacherCount} van {maxTeachersForTrial}</span> leraren gebruikt.
                {isAtTeacherLimit && ' U heeft de limiet bereikt.'}
              </p>
              {isAtTeacherLimit && (
                <p className="text-sm text-red-700 mt-1">
                  Upgrade naar een betaald abonnement om meer leraren toe te voegen.
                </p>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Leraren gebruikt</span>
                <span>{currentTeacherCount}/{maxTeachersForTrial}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isAtTeacherLimit ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min((currentTeacherCount / maxTeachersForTrial) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (dataLoading && (!teachers || teachers.length === 0)) {
    return <LoadingSpinner message="Leraren laden..." />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {actionLoading && <LoadingSpinner message="Bezig..." />}
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="page-title">Leraren Beheer</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {/* ✅ Show current count for admins */}
            {isTrialMosque && (
              <span className="text-sm text-gray-600 font-medium">
                {currentTeacherCount}/{maxTeachersForTrial} leraren
              </span>
            )}
            <Button 
              onClick={handleOpenAddModal} 
              variant={isAtTeacherLimit ? "disabled" : "primary"} 
              icon={isAtTeacherLimit ? Lock : Plus} 
              className="w-full sm:w-auto" 
              disabled={actionLoading || isAtTeacherLimit}
              title={isAtTeacherLimit ? `Trial limiet bereikt (${maxTeachersForTrial} leraren max)` : "Nieuwe leraar toevoegen"}
            >
              {isAtTeacherLimit ? 'Limiet bereikt' : 'Nieuwe Leraar'}
            </Button>
          </div>
        </div>

        {/* ✅ Trial limitation notice */}
        {renderTrialLimitNotice()}

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
            <p className="text-gray-600">
              {isTrialMosque 
                ? `Voeg tot ${maxTeachersForTrial} leraren toe in de trial versie.`
                : "Voeg leraren toe om klassen aan te kunnen maken."
              }
            </p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={teacher.id}>
                      {teacher.id.substring(0,8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {teacher.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.phone || '-'}
                    </td>
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
                      <Button 
                        onClick={() => handleOpenEditModal(teacher)} 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800 p-1.5" 
                        title="Bewerken" 
                        disabled={actionLoading}
                      > 
                        <Edit3 size={16} /> 
                      </Button>
                      <Button 
                        onClick={() => handleDeleteTeacher(teacher.id)} 
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
            modalError={modalErrorText}
            isLoading={actionLoading}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default TeachersTab;