// src/features/admin/students/StudentsTab.js - Updated with useTrialStatus Hook
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { calculateParentPaymentStatus } from '../../../utils/financials';
import { useTrialStatus } from '../../../hooks/useTrialStatus'; // ✅ ADDED: Trial status hook
import AdminLayout from '../../../layouts/AdminLayout';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import AddStudentModal from './AddStudentModal';
import { 
  Users as StudentIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  UserCircle, 
  BookOpen as ClassIcon, 
  AlertCircle, 
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Crown,
  Lock,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const StudentsTab = () => {
  const { realData, loadData } = useData();
  const { users, students, classes, payments, mosque, loading: dataLoading, error: dataError } = realData;
  
  // ✅ ADDED: Trial status hook
  const { trialStatus, loading: trialLoading } = useTrialStatus();
  
  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // Error and loading states
  const [pageError, setPageError] = useState('');
  const [modalErrorText, setModalErrorText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pageMessage, setPageMessage] = useState({ type: '', text: '' });
  
  // Attendance data
  const [attendanceHistory, setAttendanceHistory] = useState({});
  
  // Filter en sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  
  const navigate = useNavigate();
  const parents = users ? users.filter(u => u.role === 'parent') : [];

  // ✅ UPDATED: Use trial status hook instead of mosque data
  const isTrialActive = trialStatus && !trialStatus.isProfessional;
  const maxStudentsForTrial = trialStatus?.maxStudents || 10;
  const currentStudentCount = students ? students.length : 0;
  const isAtStudentLimit = isTrialActive && currentStudentCount >= maxStudentsForTrial;
  const canAddMoreStudents = !isTrialActive || currentStudentCount < maxStudentsForTrial;
  const studentsRemaining = isTrialActive ? Math.max(0, maxStudentsForTrial - currentStudentCount) : null;

  useEffect(() => {
    if (dataError) {
      setPageError(dataError);
      setPageMessage({ type: '', text: '' });
    } else {
      setPageError('');
    }
  }, [dataError]);

  // Filter en sort logica
  const filteredAndSortedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    // Step 1: Filter op zoekterm
    let filtered = students.filter(student => {
      const nameMatch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       student.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const parentMatch = student.parent?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const classMatch = student.class?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return nameMatch || parentMatch || classMatch;
    });

    // Step 2: Filter op klas
    if (selectedClassFilter) {
      filtered = filtered.filter(student => student.class_id === selectedClassFilter);
    }

    // Step 3: Sorteren
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'first_name':
          aValue = a.first_name || a.name?.split(' ')[0] || '';
          bValue = b.first_name || b.name?.split(' ')[0] || '';
          break;
        case 'last_name':
          aValue = a.last_name || a.name?.split(' ').slice(1).join(' ') || '';
          bValue = b.last_name || b.name?.split(' ').slice(1).join(' ') || '';
          break;
        case 'class':
          aValue = a.class?.name || '';
          bValue = b.class?.name || '';
          break;
        case 'parent':
          aValue = a.parent?.name || '';
          bValue = b.parent?.name || '';
          break;
        case 'date_of_birth':
          aValue = new Date(a.date_of_birth || '1900-01-01');
          bValue = new Date(b.date_of_birth || '1900-01-01');
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
  }, [students, searchQuery, selectedClassFilter, sortConfig]);

  // Sort functie
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClassFilter('');
    setSortConfig({ key: 'first_name', direction: 'asc' });
  };

  // ✅ UPDATED: Enhanced trial limit check with trialLoading
  const handleOpenAddModal = () => {
    // Check prerequisites first
    if (parents.length === 0) {
      alert('Voeg eerst ouders toe voordat u leerlingen kunt aanmaken.');
      navigate('/admin/parents');
      return;
    }
    if (classes.length === 0) {
      alert('Voeg eerst klassen toe voordat u leerlingen kunt aanmaken.');
      navigate('/admin/classes');
      return;
    }

    // ✅ Enhanced trial limit check
    if (isAtStudentLimit) {
      setPageMessage({ 
        type: 'error', 
        text: `Trial versie beperkt tot maximaal ${maxStudentsForTrial} leerlingen. Upgrade naar een betaald abonnement voor meer leerlingen.` 
      });
      return;
    }

    setEditingStudent(null);
    setShowAddStudentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setShowAddStudentModal(true);
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
  };

  const handleStudentSubmit = async (studentDataFromModal) => {
    setModalErrorText('');
    setPageMessage({ type: '', text: '' });
    
    const requiredFields = ['name', 'parentId', 'classId'];
    for (const field of requiredFields) {
      if (!studentDataFromModal[field] || !String(studentDataFromModal[field]).trim()) {
        let fieldLabel = field;
        if (field === 'parentId') fieldLabel = 'Ouder';
        if (field === 'classId') fieldLabel = 'Klas';
        setModalErrorText(`Veld "${fieldLabel}" is verplicht.`);
        return false;
      }
    }

    if (!mosque || !mosque.id) {
      setModalErrorText("Moskee informatie niet beschikbaar. Kan actie niet uitvoeren.");
      return false;
    }

    // ✅ Enhanced trial limit check
    if (!editingStudent && isAtStudentLimit) {
      setModalErrorText(`Trial versie beperkt tot maximaal ${maxStudentsForTrial} leerlingen. Upgrade voor meer leerlingen.`);
      return false;
    }
    
    setActionLoading(true);

    try {
        let result;
        const payload = {
            name: studentDataFromModal.name.trim(),
            parent_id: studentDataFromModal.parentId,
            class_id: studentDataFromModal.classId,
            date_of_birth: studentDataFromModal.date_of_birth || null,
            emergency_contact: studentDataFromModal.emergency_contact || null,
            emergency_phone: studentDataFromModal.emergency_phone || null,
            notes: studentDataFromModal.notes || null,
        };

        if (editingStudent) {
            if (editingStudent.parent_id !== payload.parent_id) {
                payload.parent_id_before_update = editingStudent.parent_id;
            }
            result = await apiCall(`/api/students/${editingStudent.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            payload.mosque_id = mosque.id;
            result = await apiCall(`/api/students`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        if (result.success || result.student || result.data) {
            setShowAddStudentModal(false);
            setEditingStudent(null);
            await loadData();
            setPageMessage({ 
                type: 'success', 
                text: `Leerling succesvol ${editingStudent ? 'bewerkt' : 'toegevoegd'}.` 
            });
            setActionLoading(false);
            return true;
        } else {
            throw new Error(result.error || "Kon leerling niet verwerken. Onbekende fout van server.");
        }
    } catch (err) {
        console.error('Error submitting student:', err);
        
        // ✅ Enhanced error handling for trial limits
        if (err.message && (err.message.includes('limiet') || err.message.includes('STUDENT_LIMIT_REACHED'))) {
          setModalErrorText(`Trial versie beperkt tot maximaal ${maxStudentsForTrial} leerlingen. Upgrade naar een betaald abonnement voor meer leerlingen.`);
        } else {
          setModalErrorText(err.message || `Fout bij het ${editingStudent ? 'bewerken' : 'toevoegen'} van de leerling.`);
        }
        
        setActionLoading(false);
        return false;
    }
  };

  const handleDeleteStudent = async (studentIdToDelete) => {
    if (!window.confirm("Weet u zeker dat u deze leerling wilt verwijderen? Dit zal ook de bijdrage van de ouder herberekenen.")) {
        return;
    }
    
    setActionLoading(true);
    setPageError('');
    setPageMessage({ type: '', text: '' });
    
    try {
        const result = await apiCall(`/api/students/${studentIdToDelete}`, { 
            method: 'DELETE' 
        });
        
        if (result.success) {
            await loadData();
            setPageMessage({ type: 'success', text: 'Leerling succesvol verwijderd.' });
        } else {
            throw new Error(result.error || "Kon leerling niet verwijderen.");
        }
    } catch (err) {
        console.error("Error deleting student:", err);
        setPageError(`Fout bij verwijderen van leerling: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const viewAttendanceHistory = async (studentId) => {
    try {
        setActionLoading(true);
        const response = await apiCall(`/api/students/${studentId}/attendance-history?limit=20`);
        
        setAttendanceHistory({
            [studentId]: response || []
        });
        setShowAttendanceModal(true);
    } catch (error) {
        console.error('Fout bij ophalen attendance history:', error);
        setPageError(`Fout bij ophalen aanwezigheidsgeschiedenis: ${error.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  // ✅ ENHANCED: Trial limit notice with better status handling
  const renderTrialLimitNotice = () => {
    if (!isTrialActive) return null;

    const usagePercentage = (currentStudentCount / maxStudentsForTrial) * 100;
    const isNearLimit = usagePercentage >= 80;
    const isAtLimit = isAtStudentLimit;

    return (
      <div className={`p-4 rounded-lg border-2 mb-6 ${
        isAtLimit 
          ? 'bg-red-50 border-red-200' 
          : isNearLimit 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isAtLimit ? (
              <Lock className="h-6 w-6 text-red-600" />
            ) : isNearLimit ? (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            ) : (
              <Crown className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${
              isAtLimit 
                ? 'text-red-800' 
                : isNearLimit 
                  ? 'text-amber-800' 
                  : 'text-blue-800'
            }`}>
              Trial Versie - Leerlingen Limiet
            </h3>
            <div className="mt-1">
              <p className={`text-sm ${
                isAtLimit 
                  ? 'text-red-700' 
                  : isNearLimit 
                    ? 'text-amber-700' 
                    : 'text-blue-700'
              }`}>
                <span className="font-medium">{currentStudentCount} van {maxStudentsForTrial}</span> leerlingen gebruikt.
                {isAtLimit && ' U heeft de limiet bereikt.'}
                {!isAtLimit && studentsRemaining && ` Nog ${studentsRemaining} leerlingen beschikbaar.`}
              </p>
              {isAtLimit && (
                <p className="text-sm text-red-700 mt-1">
                  Upgrade naar een betaald abonnement om meer leerlingen toe te voegen.
                </p>
              )}
              {isNearLimit && !isAtLimit && (
                <p className="text-sm text-amber-700 mt-1">
                  U nadert de limiet. Overweeg een upgrade naar een betaald abonnement.
                </p>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Leerlingen gebruikt</span>
                <span>{currentStudentCount}/{maxStudentsForTrial} ({Math.round(usagePercentage)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isAtLimit 
                      ? 'bg-red-500' 
                      : isNearLimit 
                        ? 'bg-amber-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Upgrade suggestion */}
            {(isAtLimit || isNearLimit) && (
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  size="sm"
                  className={`${
                    isAtLimit 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-amber-600 hover:bg-amber-700'
                  } text-white`}
                  onClick={() => navigate('/admin/subscription')}
                >
                  {isAtLimit ? 'Upgrade Nu' : 'Bekijk Upgrade Opties'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Show loading state when trial data is loading
  if ((dataLoading || trialLoading) && (!students || students.length === 0)) {
    return <LoadingSpinner message="Leerlingen laden..." />;
  }

  const hasActiveFilters = searchQuery || selectedClassFilter || sortConfig.key !== 'first_name' || sortConfig.direction !== 'asc';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {actionLoading && <LoadingSpinner message="Bezig..." />}
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h2 className="page-title">Leerlingenbeheer</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredAndSortedStudents.length} van {students?.length || 0} leerlingen
              {hasActiveFilters && ' (gefilterd)'}
              {isTrialActive && (
                <span className="ml-2 text-xs text-gray-500">
                  • Trial: {currentStudentCount}/{maxStudentsForTrial} gebruikt
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* ✅ Enhanced trial usage indicator in header */}
            {isTrialActive && (
              <div className="text-xs text-gray-600 font-medium self-center bg-gray-100 px-3 py-1 rounded-full">
                {currentStudentCount}/{maxStudentsForTrial} leerlingen
              </div>
            )}
            
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
              variant={isAtStudentLimit ? "disabled" : "primary"} 
              icon={isAtStudentLimit ? Lock : Plus} 
              disabled={actionLoading || isAtStudentLimit || trialLoading} // ✅ Added trialLoading
              title={isAtStudentLimit ? `Trial limiet bereikt (${maxStudentsForTrial} leerlingen max)` : "Nieuwe leerling toevoegen"}
            >
              {isAtStudentLimit ? 'Limiet Bereikt' : 'Nieuwe Leerling'}
            </Button>
          </div>
        </div>

        {/* ✅ ADDED: Trial limitation notice */}
        {renderTrialLimitNotice()}

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

        {/* Filter sectie */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Zoekbalk */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Zoek op naam leerling, ouder of klas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

              {/* Klas Filter */}
              <div>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Alle klassen</option>
                  {classes?.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Acties */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {filteredAndSortedStudents.length} resultaten gevonden
                </div>
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Filters wissen
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {(parents.length === 0 || classes.length === 0) && !dataLoading && (!students || students.length === 0) ? (
          <div className="card text-center">
            <StudentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Voorwaarden niet voldaan</h3>
            {parents.length === 0 && <p className="text-gray-600 mb-2">U dient eerst ouders toe te voegen.</p>}
            {classes.length === 0 && <p className="text-gray-600">U dient eerst klassen aan te maken.</p>}
            <div className="mt-4 space-x-2">
              {parents.length === 0 && (
                <Button onClick={() => navigate('/admin/parents')} variant="secondary">
                  Naar Ouders
                </Button>
              )}
              {classes.length === 0 && (
                <Button onClick={() => navigate('/admin/classes')} variant="secondary">
                  Naar Klassen
                </Button>
              )}
            </div>
          </div>
        ) : (!students || students.length === 0) && !dataLoading ? (
          <div className="card text-center">
            <StudentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nog geen leerlingen</h3>
            <p className="text-gray-600">
              {isTrialActive 
                ? `Voeg tot ${maxStudentsForTrial} leerlingen toe in de trial versie.`
                : "Voeg leerlingen toe en koppel ze aan ouders en klassen."
              }
            </p>
            {isTrialActive && studentsRemaining && (
              <p className="text-sm text-blue-600 mt-2">
                Nog {studentsRemaining} leerlingen beschikbaar in uw trial.
              </p>
            )}
          </div>
        ) : filteredAndSortedStudents.length === 0 && hasActiveFilters ? (
          <div className="card text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Geen resultaten</h3>
            <p className="text-gray-600 mb-4">Geen leerlingen gevonden met de huidige filters.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
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
                      onClick={() => handleSort('class')}
                    >
                      <div className="flex items-center">
                        Klas
                        {renderSortIcon('class')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('parent')}
                    >
                      <div className="flex items-center">
                        Ouder
                        {renderSortIcon('parent')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('date_of_birth')}
                    >
                      <div className="flex items-center">
                        Geboortedatum
                        {renderSortIcon('date_of_birth')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Betalingsstatus
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedStudents.map((student, index) => {
                    const studentPaymentStatus = calculateParentPaymentStatus(student.parent, payments);
                    
                    return (
                      <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{student.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserCircle className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.first_name || student.name?.split(' ')[0] || 'Onbekend'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.last_name || student.name?.split(' ').slice(1).join(' ') || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ClassIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {student.class?.name || 'Geen klas'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.parent?.name || 'Geen ouder'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.date_of_birth ? (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {new Date(student.date_of_birth).toLocaleDateString('nl-NL')}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            studentPaymentStatus === 'up_to_date' 
                              ? 'bg-green-100 text-green-800' 
                              : studentPaymentStatus === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {studentPaymentStatus === 'up_to_date' ? 'Betaald' : 
                             studentPaymentStatus === 'overdue' ? 'Achterstallig' : 'Onbekend'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => viewAttendanceHistory(student.id)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                              title="Bekijk aanwezigheid"
                            >
                              <Calendar size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                              title="Bewerk leerling"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Verwijder leerling"
                              disabled={actionLoading}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {showAddStudentModal && (
          <AddStudentModal
            isOpen={showAddStudentModal}
            onClose={() => {
              setShowAddStudentModal(false);
              setEditingStudent(null);
              setModalErrorText('');
            }}
            onSubmit={handleStudentSubmit}
            initialData={editingStudent}
            parents={parents}
            classes={classes}
            modalError={modalErrorText}
            isLoading={actionLoading}
          />
        )}

        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Aanwezigheidsgeschiedenis</h3>
                <Button
                  onClick={() => setShowAttendanceModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-2">
                {Object.values(attendanceHistory)[0]?.length > 0 ? (
                  Object.values(attendanceHistory)[0].map((record, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">
                        {new Date(record.les?.les_datum).toLocaleDateString('nl-NL')}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        record.status === 'aanwezig' ? 'bg-green-100 text-green-800' :
                        record.status === 'te_laat' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status?.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Geen aanwezigheidsgegevens beschikbaar
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StudentsTab;