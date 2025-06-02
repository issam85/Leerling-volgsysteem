// src/features/admin/payments/PaymentsTab.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext'; // currentUser zit nu in useData
import { apiCall } from '../../../services/api';
import { calculateFinancialMetrics, calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import AddPaymentModal from './AddPaymentModal';
import { DollarSign, Plus, Edit3, Trash2, CheckCircle, XCircle, AlertTriangle, Info, Users as UsersIcon, AlertCircle as AlertCircleIcon } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

const PaymentsTab = () => {
  const { realData, loadData, currentUser } = useData(); // currentUser hier vandaan voor processed_by
  const navigate = useNavigate();
  const { users, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedParentForPaymentModal, setSelectedParentForPaymentModal] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const parents = users.filter(u => u.role === 'parent');
  // Bereken financialMetrics alleen als users en payments geladen zijn
  const financialMetrics = (users.length > 0 || payments.length > 0) ? calculateFinancialMetrics(users, payments) : { totalOutstanding: "0.00", totalPaid: "0.00", percentagePaid: 0 };


  useEffect(() => {
    if (dataError) setPageError(dataError); else setPageError('');
  }, [dataError]);

  const handleOpenAddModal = (parent = null) => {
    setSelectedParentForPaymentModal(parent);
    setEditingPayment(null);
    setShowAddPaymentModal(true);
    setModalErrorText('');
  };

  const handleOpenEditModal = (payment) => {
    const parentOfPayment = parents.find(p => String(p.id) === String(payment.parent_id));
    setSelectedParentForPaymentModal(parentOfPayment); // Kan undefined zijn als ouder niet meer bestaat
    setEditingPayment(payment);
    setShowAddPaymentModal(true);
    setModalErrorText('');
  };

  const handlePaymentSubmit = async (paymentDataFromModal) => {
    setModalErrorText('');
    const parsedAmount = parseFloat(paymentDataFromModal.amount);
    if (!paymentDataFromModal.parentId || !parsedAmount || parsedAmount <= 0) {
      setModalErrorText('Ouder en een geldig positief bedrag zijn verplicht.');
      return false;
    }
    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar.");
      return false;
    }
    setActionLoading(true);

    try {
      const payload = {
        parent_id: paymentDataFromModal.parentId, // Is al UUID string
        amount: parsedAmount,
        payment_method: paymentDataFromModal.paymentMethod,
        description: paymentDataFromModal.description || 'Algemene bijdrage',
        notes: paymentDataFromModal.notes || '',
        processed_by: currentUser?.id, // ID van ingelogde admin
        payment_date: paymentDataFromModal.payment_date, // YYYY-MM-DD
        // student_id is optioneel, kan worden toegevoegd aan AddPaymentModal
        ...(paymentDataFromModal.student_id && { student_id: paymentDataFromModal.student_id }),
      };

      let result;
      if (editingPayment) {
        // PUT naar /api/payments/:paymentId (BACKEND MOET DIT IMPLEMENTEREN)
        result = await apiCall(`/api/payments/${editingPayment.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        payload.mosque_id = mosque.id; // Vereist door je backend /api/payments POST
        // POST naar /api/payments
        result = await apiCall(`/api/payments`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (result.success || result.payment) {
        setShowAddPaymentModal(false);
        setEditingPayment(null);
        setSelectedParentForPaymentModal(null);
        await loadData();
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon betaling niet verwerken.");
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setModalErrorText(err.message || `Fout bij het ${editingPayment ? 'bewerken' : 'registreren'} van betaling.`);
      setActionLoading(false);
      return false;
    }
  };

   const handleDeletePayment = async (paymentIdToDelete) => {
    if (!window.confirm("Weet u zeker dat u deze betaling wilt verwijderen? Dit kan niet ongedaan gemaakt worden.")) return;
    if (!mosque || !mosque.id) { alert("Moskee informatie niet beschikbaar."); return; }
    setActionLoading(true);
    try {
      // DELETE naar /api/payments/:paymentId (BACKEND MOET DIT IMPLEMENTEREN)
      const result = await apiCall(`/api/payments/${paymentIdToDelete}`, { method: 'DELETE' });
      // HIER DE CORRECTIE:
      if (result.success) { // Gebruik result.success, niet response.status
        await loadData();
      } else {
         throw new Error(result.error || "Kon betaling niet verwijderen.");
      }
    } catch (err) {
      console.error("Error deleting payment:", err);
      setPageError(`Fout bij verwijderen van betaling: ${err.message}`);
    }
    setActionLoading(false);
  };

  const getPaymentStatusIcon = (statusKey) => {
    if (statusKey === 'betaald') return <CheckCircle size={14} className="text-green-600 mr-1" />;
    if (statusKey === 'deels_betaald') return <AlertTriangle size={14} className="text-yellow-600 mr-1" />;
    if (statusKey === 'openstaand') return <XCircle size={14} className="text-red-600 mr-1" />;
    if (statusKey === 'nvt') return <Info size={14} className="text-gray-500 mr-1" />;
    return null;
  };

  if (dataLoading && !payments.length && !users.length) { // Wacht tot ook users geladen zijn voor financialMetrics
    return <LoadingSpinner message="Betalingen en financiële data laden..." />;
  }
  
  // Sorteer betalingen op datum, nieuwste eerst
  const sortedPayments = [...payments].sort((a,b) => {
      const dateA = new Date(a.payment_date || a.created_at);
      const dateB = new Date(b.payment_date || b.created_at);
      return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Betalingenbeheer</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
                onChange={(e) => {
                    const parent = parents.find(p => String(p.id) === e.target.value);
                    if(parent) handleOpenAddModal(parent);
                    e.target.value = "";
                }}
                className="input-field sm:min-w-[200px] py-2.5"
                defaultValue=""
                disabled={actionLoading || parents.length === 0}
            >
                <option value="" disabled>{parents.length === 0 ? "Eerst ouders toevoegen" : "Snelle betaling voor..."}</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button onClick={() => handleOpenAddModal()} variant="primary" icon={Plus} className="w-full sm:w-auto" disabled={actionLoading || parents.length === 0}>
                Nieuwe Betaling
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card"><h4 className="text-sm text-gray-500 mb-0.5">Totaal Openstaand</h4><p className="text-3xl font-bold text-red-600">€{financialMetrics.totalOutstanding}</p></div>
        <div className="card"><h4 className="text-sm text-gray-500 mb-0.5">Totaal Betaald</h4><p className="text-3xl font-bold text-green-600">€{financialMetrics.totalPaid}</p></div>
        <div className="card"><h4 className="text-sm text-gray-500 mb-0.5">% Betaald</h4><p className="text-3xl font-bold text-blue-600">{financialMetrics.percentagePaid}%</p></div>
      </div>

      {pageError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircleIcon size={20} className="mr-2" /> {pageError}
        </div>
        )}

      {parents.length === 0 && !dataLoading && payments.length === 0 && (
     <div className="card text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Voeg eerst ouders toe</h3>
          <p className="text-gray-600">Om betalingen te registreren, dient u eerst ouders aan het systeem toe te voegen.</p>
          <Button onClick={() => navigate('/admin/parents')} variant="primary" className="mt-4">Naar Ouderbeheer</Button>
      </div>
)}

      {sortedPayments.length === 0 && !dataLoading && parents.length > 0 ? (
        <div className="card text-center">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen betalingen</h3>
          <p className="text-gray-600">Registreer de eerste betaling om het financiële overzicht te starten.</p>
        </div>
      ) : sortedPayments.length > 0 && (
        <div className="table-responsive-wrapper bg-white rounded-xl shadow border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ouder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Methode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notitie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Ouder</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPayments.map(payment => {
                // Je backend stuurt al geneste parent info mee
                const parentName = payment.parent?.name || <span className="italic text-gray-400">Onbekend</span>;
                const parentPaymentInfo = payment.parent_id ? calculateParentPaymentStatus(payment.parent_id, users, payments) : null;
                
                let statusColorClass = 'text-gray-600 bg-gray-100';
                if (parentPaymentInfo?.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
                else if (parentPaymentInfo?.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
                else if (parentPaymentInfo?.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">€{parseFloat(payment.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{payment.payment_method}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={payment.notes || payment.description}>
                        {payment.notes || payment.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {parentPaymentInfo ? (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${statusColorClass} capitalize`}>
                          {getPaymentStatusIcon(parentPaymentInfo.paymentStatus)}
                          {parentPaymentInfo.paymentStatus.replace('_', ' ')}
                        </span>
                      ) : <span className="italic text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <Button onClick={() => handleOpenEditModal(payment)} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1.5" title="Bewerken" disabled={actionLoading}> <Edit3 size={16} /> </Button>
                      <Button onClick={() => handleDeletePayment(payment.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 p-1.5" title="Verwijderen" disabled={actionLoading}> <Trash2 size={16} /> </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddPaymentModal && (
        <AddPaymentModal
          isOpen={showAddPaymentModal}
          onClose={() => { setShowAddPaymentModal(false); setEditingPayment(null); setSelectedParentForPaymentModal(null); setModalErrorText(''); }}
          onSubmit={handlePaymentSubmit}
          initialData={editingPayment}
          parents={parents} // Lijst van alle ouders voor de dropdown
          selectedParentProp={selectedParentForPaymentModal} // Voor het voorselecteren van de ouder
          modalError={modalErrorText}
          isLoading={actionLoading}
          // Geef users en payments mee voor het tonen van de status van de ouder in de modal
          usersFromDataContext={users}
          paymentsFromDataContext={payments}
        />
      )}
    </div>
  );
};

export default PaymentsTab;