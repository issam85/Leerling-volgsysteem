// src/features/admin/payments/AddPaymentModal.js
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { calculateParentPaymentStatus } from '../../../utils/financials';

const AddPaymentModal = ({ isOpen, onClose, onSubmit, initialData, parents, selectedParentProp, modalError: apiErrorProp, isLoading, usersFromDataContext, paymentsFromDataContext }) => {
  const [formData, setFormData] = useState({
    parentId: '', // Wordt UUID string
    amount: '',
    paymentMethod: 'contant',
    description: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
    student_id: '', // Optioneel
  });
  const [formValidationError, setFormValidationError] = useState('');
  const [parentPaymentInfo, setParentPaymentInfo] = useState(null);

  const studentsOfSelectedParent = useMemo(() => {
    if (!formData.parentId || !usersFromDataContext) return [];
    // Vind alle studenten die bij de geselecteerde ouder horen
    // Je hebt 'students' data nodig, niet 'usersFromDataContext' hiervoor.
    // Dit moet je aanpassen om `realData.students` te gebruiken.
    // Voor nu een placeholder:
    // const allStudents = usersFromDataContext.filter(u => u.role === 'student'); // Onjuist, studenten zitten in `realData.students`
    // return allStudents.filter(s => String(s.parent_id) === String(formData.parentId));
    return []; // TODO: Fix this with realData.students
  }, [formData.parentId, usersFromDataContext]);


  useEffect(() => {
    if (isOpen) {
      const parentToSetId = initialData ? initialData.parent_id : (selectedParentProp ? selectedParentProp.id : '');
      setFormData({
        parentId: String(parentToSetId || ''),
        amount: initialData?.amount ? String(parseFloat(initialData.amount).toFixed(2)) : '',
        paymentMethod: initialData?.payment_method || 'contant',
        description: initialData?.description || '',
        notes: initialData?.notes || '',
        payment_date: initialData?.payment_date || new Date().toISOString().split('T')[0],
        student_id: initialData?.student_id || '',
      });
      setFormValidationError('');
      setParentPaymentInfo(null);
    }
  }, [isOpen, initialData, selectedParentProp]);

  useEffect(() => {
    if (formData.parentId && usersFromDataContext && paymentsFromDataContext) {
      const info = calculateParentPaymentStatus(formData.parentId, usersFromDataContext, paymentsFromDataContext);
      setParentPaymentInfo(info);
    } else {
      setParentPaymentInfo(null);
    }
  }, [formData.parentId, usersFromDataContext, paymentsFromDataContext, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.parentId || !parsedAmount || parsedAmount <= 0) {
      setFormValidationError('Ouder en een geldig positief bedrag zijn verplicht.');
      return;
    }
    if (!formData.payment_date) {
        setFormValidationError('Betalingsdatum is verplicht.');
        return;
    }
    const success = await onSubmit(formData); // Parent (PaymentsTab) handelt sluiten af
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Betaling Bewerken" : "Nieuwe Betaling Registreren"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuleren</Button>
          <Button variant="primary" type="submit" form="addPaymentForm" disabled={isLoading}>
            {isLoading ? (initialData ? "Opslaan..." : "Registreren...") : (initialData ? "Wijzigingen Opslaan" : "Betaling Registreren")}
          </Button>
        </>
      }
    >
      <form id="addPaymentForm" onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="paymentParent" className="block text-sm font-medium text-gray-700 mb-1">Ouder *</label>
            <select id="paymentParent" name="parentId" value={formData.parentId} onChange={handleChange} required className="input-field" disabled={!!initialData || !!selectedParentProp}>
                <option value="">-- Selecteer ouder --</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
            </select>
        </div>

        {parentPaymentInfo && (
            <div className="p-3 bg-gray-100 rounded-md border border-gray-200 text-sm">
                <h4 className="font-semibold mb-1 text-gray-700">Financiële status {parents.find(p=>String(p.id) === formData.parentId)?.name || ''}:</h4>
                <div className="grid grid-cols-3 gap-2">
                    <span>Verschuldigd: <span className="font-medium">€{parentPaymentInfo.amountDue}</span></span>
                    <span>Betaald: <span className="font-medium text-green-600">€{parentPaymentInfo.totalPaid}</span></span>
                    <span>Open: <strong className={parseFloat(parentPaymentInfo.remainingBalance) > 0 ? 'text-red-600' : 'text-green-600'}>€{parentPaymentInfo.remainingBalance}</strong></span>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <Input label="Bedrag (€) *" name="amount" type="number" value={formData.amount} onChange={handleChange} min="0.01" step="0.01" required />
            <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Betaalmethode *</label>
                <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="input-field" required>
                    <option value="contant">Contant</option>
                    <option value="pin">PIN/Bankpas</option>
                    <option value="overschrijving">Overschrijving</option>
                    <option value="ideal">iDEAL</option>
                    <option value="anders">Anders</option>
                </select>
            </div>
        </div>
        <Input label="Betalingsdatum *" name="payment_date" type="date" value={formData.payment_date} onChange={handleChange} required />
        {/* Optioneel: student selecteren als betaling voor specifieke student is */}
        {/* {formData.parentId && studentsOfSelectedParent.length > 0 && (
             <div>
                <label htmlFor="paymentStudent" className="block text-sm font-medium text-gray-700 mb-1">Specifieke Leerling (Optioneel)</label>
                <select id="paymentStudent" name="student_id" value={formData.student_id} onChange={handleChange} className="input-field">
                    <option value="">-- Algemeen voor ouder --</option>
                    {studentsOfSelectedParent.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        )} */}
        <Input label="Omschrijving (Optioneel)" name="description" value={formData.description} onChange={handleChange} placeholder="Bijv. Bijdrage Maart, Donatie"/>
        <Input label="Interne Notities (Optioneel)" name="notes" type="textarea" value={formData.notes} onChange={handleChange} rows="2" />

        {apiErrorProp && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiErrorProp}</p>}
        {formValidationError && <p className="text-red-500 text-sm mt-2">{formValidationError}</p>}
      </form>
    </Modal>
  );
};

export default AddPaymentModal;