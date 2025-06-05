// src/pages/TeacherMyClassesPage.js - Uitgebreid met leerling toevoegen en Qor'aan voortgang
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AddStudentModal from '../features/teacher/AddStudentModal';
import QuranProgressTracker from '../features/teacher/QuranProgressTracker';
import { 
  BookOpen, 
  Users, 
  AlertCircle, 
  ArrowRight, 
  UserPlus,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp
} from 'lucide-react';

const TeacherMyClassesPage = () => {
  const { realData } = useData();
  const { currentUser } = useAuth();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedClassForAddStudent, setSelectedClassForAddStudent] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [showQuranProgress, setShowQuranProgress] = useState(false);
  const [selectedStudentForQuran, setSelectedStudentForQuran] = useState(null);

  // Veilige destructurering met fallbacks naar lege arrays
  const teacherAssignedClasses = realData.teacherAssignedClasses || [];
  const students = realData.students || [];
  const allUsers = realData.users || [];
  const loading = realData.loading;
  const error = realData.error;

  // Aangepaste loading check
  if (loading && teacherAssignedClasses.length === 0) {
    return <LoadingSpinner message="Mijn klassen laden..." />;
  }

  if (error) {
    return <div className="card text-red-600 bg-red-50 border-red-200 p-4"><AlertCircle className="inline mr-2"/>Fout bij laden: {error}</div>;
  }

  if (!currentUser || currentUser.role !== 'teacher') {
    return <div className="card p-4 text-center">Geen toegang. U dient ingelogd te zijn als leraar.</div>;
  }

  const handleAddStudent = (classObj) => {
    setSelectedClassForAddStudent(classObj);
    setShowAddStudentModal(true);
  };

  const handleShowQuranProgress = (student) => {
    setSelectedStudentForQuran(student);
    setShowQuranProgress(true);
  };

  const toggleClassExpansion = (classId) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Mijn Klassen</h2>
        <div className="text-sm text-gray-600">
          Als leraar kunt u leerlingen toevoegen en Qor'aan voortgang bijhouden
        </div>
      </div>
      
      {teacherAssignedClasses.length === 0 && !loading ? (
        <div className="card text-center p-6">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Geen klassen toegewezen</h3>
          <p className="text-gray-600">Er zijn momenteel geen actieve klassen aan u toegewezen. Neem contact op met de administratie als dit niet klopt.</p>
        </div>
      ) : (
        teacherAssignedClasses.length > 0 && (
          <div className="space-y-6">
            {teacherAssignedClasses.map(cls => {
              if (!cls || !cls.id) {
                console.warn("[TeacherMyClassesPage] Invalid class object:", cls);
                return null; 
              }
              
              const classStudents = students.filter(s => s.class_id === cls.id && s.active);
              const teacherDetails = allUsers.find(u => u.id === cls.teacher_id);
              const isExpanded = expandedClass === cls.id;

              return (
                <div key={cls.id} className="card hover:shadow-lg transition-shadow duration-150">
                  {/* Class header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-emerald-700 mb-2">{cls.name || "Naamloze Klas"}</h3>
                      {teacherDetails && currentUser && teacherDetails.id !== currentUser.id && (
                         <p className="text-xs text-gray-500 mb-1">Leraar: {teacherDetails.name}</p>
                      )}
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{cls.description || "Geen omschrijving."}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users size={16} className="mr-1.5" />
                        <span>{classStudents.length} actieve leerling(en)</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleAddStudent(cls)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <UserPlus size={16} className="mr-2" />
                        Leerling Toevoegen
                      </button>
                      
                      <Link
                        to={`/teacher/class/${cls.id}/attendance`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <Calendar size={16} className="mr-2" />
                        Absenties
                      </Link>
                      
                      {classStudents.length > 0 && (
                        <button
                          onClick={() => toggleClassExpansion(cls.id)}
                          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={16} className="mr-2" />
                              Inklappen
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} className="mr-2" />
                              Leerlingen ({classStudents.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded students list */}
                  {isExpanded && classStudents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                        <Users size={18} className="mr-2" />
                        Leerlingen in {cls.name}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classStudents.map(student => (
                          <div key={student.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-800">{student.name}</h5>
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
                                <BookMarked size={14} className="mr-1.5" />
                                Qor'aan Voortgang
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedClassForAddStudent && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => {
            setShowAddStudentModal(false);
            setSelectedClassForAddStudent(null);
          }}
          classId={selectedClassForAddStudent.id}
          className={selectedClassForAddStudent.name}
        />
      )}

      {/* Quran Progress Modal/View */}
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
                    Qor'aan Voortgang
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

export default TeacherMyClassesPage;