// src/pages/TeacherSingleClassPage.js - NIEUWE PAGINA VOOR INDIVIDUELE KLAS
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AddStudentModal from '../features/teacher/AddStudentModal';
import QuranProgressTracker from '../features/teacher/QuranProgressTracker';
import { 
  BookOpen, 
  Users, 
  AlertCircle, 
  ArrowLeft,
  UserPlus,
  BookMarked,
  Calendar,
  GraduationCap,
  User
} from 'lucide-react';

const TeacherSingleClassPage = () => {
  const { classId } = useParams();
  const { realData } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showQuranProgress, setShowQuranProgress] = useState(false);
  const [selectedStudentForQuran, setSelectedStudentForQuran] = useState(null);

  // Data destructuring met fallbacks
  const teacherAssignedClasses = realData.teacherAssignedClasses || [];
  const students = realData.students || [];
  const allUsers = realData.users || [];
  const loading = realData.loading;
  const error = realData.error;

  // Zoek de specifieke klas
  const currentClass = teacherAssignedClasses.find(cls => cls.id === classId);
  const classStudents = students.filter(s => s.class_id === classId && s.active);
  const teacherDetails = allUsers.find(u => u.id === currentClass?.teacher_id);

  // Security check: mag deze leraar deze klas bekijken?
  const isAuthorized = currentUser && 
    (currentUser.role === 'admin' || 
     (currentUser.role === 'teacher' && currentClass && String(currentClass.teacher_id) === String(currentUser.id)));

  if (loading && teacherAssignedClasses.length === 0) {
    return <LoadingSpinner message="Klas gegevens laden..." />;
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
      <div className="card p-4 text-center">
        Geen toegang. U dient ingelogd te zijn als leraar.
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Klas niet gevonden</h3>
        <p className="text-gray-600 mb-4">
          De gevraagde klas bestaat niet of u heeft geen toegang.
        </p>
        <Link 
          to="/teacher/my-classes"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <ArrowLeft size={16} className="mr-2" />
          Terug naar Mijn Klassen
        </Link>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Geen toegang</h3>
        <p className="text-gray-600 mb-4">
          U heeft geen rechten om deze klas te bekijken.
        </p>
        <Link 
          to="/teacher/my-classes"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <ArrowLeft size={16} className="mr-2" />
          Terug naar Mijn Klassen
        </Link>
      </div>
    );
  }

  const handleAddStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleShowQuranProgress = (student) => {
    setSelectedStudentForQuran(student);
    setShowQuranProgress(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link 
              to="/teacher/my-classes"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h2 className="page-title flex items-center">
              <GraduationCap className="mr-3 text-emerald-600" size={28} />
              {currentClass.name}
            </h2>
          </div>
          
          {currentClass.description && (
            <p className="text-gray-600 mb-3">{currentClass.description}</p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span className="flex items-center">
              <Users size={16} className="mr-1.5" />
              {classStudents.length} actieve leerling(en)
            </span>
            {teacherDetails && (
              <span className="flex items-center">
                <User size={16} className="mr-1.5" />
                Leraar: {teacherDetails.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAddStudent}
            className="inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <UserPlus size={16} className="mr-2" />
            Leerling Toevoegen
          </button>
          
          <Link
            to={`/teacher/class/${currentClass.id}/attendance`}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Calendar size={16} className="mr-2" />
            Absenties Bijhouden
          </Link>
        </div>
      </div>

      {/* Students Grid */}
      {classStudents.length === 0 ? (
        <div className="card text-center p-8">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Geen leerlingen</h3>
          <p className="text-gray-600 mb-4">
            Er zijn nog geen leerlingen in deze klas geregistreerd.
          </p>
          <button
            onClick={handleAddStudent}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <UserPlus size={16} className="mr-2" />
            Eerste Leerling Toevoegen
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-lg font-medium text-gray-800 flex items-center">
              <Users size={20} className="mr-2" />
              Leerlingen ({classStudents.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classStudents.map(student => (
              <div key={student.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-800 text-sm">{student.name}</h4>
                  {!student.active && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      Inactief
                    </span>
                  )}
                </div>
                
                {student.date_of_birth && (
                  <p className="text-xs text-gray-500 mb-2">
                    Geboren: {new Date(student.date_of_birth).toLocaleDateString('nl-NL')}
                  </p>
                )}

                {student.notes && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {student.notes}
                  </p>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => handleShowQuranProgress(student)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"
                  >
                    <BookMarked size={12} className="mr-1.5" />
                    Qor'aan Voortgang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          classId={currentClass.id}
          className={currentClass.name}
        />
      )}

      {/* Quran Progress Modal */}
      {showQuranProgress && selectedStudentForQuran && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BookMarked className="mr-2 text-emerald-600" size={24} />
                    Qor'aan Voortgang - {selectedStudentForQuran.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowQuranProgress(false);
                      setSelectedStudentForQuran(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <span className="sr-only">Sluiten</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <QuranProgressTracker
                    studentId={selectedStudentForQuran.id}
                    studentName={selectedStudentForQuran.name}
                    classId={selectedStudentForQuran.class_id}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSingleClassPage;