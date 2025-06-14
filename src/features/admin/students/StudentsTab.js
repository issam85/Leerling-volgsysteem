// src/features/admin/students/StudentsTab.js - VOLLEDIG VERBETERDE VERSIE
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { apiCall } from '../../../services/api';
import { calculateParentPaymentStatus } from '../../../utils/financials';
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
  X
} from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const StudentsTab = () => {
  const { realData, loadData } = useData();
  const { users, students, classes, payments, mosque, loading: dataLoading, error: dataError } = realData;
  
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
  
  // ✅ NIEUWE FILTER EN SORT STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' of 'cards'
  
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

  // ✅ GEAVANCEERDE FILTER EN SORT LOGICA
  const filteredAndSortedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    // Step 1: Filter op zoekterm
    let filtered = students.filter(student => {
      // Zoek in naam (voornaam, achternaam, volledige naam)
      const nameMatch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       student.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Zoek ook in ouder naam
      const parentMatch = student.parent?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Zoek in klas naam
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
    setSelectedClassFilter('');
    setSortConfig({ key: 'first_name', direction: 'asc' });
  };

  // Bestaande functies (ongewijzigd)
  const handleOpenAddModal = () => {
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
        setModalErrorText(err.message || `Fout bij het ${editingStudent ? 'bewerken' : 'toevoegen'} van de leerling.`);
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

  if (dataLoading && (!students || students.length === 0)) {
    return <LoadingSpinner message="Leerlingen laden..." />;
  }

  const hasActiveFilters = searchQuery || selectedClassFilter || sortConfig.key !== 'name' || sortConfig.direction !== 'asc';

  return (
    <div className="space-y-6">
      {actionLoading && <LoadingSpinner message="Bezig..." />}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="page-title">Leerlingenbeheer</h2>
          <p className="text-gray-600 text-sm mt-1">
            {filteredAndSortedStudents.length} van {students?.length || 0} leerlingen
            {hasActiveFilters && ' (gefilterd)'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
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
            Nieuwe Leerling
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

      {/* ✅ NIEUWE FILTER SECTIE */}
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
          <p className="text-gray-600">Voeg leerlingen toe en koppel ze aan ouders en klassen.</p>
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
                {filteredAndSortedStudents.map(student => {
                  const parentName = student.parent?.name || <span className="italic text-red-500">Geen</span>;
                  const className = student.class?.name || <span className="italic text-gray-400">Geen</span>;
                  const paymentInfo = student.parent_id ? calculateParentPaymentStatus(student.parent_id, users, payments) : null;
                  
                  let statusColorClass = 'text-gray-600 bg-gray-100';
                  if (paymentInfo?.paymentStatus === 'betaald') statusColorClass = 'text-green-700 bg-green-100';
                  else if (paymentInfo?.paymentStatus === 'deels_betaald') statusColorClass = 'text-yellow-700 bg-yellow-100';
                  else if (paymentInfo?.paymentStatus === 'openstaand') statusColorClass = 'text-red-700 bg-red-100';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={student.id}>
                        {student.id ? student.id.substring(0,8) + '...' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name || student.name?.split(' ')[0] || '-'}
                        </div>
                        {student.date_of_birth && (
                          <div className="text-xs text-gray-500">
                            {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} jaar
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.last_name || (student.name?.split(' ').slice(1).join(' ')) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="flex items-center">
                          <ClassIcon size={16} className="mr-1.5 text-blue-500 flex-shrink-0"/>
                          {className}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="flex items-center">
                          <UserCircle size={16} className="mr-1.5 text-orange-500 flex-shrink-0"/>
                          {parentName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {student.date_of_birth 
                          ? new Date(student.date_of_birth).toLocaleDateString('nl-NL') 
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {paymentInfo ? (
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-tight font-semibold rounded-full ${statusColorClass} capitalize`}>
                            {paymentInfo.paymentStatus.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="italic text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button 
                          onClick={() => viewAttendanceHistory(student.id)}
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-800 p-1.5" 
                          title="Bekijk aanwezigheid" 
                          disabled={actionLoading}
                        > 
                          <Calendar size={16} /> 
                        </Button>
                        <Button 
                          onClick={() => handleOpenEditModal(student)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800 p-1.5" 
                          title="Bewerken" 
                          disabled={actionLoading}
                        > 
                          <Edit3 size={16} /> 
                        </Button>
                        <Button 
                          onClick={() => handleDeleteStudent(student.id)} 
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
  );
};

export default StudentsTab;