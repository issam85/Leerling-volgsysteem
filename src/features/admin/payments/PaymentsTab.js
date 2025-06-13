// src/features/admin/payments/PaymentsTab.js - CORRECTED VERSION (No Edit/Delete)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { calculateFinancialMetrics, calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import AddPaymentModal from './AddPaymentModal';
import { DollarSign, Plus, CheckCircle, XCircle, AlertTriangle, Info, Users as UsersIcon, AlertCircle as AlertCircleIcon } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

const PaymentsTab = () => {
  const { realData, loadData, currentUser } = useData();
  const navigate = useNavigate();
  const { users, payments, mosque, loading: dataLoading, error: dataError } = realData;
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedParentForPaymentModal, setSelectedParentForPaymentModal] = useState(null);
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const parents = users.filter(u => u.role === 'parent');
  const financialMetrics = (users.length > 0 || payments.length > 0) ? calculateFinancialMetrics(users, payments) : { totalOutstanding: "0.00", totalPaid: "0.00", percentagePaid: 0 };

  useEffect(() => {
    if (dataError) setPageError(dataError); else setPageError('');
  }, [dataError]);

  const handleOpenAddModal = (parent = null) => {
    setSelectedParentForPaymentModal(parent);
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
        parent_id: paymentDataFromModal.parentId,
        amount: parsedAmount,
        payment_method: paymentDataFromModal.paymentMethod,
        description: paymentDataFromModal.description || 'Algemene bijdrage',
        notes: paymentDataFromModal.notes || '',
        processed_by: currentUser?.id,
        payment_date: paymentDataFromModal.payment_date,
        mosque_id: mosque.id,
        ...(paymentDataFromModal.student_id && { student_id: paymentDataFromModal.student_id }),
      };

      // ✅ ONLY POST operation - no PUT for editing
      const result = await apiCall(`/api/payments`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success || result.payment) {
        setShowAddPaymentModal(false);
        setSelectedParentForPaymentModal(null);
        await loadData();
        setActionLoading(false);
        return true;
      } else {
        throw new Error(result.error || "Kon betaling niet registreren.");
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setModalErrorText(err.message || 'Fout bij het registreren van betaling.');
      setActionLoading(false);
      return false;
    }
  };

  // ❌ REMOVED: handleDeletePayment function - backend doesn't support this
  // ❌ REMOVED: handleOpenEditModal function - backend doesn't support this

  const getPaymentStatusIcon = (statusKey) => {
    if (statusKey === 'betaald') return <CheckCircle size={14} className="text-green-600 mr-1" />;
    if (statusKey === 'deels_betaald') return <AlertTriangle size={14} className="text-yellow-600 mr-1" />;
    if (statusKey === 'openstaand') return <XCircle size={14} className="text-red-600 mr-1" />;
    if (statusKey === 'nvt') return <Info size={14} className="text-gray-500 mr-1" />;
    return null;
  };

  if (dataLoading && !payments.length && !users.length) {
    return <LoadingSpinner message="Betalingen en financiële data laden..." />;
  }
  
  // Sort payments by date, newest first
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
                {/* ❌ REMOVED: Actions column since we can't edit/delete */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPayments.map(payment => {
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
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs leading-tight font-semibold rounded-full ${statusColorClass} capitalize`}>
                          {getPaymentStatusIcon(parentPaymentInfo.paymentStatus)}
                          {parentPaymentInfo.paymentStatus.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="italic text-gray-400">-</span>
                      )}
                    </td>
                    {/* ❌ REMOVED: Action buttons column */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Notice about payment limitations */}
      {sortedPayments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
          <div className="flex items-center">
            <Info size={16} className="mr-2 flex-shrink-0" />
            <p>
              <strong>Let op:</strong> Betalingen kunnen niet bewerkt of verwijderd worden voor administratieve integriteit. 
              Neem contact op met de systeembeheerder als correcties nodig zijn.
            </p>
          </div>
        </div>
      )}

      {showAddPaymentModal && (
        <AddPaymentModal
          isOpen={showAddPaymentModal}
          onClose={() => { setShowAddPaymentModal(false); setSelectedParentForPaymentModal(null); setModalErrorText(''); }}
          onSubmit={handlePaymentSubmit}
          initialData={null} // ❌ Always null since we can't edit
          parents={parents}
          selectedParentProp={selectedParentForPaymentModal}
          modalError={modalErrorText}
          isLoading={actionLoading}
          usersFromDataContext={users}
          paymentsFromDataContext={payments}
        />
      )}
    </div>
  );
};

export default PaymentsTab;