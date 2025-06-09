// src/pages/TeacherMyClassesPage.js - DEFINITIEVE VERSIE MET WERKENDE EMAIL
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { apiCall } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { 
  AlertCircle, 
  UserPlus, 
  Mail, 
  BookMarked, 
  User, 
  Phone, 
  Send, 
  Calendar,
  ArrowLeft,
  X,
  CheckCircle
} from 'lucide-react';

// De nieuwe, functionele MailModal component
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
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
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

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

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

  const currentClass = classes.find(c => String(c.id) === String(classId));
  
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

  const classStudents = students.filter(s => 
    String(s.class_id) === String(classId) && s.active
  );

  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => {
    if (!isLoading) {
      setModalState({ type: null, data: null });
    }
  };

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
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Terug naar dashboard"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="page-title mb-0">{currentClass.name}</h2>
          </div>
          <p className="text-gray-600 ml-11">
            {currentClass.description || 'Geen omschrijving beschikbaar'}
          </p>
          <p className="text-sm text-gray-500 ml-11">
            {classStudents.length} actieve leerling{classStudents.length !== 1 ? 'en' : ''}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button icon={UserPlus}>Nieuwe Leerling</Button>
          <Button 
            icon={Mail} 
            variant="secondary" 
            onClick={() => openModal('mail_class')}
            disabled={classStudents.length === 0}
          >
            Bericht aan Klas
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

      {/* Leerlingen Tabel */}
      {classStudents.length === 0 ? (
        <div className="card text-center p-8">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Geen leerlingen</h3>
          <p className="text-gray-600 mb-4">
            Er zijn nog geen leerlingen toegevoegd aan deze klas.
          </p>
          <Button icon={UserPlus}>Voeg eerste leerling toe</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leerling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geboortedatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ouder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Ouder
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classStudents.map(student => {
                  const parent = users.find(u => String(u.id) === String(student.parent_id));
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        {student.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={student.notes}>
                            {student.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.date_of_birth 
                          ? new Date(student.date_of_birth).toLocaleDateString('nl-NL') 
                          : <span className="italic text-gray-400">Niet opgegeven</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parent?.name || <span className="italic text-gray-400">Geen ouder gekoppeld</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parent ? (
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Mail size={12} className="mr-2 text-gray-400 flex-shrink-0"/>
                              <span className="truncate max-w-xs" title={parent.email}>
                                {parent.email}
                              </span>
                            </div>
                            {parent.phone && (
                              <div className="flex items-center">
                                <Phone size={12} className="mr-2 text-gray-400 flex-shrink-0"/>
                                <span>{parent.phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-gray-400">Geen contact info</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => parent && openModal('mail_parent', student)}
                            disabled={!parent?.email}
                            title={parent?.email ? `Mail ${parent.name}` : 'Geen email beschikbaar'}
                          >
                            <Mail size={14} />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            icon={BookMarked}
                            title="Qor'aan voortgang"
                          >
                            Qor'aan
                          </Button>
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
    </div>
  );
};

export default TeacherMyClassesPage;