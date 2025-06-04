// src/pages/TeacherMyClassesPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpen, Users, AlertCircle, ArrowRight } from 'lucide-react';

const TeacherMyClassesPage = () => {
  const { realData } = useData();
  const { currentUser } = useAuth();

  // Console logs voor debugging
  // console.log("[TeacherMyClassesPage] Rendering. realData:", JSON.stringify(realData, null, 2));
  // console.log("[TeacherMyClassesPage] currentUser:", currentUser);

  // Veilige destructurering met fallbacks naar lege arrays
  const teacherAssignedClasses = realData.teacherAssignedClasses || [];
  const students = realData.students || [];
  const allUsers = realData.users || []; // allUsers is een betere naam dan 'users' als variabele
  const loading = realData.loading;
  const error = realData.error;

  // console.log("[TeacherMyClassesPage] Destructured data: teacherAssignedClasses length:", teacherAssignedClasses.length, "students length:", students.length, "allUsers length:", allUsers.length, "loading:", loading, "error:", error);

  // Aangepaste loading check: wacht tot loading false is, of als loading true is en er zijn nog geen klassen
  // Dit voorkomt een flash van "geen klassen" als data nog laadt.
  if (loading && teacherAssignedClasses.length === 0) {
    return <LoadingSpinner message="Mijn klassen laden..." />;
  }

  if (error) {
    return <div className="card text-red-600 bg-red-50 border-red-200 p-4"><AlertCircle className="inline mr-2"/>Fout bij laden: {error}</div>;
  }

  if (!currentUser || currentUser.role !== 'teacher') {
    // Deze situatie zou idealiter al door ProtectedRoute worden afgevangen
    return <div className="card p-4 text-center">Geen toegang. U dient ingelogd te zijn als leraar.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="page-title">Mijn Klassen</h2>
      
      {/* Toon alleen als niet aan het laden is EN er daadwerkelijk geen klassen zijn */}
      {teacherAssignedClasses.length === 0 && !loading ? (
        <div className="card text-center p-6">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Geen klassen toegewezen</h3>
          <p className="text-gray-600">Er zijn momenteel geen actieve klassen aan u toegewezen. Neem contact op met de administratie als dit niet klopt.</p>
        </div>
      ) : (
        // Alleen de grid tonen als er klassen zijn (voorkomt errors als de array nog leeg is tijdens een render cycle)
        teacherAssignedClasses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherAssignedClasses.map(cls => {
              if (!cls || !cls.id) { // Extra check voor geldige klas objecten
                console.warn("[TeacherMyClassesPage] Invalid class object in map:", cls);
                return null; 
              }
              // Vind de studenten die bij deze klas horen
              const classStudents = students.filter(s => s.class_id === cls.id && s.active);
              // De leraar naam (van de ingelogde leraar, of als er een andere teacher_id is voor de volledigheid)
              const teacherDetails = allUsers.find(u => u.id === cls.teacher_id);

              return (
                <div key={cls.id} className="card hover:shadow-lg transition-shadow duration-150 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-emerald-700 mb-2">{cls.name || "Naamloze Klas"}</h3>
                    {/* Toon als de klas een andere leraar heeft dan de ingelogde (onwaarschijnlijk hier, maar defensief) */}
                    {teacherDetails && currentUser && teacherDetails.id !== currentUser.id && (
                       <p className="text-xs text-gray-500 mb-1">Leraar: {teacherDetails.name}</p>
                    )}
                    <p className="text-sm text-gray-600 mb-1 line-clamp-2 h-10" title={cls.description || ''}>{cls.description || "Geen omschrijving."}</p> {/* Vaste hoogte voor lijnconsistentie */}
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <Users size={16} className="mr-1.5" />
                      <span>{classStudents.length} actieve leerling(en)</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/teacher/class/${cls.id}/attendance`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Absenties Registreren <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default TeacherMyClassesPage;