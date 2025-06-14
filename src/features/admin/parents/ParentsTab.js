// src/features/admin/parents/ParentsTab.js - VOLLEDIG UITGEBREIDE VERSIE met ALLE FILTERS
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { generateTempPassword } from '../../../utils/authHelpers';
import { calculateParentPaymentStatus } from '../../../utils/financials';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import AddParentModal from './AddParentModal';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  KeyRound,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Download,
  FileText,
  FilterX
} from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

// Helper functie om valuta te formatteren
const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (!isNaN(number)) {
    return number.toFixed(2);
  }
  return '0.00';
};

// CSV Export functie
const exportToCSV = (data, filename = 'ouders-export') => {
  const headers = [
    'Voornaam',
    'Achternaam', 
    'Email',
    'Telefoon',
    'Adres',
    'Postcode',
    'Woonplaats',
    'Aantal Kinderen',
    'Verschuldigd (€)',
    'Betaald (€)',
    'Openstaand (€)',
    'Betalingsstatus',
    'Aangemaakt op'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(parent => [
      `"${parent.first_name || parent.name?.split(' ')[0] || ''}"`,
      `"${parent.last_name || parent.name?.split(' ').slice(1).join(' ') || ''}"`,
      `"${parent.email || ''}"`,
      `"${parent.phone || ''}"`,
      `"${parent.address || ''}"`,
      `"${parent.zipcode || ''}"`,
      `"${parent.city || ''}"`,
      parent.childCount || 0,
      parent.paymentInfo?.amountDue || '0.00',
      parent.paymentInfo?.totalPaid || '0.00',
      parent.paymentInfo?.remainingBalance || '0.00',
      `"${parent.paymentInfo?.paymentStatus?.replace('_', ' ') || 'Onbekend'}"`,
      `"${parent.created_at ? new Date(parent.created_at).toLocaleDateString('nl-NL') : ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ParentsTab = () => {
  const { realData, loadData } = useData();
  const { users, students, payments, mosque, loading: dataLoading, error: dataError } = realData;
  
  // Modal states
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  
  // Error and loading states
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedParentId, setExpandedParentId] = useState(null);
  const [pageMessage, setPageMessage] = useState({ type: '', text: '' });
  
  // ✅ UITGEBREIDE FILTER EN SORT STATES - NU MET ALLE GEWENSTE FILTERS
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    firstName: '',      // ✅ NIEUW: Specifieke voornaam filter
    lastName: '',       // ✅ NIEUW: Specifieke achternaam filter
    email: '',
    address: '',        // ✅ NIEUW: Specifieke adres filter
    zipcode: '',
    city: '',
    paymentStatus: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
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

  // ✅ VOLLEDIG UITGEBREIDE FILTER EN SORT LOGICA
  const filteredAndSortedParents = useMemo(() => {
    if (!parents || parents.length === 0) return [];

    // Berrijk parents met extra info
    const enrichedParents = parents.map(parent => {
      const paymentInfo = calculateParentPaymentStatus(parent.id, users, payments);
      const parentStudents = students ? students.filter(s => String(s.parent_id) === String(parent.id)) : [];
      
      return {
        ...parent,
        paymentInfo,
        childCount: parentStudents.length,
        first_name: parent.first_name || parent.name?.split(' ')[0] || '',
        last_name: parent.last_name || parent.name?.split(' ').slice(1).join(' ') || ''
      };
    });

    // Step 1: Filter op algemene zoekterm
    let filtered = enrichedParents.filter(parent => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        parent.name?.toLowerCase().includes(searchLower) ||
        parent.first_name?.toLowerCase().includes(searchLower) ||
        parent.last_name?.toLowerCase().includes(searchLower) ||
        parent.email?.toLowerCase().includes(searchLower) ||
        parent.phone?.toLowerCase().includes(searchLower) ||
        parent.address?.toLowerCase().includes(searchLower) ||
        parent.city?.toLowerCase().includes(searchLower) ||
        parent.zipcode?.toLowerCase().includes(searchLower)
      );
    });

    // Step 2: Specifieke filters (✅ NU UITGEBREID MET ALLE GEWENSTE FILTERS)
    if (filters.firstName) {
      filtered = filtered.filter(parent => 
        parent.first_name?.toLowerCase().includes(filters.firstName.toLowerCase())
      );
    }
    
    if (filters.lastName) {
      filtered = filtered.filter(parent => 
        parent.last_name?.toLowerCase().includes(filters.lastName.toLowerCase())
      );
    }
    
    if (filters.email) {
      filtered = filtered.filter(parent => 
        parent.email?.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    
    if (filters.address) {
      filtered = filtered.filter(parent => 
        parent.address?.toLowerCase().includes(filters.address.toLowerCase())
      );
    }
    
    if (filters.zipcode) {
      filtered = filtered.filter(parent => 
        parent.zipcode?.toLowerCase().includes(filters.zipcode.toLowerCase())
      );
    }
    
    if (filters.city) {
      filtered = filtered.filter(parent => 
        parent.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    
    if (filters.paymentStatus) {
      filtered = filtered.filter(parent => 
        parent.paymentInfo?.paymentStatus === filters.paymentStatus
      );
    }

    // Step 3: Sorteren
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'first_name':
          aValue = a.first_name || '';
          bValue = b.first_name || '';
          break;
        case 'last_name':
          aValue = a.last_name || '';
          bValue = b.last_name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'address':
          aValue = a.address || '';
          bValue = b.address || '';
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'zipcode':
          aValue = a.zipcode || '';
          bValue = b.zipcode || '';
          break;
        case 'childCount':
          aValue = a.childCount || 0;
          bValue = b.childCount || 0;
          break;
        case 'paymentStatus':
          aValue = a.paymentInfo?.paymentStatus || '';
          bValue = b.paymentInfo?.paymentStatus || '';
          break;
        case 'amountDue':
          aValue = parseFloat(a.paymentInfo?.amountDue || 0);
          bValue = parseFloat(b.paymentInfo?.amountDue || 0);
          break;
        case 'created_at':
          aValue = new Date(a.created_at || '1900-01-01');
          bValue = new Date(b.created_at || '1900-01-01');
          break;
        default:
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [parents, students, payments, users, searchQuery, filters, sortConfig]);

  // ✅ SORT FUNCTIE
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ✅ RENDER SORT ICON
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  // ✅ CLEAR FILTERS
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      zipcode: '',
      city: '',
      paymentStatus: ''
    });
    setSortConfig({ key: 'first_name', direction: 'asc' });
  };

  // ✅ CSV EXPORT FUNCTIE
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const dataToExport = filteredAndSortedParents;
      const hasFilters = searchQuery || Object.values(filters).some(f => f);
      const filename = `ouders-export${hasFilters ? '-gefilterd' : ''}`;
      exportToCSV(dataToExport, filename);
      
      setPageMessage({ 
        type: 'success', 
        text: `${dataToExport.length} ouders geëxporteerd naar CSV` 
      });
    } catch (error) {
      setPageMessage({ 
        type: 'error', 
        text: `Fout bij exporteren: ${error.message}` 
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Bestaande functies...
  const handleOpenAddModal = () => {
    setEditingParent(null);
    setShowAddParentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleOpenEditModal = (parent) => {
    setEditingParent(parent);
    setShowAddParentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleParentSubmit = async (parentDataFromModal) => {
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });

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
        first_name: parentDataFromModal.first_name?.trim() || parentDataFromModal.name.trim().split(' ')[0],
        last_name: parentDataFromModal.last_name?.trim() || parentDataFromModal.name.trim().split(' ').slice(1).join(' '),
      };

      if (editingParent) {
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
    
    setActionLoading(true);
    setPageError('');
    setPageMessage({ type: '', text: '' });
    
    try {
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

  const hasActiveFilters = searchQuery || Object.values(filters).some(f => f) || sortConfig.key !== 'first_name' || sortConfig.direction !== 'asc';

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="page-title">Ouderbeheer</h2>
          <p className="text-gray-600 text-sm mt-1">
            {filteredAndSortedParents.length} van {parents?.length || 0} ouders
            {hasActiveFilters && ' (gefilterd)'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleExportCSV}
            variant="secondary"
            icon={Download}
            disabled={isExporting || filteredAndSortedParents.length === 0}
            className="min-w-max"
          >
            {isExporting ? 'Exporteren...' : `Exporteer CSV (${filteredAndSortedParents.length})`}
          </Button>
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
            icon={Filter}
            className={hasActiveFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
          >
            {showFilters ? 'Verberg Filters' : 'Toon Filters'}
            {hasActiveFilters && <span className="ml-1 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">!</span>}
          </Button>
          <Button 
            onClick={handleOpenAddModal} 
            variant="primary" 
            icon={Plus} 
            disabled={actionLoading}
          >
            Nieuwe Ouder
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      {pageMessage.text && (
        <div className={`p-4 rounded-md text-sm flex items-center ${
          pageMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {pageMessage.type === 'success' ? '✅' : '❌'} {pageMessage.text}
        </div>
      )}

      {pageError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" /> {pageError}
        </div>
      )}

      {/* ✅ VOLLEDIG UITGEBREIDE FILTER SECTIE */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          {/* Algemene Zoekbalk */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Algemene Zoekterm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Zoek op naam, email, telefoon, adres of woonplaats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Specifieke Filters */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Specifieke Filters
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {/* ✅ NIEUWE SPECIFIEKE FILTERS */}
              <Input
                label="Voornaam bevat"
                value={filters.firstName}
                onChange={(e) => setFilters(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="bijv. Jan"
              />

              <Input
                label="Achternaam bevat"
                value={filters.lastName}
                onChange={(e) => setFilters(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="bijv. Jansen"
              />

              <Input
                label="Email bevat"
                value={filters.email}
                onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                placeholder="bijv. gmail.com"
              />

              <Input
                label="Adres bevat"
                value={filters.address}
                onChange={(e) => setFilters(prev => ({ ...prev, address: e.target.value }))}
                placeholder="bijv. Hoofdstraat"
              />

              <Input
                label="Postcode bevat"
                value={filters.zipcode}
                onChange={(e) => setFilters(prev => ({ ...prev, zipcode: e.target.value }))}
                placeholder="bijv. 3135"
              />

              <Input
                label="Woonplaats bevat"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                placeholder="bijv. Amsterdam"
              />

              {/* Betalingsstatus Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Betalingsstatus</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Alle statussen</option>
                  <option value="betaald">Betaald</option>
                  <option value="deels_betaald">Deels Betaald</option>
                  <option value="openstaand">Openstaand</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Acties */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredAndSortedParents.length}</span> resultaten gevonden
              {hasActiveFilters && (
                <span className="ml-2 text-blue-600">
                  • Filters actief
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  icon={FilterX}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Alle filters wissen
                </Button>
              )}
              <Button
                onClick={handleExportCSV}
                variant="secondary"
                size="sm"
                icon={FileText}
                disabled={isExporting || filteredAndSortedParents.length === 0}
              >
                Exporteer deze resultaten
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content - Tabel of Lege Staten */}
      {!dataLoading && parents && parents.length === 0 ? (
        <div className="card text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen ouders</h3>
          <p className="text-gray-600">Voeg ouders toe om leerlingen te kunnen koppelen en betalingen te beheren.</p>
        </div>
      ) : filteredAndSortedParents.length === 0 && hasActiveFilters ? (
        <div className="card text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Geen resultaten</h3>
          <p className="text-gray-600 mb-4">Geen ouders gevonden met de huidige filters.</p>
          <Button onClick={clearFilters} variant="secondary">
            Filters wissen
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('first_name')}
                  >
                    <div className="flex items-center">
                      Voornaam
                      {renderSortIcon('first_name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('last_name')}
                  >
                    <div className="flex items-center">
                      Achternaam
                      {renderSortIcon('last_name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center">
                      Woonplaats
                      {renderSortIcon('city')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('childCount')}
                  >
                    <div className="flex items-center">
                      Kinderen
                      {renderSortIcon('childCount')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('paymentStatus')}
                  >
                    <div className="flex items-center">
                      Status
                      {renderSortIcon('paymentStatus')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedParents.map(parent => {
                  const isExpanded = expandedParentId === parent.id;
                  let statusColorClass = 'text-gray-600 bg-gray-100';
                  if (parent.paymentInfo?.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
                  else if (parent.paymentInfo?.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
                  else if (parent.paymentInfo?.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

                  return (
                    <React.Fragment key={parent.id}>
                      <tr 
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-emerald-50' : ''
                        }`}
                        onClick={() => toggleParentDetails(parent.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {parent.first_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {parent.last_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{parent.email}</div>
                          <div className="text-xs text-gray-500">{parent.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{parent.city || '-'}</div>
                          <div className="text-xs text-gray-500">{parent.zipcode || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-medium">{parent.childCount}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-tight font-semibold rounded-full ${statusColorClass} capitalize`}>
                            {parent.paymentInfo?.paymentStatus?.replace('_', ' ') || 'nvt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
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
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-emerald-50 border-t border-emerald-200">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Contactgegevens</h4>
                                <p><strong>Telefoon:</strong> {parent.phone || '-'}</p>
                                <p><strong>Adres:</strong> {parent.address || '-'}</p>
                                <p><strong>Postcode:</strong> {parent.zipcode || '-'}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Financieel</h4>
                                <p><strong>Verschuldigd:</strong> €{formatCurrency(parent.paymentInfo?.amountDue || 0)}</p>
                                <p><strong>Betaald:</strong> €{formatCurrency(parent.paymentInfo?.totalPaid || 0)}</p>
                                <p className={parseFloat(parent.paymentInfo?.remainingBalance || 0) > 0 ? 'font-semibold text-red-600' : 'text-green-600'}>
                                  <strong>Openstaand:</strong> €{formatCurrency(parent.paymentInfo?.remainingBalance || 0)}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Account Info</h4>
                                <p><strong>Account ID:</strong> {parent.id?.substring(0,8)}...</p>
                                <p><strong>Aangemaakt:</strong> {new Date(parent.created_at).toLocaleDateString('nl-NL')}</p>
                              </div>
                            </div>
                            
                            {parent.childCount > 0 && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-700 mb-2">Gekoppelde Kinderen ({parent.childCount})</h4>
                                <div className="flex flex-wrap gap-2">
                                  {students?.filter(s => String(s.parent_id) === String(parent.id)).map(student => (
                                    <span 
                                      key={student.id} 
                                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                    >
                                      {student.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
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