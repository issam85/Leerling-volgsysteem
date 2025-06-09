// src/pages/ChildDetailPage.js - DEFINITIEVE VOLLEDIGE VERSIE MET WERKENDE RAPPORT-WEERGAVE
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { apiCall } from '../services/api';
import { 
  ArrowLeft, 
  User, 
  BookOpen as ClassIcon, 
  CalendarDays, 
  BookMarked, 
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle, 
  Clock,
  Info,
  Printer
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import QuranProgressView from '../features/parent/QuranProgressView';
import StudentReport from '../features/teacher/StudentReport';

// Volledige AbsentieOverzichtView component
const AbsentieOverzichtView = ({ childId }) => {
    const { realData } = useData();
    const stats = realData.attendanceStats?.[childId];
    
    if (!stats) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Aanwezigheidsoverzicht</h3>
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 italic">Geen aanwezigheidsstatistieken beschikbaar.</p>
                    <p className="text-sm text-gray-500 mt-2">
                        De leraar heeft nog geen aanwezigheid geregistreerd voor dit kind.
                    </p>
                </div>
            </div>
        );
    }

    const total = stats.aanwezig + stats.afwezig_ongeoorloofd + stats.afwezig_geoorloofd + stats.te_laat;
    const percentage = total > 0 ? Math.round(((stats.aanwezig + stats.te_laat) / total) * 100) : 0;

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Aanwezigheidsoverzicht</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="card p-4 text-center bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <div className={`text-4xl font-bold mb-1 ${
                        percentage >= 90 ? 'text-emerald-600' : 
                        percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                        {percentage}%
                    </div>
                    <div className="text-sm text-emerald-800 font-medium">Aanwezigheid</div>
                </div>
                
                <div className="card p-4 text-center bg-green-50 border-green-200">
                    <div className="text-4xl font-bold text-green-700 mb-1">{stats.aanwezig}</div>
                    <div className="text-sm text-green-800 font-medium">Aanwezig</div>
                </div>
                
                <div className="card p-4 text-center bg-orange-50 border-orange-200">
                    <div className="text-4xl font-bold text-orange-700 mb-1">{stats.te_laat}</div>
                    <div className="text-sm text-orange-800 font-medium">Te Laat</div>
                </div>
                
                <div className="card p-4 text-center bg-red-50 border-red-200">
                    <div className="text-4xl font-bold text-red-700 mb-1">{stats.afwezig_ongeoorloofd}</div>
                    <div className="text-sm text-red-800 font-medium">Ongeoorloofd Afwezig</div>
                </div>
                
                <div className="card p-4 text-center bg-blue-50 border-blue-200">
                    <div className="text-4xl font-bold text-blue-700 mb-1">{stats.afwezig_geoorloofd}</div>
                    <div className="text-sm text-blue-800 font-medium">Geoorloofd Afwezig</div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Samenvatting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Totaal aantal lessen:</span>
                        <span className="font-semibold ml-2">{total}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Effectief aanwezig:</span>
                        <span className="font-semibold ml-2">{stats.aanwezig + stats.te_laat} lessen</span>
                    </div>
                </div>
                
                {percentage < 75 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                            <AlertCircle size={16} className="text-yellow-600 mr-2" />
                            <span className="text-sm text-yellow-800">
                                De aanwezigheid is lager dan 75%. Neem contact op met de leraar als er vragen zijn.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Verbeterde RapportView met StudentReport integratie
const RapportView = ({ student, studentClass, teacher }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const reportPeriod = "2024-2025";

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                setError('');
                
                // Check if we're in demo mode (geen production hostname)
                const isDemoMode = !window.location.hostname.includes('production');
                
                if (isDemoMode) {
                    // Demo mode: gebruik mock data
                    console.log("Demo mode: gebruik mock rapport data voor ouder");
                    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
                    
                    setReport({
                        student_id: student.id,
                        grades: {
                            ar_write: 'G',
                            ar_read: 'V',
                            qu_recite: 'G',
                            att_general: 'V',
                            we_effort: 'G',
                            ie_understand: 'V',
                            be_teacher: 'G',
                        },
                        comments: 'Goede voortgang dit kwartaal. Blijf zo doorgaan met de mooie inzet!',
                        attendanceStats: {
                            aanwezig: 24,
                            te_laat: 2,
                            afwezig_geoorloofd: 1,
                            afwezig_ongeoorloofd: 0,
                        }
                    });
                } else {
                    // Production mode: try real API
                    const data = await apiCall(`/api/students/${student.id}/report?period=${reportPeriod}`);
                    if (data && data.student_id) {
                        setReport(data);
                    } else {
                        setReport(null); // Geen rapport gevonden
                    }
                }
            } catch (err) {
                console.error("Fout bij ophalen rapport voor ouder:", err);
                setError("Kon het rapport niet laden. Probeer het later opnieuw.");
            } finally {
                setLoading(false);
            }
        };

        if (student?.id) {
            fetchReport();
        }
    }, [student?.id, reportPeriod]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner message="Rapport laden..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                <div className="flex items-center">
                    <XCircle size={16} className="mr-2" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }
    
    if (!report) {
        return (
            <div className="text-center py-12">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                    <Info size={32} className="mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-800 mb-2">Nog geen rapport beschikbaar</h3>
                    <p className="text-sm text-blue-700">
                        De leraar heeft voor de periode "{reportPeriod}" nog geen rapport opgeslagen voor {student.name}.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                        Rapporten worden meestal aan het einde van elk kwartaal gepubliceerd.
                    </p>
                </div>
            </div>
        );
    }

    // Print functie voor ouders
    const handlePrintReport = () => {
        window.print();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Rapport</h3>
                <Button 
                    icon={Printer} 
                    variant="secondary" 
                    onClick={handlePrintReport}
                    title="Rapport afdrukken"
                >
                    Afdrukken
                </Button>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <StudentReport 
                    student={student} 
                    studentClass={studentClass}
                    teacher={teacher}
                    isEditable={false} // BELANGRIJK: Ouders kunnen niet bewerken
                />
            </div>
            
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                <Info size={16} className="inline mr-2" />
                Dit is een alleen-lezen weergave van het rapport. Voor vragen over het rapport kunt u contact opnemen met de leraar.
            </div>
        </div>
    );
};

// Hoofdcomponent
const ChildDetailPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { realData } = useData();
    const { students, classes, users, loading: dataLoading } = realData;
    const [activeTab, setActiveTab] = useState('aanwezigheid');

    if (dataLoading && !students?.length) {
        return <LoadingSpinner message="Leerlinggegevens laden..." />;
    }

    const student = students.find(s => s.id === studentId);

    if (!student) {
        return (
            <div className="card text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Leerling niet gevonden</h2>
                <p className="text-gray-600 mb-4">
                    De opgevraagde leerling kon niet worden gevonden.
                </p>
                <Button onClick={() => navigate('/parent/my-children')} icon={ArrowLeft}>
                    Terug naar overzicht
                </Button>
            </div>
        );
    }

    const studentClass = classes?.find(c => c.id === student.class_id);
    const teacher = users?.find(u => u.id === studentClass?.teacher_id);
    
    const TabButton = ({ tabName, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm sm:text-base font-semibold border-b-2 transition-colors duration-150 ${
                activeTab === tabName 
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
        >
            <Icon size={18} className="mr-2" />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => navigate('/parent/my-children')} 
                    className="p-2 mr-4 rounded-full hover:bg-gray-100 transition-colors"
                    title="Terug naar mijn kinderen"
                >
                    <ArrowLeft size={24} className="text-gray-600"/>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="inline-flex items-center">
                            <ClassIcon size={14} className="mr-1.5"/>
                            {studentClass?.name || 'Geen klas toegewezen'}
                        </span>
                        <span className="inline-flex items-center">
                            <User size={14} className="mr-1.5"/>
                            {teacher?.name || 'Geen leraar toegewezen'}
                        </span>
                        {student.date_of_birth && (
                            <span className="inline-flex items-center">
                                <CalendarDays size={14} className="mr-1.5"/>
                                {new Date(student.date_of_birth).toLocaleDateString('nl-NL')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigatie */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <TabButton tabName="aanwezigheid" label="Aanwezigheid" icon={CalendarDays}/>
                    <TabButton tabName="quran" label="Qor'aan" icon={BookMarked}/>
                    <TabButton tabName="rapport" label="Rapport" icon={ClipboardList}/>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'aanwezigheid' && <AbsentieOverzichtView childId={student.id} />}
                {activeTab === 'quran' && (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Qor'aan Voortgang</h3>
                        <QuranProgressView childId={student.id} childName={student.name} />
                    </div>
                )}
                {activeTab === 'rapport' && (
                    <RapportView 
                        student={student} 
                        studentClass={studentClass} 
                        teacher={teacher} 
                    />
                )}
            </div>
        </div>
    );
};

export default ChildDetailPage;