// src/pages/TeacherMyClassesPage.js - DEFINITIEVE, PROFESSIONELE VERSIE
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AddStudentModal from '../features/teacher/AddStudentModal';
import QuranProgressTracker from '../features/teacher/QuranProgressTracker';
import Button from '../components/Button';
import { 
  BookOpen, 
  Users, 
  AlertCircle, 
  UserPlus,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Calendar,
  XCircle // Zorg dat deze import er is voor de modal
} from 'lucide-react';

const TeacherMyClassesPage = () => {
  const { realData } = useData();
  const { currentUser } = useAuth();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedClassForAddStudent, setSelectedClassForAddStudent] = useState(null);
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [selectedStudentForQuran, setSelectedStudentForQuran] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);

  const { teacherAssignedClasses = [], students = [], loading, error } = realData;

  if (loading && teacherAssignedClasses.length === 0) {
    return <LoadingSpinner message="Mijn klassen laden..." />;
  }

  if (error) {
    return <div className="card text-red-600 p-4"><AlertCircle className="inline mr-2"/>Fout: {error}</div>;
  }

  const handleToggleExpansion = (classId) => {
    setExpandedClassId(prevId => (prevId === classId ? null : classId));
  };
  
  const handleAddStudent = (classObj) => {
    setSelectedClassForAddStudent(classObj);
    setShowAddStudentModal(true);
  };

  const handleShowQuranProgress = (student) => {
    setSelectedStudentForQuran(student);
    setShowQuranModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Mijn Klassen</h2>
        <p className="text-sm text-gray-600">Beheer hier uw klassen, leerlingen en voortgang.</p>
      </div>
      
      {teacherAssignedClasses.length === 0 && !loading ? (
        <div className="card text-center p-8">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Geen klassen toegewezen</h3>
          <p className="text-gray-600">Neem contact op met de administratie als dit niet klopt.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {teacherAssignedClasses.map(cls => {
            // Defensive check voor ongeldige data in de array
            if (!cls || !cls.id) return null;

            const classStudents = students.filter(s => s.class_id === cls.id && s.active);
            const isExpanded = expandedClassId === cls.id;

            return (
              <div key={cls.id} className="card p-0 overflow-hidden border hover:shadow-lg transition-shadow duration-200">
                {/* Kaart Header */}
                <div className="p-5">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-emerald-700">{cls.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{cls.description || "Geen omschrijving."}</p>
                      <p className="flex items-center text-sm font-medium text-gray-600 mt-2">
                        <Users size={16} className="mr-2 text-emerald-600"/>
                        {classStudents.length} actieve leerling(en)
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center">
                      <Button onClick={() => handleToggleExpansion(cls.id)} variant="secondary" icon={isExpanded ? ChevronUp : ChevronDown}>
                        Leerlingen ({classStudents.length})
                      </Button>
                      <Button onClick={() => handleAddStudent(cls)} variant="secondary" icon={UserPlus}>Toevoegen</Button>
                      <Link to={`/teacher/class/${cls.id}/attendance`}>
                        <Button variant="primary" icon={Calendar} className="w-full">Absenties</Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Uitklapbare Leerlingenlijst */}
                {isExpanded && (
                  <div className="bg-gray-50 px-5 py-5 border-t border-emerald-100">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Leerlingen in {cls.name}</h4>
                    {classStudents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classStudents.map(student => (
                          <div key={student.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col">
                            <div className="flex-1">
                                <h5 className="font-semibold text-gray-800">{student.name}</h5>
                                {student.date_of_birth && (
                                    <p className="text-xs text-gray-500">
                                        Geboren: {new Date(student.date_of_birth).toLocaleDateString('nl-NL')}
                                    </p>
                                )}
                                {student.notes && (
                                    <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100 line-clamp-2" title={student.notes}>
                                        <strong>Notitie:</strong> {student.notes}
                                    </p>
                                )}
                            </div>
                            <Button onClick={() => handleShowQuranProgress(student)} variant="secondary" size="sm" icon={BookMarked} fullWidth className="mt-4">
                              Qor'aan Voortgang
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Er zijn nog geen leerlingen toegevoegd aan deze klas.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddStudentModal && <AddStudentModal isOpen={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} classId={selectedClassForAddStudent.id} className={selectedClassForAddStudent.name} />}
      
      {/* De betere, professionele modal structuur */}
      {showQuranModal && selectedStudentForQuran && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 id="modal-title" className="text-lg font-medium text-gray-900">Qor'aan Voortgang: {selectedStudentForQuran.name}</h3>
              <button onClick={() => setShowQuranModal(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <XCircle size={24} />
                <span className="sr-only">Sluiten</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <QuranProgressTracker studentId={selectedStudentForQuran.id} studentName={selectedStudentForQuran.name} classId={selectedStudentForQuran.class_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMyClassesPage;