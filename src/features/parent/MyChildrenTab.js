// src/features/parent/MyChildrenTab.js - VERNIEUWDE LIJSTWEERGAVE
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  Users, 
  BookOpen as ClassIcon, 
  User as TeacherIcon, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyChildrenTab = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { 
    students, 
    classes, 
    users, 
    loading: dataLoading, 
    error: dataError 
  } = realData;

  // Wacht tot alle benodigde data is geladen
  if (dataLoading && (!students || students.length === 0) && !dataError) {
    return <LoadingSpinner message="Gegevens van uw kinderen laden..." />;
  }

  if (dataError) {
    return (
      <div className="card text-red-600 bg-red-50 border-red-200">
        <AlertCircle className="inline mr-2"/>
        Fout bij laden van gegevens: {dataError}
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'parent') {
    return (
      <div className="card text-orange-600 bg-orange-50 border-orange-200">
        <AlertCircle className="inline mr-2"/>
        Geen toegang. U dient ingelogd te zijn als ouder.
      </div>
    );
  }

  // Filter de kinderen van de ingelogde ouder
  const myChildren = students ? students.filter(student => String(student.parent_id) === String(currentUser.id)) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Mijn Kinderen</h2>
      </div>

      {myChildren.length === 0 && !dataLoading ? (
        <div className="card text-center">
          <Users className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nog geen kinderen ingeschreven</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Er zijn op dit moment geen leerlingen gekoppeld aan uw account.
            Als dit niet klopt, neem dan contact op met de administratie van de moskee.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myChildren.map(child => {
            const childClass = classes?.find(c => String(c.id) === String(child.class_id));
            const teacherUser = users?.find(u => u.role === 'teacher' && String(u.id) === String(childClass?.teacher_id));
            
            return (
              <Link
                key={child.id}
                to={`/parent/my-children/${child.id}`}
                className="card flex items-center justify-between hover:bg-emerald-50 hover:shadow-lg transition-all duration-150 cursor-pointer group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-emerald-700 group-hover:text-emerald-800">
                      {child.name}
                    </h3>
                    {child.active === false && (
                      <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                        Inactief
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center">
                      <ClassIcon size={14} className="mr-1.5 text-blue-500 flex-shrink-0"/>
                      <strong className="mr-1">Klas:</strong>
                      {childClass?.name || <span className="italic text-gray-500">Geen klas</span>}
                    </span>
                    <span className="inline-flex items-center">
                      <TeacherIcon size={14} className="mr-1.5 text-purple-500 flex-shrink-0"/>
                      <strong className="mr-1">Leraar:</strong>
                      {teacherUser?.name || <span className="italic text-gray-500">Nog niet toegewezen</span>}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-500 group-hover:text-emerald-600 transition-colors">
                  <span className="text-sm mr-2 hidden sm:block">Dashboard</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyChildrenTab;