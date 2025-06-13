// src/pages/ChildDetailPage.js - DEFINITIEVE VERSIE MET CORRECTE RAPPORT-WEERGAVE EN MAILMODAL
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
  Info, 
  Printer,
  Mail
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import QuranProgressView from '../features/parent/QuranProgressView';
import Button from '../components/Button';
import MailModal from '../components/MailModal';

// Definieer de structuur van het rapport HIER, zodat beide views het kunnen gebruiken.
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

const attendanceReportItems = [
    { id: 'att_general', label: 'Aanwezigheid Algemeen', labelAr: 'الحضور العام' }
];

// Sub-component voor het Absentie Overzicht - Volledige implementatie
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

// De RapportView wordt nu een correcte, zelfstandige weergavecomponent
const RapportView = ({ student }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportPeriod = "2024-2025";

  useEffect(() => {
    const fetchReport = async () => {
      if (!student?.id) {
        setLoading(false);
        setError("Leerling niet gevonden.");
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        console.log(`[RapportView] Fetching report for student ${student.id}...`);
        const data = await apiCall(`/api/reports/student/${student.id}?period=${reportPeriod}`);
        
        // LOG DE ONTVANGEN DATA OM TE DEBUGGEN
        console.log('[RapportView] Data received from API:', JSON.stringify(data, null, 2));

        // Controleer of de data de verwachte structuur heeft
        if (data && typeof data === 'object') {
          setReportData(data);
        } else {
          // Als de API iets onverwachts teruggeeft (bv. geen JSON), behandel als niet gevonden.
          setReportData(null); 
        }

      } catch (err) { 
        console.error("[RapportView] Error fetching report:", err);
        setError(`Kon het rapport niet laden: ${err.message}`); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchReport();
  }, [student?.id, reportPeriod]);

  if (loading) return <LoadingSpinner message="Rapport laden..." />;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

  // ==========================================================
  // DE MEEST BELANGRIJKE WIJZIGING IS HIER: VEILIGE DATA-TOEGANG
  // ==========================================================
  
  // Haal de 'report' en 'attendanceStats' uit de state.
  // Als reportData null is, zijn deze variabelen undefined.
  const { report, attendanceStats } = reportData || {};

  // Als er geen rapport is gevonden (report is null of undefined), toon dan de infomelding.
  if (!report) {
    return (
      <div className="p-4 bg-blue-50 text-blue-700 rounded-md text-center">
        <Info className="inline mr-2"/>
        Er is nog geen rapport opgeslagen voor deze periode.
      </div>
    );
  }

  // Als we hier komen, weten we dat 'report' een object is.
  // We kunnen nu veilig de eigenschappen benaderen.
  const grades = report.grades || {};
  const comments = report.comments || '';
  
  const GradeDisplay = ({ grade }) => {
    const gradeStyles = {
        G: 'bg-green-600 text-white', 
        V: 'bg-blue-600 text-white',
        M: 'bg-yellow-500 text-white', 
        O: 'bg-red-600 text-white',
    };
    
    return (
      <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
        grade ? gradeStyles[grade] : 'bg-gray-200'
      }`}>
        {grade || ''}
      </div>
    );
  };

  // Helper function to get section title
  const getSectionTitle = (key) => {
    const titles = { 
      arabic: 'Arabische Taal', 
      quran: 'Koran', 
      workEthic: 'Werkhouding', 
      islamicEducation: 'Islamitische Opvoeding', 
      behavior: 'Gedrag in de Klas' 
    };
    return titles[key] || key;
  };

  return (
    <div className="bg-white p-4 sm:p-6 border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Rapportdetails</h3>
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
          Afdrukken
        </Button>
      </div>
      
      {/* Grade Legend */}
      <div className="p-3 bg-gray-50 border rounded-md mb-6 text-xs sm:text-sm">
        <p>
          <strong>G</strong> = Goed
          <strong className="ml-4">V</strong> = Voldoende
          <strong className="ml-4">M</strong> = Matig
          <strong className="ml-4">O</strong> = Onvoldoende
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(reportDataStructure).map(([key, sectionItems]) => (
          <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
            <h4 className="font-bold text-gray-700 mb-3 text-lg">
              {getSectionTitle(key)}
            </h4>
            <ul className="space-y-2">
              {sectionItems.map(item => (
                <li key={item.id} className="flex justify-between items-center p-3 rounded-md hover:bg-gray-50 border border-gray-100">
                  <div>
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <div className="text-xs text-gray-500 font-arabic">{item.labelAr}</div>
                  </div>
                  <GradeDisplay grade={report.grades[item.id]} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Aanwezigheid Section */}
        <div className="border-b border-gray-200 pb-4 last:border-b-0">
          <h4 className="font-bold text-gray-700 mb-3 text-lg">Aanwezigheid</h4>
          <ul className="space-y-2">
            {attendanceReportItems.map(item => (
              <li key={item.id} className="flex justify-between items-center p-3 rounded-md hover:bg-gray-50 border border-gray-100">
                <div>
                  <span className="font-medium text-gray-800">{item.label}</span>
                  <div className="text-xs text-gray-500 font-arabic">{item.labelAr}</div>
                </div>
                <GradeDisplay grade={report.grades[item.id]} />
              </li>
            ))}
          </ul>
        </div>

        {/* Comments Section */}
        {report.comments && (
          <div>
            <h4 className="font-bold text-gray-700 mb-3 text-lg border-b border-gray-200 pb-2">
              Opmerkingen van de leraar
            </h4>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {report.comments}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <Info size={16} className="inline mr-2" />
        Dit rapport is alleen-lezen. Voor vragen kunt u contact opnemen met de leraar.
      </div>
    </div>
  );
};

// De hoofdcomponent van de pagina - Volledige implementatie
const ChildDetailPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { realData } = useData();
  const { students, classes, users, loading: dataLoading } = realData;
  const [activeTab, setActiveTab] = useState('rapport');

  // State voor de mail modal
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailFeedback, setMailFeedback] = useState({ type: '', text: '' });

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

  // Functie om email naar leraar te versturen
  const handleSendTeacherEmail = async ({ subject, body }) => {
    setMailLoading(true);
    setMailFeedback({ type: '', text: '' });
    try {
      const result = await apiCall('/api/email/send-generic', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: teacher.email,
          subject,
          body
        })
      });
      if (!result.success) throw new Error(result.error || 'Versturen mislukt');
      
      setMailFeedback({ type: 'success', text: 'E-mail succesvol verzonden!' });
      setIsMailModalOpen(false);
    } catch (error) {
      setMailFeedback({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setMailLoading(false);
    }
  };
  
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
      {/* Header met actieknop */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        {/* Linkerkant: Info */}
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/parent/my-children')} 
            className="p-2 mr-4 rounded-full hover:bg-gray-100 transition-colors"
            title="Terug naar mijn kinderen"
          >
            <ArrowLeft size={24} className="text-gray-600"/>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
              <span className="inline-flex items-center">
                <ClassIcon size={14} className="mr-1.5"/>
                {studentClass?.name || 'Geen klas'}
              </span>
              <span className="inline-flex items-center">
                <User size={14} className="mr-1.5"/>
                {teacher?.name || 'Geen leraar'}
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

        {/* Rechterkant: Actieknop */}
        {teacher?.email && (
          <Button icon={Mail} variant="secondary" onClick={() => setIsMailModalOpen(true)}>
            Contact Leraar/Lerares
          </Button>
        )}
      </div>

      {/* Feedback weergave */}
      {mailFeedback.text && (
        <div className={`p-4 rounded-md ${
          mailFeedback.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {mailFeedback.text}
        </div>
      )}

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
        {activeTab === 'rapport' && <RapportView student={student} />}
      </div>

      {/* Email Modal */}
      <MailModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        onSend={handleSendTeacherEmail}
        isLoading={mailLoading}
        title={`Bericht aan ${teacher?.name || 'Leraar/Lerares'}`}
        recipientInfo={teacher?.email}
      />
    </div>
  );
};

export default ChildDetailPage;