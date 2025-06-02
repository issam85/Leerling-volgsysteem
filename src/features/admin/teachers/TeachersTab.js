// src/features/admin/teachers/TeachersTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { generateTempPassword, sendUserWelcomeEmailViaBackend } from '../../../utils/authHelpers';
import Button from '../../../components/Button';
import AddTeacherModal from './AddTeacherModal';
import { User as UserIcon, Plus, Edit3, Trash2, Mail, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

const TeachersTab = () => {
  const { realData, loadData } = useData();
  const { users, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const teachers = users.filter(u => u.role === 'teacher');

  useEffect(() => {
    if (dataError) setPageError(dataError); else setPageError('');
  }, [dataError]);

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setShowAddTeacherModal(true);
    setModalErrorText('');
  };

  const handleOpenEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setShowAddTeacherModal(true);
    setModalErrorText('');
  };

  const handleTeacherSubmit = async (teacherDataFromModal) => {
    setModalErrorText('');
    if (!teacherDataFromModal.name.trim() || !teacherDataFromModal.email.trim()) {
      setModalErrorText('Naam en email zijn verplicht.');
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
        role: 'teacher',
        // Andere velden zoals phone, address kunnen hier ook als ze in AddTeacherModal zijn
      };

      if (editingTeacher) {
        // PUT request naar /api/users/:userId (ZORG DAT DIT ENDPOINT BESTAAT IN BACKEND)
        // Zorg dat je backend de mosque_id check doet of dat de user bij de mosque hoort
        result = await apiCall(`/api/users/${editingTeacher.id}`, {
          method: 'PUT',
          body: JSON.stringify(payloadBase),
        });
      } else {
        const tempPassword = generateTempPassword();
        const payload = {
          ...payloadBase,
          password: tempPassword,
          mosque_id: mosque.id, // Vereist door je backend /api/users POST
        };
        // POST request naar /api/users
        result = await apiCall(`/api/users`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        // Je backend geeft { success: true, user: ... } terug
        if ((result.success || result.user) && teacherDataFromModal.sendEmail) {
          // Stuur welkomstmail
          if (mosque.m365_configured && mosque.m365_tenant_id && mosque.m365_client_id && mosque.m365_sender_email) {
            // Client Secret is hier het probleem. Je backend /api/send-email-m365 verwacht het.
            // De frontend zou de secret niet moeten bewaren.
            // OPLOSSING: Je backend /api/users POST endpoint kan de email direct triggeren na user creatie,
            // gebruikmakend van de opgeslagen M365 secret.
            // OF: De frontend moet de secret (tijdelijk) hebben na M365 configuratie om mee te sturen.
            // Voor nu: aanname dat je de secret *ergens* vandaan haalt voor de API call.
            // Dit is een placeholder, want 'DE_M365_CLIENT_SECRET_HIER' is niet correct.
            console.warn("Client Secret voor M365 email is nodig maar niet veilig beschikbaar hier. Overweeg backend-triggered email.");
            const m365ApiCredentials = {
                tenantId: mosque.m365_tenant_id,
                clientId: mosque.m365_client_id,
                clientSecret: "DE_M365_CLIENT_SECRET_HIER_VEILIG_VERKRIJGEN_OF_BACKEND_LATEN_DOEN", // ZEER BELANGRIJK AANDACHTSPUNT
                senderEmail: mosque.m365_sender_email,
            };
            if (m365ApiCredentials.clientSecret !== "DE_M365_CLIENT_SECRET_HIER_VEILIG_VERKRIJGEN_OF_BACKEND_LATEN_DOEN") { // Alleen als secret echt is verkregen
                 await sendUserWelcomeEmailViaBackend(
                    apiCall,
                    (result.user || result.data).name, // Afhankelijk van backend response structuur
                    (result.user || result.data).email,
                    tempPassword,
                    mosque.name,
                    'teacher',
                    m365ApiCredentials
                );
            } else {
                 setModalErrorText(prev => (prev ? prev + " " : "") + "Leraar toegevoegd, maar welkomstmail kon niet worden verzonden (M365 secret niet beschikbaar).");
            }

          } else {
            setModalErrorText(prev => (prev ? prev + " " : "") + "Leraar toegevoegd, maar M365 is niet (volledig) geconfigureerd voor emails.");
          }
        }
      }

      if (result.success || result.user || result.data) {
        setShowAddTeacherModal(false);
        setEditingTeacher(null);
        await loadData();
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
    // TODO: Check of leraar nog aan klassen gekoppeld is
    if (!window.confirm("Weet u zeker dat u deze leraar wilt verwijderen?")) return;
    if (!mosque || !mosque.id) { alert("Moskee informatie niet beschikbaar."); return;}
    setActionLoading(true);
    try {
      // DELETE request naar /api/users/:userId (ZORG DAT DIT ENDPOINT BESTAAT IN BACKEND)
      const result = await apiCall(`/api/users/${teacherIdToDelete}`, { method: 'DELETE' });
      if (result.success || response.status === 204) {
        await loadData();
      } else {
         throw new Error(result.error || "Kon leraar niet verwijderen.");
      }
    } catch (err) {
      console.error("Error deleting teacher:", err);
      setPageError(`Fout bij verwijderen van leraar: ${err.message}`);
    }
    setActionLoading(false);
  };


  if (dataLoading && !teachers.length) {
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

      {pageError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      {teachers.length === 0 && !dataLoading ? (
        <div className="card text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen leraren</h3>
          <p className="text-gray-600">Voeg leraren toe om klassen en leerlingen te kunnen beheren.</p>
        </div>
      ) : (
        <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefoon</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={teacher.id}>{teacher.id.substring(0,8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button onClick={() => handleOpenEditModal(teacher)} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1.5" title="Bewerken" disabled={actionLoading}> <Edit3 size={16} /> </Button>
                    {/* TODO: Knop om welkomstmail opnieuw te sturen? */}
                    <Button onClick={() => handleDeleteTeacher(teacher.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Verwijderen" disabled={actionLoading}> <Trash2 size={16} /> </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
  );
};

export default TeachersTab;