// src/pages/TeacherMyClassesPage.js - HET NIEUWE KLASSE-DASHBOARD
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { 
  AlertCircle, 
  UserPlus, 
  Mail, 
  BookMarked, 
  User, 
  Phone, 
  Calendar,
  ArrowLeft
} from 'lucide-react';

// Placeholder Modal Component
const MailModal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div>{children}</div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} variant="secondary">Annuleren</Button>
            <Button onClick={onClose}>Versturen</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherMyClassesPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { realData } = useData();
  const { classes = [], students = [], users = [], loading, error } = realData;

  // State voor de modals
  const [showMailParentModal, setShowMailParentModal] = useState(false);
  const [showMailClassModal, setShowMailClassModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

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

  const currentClass = classes.find(c => String(c.id) === String(classId));
  
  if (!currentClass) {
    return (
      <div className="card text-center p-8">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Klas niet gevonden</h2>
        <p className="text-gray-600 mb-4">De opgevraagde klas kon niet worden gevonden.</p>
        <Button onClick={() => navigate('/dashboard')} icon={ArrowLeft}>
          Terug naar Dashboard
        </Button>
      </div>
    );
  }

  const classStudents = students.filter(s => 
    String(s.class_id) === String(classId) && s.active
  );

  const handleMailParent = (student) => {
    const parent = users.find(u => String(u.id) === String(student.parent_id));
    if (parent) {
      setSelectedRecipient({ ...parent, studentName: student.name });
      setShowMailParentModal(true);
    } else {
      alert('Ouderinformatie niet gevonden voor deze leerling.');
    }
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
            onClick={() => setShowMailClassModal(true)}
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
                            onClick={() => handleMailParent(student)}
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

      {/* Modals */}
      <MailModal 
        show={showMailParentModal} 
        onClose={() => {
          setShowMailParentModal(false);
          setSelectedRecipient(null);
        }} 
        title={`Email naar ${selectedRecipient?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aan:
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {selectedRecipient?.email} (ouder van {selectedRecipient?.studentName})
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onderwerp:
            </label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Onderwerp van uw email"
              defaultValue={`Bericht over ${selectedRecipient?.studentName}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bericht:
            </label>
            <textarea 
              className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 resize-none" 
              placeholder="Typ hier uw bericht..."
            />
          </div>
        </div>
      </MailModal>

      <MailModal 
        show={showMailClassModal} 
        onClose={() => setShowMailClassModal(false)} 
        title={`Bericht naar alle ouders van ${currentClass.name}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Let op:</strong> Dit bericht wordt verstuurd naar {classStudents.length} ouder(s).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onderwerp:
            </label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Onderwerp van uw email"
              defaultValue={`Bericht van klas ${currentClass.name}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bericht:
            </label>
            <textarea 
              className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 resize-none" 
              placeholder="Typ hier uw bericht..."
            />
          </div>
        </div>
      </MailModal>
    </div>
  );
};

export default TeacherMyClassesPage;