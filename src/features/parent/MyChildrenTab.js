// src/features/parent/MyChildrenTab.js - HERSTELDE VERSIE als overzichtspagina
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, BookOpen as ClassIcon, User as TeacherIcon, AlertCircle, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyChildrenTab = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { students, classes, users, loading: dataLoading, error: dataError } = realData;

  if (dataLoading && (!students || students.length === 0)) {
    return <LoadingSpinner message="Gegevens van uw kinderen laden..." />;
  }

  if (dataError) {
    return <div className="card text-red-600 bg-red-50 border-red-200"><AlertCircle className="inline mr-2"/>Fout: {dataError}</div>;
  }

  const myChildren = students ? students.filter(student => String(student.parent_id) === String(currentUser.id)) : [];

  return (
    <div className="space-y-6">
      <h2 className="page-title">Mijn Kinderen Overzicht</h2>

      {myChildren.length === 0 && !dataLoading ? (
        <div className="card text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Geen kinderen gevonden</h3>
            <p className="text-gray-600 max-w-md mx-auto">Er zijn geen leerlingen aan uw account gekoppeld.</p>
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
                className="card block hover:bg-emerald-50 hover:shadow-lg transition-all duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-emerald-700">{child.name}</h3>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                            <span className="inline-flex items-center"><ClassIcon size={14} className="mr-1.5 text-blue-500"/>{childClass?.name || 'Geen klas'}</span>
                            <span className="inline-flex items-center"><TeacherIcon size={14} className="mr-1.5 text-purple-500"/>{teacherUser?.name || 'Geen leraar'}</span>
                        </div>
                    </div>
                    <div className="flex items-center text-gray-500">
                        <span className="text-sm mr-2 hidden sm:inline">Bekijk Dashboard</span>
                        <ChevronRight size={20} />
                    </div>
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