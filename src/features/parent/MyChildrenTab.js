// src/features/parent/MyChildrenTab.js - Uitgebreid met Qor'aan voortgang
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import QuranProgressView from './QuranProgressView';
import { 
  Users, 
  BookOpen as ClassIcon, 
  User as TeacherIcon, 
  CalendarDays, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  BarChart3,
  BookMarked,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyChildrenTab = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { 
    students, 
    classes, 
    users, 
    attendanceStats, 
    loading: dataLoading, 
    error: dataError 
  } = realData;

  const [expandedChild, setExpandedChild] = useState(null);
  const [showQuranProgress, setShowQuranProgress] = useState({});

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

  // Helper functie om aanwezigheidspercentage te berekenen
  const calculateAttendancePercentage = (stats) => {
    if (!stats) return { percentage: 0, latePercentage: 0 };
    const total = stats.aanwezig + stats.afwezig_ongeoorloofd + stats.afwezig_geoorloofd + stats.te_laat;
    if (total === 0) return { percentage: 0, latePercentage: 0 };
    
    // Aanwezig + te laat = totaal effectief aanwezig
    const totalPresent = stats.aanwezig + stats.te_laat;
    const attendancePercentage = Math.round((totalPresent / total) * 100);
    
    // Percentage van aanwezigheid dat te laat was
    const latePercentage = totalPresent > 0 ? Math.round((stats.te_laat / totalPresent) * 100) : 0;
    
    return { percentage: attendancePercentage, latePercentage };
  };

  const toggleChildExpansion = (childId) => {
    setExpandedChild(expandedChild === childId ? null : childId);
  };

  const toggleQuranProgress = (childId) => {
    setShowQuranProgress(prev => ({
      ...prev,
      [childId]: !prev[childId]
    }));
  };

  // Render attendancestatistieken component
  const AttendanceStats = ({ childId, childName }) => {
    const stats = attendanceStats?.[childId];
    
    if (!stats) {
      return (
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
            <BarChart3 size={14} className="mr-1" />
            Aanwezigheid
          </h4>
          <p className="text-sm text-gray-500 italic">Nog geen aanwezigheidsgegevens beschikbaar</p>
        </div>
      );
    }

    const total = stats.aanwezig + stats.afwezig_ongeoorloofd + stats.afwezig_geoorloofd + stats.te_laat;
    const attendanceResult = calculateAttendancePercentage(stats);
    const attendancePercentage = attendanceResult.percentage;
    const latePercentage = attendanceResult.latePercentage;
    
    return (
      <div className="pt-3 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center">
          <BarChart3 size={14} className="mr-1" />
          Aanwezigheid ({total} lessen)
        </h4>
        
        {/* Percentage indicator */}
        <div className="flex items-center mb-3">
          <TrendingUp size={16} className="mr-2 text-blue-600" />
          <span className="text-sm font-medium text-gray-700 mr-2">Aanwezigheidspercentage:</span>
          <span className={`text-sm font-bold px-2 py-1 rounded ${
            attendancePercentage >= 90 ? 'text-green-700 bg-green-100' :
            attendancePercentage >= 75 ? 'text-yellow-700 bg-yellow-100' :
            'text-red-700 bg-red-100'
          }`}>
            {attendancePercentage}%
            {latePercentage > 0 && (
              <span className="text-xs font-normal ml-1 opacity-75">
                (waarvan {latePercentage}% te laat)
              </span>
            )}
          </span>
        </div>

        {/* Statistieken grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center p-2 bg-green-50 rounded-lg">
            <CheckCircle2 size={16} className="mr-2 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-green-800">{stats.aanwezig}</div>
              <div className="text-green-600">Aanwezig</div>
            </div>
          </div>
          
          <div className="flex items-center p-2 bg-red-50 rounded-lg">
            <XCircle size={16} className="mr-2 text-red-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-800">{stats.afwezig_ongeoorloofd}</div>
              <div className="text-red-600">Afwezig</div>
            </div>
          </div>
          
          <div className="flex items-center p-2 bg-yellow-50 rounded-lg">
            <Clock size={16} className="mr-2 text-yellow-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-yellow-800">{stats.te_laat}</div>
              <div className="text-yellow-600">Te laat</div>
            </div>
          </div>
          
          <div className="flex items-center p-2 bg-blue-50 rounded-lg">
            <CheckCircle2 size={16} className="mr-2 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-blue-800">{stats.afwezig_geoorloofd}</div>
              <div className="text-blue-600">Geoorloofde afwezigheid</div>
            </div>
          </div>
        </div>

        {/* Progress bar voor visuele weergave */}
        {total > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
              {/* Totale aanwezigheid (inclusief te laat) */}
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  attendancePercentage >= 90 ? 'bg-green-500' :
                  attendancePercentage >= 75 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              ></div>
              {/* Overlay voor "te laat" percentage binnen de aanwezigheid */}
              {latePercentage > 0 && (
                <div 
                  className="absolute top-0 right-0 h-2 bg-orange-400 bg-opacity-60"
                  style={{ 
                    width: `${(stats.te_laat / total) * 100}%`,
                    right: `${100 - attendancePercentage}%`
                  }}
                  title={`${latePercentage}% van aanwezigheid was te laat`}
                ></div>
              )}
            </div>
            {latePercentage > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Oranje gedeelte toont te laat percentage binnen aanwezigheid
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

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
      ) : myChildren.length > 0 ? (
        <div className="space-y-6">
          {myChildren.map(child => {
            const childClass = classes ? classes.find(c => String(c.id) === String(child.class_id)) : null;
            const teacherUser = users && childClass?.teacher_id ? users.find(u => u.role === 'teacher' && String(u.id) === String(childClass.teacher_id)) : null;
            const teacherName = teacherUser?.name || <span className="italic text-gray-500">Nog niet toegewezen</span>;
            const isExpanded = expandedChild === child.id;
            const showingQuranProgress = showQuranProgress[child.id];

            return (
              <div key={child.id} className="card hover:shadow-lg transition-shadow duration-150">
                {/* Child header */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-emerald-700">{child.name}</h3>
                    {child.active === false && (
                      <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full mt-1">Inactief</span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => toggleQuranProgress(child.id)}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        showingQuranProgress 
                          ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' 
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <BookMarked size={14} className="mr-1" />
                      Qor'aan Voortgang
                    </button>
                    
                    <button
                      onClick={() => toggleChildExpansion(child.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} className="mr-1" />
                          Inklappen
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="mr-1" />
                          Details
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                  <div className="flex items-center py-1">
                    <ClassIcon size={18} className="mr-2.5 text-blue-600 flex-shrink-0" />
                    <strong className="w-24 inline-block flex-shrink-0">Klas:</strong>
                    <span>{childClass?.name || <span className="italic text-gray-500">Geen klas</span>}</span>
                  </div>
                  <div className="flex items-center py-1">
                    <TeacherIcon size={18} className="mr-2.5 text-purple-600 flex-shrink-0" />
                    <strong className="w-24 inline-block flex-shrink-0">Leraar:</strong>
                    <span>{teacherName}</span>
                  </div>
                </div>

                {/* Qor'aan Progress Section */}
                {showingQuranProgress && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                    <QuranProgressView 
                      childId={child.id} 
                      childName={child.name} 
                    />
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="space-y-4">
                    {/* Extra details */}
                    {child.date_of_birth && (
                      <div className="flex items-center py-1 text-sm">
                        <CalendarDays size={18} className="mr-2.5 text-gray-500 flex-shrink-0" />
                        <strong className="w-28 inline-block flex-shrink-0">Geboortedatum:</strong>
                        <span>{new Date(child.date_of_birth).toLocaleDateString('nl-NL')}</span>
                      </div>
                    )}

                    {/* Aanwezigheidsstatistieken */}
                    <AttendanceStats childId={child.id} childName={child.name} />

                    {/* Class description */}
                    {childClass?.description && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Informatie over de klas:</h4>
                        <p className="text-xs text-gray-600">{childClass.description}</p>
                      </div>
                    )}

                    {/* Child notes */}
                    {child.notes && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Notities over {child.name}:</h4>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{child.notes}</p>
                      </div>
                    )}
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