// src/features/admin/parents/ParentsTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { generateTempPassword, sendUserWelcomeEmailViaBackend } from '../../../utils/authHelpers';
import { calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import AddParentModal from './AddParentModal';
import { Users, Plus, Edit3, Trash2, ChevronDown, ChevronUp, DollarSign, MessageSquare, AlertCircle, Info } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom'; // Voor navigatie naar betalingen

const ParentsTab = () => {
  const { realData, loadData } = useData();
  const { users, students, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedParentId, setExpandedParentId] = useState(null);
  const navigate = useNavigate();

  const parents = users.filter(u => u.role === 'parent');

  useEffect(() => {
    if (dataError) setPageError(dataError); else setPageError('');
  }, [dataError]);

  const handleOpenAddModal = () => {
    setEditingParent(null);
    setShowAddParentModal(true);
    setModalErrorText('');
  };

  const handleOpenEditModal = (parent) => {
    setEditingParent(parent);
    setShowAddParentModal(true);
    setModalErrorText('');
  };

  const handleParentSubmit = async (parentDataFromModal) => {
    setModalErrorText('');
    const requiredFields = ['name', 'email', 'phone', 'address', 'zipcode', 'city', 'amount_due_input']; // amount_due_input voor validatie
    for (const field of requiredFields) {
      if (!parentDataFromModal[field] || !String(parentDataFromModal[field]).trim()) {
        setModalErrorText(`Veld "${field === 'amount_due_input' ? 'Maandelijkse Bijdrage' : field}" is verplicht.`);
        return false;
      }
    }
    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar.");
      return false;
    }
    setActionLoading(true);

    try {
      let result;
      const payloadBase = {
        name: parentDataFromModal.name.trim(),
        email: parentDataFromModal.email.trim(),
        phone: parentDataFromModal.phone.trim(),
        address: parentDataFromModal.address.trim(),
        city: parentDataFromModal.city.trim(),
        zipcode: parentDataFromModal.zipcode.trim(),
        role: 'parent',
        amount_due: parseFloat(parentDataFromModal.amount_due_input) || 0,
      };

      if (editingParent) {
        result = await apiCall(`/api/users/${editingParent.id}`, { // Backend endpoint /api/users/:id voor PUT
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
        result = await apiCall(`/api/users`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if ((result.success || result.user) && parentDataFromModal.sendEmail) {
          if (mosque.m365_configured && mosque.m365_tenant_id && mosque.m365_client_id && mosque.m365_sender_email) {
            console.warn("Client Secret voor M365 email is nodig maar niet veilig beschikbaar hier. Overweeg backend-triggered email.");
            const m365ApiCredentials = {
                tenantId: mosque.m365_tenant_id,
                clientId: mosque.m365_client_id,
                clientSecret: "DE_M365_CLIENT_SECRET_HIER_VEILIG_VERKRIJGEN_OF_BACKEND_LATEN_DOEN", // ZEER BELANGRIJK AANDACHTSPUNT
                senderEmail: mosque.m365_sender_email,
            };
             if (m365ApiCredentials.clientSecret !== "DE_M365_CLIENT_SECRET_HIER_VEILIG_VERKRIJGEN_OF_BACKEND_LATEN_DOEN") {
                await sendUserWelcomeEmailViaBackend(
                    apiCall,
                    (result.user || result.data).name,
                    (result.user || result.data).email,
                    tempPassword,
                    mosque.name,
                    'parent',
                    m365ApiCredentials
                );
            } else {
                setModalErrorText(prev => (prev ? prev + " " : "") + "Ouder toegevoegd, maar welkomstmail kon niet worden verzonden (M365 secret niet beschikbaar).");
            }
          } else {
             setModalErrorText(prev => (prev ? prev + " " : "") + "Ouder toegevoegd, maar M365 is niet (volledig) geconfigureerd voor emails.");
          }
        }
      }

      if (result.success || result.user || result.data) {
        setShowAddParentModal(false);
        setEditingParent(null);
        await loadData();
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon ouder niet verwerken.");
      }
    } catch (err) {
      console.error('Error submitting parent:', err);
      setModalErrorText(err.message || `Fout bij het ${editingParent ? 'bewerken' : 'toevoegen'} van de ouder.`);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteParent = async (parentIdToDelete) => {
  // ... (confirm, mosque check, setActionLoading)

    try {
        const result = await apiCall(`/api/users/${parentIdToDelete}`, { method: 'DELETE' });
        // CORRECTIE HIER:
        if (result.success) {
        await loadData();
        } else {
        throw new Error(result.error || "Kon ouder niet verwijderen (onbekende fout).");
        }
    } catch (err) {
        console.error("Error deleting parent:", err);
        setPageError(`Fout bij verwijderen van ouder: ${err.message}`);
    }
    setActionLoading(false);
    };

  const toggleParentDetails = (parentId) => {
    setExpandedParentId(expandedParentId === parentId ? null : parentId);
  };

  if (dataLoading && !parents.length) {
    return <LoadingSpinner message="Ouders laden..." />;
  }

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Ouderbeheer</h2>
        <Button onClick={handleOpenAddModal} variant="primary" icon={Plus} className="w-full sm:w-auto" disabled={actionLoading}>
          Nieuwe Ouder
        </Button>
      </div>

      {pageError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      {parents.length === 0 && !dataLoading ? (
        <div className="card text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen ouders</h3>
          <p className="text-gray-600">Voeg ouders toe om leerlingen te kunnen koppelen en betalingen te beheren.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          {parents.map(parent => {
            const paymentInfo = calculateParentPaymentStatus(parent.id, users, payments);
            const parentStudents = students.filter(s => String(s.parent_id) === String(parent.id));
            const isExpanded = expandedParentId === parent.id;
            
            let statusColorClass = 'text-gray-600 bg-gray-100';
            if (paymentInfo.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
            else if (paymentInfo.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
            else if (paymentInfo.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

            return (
              <div key={parent.id} className={`border-b border-gray-200 last:border-b-0 transition-all duration-300 ease-in-out ${isExpanded ? 'bg-emerald-50 shadow-inner' : 'hover:bg-gray-50'}`}>
                <div className="px-4 py-3 sm:px-6 grid grid-cols-12 gap-x-4 gap-y-2 items-center cursor-pointer" onClick={() => toggleParentDetails(parent.id)}>
                  <div className="col-span-12 lg:col-span-4">
                    <h3 className="text-md font-semibold text-emerald-700 group-hover:text-emerald-800">{parent.name}</h3>
                    <p className="text-xs text-gray-500 truncate" title={parent.email}>{parent.email}</p>
                  </div>
                  <div className="col-span-6 sm:col-span-4 lg:col-span-3 text-xs text-gray-600">
                    <p className="truncate" title={parent.address}>{parent.address || '-'}</p>
                    <p>{parent.zipcode || ''} {parent.city || ''}</p>
                  </div>
                  <div className="col-span-3 sm:col-span-2 lg:col-span-1 text-sm text-center">
                    <span className="font-medium">{parentStudents.length}</span> <span className="text-xs">kind(eren)</span>
                  </div>
                  <div className={`col-span-3 sm:col-span-2 lg:col-span-2 text-xs font-medium text-center px-2.5 py-1 rounded-full ${statusColorClass} capitalize`}>
                    {paymentInfo.paymentStatus.replace('_', ' ')}
                  </div>
                  <div className="col-span-12 sm:col-span-4 lg:col-span-2 flex justify-end items-center space-x-1 mt-2 sm:mt-0">
                     <Button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(parent);}} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1.5" title="Bewerken" disabled={actionLoading}> <Edit3 size={16} /> </Button>
                     <Button onClick={(e) => { e.stopPropagation(); handleDeleteParent(parent.id);}} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Verwijderen" disabled={actionLoading}> <Trash2 size={16} /> </Button>
                     <span className="p-1.5 text-gray-400">{isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 py-4 sm:px-6 border-t border-emerald-200 bg-white space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Details voor {parent.name}:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                        <div><strong>Telefoon:</strong> {parent.phone || '-'}</div>
                        <div><strong>Verschuldigd:</strong> €{paymentInfo.amountDue}</div>
                        <div><strong>Betaald:</strong> €{paymentInfo.totalPaid}</div>
                        <div className={parseFloat(paymentInfo.remainingBalance) > 0 ? 'font-semibold text-red-600' : 'text-green-600'}>
                            <strong>Openstaand:</strong> €{paymentInfo.remainingBalance}
                        </div>
                        <div><strong>Account ID:</strong> <span className="font-mono truncate" title={parent.id}>{parent.id.substring(0,8)}...</span></div>
                        <div><strong>Geregistreerd op:</strong> {new Date(parent.created_at).toLocaleDateString('nl-NL')}</div>
                    </div>
                    {parentStudents.length > 0 && (
                        <div className="mt-2">
                            <h5 className="text-xs font-semibold text-gray-700 mb-0.5">Gekoppelde Kinderen:</h5>
                            <ul className="list-disc list-inside text-xs text-gray-600 pl-1">
                                {parentStudents.map(student => <li key={student.id}>{student.name}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="mt-3 flex space-x-2">
                        {/* TODO: Navigatie naar betalingen tab met filter op deze ouder */}
                        {/* <Button size="sm" variant="secondary" icon={DollarSign} onClick={() => navigate(`/admin/payments?parentId=${parent.id}`)}>Betalingen Bekijken</Button> */}
                        {/* <Button size="sm" variant="secondary" icon={MessageSquare}>Bericht Sturen</Button> */}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddParentModal && (
        <AddParentModal
          isOpen={showAddParentModal}
          onClose={() => { setShowAddParentModal(false); setEditingParent(null); setModalErrorText(''); }}
          onSubmit={handleParentSubmit}
          initialData={editingParent}
          modalError={modalErrorText}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ParentsTab;