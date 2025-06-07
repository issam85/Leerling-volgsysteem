// src/pages/TeacherMyClassesPage.js - DEFINITIEVE, VOLLEDIGE EN CORRECTE VERSIE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import AddStudentModal from '../features/teacher/AddStudentModal';
import QuranProgressTracker from '../features/teacher/QuranProgressTracker';
import { 
  BookOpen, 
  Users, 
  AlertCircle, 
  UserPlus,
  BookMarked,
  Calendar,
  ChevronLeft
} from 'lucide-react';

const TeacherMyClassesPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const { realData } = useData();
  const { currentUser } = useAuth();
  const { classes, students, loading, error } = realData;

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showQuranProgressModal, setShowQuranProgressModal] = useState(false);
  const [selectedStudentForQuran, setSelectedStudentForQuran] = useState(null);

  const [currentClass, setCurrentClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);

  useEffect(() => {
    if (classId && classes.length > 0 && currentUser) {
      const foundClass = classes.find(c => String(c.id) === String(classId));
      
      if (foundClass && String(foundClass.teacher_id) === String(currentUser.id)) {
        setCurrentClass(foundClass);
        const studentsInClass = students.filter(s => String(s.class_id) === String(classId) && s.active);
        setClassStudents(studentsInClass);
      } else {
        setCurrentClass(null);
        setClassStudents([]);
      }
    } else {
      setCurrentClass(null);
      setClassStudents([]);
    }
  }, [classId, classes, students, currentUser]);

  const handleAddStudentClick = () => setShowAddStudentModal(true);
  
  const handleShowQuranProgress = (student) => {
    setSelectedStudentForQuran(student);
    setShowQuranProgressModal(true);
  };

  if (loading && !currentClass && classId) {
    return <LoadingSpinner message="Klasdetails laden..." />;
  }
  if (loading && !classId) {
    return <LoadingSpinner message="Klassenoverzicht laden..." />;
  }

  if (error) {
    return <div className="card text-red-600"><AlertCircle className="inline mr-2"/>Fout: {error}</div>;
  }

  // --- DETAIL VIEW ---
  if (classId) {
    if (!currentClass) {
        return (
            <div className="card text-center p-6">
                <AlertCircle size={20} className="mx-auto mb-2 text-yellow-500" />
                <h3 className="text-lg font-semibold">Klas niet gevonden</h3>
                <p className="text-gray-600 mt-1">
                    De geselecteerde klas kon niet worden gevonden of u heeft geen toegang.
                </p>
                <div className="mt-4">
                    <Button onClick={() => navigate('/teacher/my-classes')}>
                        <ChevronLeft size={16} className="mr-2"/> Terug naar overzicht
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/teacher/my-classes')} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft size={16} className="mr-1.5"/> Alle Klassen
          </Button>
          <div className="card bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1">
                    <h2 className="page-title !mb-1">{currentClass.name}</h2>
                    <p className="text-gray-600 line-clamp-2 mt-1">{currentClass.description || "Geen omschrijving."}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                    <Button onClick={handleAddStudentClick} variant="outline" className="bg-white">
                        <UserPlus size={16} className="mr-2" /> Leerling Toevoegen
                    </Button>
                    <Button as={Link} to={`/teacher/class/${classId}/attendance`}>
                        <Calendar size={16} className="mr-2" /> Absenties
                    </Button>
                </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users size={20} className="mr-3 text-emerald-600"/>
                Leerlingen in deze klas ({classStudents.length})
            </h3>
            {classStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classStudents.map(student => (
                  <div key={student.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-gray-800">{student.name}</h4>
                    {student.date_of_birth && (
                      <p className="text-sm text-gray-500 mb-3">
                        Geboren: {new Date(student.date_of_birth).toLocaleDateString('nl-NL')}
                      </p>
                    )}
                    <Button 
                        onClick={() => handleShowQuranProgress(student)} 
                        variant="primary" 
                        size="sm"
                        fullWidth
                    >
                        <BookMarked size={14} className="mr-2" /> Qor'aan Voortgang
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-5">Er zijn nog geen actieve leerlingen in deze klas.</p>
            )}
          </div>

          {showAddStudentModal && currentClass && (
            <AddStudentModal
              isOpen={showAddStudentModal}
              onClose={() => setShowAddStudentModal(false)}
              classId={currentClass.id}
              className={currentClass.name}
            />
          )}
          
          {showQuranProgressModal && selectedStudentForQuran && (
            <Modal 
              isOpen={showQuranProgressModal} 
              onClose={() => setShowQuranProgressModal(false)}
              title={`Qor'aan Voortgang: ${selectedStudentForQuran.name}`}
              size="2xl"
            >
              <QuranProgressTracker
                studentId={selectedStudentForQuran.id}
                studentName={selectedStudentForQuran.name}
                classId={selectedStudentForQuran.class_id}
              />
            </Modal>
          )}
        </div>
      );
  }

  // --- MASTER VIEW ---
  return (
    <div className="text-center p-6 sm:p-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-400 mx-auto mb-4" />
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Welkom bij Mijn Klassen</h2>
      <p className="mt-2 text-base text-gray-600 max-w-lg mx-auto">
        Selecteer een van uw klassen in het menu aan de linkerkant om de details te bekijken.
      </p>
    </div>
  );
};

export default TeacherMyClassesPage;