// src/features/parent/MyChildrenTab.js - COMPLETE VERSIE
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { apiCall } from '../../services/api'; // Nodig voor aanwezigheidshistorie
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
  Info
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

// Helper component voor de tab-knoppen
const ViewTab = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
      isActive
        ? 'bg-emerald-600 text-white shadow'
        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
    }`}
  >
    <Icon size={16} className="mr-2" />
    {label}
  </button>
);

// Component voor de gedetailleerde aanwezigheidshistorie
const AttendanceHistoryView = ({ childId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { realData } = useData();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!realData.mosque?.id) return;
            try {
                const data = await apiCall(`/api/leerlingen/${childId}/absentiehistorie`);
                setHistory(data || []);
            } catch (err) {
                setError('Kon historie niet laden.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [childId, realData.mosque?.id]);

    if (loading) return <div className="text-center p-4"><LoadingSpinner message="Historie laden..." /></div>;
    if (error) return <div className="p-3 bg-red-50 text-red-600 rounded-md">{error}</div>;

    const statusInfo = {
        aanwezig: { icon: CheckCircle2, color: 'text-green-500', label: 'Aanwezig' },
        te_laat: { icon: Clock, color: 'text-orange-500', label: 'Te laat' },
        afwezig_ongeoorloofd: { icon: XCircle, color: 'text-red-500', label: 'Afwezig' },
        afwezig_geoorloofd: { icon: Info, color: 'text-blue-500', label: 'Afwezig (Geoorloofd)' }
    };

    return (
        <div className="space-y-3 mt-4">
             <h4 className="text-md font-semibold text-gray-700">Recente Lesmomenten</h4>
             {history.length > 0 ? history.map(item => {
                 const Icon = statusInfo[item.status]?.icon || AlertCircle;
                 const color = statusInfo[item.status]?.color || 'text-gray-500';
                 const label = statusInfo[item.status]?.label || 'Onbekend';
                 return(
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div>
                            <p className="font-semibold text-gray-800">{new Date(item.les.les_datum).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-xs text-gray-500">{item.les.onderwerp || 'Algemene les'}</p>
                        </div>
                        <div className={`flex items-center text-sm font-medium ${color}`}>
                            <Icon size={18} className="mr-2"/>
                            <span>{label}</span>
                        </div>
                    </div>
                 )
             }) : (
                 <p className="text-sm text-gray-500 italic">Geen recente aanwezigheidsregistraties gevonden.</p>
             )}
        </div>
    );
};

// Component voor de aanwezigheidsstatistieken overzicht
const AttendanceStatsView = ({ stats }) => {
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

    if (!stats) {
        return (
            <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <BarChart3 size={18} className="mr-2"/>
                    Statistieken
                </h4>
                <p className="text-sm text-gray-500 italic">Nog geen aanwezigheidsstatistieken beschikbaar.</p>
            </div>
        );
    }

    const total = stats.aanwezig + stats.afwezig_ongeoorloofd + stats.afwezig_geoorloofd + stats.te_laat;
    const { percentage, latePercentage } = calculateAttendancePercentage(stats);

    return (
        <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <BarChart3 size={18} className="mr-2"/>
                Statistieken ({total} lessen)
            </h4>
            
            {/* Percentage indicator */}
            <div className="flex items-center mb-4">
                <TrendingUp size={16} className="mr-2 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 mr-3">Aanwezigheidspercentage:</span>
                <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                    percentage >= 90 ? 'bg-green-100 text-green-800' : 
                    percentage >= 75 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                }`}>
                    {percentage}%
                    {latePercentage > 0 && (
                        <span className="text-xs font-normal ml-1 opacity-75">
                            (waarvan {latePercentage}% te laat)
                        </span>
                    )}
                </span>
            </div>

            {/* Statistieken grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-1">
                        <CheckCircle2 size={16} className="mr-1 text-green-600" />
                        <strong className="block text-green-800">{stats.aanwezig}</strong>
                    </div>
                    <span className="text-xs text-green-600">Aanwezig</span>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center mb-1">
                        <XCircle size={16} className="mr-1 text-red-600" />
                        <strong className="block text-red-800">{stats.afwezig_ongeoorloofd}</strong>
                    </div>
                    <span className="text-xs text-red-600">Afwezig</span>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                    <div className="flex items-center mb-1">
                        <Clock size={16} className="mr-1 text-orange-600" />
                        <strong className="block text-orange-800">{stats.te_laat}</strong>
                    </div>
                    <span className="text-xs text-orange-600">Te laat</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-1">
                        <Info size={16} className="mr-1 text-blue-600" />
                        <strong className="block text-blue-800">{stats.afwezig_geoorloofd}</strong>
                    </div>
                    <span className="text-xs text-blue-600">Geoorloofd</span>
                </div>
            </div>

            {/* Progress bar voor visuele weergave */}
            {total > 0 && (
                <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        {/* Totale aanwezigheid (inclusief te laat) */}
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                percentage >= 90 ? 'bg-green-500' :
                                percentage >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                        {/* Overlay voor "te laat" percentage binnen de aanwezigheid */}
                        {latePercentage > 0 && (
                            <div 
                                className="absolute top-0 right-0 h-2 bg-orange-400 bg-opacity-60"
                                style={{ 
                                    width: `${(stats.te_laat / total) * 100}%`,
                                    right: `${100 - percentage}%`
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

const MyChildrenTab = () => {
  const { currentUser } = useAuth();
  const { realData } = useData();
  const { 
    students, 
    classes, 
    users, 
    attendanceStats, 
    quranStats, 
    loading: dataLoading, 
    error: dataError 
  } = realData;
  
  // State om de actieve weergave per kind bij te houden (bv. 'details', 'attendance', 'quran')
  const [activeView, setActiveView] = useState({});

  // Wacht tot alle benodigde data is geladen
  if (dataLoading && (!students?.length || !classes?.length || !users?.length) && !dataError) {
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

  const handleViewChange = (childId, view) => {
    setActiveView(prev => ({ ...prev, [childId]: prev[childId] === view ? null : view }));
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
      ) : (
        <div className="space-y-5">
          {myChildren.map(child => {
            const childClass = classes?.find(c => String(c.id) === String(child.class_id));
            const teacherUser = users?.find(u => u.role === 'teacher' && String(u.id) === String(childClass?.teacher_id));
            const teacherName = teacherUser?.name || 'Nog niet toegewezen';
            const currentView = activeView[child.id];

            return (
              <div key={child.id} className="card p-0 overflow-hidden hover:shadow-lg transition-shadow duration-150">
                <div className="p-5">
                    {/* Header per kind */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                        <div className="flex-1">
                            <h3 className="text-2xl font-semibold text-emerald-700">{child.name}</h3>
                            {child.active === false && (
                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full mt-1 inline-block">
                                    Inactief
                                </span>
                            )}
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
                        {child.date_of_birth && (
                            <div className="flex items-center py-1">
                                <CalendarDays size={18} className="mr-2.5 text-gray-500 flex-shrink-0" />
                                <strong className="w-24 inline-block flex-shrink-0">Geboren:</strong>
                                <span>{new Date(child.date_of_birth).toLocaleDateString('nl-NL')}</span>
                            </div>
                        )}
                    </div>

                    {/* Tab Knoppen */}
                    <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        <ViewTab 
                            label="Overzicht" 
                            icon={BarChart3} 
                            isActive={currentView === 'details'} 
                            onClick={() => handleViewChange(child.id, 'details')} 
                        />
                        <ViewTab 
                            label="Aanwezigheid" 
                            icon={CalendarDays} 
                            isActive={currentView === 'attendance'} 
                            onClick={() => handleViewChange(child.id, 'attendance')} 
                        />
                        <ViewTab 
                            label="Qor'aan" 
                            icon={BookMarked} 
                            isActive={currentView === 'quran'} 
                            onClick={() => handleViewChange(child.id, 'quran')} 
                        />
                    </div>
                </div>
                
                {/* Content die wisselt op basis van geselecteerde tab */}
                {currentView && (
                    <div className="bg-gray-50 px-5 py-5 border-t border-emerald-100">
                        {currentView === 'details' && (
                            <div>
                                <AttendanceStatsView stats={attendanceStats?.[child.id]} />
                                
                                {/* Extra details */}
                                {childClass?.description && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <h4 className="text-md font-semibold text-gray-700 mb-2">Informatie over de klas</h4>
                                        <p className="text-sm text-gray-600">{childClass.description}</p>
                                    </div>
                                )}

                                {child.notes && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <h4 className="text-md font-semibold text-gray-700 mb-2">Notities over {child.name}</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{child.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {currentView === 'attendance' && (
                            <AttendanceHistoryView childId={child.id} />
                        )}
                        
                        {currentView === 'quran' && (
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                                <QuranProgressView 
                                    childId={child.id} 
                                    childName={child.name} 
                                />
                            </div>
                        )}
                    </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyChildrenTab;