// src/features/admin/parents/ParentsTab.js
import React, { useState, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { generateTempPassword } from '../../../utils/authHelpers';
import { calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import AddParentModal from './AddParentModal';
import { Users, Plus, Edit3, Trash2, ChevronDown, ChevronUp, AlertCircle, KeyRound } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

// Helper functie om valuta te formatteren en NaN/null/undefined te voorkomen
const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (!isNaN(number)) {
    return number.toFixed(2);
  }
  return '0.00'; // Fallback waarde als het geen geldig getal is
};

const ParentsTab = () => {
  const { realData, loadData } = useData();
  const { users, students, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedParentId, setExpandedParentId] = useState(null);
  const [pageMessage, setPageMessage] = useState({ type: '', text: '' }); // Voor feedbackberichten
  const navigate = useNavigate();

  const parents = users ? users.filter(u => u.role === 'parent') : [];

  useEffect(() => {
    if (dataError) {
      setPageError(dataError);
      setPageMessage({ type: '', text: '' }); // Reset page message on new data error
    } else {
      setPageError('');
    }
  }, [dataError]);

  const handleOpenAddModal = () => {
    setEditingParent(null);
    setShowAddParentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' }); // Reset page message
  };

  const handleOpenEditModal = (parent) => {
    setEditingParent(parent);
    setShowAddParentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' }); // Reset page message
  };

  const handleParentSubmit = async (parentDataFromModal) => {
    setModalErrorText('');
    setPageMessage({ type: '', text: '' }); 
    console.log("[ParentsTab] parentDataFromModal received for submit:", JSON.stringify(parentDataFromModal, null, 2));

    const requiredFields = ['name', 'email', 'phone', 'address', 'zipcode', 'city'];
    for (const field of requiredFields) {
      if (!parentDataFromModal[field] || !String(parentDataFromModal[field]).trim()) {
        let fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
        if (field === 'zipcode') fieldLabel = 'Postcode';
        setModalErrorText(`Veld "${fieldLabel}" is verplicht.`);
        return false;
      }
    }
    if (!/\S+@\S+\.\S+/.test(parentDataFromModal.email.trim())) {
      setModalErrorText('Voer een geldig emailadres in.');
      return false;
    }

    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar. Kan actie niet uitvoeren.");
      return false;
    }
    setActionLoading(true);

    try {
      let result;
      const payloadBase = {
        name: parentDataFromModal.name.trim(),
        email: parentDataFromModal.email.trim().toLowerCase(),
        phone: parentDataFromModal.phone.trim(),
        address: parentDataFromModal.address.trim(),
        city: parentDataFromModal.city.trim(),
        zipcode: parentDataFromModal.zipcode.trim().toUpperCase(),
        role: 'parent',
      };

      if (editingParent) {
        // PUT naar /api/users/:id - Geverifieerd endpoint
        result = await apiCall(`/api/users/${editingParent.id}`, {
          method: 'PUT',
          body: JSON.stringify(payloadBase),
        });
      } else {
        const tempPassword = generateTempPassword();
        const payload = { 
            ...payloadBase, 
            password: tempPassword, 
            mosque_id: mosque.id,
            sendWelcomeEmail: parentDataFromModal.sendEmail 
        };
        // POST naar /api/users - Geverifieerd endpoint
        result = await apiCall(`/api/users`, { method: 'POST', body: JSON.stringify(payload) });
      }

      if (result.success || result.user || result.data) {
        setShowAddParentModal(false);
        setEditingParent(null);
        await loadData(); 
        setPageMessage({ type: 'success', text: `Ouder succesvol ${editingParent ? 'bewerkt' : 'toegevoegd'}.` });
        setActionLoading(false);
        return true; 
      } else {
        throw new Error(result.error || "Kon ouder niet verwerken. Onbekende fout van server.");
      }
    } catch (err) {
      console.error('Error submitting parent:', err);
      setModalErrorText(err.message || `Fout bij het ${editingParent ? 'bewerken' : 'toevoegen'} van de ouder.`);
      setActionLoading(false);
      return false; 
    }
  };

  const handleDeleteParent = async (parentIdToDelete) => {
    const parentStudents = students ? students.filter(s => String(s.parent_id) === String(parentIdToDelete)) : [];
    let confirmMessage = "Weet u zeker dat u deze ouder wilt verwijderen?";
    if (parentStudents.length > 0) {
        confirmMessage += ` Deze ouder heeft ${parentStudents.length} leerling(en) geregistreerd. Deze koppeling(en) zullen verbroken worden en de bijdrage wordt herberekend.`;
    }
    if (!window.confirm(confirmMessage)) return;
    
    if (!mosque || !mosque.id) { 
      setPageError("Moskee informatie niet beschikbaar. Kan actie niet uitvoeren."); 
      return;
    }
    setActionLoading(true);
    setPageError('');
    setPageMessage({ type: '', text: '' });
    
    try {
      // DELETE naar /api/users/:id - Geverifieerd endpoint
      const result = await apiCall(`/api/users/${parentIdToDelete}`, { method: 'DELETE' });
      if (result.success) {
        await loadData();
        setPageMessage({ type: 'success', text: 'Ouder succesvol verwijderd.' });
      } else {
        throw new Error(result.error || "Kon ouder niet verwijderen.");
      }
    } catch (err) {
      console.error("Error deleting parent:", err);
      setPageError(`Fout bij verwijderen van ouder: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNewPassword = async (parent) => {
    if (!window.confirm(`Weet u zeker dat u een nieuw tijdelijk wachtwoord wilt sturen naar ${parent.name} (${parent.email})? De ouder moet hiermee opnieuw inloggen en het wachtwoord wijzigen.`)) {
      return;
    }
    setActionLoading(true);
    setPageMessage({ type: '', text: '' }); 
    
    try {
      // POST naar /api/users/:userId/send-new-password - Geverifieerd endpoint
      const result = await apiCall(`/api/users/${parent.id}/send-new-password`, { method: 'POST' });
      
      if (result.success) {
        setPageMessage({ type: 'success', text: result.message });
      } else {
        let errMsg = result.error || 'Kon nieuw wachtwoord niet versturen.';
        if (result.details?.newPasswordForManualDelivery) {
            errMsg += ` U kunt het wachtwoord handmatig doorgeven: ${result.details.newPasswordForManualDelivery}`;
        }
        setPageMessage({ type: 'error', text: errMsg });
      }
      
      // Extra check voor handmatige levering (voor development)
      if (result.details?.newPasswordForManualDelivery) {
        alert(`Wachtwoord voor handmatige levering: ${result.details.newPasswordForManualDelivery}`);
      }
    } catch (err) {
      console.error("Error sending new password to parent:", err);
      setPageMessage({ type: 'error', text: `Fout bij versturen nieuw wachtwoord: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleParentDetails = (parentId) => {
    setExpandedParentId(expandedParentId === parentId ? null : parentId);
  };

  if (dataLoading && (!parents || parents.length === 0)) {
    return <LoadingSpinner message="Ouders laden..." />;
  }

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Ouderbeheer</h2>
        <Button 
          onClick={handleOpenAddModal} 
          variant="primary" 
          icon={Plus} 
          className="w-full sm:w-auto" 
          disabled={actionLoading}
        >
          Nieuwe Ouder
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

      {!dataLoading && parents && parents.length === 0 ? (
        <div className="card text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen ouders</h3>
          <p className="text-gray-600">Voeg ouders toe om leerlingen te kunnen koppelen en betalingen te beheren.</p>
        </div>
      ) : parents && parents.length > 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          {parents.map(parent => {
            const paymentInfo = calculateParentPaymentStatus(parent.id, users, payments);
            const parentStudents = students ? students.filter(s => String(s.parent_id) === String(parent.id)) : [];
            const isExpanded = expandedParentId === parent.id;
            
            let statusColorClass = 'text-gray-600 bg-gray-100';
            if (paymentInfo.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
            else if (paymentInfo.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
            else if (paymentInfo.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

            return (
              <div 
                key={parent.id} 
                className={`border-b border-gray-200 last:border-b-0 transition-all duration-300 ease-in-out ${
                  isExpanded ? 'bg-emerald-50 shadow-inner' : 'hover:bg-gray-50'
                }`}
              >
                <div 
                  className="px-4 py-3 sm:px-6 grid grid-cols-12 gap-x-4 gap-y-2 items-center cursor-pointer" 
                  onClick={() => toggleParentDetails(parent.id)}
                >
                  <div className="col-span-12 lg:col-span-4">
                    <h3 className="text-md font-semibold text-emerald-700 group-hover:text-emerald-800">
                      {parent.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate" title={parent.email}>
                      {parent.email}
                    </p>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-4 lg:col-span-3 text-xs text-gray-600">
                    <p className="truncate" title={parent.address}>
                      {parent.address || '-'}
                    </p>
                    <p>{parent.zipcode || ''} {parent.city || ''}</p>
                  </div>
                  
                  <div className="col-span-3 sm:col-span-2 lg:col-span-1 text-sm text-center">
                    <span className="font-medium">{parentStudents.length}</span> 
                    <span className="text-xs"> kind(eren)</span>
                  </div>
                  
                  <div className={`col-span-3 sm:col-span-2 lg:col-span-2 text-xs font-medium text-center px-2.5 py-1 rounded-full ${statusColorClass} capitalize`}>
                    {paymentInfo.paymentStatus.replace('_', ' ')}
                  </div>
                  
                  <div className="col-span-12 sm:col-span-4 lg:col-span-2 flex justify-end items-center space-x-1 mt-2 sm:mt-0">
                     <Button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleSendNewPassword(parent);
                        }} 
                        variant="ghost" 
                        size="sm" 
                        className="text-orange-600 hover:text-orange-800 p-1.5" 
                        title="Nieuw wachtwoord sturen"
                        disabled={actionLoading}
                     >
                        <KeyRound size={16} />
                     </Button>
                     
                     <Button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleOpenEditModal(parent);
                        }} 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800 p-1.5" 
                        title="Bewerken" 
                        disabled={actionLoading}
                     > 
                        <Edit3 size={16} /> 
                     </Button>
                     
                     <Button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteParent(parent.id);
                        }} 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800 p-1.5" 
                        title="Verwijderen" 
                        disabled={actionLoading}
                     > 
                        <Trash2 size={16} /> 
                     </Button>
                     
                     <span className="p-1.5 text-gray-400">
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                     </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 py-4 sm:px-6 border-t border-emerald-200 bg-white space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">
                      Details voor {parent.name}:
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                        <div><strong>Telefoon:</strong> {parent.phone || '-'}</div>
                        <div><strong>Verschuldigd:</strong> €{formatCurrency(paymentInfo.amountDue)}</div>
                        <div><strong>Betaald:</strong> €{formatCurrency(paymentInfo.totalPaid)}</div>
                        <div className={parseFloat(paymentInfo.remainingBalance) > 0 ? 'font-semibold text-red-600' : 'text-green-600'}>
                            <strong>Openstaand:</strong> €{formatCurrency(paymentInfo.remainingBalance)}
                        </div>
                        <div>
                            <strong>Account ID:</strong> 
                            <span className="font-mono truncate" title={parent.id}>
                                {parent.id ? parent.id.substring(0,8) + '...' : '-'}
                            </span>
                        </div>
                        <div>
                            <strong>Geregistreerd op:</strong> 
                            {parent.created_at ? new Date(parent.created_at).toLocaleDateString('nl-NL') : '-'}
                        </div>
                    </div>
                    
                    {parentStudents.length > 0 && (
                        <div className="mt-2">
                            <h5 className="text-xs font-semibold text-gray-700 mb-0.5">
                                Gekoppelde Kinderen:
                            </h5>
                            <ul className="list-disc list-inside text-xs text-gray-600 pl-1">
                                {parentStudents.map(student => (
                                    <li key={student.id}>{student.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {showAddParentModal && (
        <AddParentModal
          isOpen={showAddParentModal}
          onClose={() => { 
            setShowAddParentModal(false); 
            setEditingParent(null); 
            setModalErrorText(''); 
          }}
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