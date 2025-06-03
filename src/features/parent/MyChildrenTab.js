// src/features/parent/MyChildrenTab.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, BookOpen as ClassIcon, User as TeacherIcon, CalendarDays, AlertCircle, Smile, Frown } from 'lucide-react'; // Smile/Frown voor aanwezigheid (voorbeeld)
import LoadingSpinner from '../../components/LoadingSpinner'; // Zorg dat dit pad correct is

const MyChildrenTab = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { students, classes, users, loading: dataLoading, error: dataError } = realData; // users voor lerarennamen

  // Wacht tot alle benodigde data is geladen
  if (dataLoading && (!students?.length || !classes?.length || !users?.length) && !dataError) {
    return <LoadingSpinner message="Gegevens van uw kinderen laden..." />;
  }

  if (dataError) {
    return (
      <div className="card text-red-600 bg-red-50 border-red-200">
        <AlertCircle className="inline mr-2 mb-1"/>Fout bij laden van gegevens: {dataError}
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'parent') {
    return (
      <div className="card text-orange-600 bg-orange-50 border-orange-200">
        <AlertCircle className="inline mr-2 mb-1"/>Geen toegang. U dient ingelogd te zijn als ouder.
      </div>
    );
  }

  // Filter de kinderen van de ingelogde ouder
  const myChildren = students ? students.filter(student => String(student.parent_id) === String(currentUser.id)) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="page-title">Mijn Kinderen</h2>
        {/* Hier zou een knop kunnen komen om bijv. een nieuw kind aan te melden (indien die flow bestaat) */}
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
      ) : myChildren.length > 0 ? (
        <div className="space-y-6">
          {myChildren.map(child => {
            const childClass = classes ? classes.find(c => String(c.id) === String(child.class_id)) : null;
            // De 'teacher' info zit genest in 'childClass' door je backend query voor klassen
            // Echter, de 'teacher' in classes is alleen een ID. We moeten de leraar opzoeken in de 'users' array.
            const teacherUser = users && childClass?.teacher_id ? users.find(u => u.role === 'teacher' && String(u.id) === String(childClass.teacher_id)) : null;
            const teacherName = teacherUser?.name || <span className="italic text-gray-500">Nog niet toegewezen</span>;

            return (
              <div key={child.id} className="card hover:shadow-lg transition-shadow duration-150">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                    <h3 className="text-2xl font-semibold text-emerald-700">{child.name}</h3>
                    {child.active === false && ( // Toon als kind inactief is
                        <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full mt-1 sm:mt-0">Inactief</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center py-1">
                    <ClassIcon size={18} className="mr-2.5 text-blue-600 flex-shrink-0" />
                    <strong className="w-28 inline-block flex-shrink-0">Klas:</strong>
                    <span>{childClass?.name || <span className="italic text-gray-500">Geen klas</span>}</span>
                  </div>
                  <div className="flex items-center py-1">
                    <TeacherIcon size={18} className="mr-2.5 text-purple-600 flex-shrink-0" />
                    <strong className="w-28 inline-block flex-shrink-0">Leraar:</strong>
                    <span>{teacherName}</span>
                  </div>
                  {child.date_of_birth && (
                    <div className="flex items-center py-1">
                      <CalendarDays size={18} className="mr-2.5 text-gray-500 flex-shrink-0" />
                      <strong className="w-28 inline-block flex-shrink-0">Geboortedatum:</strong>
                      <span>{new Date(child.date_of_birth).toLocaleDateString('nl-NL')}</span>
                    </div>
                  )}
                  {/* Voorbeeld voor toekomstige uitbreidingen */}
                  {/* <div className="flex items-center py-1">
                    <Smile size={18} className="mr-2.5 text-green-500 flex-shrink-0" />
                    <strong className="w-28 inline-block flex-shrink-0">Aanwezigheid:</strong>
                    <span>95% (Voorbeeld)</span>
                  </div> */}
                </div>

                {childClass?.description && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Informatie over de klas:</h4>
                        <p className="text-xs text-gray-600">{childClass.description}</p>
                    </div>
                )}

                {child.notes && (
                     <div className="mt-4 pt-3 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Notities over {child.name}:</h4>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{child.notes}</p>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default MyChildrenTab;