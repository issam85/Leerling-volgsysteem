// src/pages/TeacherMyClassesPage.js - DEFINITIEVE VERSIE MET UITKLAPBARE RIJEN EN ALLE FUNCTIONALITEIT
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { apiCall } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import AddStudentModal from '../features/teacher/AddStudentModal';
import QuranProgressTracker from '../features/teacher/QuranProgressTracker';
import StudentReport from '../features/teacher/StudentReport';
import ClassBulkMessageModal from '../features/teacher/ClassBulkMessageModal';
import { 
  AlertCircle, 
  UserPlus, 
  Mail, 
  BookMarked, 
  User, 
  Phone, 
  Send, 
  Calendar,
  XCircle, 
  ArrowLeft, 
  CheckCircle, 
  X, 
  ChevronDown, 
  ChevronUp,
  ClipboardList,
  Printer
} from 'lucide-react';

// Volledige MailModal component
const MailModal = ({ show, onClose, title, onSend, isLoading, recipientInfo }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!show) {
      setSubject('');
      setBody('');
    }
  }, [show]);

  if (!show) return null;

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      alert('Onderwerp en bericht zijn verplicht.');
      return;
    }
    onSend({ subject: subject.trim(), body: body.trim() });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
            <span className="sr-only">Sluiten</span>
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {recipientInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Aan:</strong> {recipientInfo}
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onderwerp *
            </label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Onderwerp van uw email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
              disabled={isLoading}
              maxLength={200}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bericht *
            </label>
            <textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)}
              placeholder="Typ hier uw bericht..."
              className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 resize-none disabled:bg-gray-100"
              disabled={isLoading}
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {body.length}/2000 karakters
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button 
            onClick={onClose} 
            variant="secondary" 
            disabled={isLoading}
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleSend} 
            icon={Send} 
            disabled={isLoading || !subject.trim() || !body.trim()}
          >
            {isLoading ? 'Versturen...' : 'Versturen'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const TeacherMyClassesPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { classes = [], students = [], users = [], loading, error } = realData;

  // State voor modals en feedback
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  // State voor Qor'aan modal
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [selectedStudentForQuran, setSelectedStudentForQuran] = useState(null);
  
  // State voor Add Student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  
  // State voor Rapport modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

  // State voor Class Bulk Message modal
  const [showClassBulkModal, setShowClassBulkModal] = useState(false);
  const [classBulkError, setClassBulkError] = useState('');

  // NIEUWE STATE voor de uitgeklapte rij
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

  // Calculate data first (before any early returns)
  const currentClass = classes.find(c => String(c.id) === String(classId));
  const classStudents = students.filter(s =>
    String(s.class_id) === String(classId) && s.active
  );

  // Get unique parents for this class
  const classParents = React.useMemo(() => {
    const parentIds = [...new Set(classStudents.map(s => s.parent_id).filter(Boolean))];
    return users.filter(u => parentIds.includes(u.id) && u.role === 'parent');
  }, [classStudents, users]);

  // Loading and error states
  if (loading && !classes.length) {
    return <LoadingSpinner message="Klasgegevens laden..." />;
  }

  if (error) {
    return (
      <div className="card text-red-600 bg-red-50 border-red-200 p-4">
        <AlertCircle className="inline mr-2"/>
        Fout bij laden: {error}
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'teacher') {
    return (
      <div className="card text-orange-600 bg-orange-50 border-orange-200 p-4">
        <AlertCircle className="inline mr-2"/>
        Geen toegang. U dient ingelogd te zijn als leraar.
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="card text-center p-8">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Klas niet gevonden</h2>
        <p className="text-gray-600 mb-4">
          De opgevraagde klas kon niet worden gevonden of u heeft geen toegang tot deze klas.
        </p>
        <Button onClick={() => navigate('/dashboard')} icon={ArrowLeft}>
          Terug naar Dashboard
        </Button>
      </div>
    );
  }

  // Modal handlers
  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => {
    if (!isLoading) {
      setModalState({ type: null, data: null });
    }
  };
  
  // Qor'aan modal handlers
  const handleShowQuranProgress = (student) => {
    setSelectedStudentForQuran(student);
    setShowQuranModal(true);
  };

  const handleCloseQuranModal = () => {
    setShowQuranModal(false);
    setSelectedStudentForQuran(null);
  };

  // Add Student modal handlers
  const handleAddStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleCloseAddStudentModal = () => {
    setShowAddStudentModal(false);
  };

  // Rapport modal handlers
  const handleShowReport = (student) => {
    setSelectedStudentForReport(student);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setSelectedStudentForReport(null);
    setShowReportModal(false);
  };

  const handlePrintReport = () => {
    const reportElement = document.getElementById('report-content');
    if (reportElement) {
      window.print();
    }
  };

  // Bulk message modal handlers
  const handleShowClassBulkModal = () => {
    setShowClassBulkModal(true);
    setClassBulkError('');
  };

  const handleCloseClassBulkModal = () => {
    if (!isLoading) {
      setShowClassBulkModal(false);
      setClassBulkError('');
    }
  };

  const handleClassBulkSubmit = async (formData) => {
    setIsLoading(true);
    setClassBulkError('');

    try {
      const { selectedParentIds, subject, body } = formData;

      let result;
      if (selectedParentIds.length === classParents.length) {
        // All parents selected, use the original endpoint
        result = await apiCall('/api/email/send-to-class', {
          method: 'POST',
          body: JSON.stringify({
            classId: currentClass.id,
            subject,
            body
          })
        });
      } else {
        // Selected parents only, use the new endpoint
        result = await apiCall('/api/email/send-to-selected-class-parents', {
          method: 'POST',
          body: JSON.stringify({
            classId: currentClass.id,
            subject,
            body,
            selectedParentIds
          })
        });
      }

      setFeedback({
        type: 'success',
        message: result?.message || 'Berichten succesvol verstuurd!'
      });

      setShowClassBulkModal(false);
      return true;
    } catch (error) {
      console.error('Bulk email error:', error);
      setClassBulkError(error.message || 'Er ging iets mis bij het versturen van de berichten.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Functie om de rij uit/in te klappen
  const toggleStudentExpansion = (studentId) => {
    setExpandedStudentId(prevId => (prevId === studentId ? null : studentId));
  };
  
  // Email handler
  const handleSendEmail = async ({ subject, body }) => {
    setIsLoading(true);
    setFeedback({ type: '', message: '' });
    
    try {
      let result;
      if (modalState.type === 'mail_parent') {
        const parent = users.find(u => String(u.id) === String(modalState.data.parent_id));
        if (!parent) {
          throw new Error('Ouder niet gevonden');
        }
        result = await apiCall('/api/email/send-to-parent', {
          method: 'POST',
          body: JSON.stringify({ 
            recipientUserId: parent.id, 
            subject, 
            body,
            studentName: modalState.data.name
          })
        });
      } else if (modalState.type === 'mail_class') {
        result = await apiCall('/api/email/send-to-class', {
          method: 'POST',
          body: JSON.stringify({ 
            classId: currentClass.id, 
            subject, 
            body 
          })
        });
      }
      
      setFeedback({ 
        type: 'success', 
        message: result?.message || 'Email succesvol verstuurd!' 
      });
      closeModal();
    } catch (error) {
      console.error('Email error:', error);
      setFeedback({ 
        type: 'error', 
        message: `Fout bij versturen: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientInfo = () => {
    if (modalState.type === 'mail_parent' && modalState.data) {
      const parent = users.find(u => String(u.id) === String(modalState.data.parent_id));
      return parent ? `${parent.name} (${parent.email})` : 'Ouder niet gevonden';
    } else if (modalState.type === 'mail_class') {
      const parentCount = [...new Set(
        classStudents
          .map(s => s.parent_id)
          .filter(Boolean)
      )].length;
      return `${parentCount} ouder(s) van klas ${currentClass.name}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Pagina Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors lg:hidden"
              title="Terug naar dashboard"
            >
              <ArrowLeft size={20} className="text-gray-600"/>
            </button>
            <h2 className="page-title mb-0">{currentClass.name}</h2>
          </div>
          <p className="text-gray-600 ml-11 lg:ml-0 mb-2">
            {currentClass.description || 'Geen omschrijving beschikbaar.'}
          </p>
          <p className="text-sm text-gray-500 ml-11 lg:ml-0">
            {classStudents.length} actieve leerling{classStudents.length !== 1 ? 'en' : ''}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button icon={UserPlus} onClick={handleAddStudent}>
            Nieuwe Leerling
          </Button>
          <Button
            icon={Mail}
            variant="secondary"
            onClick={handleShowClassBulkModal}
            disabled={classStudents.length === 0}
          >
            Bericht naar Ouders
          </Button>
          <Link to={`/teacher/class/${classId}/attendance`}>
            <Button icon={Calendar} variant="secondary" className="w-full">
              Aanwezigheid
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Feedback Messages */}
      {feedback.message && (
        <div className={`p-4 rounded-md text-sm flex items-center ${
          feedback.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle size={18} className="mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Leerlingen Tabel met Uitklapbare Rijen */}
      {classStudents.length === 0 ? (
        <div className="card text-center p-8">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Geen leerlingen</h3>
          <p className="text-gray-600 mb-4">
            Er zijn nog geen leerlingen toegevoegd aan deze klas.
          </p>
          <Button icon={UserPlus} onClick={handleAddStudent}>
            Voeg eerste leerling toe
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leerling
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classStudents.map(student => {
                const isExpanded = expandedStudentId === student.id;
                const parent = users.find(u => String(u.id) === String(student.parent_id));
                return (
                  <React.Fragment key={student.id}>
                    {/* Hoofdrij */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStudentExpansion(student.id)} 
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          title={isExpanded ? 'Inklappen' : 'Uitklappen'}
                        >
                          {isExpanded ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        {student.notes && !isExpanded && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={student.notes}>
                            {student.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            icon={Mail} 
                            onClick={() => parent && openModal('mail_parent', student)}
                            disabled={!parent?.email}
                            title={parent?.email ? `Mail ${parent.name}` : 'Geen email beschikbaar'}
                          >
                            Mail
                          </Button>
                          
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            icon={ClipboardList} 
                            onClick={() => handleShowReport(student)}
                            title="Rapport bekijken/bewerken"
                          >
                            Rapport
                          </Button>
                          
                          <Button 
                            size="sm" 
                            icon={BookMarked} 
                            onClick={() => handleShowQuranProgress(student)}
                            title="Qor'aan voortgang bekijken"
                          >
                            Qor'aan
                          </Button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Uitgeklapte rij met details */}
                    {isExpanded && (
                      <tr className="bg-emerald-50">
                        <td colSpan="3" className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <h4 className="font-semibold text-gray-500 text-xs uppercase mb-1">Geboortedatum</h4>
                              <p className="text-gray-800">
                                {student.date_of_birth 
                                  ? new Date(student.date_of_birth).toLocaleDateString('nl-NL') 
                                  : <span className="italic text-gray-400">Niet opgegeven</span>
                                }
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-500 text-xs uppercase mb-1">Ouder</h4>
                              <p className="text-gray-800">
                                {parent?.name || <span className="italic text-gray-400">Geen ouder gekoppeld</span>}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-500 text-xs uppercase mb-1">Contact Ouder</h4>
                              {parent ? (
                                <div className="space-y-1 mt-1">
                                  <div className="flex items-center text-gray-700">
                                    <Mail size={12} className="mr-2 text-gray-400 flex-shrink-0"/>
                                    <span className="truncate" title={parent.email}>
                                      {parent.email}
                                    </span>
                                  </div>
                                  {parent.phone && (
                                    <div className="flex items-center text-gray-700">
                                      <Phone size={12} className="mr-2 text-gray-400 flex-shrink-0"/>
                                      <span>{parent.phone}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-400 italic">Geen contact info</p>
                              )}
                            </div>
                          </div>
                          {student.notes && (
                            <div className="mt-4 pt-3 border-t border-emerald-200">
                              <h4 className="font-semibold text-gray-500 text-xs uppercase mb-1">Notities</h4>
                              <p className="text-gray-800 italic">{student.notes}</p>
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
      )}

      {/* Email Modals */}
      <MailModal 
        show={modalState.type === 'mail_parent'} 
        onClose={closeModal} 
        title={`Email naar ouder van ${modalState.data?.name}`}
        onSend={handleSendEmail}
        isLoading={isLoading}
        recipientInfo={getRecipientInfo()}
      />
      
      <MailModal 
        show={modalState.type === 'mail_class'} 
        onClose={closeModal} 
        title={`Bericht naar alle ouders van ${currentClass.name}`}
        onSend={handleSendEmail}
        isLoading={isLoading}
        recipientInfo={getRecipientInfo()}
      />
      
      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={handleCloseAddStudentModal}
          classId={currentClass.id}
          className={currentClass.name}
        />
      )}
      
      {/* Qor'aan Progress Modal */}
      {showQuranModal && selectedStudentForQuran && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4" 
          aria-labelledby="quran-modal-title" 
          role="dialog" 
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 id="quran-modal-title" className="text-lg font-medium text-gray-900">
                Qor'aan Voortgang: {selectedStudentForQuran.name}
              </h3>
              <button 
                onClick={handleCloseQuranModal} 
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
                <span className="sr-only">Sluiten</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <QuranProgressTracker 
                studentId={selectedStudentForQuran.id} 
                studentName={selectedStudentForQuran.name} 
                classId={selectedStudentForQuran.class_id} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Rapport Modal */}
      {showReportModal && selectedStudentForReport && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col my-8">
            <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900">
                Rapport: {selectedStudentForReport.name}
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  icon={Printer} 
                  variant="secondary" 
                  onClick={handlePrintReport}
                  title="Rapport afdrukken"
                >
                  Afdrukken
                </Button>
                <button 
                  onClick={handleCloseReportModal} 
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                  title="Rapport sluiten"
                >
                  <XCircle size={24} />
                  <span className="sr-only">Sluiten</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" id="report-content">
              <StudentReport 
                student={selectedStudentForReport}
                studentClass={currentClass}
                teacher={users.find(u => String(u.id) === String(currentClass.teacher_id))}
                isEditable={String(currentUser.id) === String(currentClass.teacher_id)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Class Bulk Message Modal */}
      <ClassBulkMessageModal
        isOpen={showClassBulkModal}
        onClose={handleCloseClassBulkModal}
        onSubmit={handleClassBulkSubmit}
        classParents={classParents}
        classStudents={classStudents}
        classInfo={currentClass}
        isLoading={isLoading}
        modalError={classBulkError}
      />
    </div>
  );
};

export default TeacherMyClassesPage;