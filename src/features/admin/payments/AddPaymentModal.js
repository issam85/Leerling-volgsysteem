// src/features/admin/payments/AddPaymentModal.js - Verbeterde versie
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { calculateParentPaymentStatus } from '../../../utils/financials';

const AddPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  parents, 
  selectedParentProp, 
  modalError: apiErrorProp, 
  isLoading, 
  usersFromDataContext, 
  paymentsFromDataContext,
  studentsFromDataContext = [] // ✅ Nieuwe prop voor studenten data
}) => {
  const [formData, setFormData] = useState({
    parentId: '',
    amount: '',
    paymentMethod: 'contant',
    description: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
    student_id: '',
  });
  const [formValidationError, setFormValidationError] = useState('');
  const [parentPaymentInfo, setParentPaymentInfo] = useState(null);

  // ✅ FIX: Correct implementation van studenten voor geselecteerde ouder
  const studentsOfSelectedParent = useMemo(() => {
    if (!formData.parentId || !studentsFromDataContext || studentsFromDataContext.length === 0) {
      return [];
    }
    
    // Zoek studenten die bij de geselecteerde ouder horen
    return studentsFromDataContext.filter(student => 
      String(student.parent_id) === String(formData.parentId)
    );
  }, [formData.parentId, studentsFromDataContext]);

  // ✅ FIX: Betere form initialisatie met null checks
  useEffect(() => {
    if (isOpen) {
      // Bepaal welke ouder geselecteerd moet worden
      let parentToSetId = '';
      
      if (initialData?.parent_id) {
        // Bewerk mode - gebruik parent uit existing payment
        parentToSetId = String(initialData.parent_id);
      } else if (selectedParentProp?.id) {
        // Snelle betaling voor specifieke ouder
        parentToSetId = String(selectedParentProp.id);
      }

      // ✅ FIX: Betere datum formatting
      const paymentDate = initialData?.payment_date 
        ? new Date(initialData.payment_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        parentId: parentToSetId,
        amount: initialData?.amount ? String(parseFloat(initialData.amount).toFixed(2)) : '',
        paymentMethod: initialData?.payment_method || 'contant',
        description: initialData?.description || '',
        notes: initialData?.notes || '',
        payment_date: paymentDate,
        student_id: initialData?.student_id || '',
      });
      
      setFormValidationError('');
      setParentPaymentInfo(null);
    }
  }, [isOpen, initialData, selectedParentProp]);

  // ✅ FIX: Betere parent payment info berekening
  useEffect(() => {
    if (formData.parentId && usersFromDataContext && paymentsFromDataContext) {
      try {
        const info = calculateParentPaymentStatus(formData.parentId, usersFromDataContext, paymentsFromDataContext);
        setParentPaymentInfo(info);
      } catch (error) {
        console.warn('Error calculating parent payment status:', error);
        setParentPaymentInfo(null);
      }
    } else {
      setParentPaymentInfo(null);
    }
  }, [formData.parentId, usersFromDataContext, paymentsFromDataContext, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear form validation error when user starts typing
    if (formValidationError) {
      setFormValidationError('');
    }
  };

  // ✅ FIX: Betere form validatie met strikte controle op negatieve waarden
  const validateForm = () => {
    if (!formData.parentId) {
      return 'Selecteer een ouder.';
    }
    
    const parsedAmount = parseFloat(formData.amount);
    
    // Strikte controle op negatieve waarden en NaN
    if (!formData.amount || isNaN(parsedAmount)) {
      return 'Voer een geldig bedrag in.';
    }
    
    if (parsedAmount < 0) {
      return 'Negatieve bedragen zijn niet toegestaan. Gebruik eventueel een aparte "Restitutie" functie.';
    }
    
    if (parsedAmount === 0) {
      return 'Bedrag moet groter zijn dan €0.00.';
    }
    
    if (parsedAmount < 0.01) {
      return 'Minimum bedrag is €0.01.';
    }
    
    if (parsedAmount > 10000) {
      return 'Bedrag mag niet hoger zijn dan €10.000.';
    }
    
    if (!formData.payment_date) {
      return 'Betalingsdatum is verplicht.';
    }
    
    // Check if date is not in the future
    const paymentDate = new Date(formData.payment_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (paymentDate > today) {
      return 'Betalingsdatum mag niet in de toekomst liggen.';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormValidationError('');
    
    const validationError = validateForm();
    if (validationError) {
      setFormValidationError(validationError);
      return;
    }

    const success = await onSubmit(formData);
    // Modal wordt gesloten door parent component als success === true
  };

  // ✅ FIX: Betere selected parent name display
  const getSelectedParentName = () => {
    if (!formData.parentId || !parents) return '';
    const parent = parents.find(p => String(p.id) === String(formData.parentId));
    return parent ? parent.name : '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Betaling Bewerken" : "Nieuwe Betaling Registreren"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuleren
          </Button>
          <Button variant="primary" type="submit" form="addPaymentForm" disabled={isLoading}>
            {isLoading 
              ? (initialData ? "Opslaan..." : "Registreren...") 
              : (initialData ? "Wijzigingen Opslaan" : "Betaling Registreren")
            }
          </Button>
        </>
      }
    >
      <form id="addPaymentForm" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="paymentParent" className="block text-sm font-medium text-gray-700 mb-1">
            Ouder *
          </label>
          <select 
            id="paymentParent" 
            name="parentId" 
            value={formData.parentId} 
            onChange={handleChange} 
            required 
            className="input-field" 
            disabled={!!initialData || !!selectedParentProp || isLoading}
          >
            <option value="">-- Selecteer ouder --</option>
            {parents.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
          {(initialData || selectedParentProp) && (
            <p className="text-sm text-gray-500 mt-1">
              {initialData ? "Ouder kan niet gewijzigd worden bij bewerken" : `Snelle betaling voor ${getSelectedParentName()}`}
            </p>
          )}
        </div>

        {/* ✅ IMPROVED: Betere parent payment info display */}
        {parentPaymentInfo && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
            <h4 className="font-semibold mb-2 text-blue-800">
              Financiële status van {getSelectedParentName()}:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="text-gray-700">
                <span className="block text-xs text-gray-500">Verschuldigd</span>
                <span className="font-medium">€{parentPaymentInfo.amountDue}</span>
              </div>
              <div className="text-green-700">
                <span className="block text-xs text-gray-500">Betaald</span>
                <span className="font-medium">€{parentPaymentInfo.totalPaid}</span>
              </div>
              <div className={parseFloat(parentPaymentInfo.remainingBalance) > 0 ? 'text-red-700' : 'text-green-700'}>
                <span className="block text-xs text-gray-500">Openstaand</span>
                <span className="font-semibold">€{parentPaymentInfo.remainingBalance}</span>
              </div>
            </div>
            {parseFloat(parentPaymentInfo.remainingBalance) <= 0 && (
              <p className="text-green-700 text-xs mt-1 font-medium">✅ Deze ouder heeft alle verplichtingen voldaan</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <Input 
            label="Bedrag (€) *" 
            name="amount" 
            type="number" 
            value={formData.amount} 
            onChange={handleChange} 
            min="0.01" 
            max="10000"
            step="0.01" 
            required 
            disabled={isLoading}
            placeholder="0.00"
          />
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Betaalmethode *
            </label>
            <select 
              id="paymentMethod" 
              name="paymentMethod" 
              value={formData.paymentMethod} 
              onChange={handleChange} 
              className="input-field" 
              required
              disabled={isLoading}
            >
              <option value="contant">Contant</option>
              <option value="pin">PIN/Bankpas</option>
              <option value="overschrijving">Overschrijving</option>
              <option value="ideal">iDEAL</option>
              <option value="anders">Anders</option>
            </select>
          </div>
        </div>

        <Input 
          label="Betalingsdatum *" 
          name="payment_date" 
          type="date" 
          value={formData.payment_date} 
          onChange={handleChange} 
          required 
          disabled={isLoading}
          max={new Date().toISOString().split('T')[0]} // Prevent future dates
        />

        {/* ✅ IMPROVED: Student selectie als studenten beschikbaar zijn */}
        {formData.parentId && studentsOfSelectedParent.length > 0 && (
          <div>
            <label htmlFor="paymentStudent" className="block text-sm font-medium text-gray-700 mb-1">
              Specifieke Leerling (Optioneel)
            </label>
            <select 
              id="paymentStudent" 
              name="student_id" 
              value={formData.student_id} 
              onChange={handleChange} 
              className="input-field"
              disabled={isLoading}
            >
              <option value="">-- Algemene betaling voor {getSelectedParentName()} --</option>
              {studentsOfSelectedParent.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.class ? `(${student.class})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Kies een specifieke leerling als deze betaling alleen voor hen bedoeld is
            </p>
          </div>
        )}

        <Input 
          label="Omschrijving (Optioneel)" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Bijv. Bijdrage Maart, Donatie, Boeken"
          disabled={isLoading}
          maxLength={100}
        />

        <Input 
          label="Interne Notities (Optioneel)" 
          name="notes" 
          type="textarea" 
          value={formData.notes} 
          onChange={handleChange} 
          rows="2" 
          placeholder="Bijv. Betaald via Hassan, Korting gegeven, etc."
          disabled={isLoading}
          maxLength={500}
        />

        {/* ✅ IMPROVED: Better error display */}
        {(apiErrorProp || formValidationError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm font-medium">
              {formValidationError || apiErrorProp}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AddPaymentModal;