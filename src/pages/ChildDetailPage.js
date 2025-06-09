// src/pages/ChildDetailPage.js - DEFINITIEVE VOLLEDIGE VERSIE
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

// Volledig uitgewerkte RapportView component
const RapportView = ({ student, studentClass, teacher }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportPeriod = "2024-2025";
  const currentDate = new Date().toLocaleDateString('nl-NL');

  useEffect(() => {
    const fetchReport = async () => {
      // Wacht niet langer als we al weten dat er geen student is
      if (!student?.id) {
        setLoading(false);
        setError("Leerlinginformatie niet beschikbaar.");
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Check if we're in demo mode
        const isDemoMode = !window.location.hostname.includes('production');
        
        if (isDemoMode) {
          // Demo mode: gebruik mock data
          console.log("Demo mode: gebruik mock rapport data voor ouder");
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
          
          const mockData = {
            student_id: student.id,
            grades: {
              ar_write: 'G',
              ar_read: 'V',
              ar_recognize: 'G',
              ar_dictation: 'M',
              ar_present: 'V',
              qu_recite: 'G',
              qu_memorize: 'V',
              qu_process: 'G',
              qu_range: 'V',
              we_effort: 'G',
              we_focus: 'V',
              we_independent: 'G',
              we_pace: 'V',
              we_homework: 'G',
              ie_understand: 'V',
              ie_learn: 'G',
              be_teacher: 'G',
              be_peers: 'V',
              att_general: 'G',
            },
            comments: `Uitstekende voortgang dit kwartaal. ${student.name} toont veel inzet en motivatie bij alle vakken. Blijf zo doorgaan!`,
            attendanceStats: {
              aanwezig: 26,
              te_laat: 1,
              afwezig_geoorloofd: 1,
              afwezig_ongeoorloofd: 0,
            }
          };
          setReport(mockData);
        } else {
          // Production mode: try real API
          const data = await apiCall(`/api/students/${student.id}/report?period=${reportPeriod}`);
          if (data && data.student_id) {
            setReport(data);
          } else {
            setReport(null);
          }
        }
      } catch (err) {
        console.error("Fout bij ophalen rapport voor ouder:", err);
        setError("Kon het rapport niet laden.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [student?.id, reportPeriod]);

  if (loading) return <LoadingSpinner message="Rapport laden..." />;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

  if (!report) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <Info size={24} className="mx-auto mb-2 text-blue-600" />
        <h3 className="font-semibold text-blue-800">Nog geen rapport beschikbaar</h3>
        <p className="text-sm text-blue-700 mt-1">
          De leraar heeft voor de periode "{reportPeriod}" nog geen rapport opgeslagen voor {student.name}.
        </p>
      </div>
    );
  }

  // Definitie van de Grade weergave (read-only)
  const GradeDisplay = ({ grade }) => {
    if (!grade) return <div className="w-8 h-8 rounded-full bg-gray-200"></div>;
    
    const gradeColors = {
      'G': 'bg-emerald-600',
      'V': 'bg-blue-600', 
      'M': 'bg-yellow-600',
      'O': 'bg-red-600'
    };
    
    return (
      <div className={`w-8 h-8 rounded-full font-bold text-white text-xs flex items-center justify-center ${gradeColors[grade] || 'bg-gray-400'}`}>
        {grade}
      </div>
    );
  };

  // Read-only rapport sectie component
  const ReportSectionReadOnly = ({ title, titleAr, items, grades }) => (
    <tbody>
      <tr className="bg-gray-200">
        <th className="p-3 text-left font-semibold text-gray-700 border border-gray-300">{title}</th>
        <th className="p-3 text-right font-semibold text-gray-700 font-arabic border border-gray-300">{titleAr}</th>
        {['G', 'V', 'M', 'O'].map(g => (
          <th key={g} className="p-3 w-12 text-center font-semibold border border-gray-300">{g}</th>
        ))}
      </tr>
      {items.map((item) => (
        <tr key={item.id} className="border-b hover:bg-gray-50">
          <td className="p-3 border border-gray-300">{item.label}</td>
          <td className="p-3 text-right font-arabic border border-gray-300">{item.labelAr}</td>
          {['G', 'V', 'M', 'O'].map(grade => (
            <td key={grade} className="p-3 border border-gray-300 text-center">
              {grades[item.id] === grade ? (
                <GradeDisplay grade={grade} />
              ) : (
                <div className="w-8 h-8"></div>
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  // Aanwezigheid sectie (read-only)
  const AttendanceSectionReadOnly = ({ stats, grades }) => {
    const items = [
      { id: 'att_general', label: 'Aanwezigheid Algemeen', labelAr: 'الحضور العام', key: null },
      { id: 'att_present', label: 'Aantal lessen aanwezig', labelAr: 'الحضور', key: 'aanwezig' },
      { id: 'att_late', label: 'Aantal lessen te laat', labelAr: 'التأخير', key: 'te_laat' },
      { id: 'att_absent_legit', label: 'Aantal lessen geoorloofd afwezig', labelAr: 'الغياب المبرر', key: 'afwezig_geoorloofd' },
      { id: 'att_absent_illegit', label: 'Aantal lessen ongeoorloofd afwezig', labelAr: 'الغياب غير المبرر', key: 'afwezig_ongeoorloofd' },
    ];
    
    return (
      <tbody>
        <tr className="bg-gray-200">
          <th className="p-3 text-left font-semibold text-gray-700 border border-gray-300">Aanwezigheid</th>
          <th className="p-3 text-right font-semibold text-gray-700 font-arabic border border-gray-300">الحضور والغياب</th>
          <th className="p-3 w-24 text-center font-semibold border border-gray-300">Aantal</th>
          {['G', 'V', 'M', 'O'].map(g => (
            <th key={g} className="p-3 w-12 text-center font-semibold border border-gray-300">{g}</th>
          ))}
        </tr>
        {items.map((item) => (
          <tr key={item.id} className="border-b hover:bg-gray-50">
            <td className="p-3 font-medium border border-gray-300">{item.label}</td>
            <td className="p-3 text-right font-arabic border border-gray-300">{item.labelAr}</td>
            <td className={`p-3 border border-gray-300 text-center font-bold text-lg ${
              item.key ? 'text-gray-700' : 'bg-gray-100'
            }`}>
              {item.key ? (stats ? stats[item.key] || 0 : '...') : ''}
            </td>
            {item.key === null ? (
              ['G', 'V', 'M', 'O'].map(grade => (
                <td key={grade} className="p-3 border border-gray-300 text-center">
                  {grades[item.id] === grade ? (
                    <GradeDisplay grade={grade} />
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </td>
              ))
            ) : (
              <td colSpan="4" className="p-3 border border-gray-300 text-center bg-gray-100 text-gray-500">
                <span className="text-xs">Automatisch berekend</span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    );
  };

  // De structuur van het rapport
  const reportDataStructure = {
    arabic: [
      { id: 'ar_write', label: 'Schrijven', labelAr: 'الكتابة والخط' },
      { id: 'ar_read', label: 'Lezen', labelAr: 'القراءة' },
      { id: 'ar_recognize', label: 'Herkennen van letters', labelAr: 'معرفة الحروف' },
      { id: 'ar_dictation', label: 'Dictee', labelAr: 'الإملاء' },
      { id: 'ar_present', label: 'Presenteren', labelAr: 'العرض' },
    ],
    quran: [
      { id: 'qu_recite', label: 'Reciteren', labelAr: 'القراءة' },
      { id: 'qu_memorize', label: 'Memoriseren', labelAr: 'الحفظ' },
      { id: 'qu_process', label: 'Leerproces', labelAr: 'عملية التعلم' },
      { id: 'qu_range', label: 'Van Surah tot Surah', labelAr: 'من سورة إلى سورة' },
    ],
    workEthic: [
      { id: 'we_effort', label: 'Inzet', labelAr: 'الإجتهاد' },
      { id: 'we_focus', label: 'Concentratie', labelAr: 'التركيز' },
      { id: 'we_independent', label: 'Zelfstandigheid', labelAr: 'الإعتماد على النفس' },
      { id: 'we_pace', label: 'Werktempo', labelAr: 'السرعة في إنجاز الأعمال' },
      { id: 'we_homework', label: 'Huiswerk', labelAr: 'واجبات منزلية' },
    ],
    islamicEducation: [
      { id: 'ie_understand', label: 'Begrijpen', labelAr: 'الفهم' },
      { id: 'ie_learn', label: 'Leren', labelAr: 'الحفظ' },
    ],
    behavior: [
      { id: 'be_teacher', label: 'Tegen docent(e)', labelAr: 'إتجاه الأستاذ(ة)' },
      { id: 'be_peers', label: 'Tegen medeleerlingen', labelAr: 'إتجاه التلاميذ' },
    ],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Rapport</h3>
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
          Afdrukken
        </Button>
      </div>
      
      <div className="bg-white p-8 border rounded-lg shadow-sm" id="parent-report-view">
        {/* Report Header */}
        <div className="flex justify-between items-start mb-8 print:mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Voortgangsrapport</h2>
            <p className="text-gray-500">Schooljaar {reportPeriod}</p>
            <p className="text-xs text-gray-400 mt-1">Bekeken op: {currentDate}</p>
          </div>
          <div className="h-16 w-16 bg-emerald-100 rounded-lg flex items-center justify-center">
            <span className="text-emerald-600 font-bold text-lg">LVS</span>
          </div>
        </div>

        {/* Student Info Table */}
        <table className="w-full mb-8 border-collapse">
          <tbody>
            <tr className="border-b">
              <td className="p-3 font-semibold text-gray-600 w-1/4 bg-gray-50">Leerling:</td>
              <td className="p-3">{student?.name}</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-semibold text-gray-600 bg-gray-50">Klas:</td>
              <td className="p-3">{studentClass?.name}</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-semibold text-gray-600 bg-gray-50">Docent(e):</td>
              <td className="p-3">{teacher?.name}</td>
            </tr>
            {student?.date_of_birth && (
              <tr className="border-b">
                <td className="p-3 font-semibold text-gray-600 bg-gray-50">Geboortedatum:</td>
                <td className="p-3">{new Date(student.date_of_birth).toLocaleDateString('nl-NL')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Grade Legend */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Beoordelingsschaal:</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><strong>G</strong> = Goed</span>
            <span><strong>V</strong> = Voldoende</span>
            <span><strong>M</strong> = Matig</span>
            <span><strong>O</strong> = Onvoldoende</span>
          </div>
        </div>
        
        {/* Grades Tables */}
        <div className="space-y-6">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <ReportSectionReadOnly 
              title="Arabische Taal" 
              titleAr="اللغة العربية" 
              items={reportDataStructure.arabic} 
              grades={report.grades} 
            />
          </table>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <ReportSectionReadOnly 
              title="Koran" 
              titleAr="القرآن الكريم" 
              items={reportDataStructure.quran} 
              grades={report.grades} 
            />
          </table>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <ReportSectionReadOnly 
              title="Werkhouding" 
              titleAr="طريقة العمل" 
              items={reportDataStructure.workEthic} 
              grades={report.grades} 
            />
          </table>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <ReportSectionReadOnly 
              title="Islamitische opvoeding" 
              titleAr="التربية الإسلامية" 
              items={reportDataStructure.islamicEducation} 
              grades={report.grades} 
            />
          </table>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <ReportSectionReadOnly 
              title="Gedrag in de klas" 
              titleAr="السلوك في القسم" 
              items={reportDataStructure.behavior} 
              grades={report.grades} 
            />
          </table>

          {/* Attendance Table */}
          <table className="w-full text-sm border-collapse border border-gray-300">
            <AttendanceSectionReadOnly 
              stats={report.attendanceStats} 
              grades={report.grades} 
            />
          </table>
        </div>

        {/* Comments section */}
        <div className="mt-8">
          <h3 className="font-semibold text-gray-700 mb-3">Opmerkingen</h3>
          <div className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md text-sm bg-gray-50">
            {report.comments || <span className="italic text-gray-500">Geen opmerkingen</span>}
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center">
            <Info size={16} className="text-emerald-600 mr-2" />
            <span className="text-sm text-emerald-800">
              Dit is een alleen-lezen weergave van het rapport. Voor vragen kunt u contact opnemen met de leraar.
            </span>
          </div>
        </div>
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