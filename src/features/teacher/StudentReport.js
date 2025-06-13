// src/features/teacher/StudentReport.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Printer, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { apiCall } from '../../services/api';
import logo from '../../assets/logo-mijnlvs.png';

// Grade button component
const GradeButton = ({ grade, currentGrade, onGradeChange, disabled = false }) => (
  <button 
    onClick={() => !disabled && onGradeChange(grade === currentGrade ? null : grade)}
    disabled={disabled}
    className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-150 flex items-center justify-center
      ${disabled 
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
        : currentGrade === grade 
          ? 'bg-emerald-600 text-white shadow-md scale-110 ring-2 ring-emerald-300' 
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-105 active:scale-95'
      }
    `}
    title={disabled ? 'Alleen voor eigen klassen' : `Beoordeling: ${grade}`}
  >
    {grade}
  </button>
);

// Standard report section component
const ReportSection = ({ title, titleAr, items, grades, onGradeChange, disabled = false }) => (
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
            <GradeButton 
              grade={grade} 
              currentGrade={grades[item.id]} 
              onGradeChange={(newGrade) => onGradeChange(item.id, newGrade)} 
              disabled={disabled}
            />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// Attendance section component
const AttendanceSection = ({ stats, grades, onGradeChange, disabled = false }) => {
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
          {/* Alleen de eerste rij ('Aanwezigheid Algemeen') is beoordeelbaar */}
          {item.key === null ? (
            ['G', 'V', 'M', 'O'].map(grade => (
              <td key={grade} className="p-3 border border-gray-300 text-center">
                <GradeButton 
                  grade={grade} 
                  currentGrade={grades[item.id]} 
                  onGradeChange={(newGrade) => onGradeChange(item.id, newGrade)} 
                  disabled={disabled}
                />
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

const StudentReport = ({ student, studentClass, teacher, isEditable, onClose }) => {
  const [report, setReport] = useState({ 
    grades: {}, 
    comments: '', 
    attendanceStats: null 
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  const reportPeriod = "2024-2025";
  const currentDate = new Date().toLocaleDateString('nl-NL');

  // Complete report data structure met unieke IDs
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

  // Auto-clear feedback
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        
        // ✅ FIX: Corrected API route
        // ❌ OLD: `/api/students/${student.id}/report?period=${reportPeriod}`
        // ✅ NEW: `/api/reports/student/${student.id}?period=${reportPeriod}`
        const data = await apiCall(`/api/reports/student/${student.id}?period=${reportPeriod}`);
        
        setReport(data || { grades: {}, comments: '', attendanceStats: null });
        
      } catch (error) {
        console.error("Fout bij ophalen rapport:", error);
        setFeedback({ 
          type: 'error', 
          message: `Fout bij laden rapport: ${error.message}` 
        });
        
        // Fallback to empty report structure
        setReport({ grades: {}, comments: '', attendanceStats: null });
        
      } finally {
        setLoading(false);
      }
    };
    
    if (student?.id) {
      fetchReport();
    }
  }, [student.id, reportPeriod]);

  const handleGradeChange = (itemId, newGrade) => {
    if (!isEditable) return;
    setReport(prev => ({
      ...prev, 
      grades: { ...prev.grades, [itemId]: newGrade }
    }));
  };

  const handleCommentsChange = (e) => {
    if (!isEditable) return;
    setReport(prev => ({ ...prev, comments: e.target.value }));
  };

  const handleSaveReport = async () => {
    if (!isEditable) return;
    
    setIsSaving(true);
    setFeedback({ type: '', message: '' });
    
    try {
      const result = await apiCall('/api/reports/save', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          classId: studentClass.id,
          mosqueId: student.mosque_id,
          period: reportPeriod,
          grades: report.grades,
          comments: report.comments,
        })
      });
      
      setFeedback({ 
        type: 'success', 
        message: result.message || 'Rapport succesvol opgeslagen!' 
      });
    } catch (error) {
      console.error('Save error:', error);
      setFeedback({ 
        type: 'error', 
        message: `Fout bij opslaan: ${error.message}` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Rapport laden..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Feedback */}
      {feedback.message && (
        <div className={`mx-4 mt-4 p-3 rounded-md text-sm flex items-center ${
          feedback.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle size={16} className="mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Report Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-8" id="student-report">
          {/* Report Header */}
          <div className="flex justify-between items-start mb-8 print:mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Voortgangsrapport</h2>
              <p className="text-gray-500">Schooljaar {reportPeriod}</p>
              <p className="text-xs text-gray-400 mt-1">Gegenereerd op: {currentDate}</p>
            </div>
            <div className="h-16 w-16 bg-emerald-100 rounded-lg flex items-center justify-center">
              <img src={logo} alt="Logo" className="h-16" onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }} />
              <span className="text-emerald-600 font-bold text-lg" style={{display: 'none'}}>LVS</span>
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
              <ReportSection 
                title="Arabische Taal" 
                titleAr="اللغة العربية" 
                items={reportDataStructure.arabic} 
                grades={report.grades} 
                onGradeChange={handleGradeChange}
                disabled={!isEditable}
              />
            </table>

            <table className="w-full text-sm border-collapse border border-gray-300">
              <ReportSection 
                title="Koran" 
                titleAr="القرآن الكريم" 
                items={reportDataStructure.quran} 
                grades={report.grades} 
                onGradeChange={handleGradeChange}
                disabled={!isEditable}
              />
            </table>

            <table className="w-full text-sm border-collapse border border-gray-300">
              <ReportSection 
                title="Werkhouding" 
                titleAr="طريقة العمل" 
                items={reportDataStructure.workEthic} 
                grades={report.grades} 
                onGradeChange={handleGradeChange}
                disabled={!isEditable}
              />
            </table>

            <table className="w-full text-sm border-collapse border border-gray-300">
              <ReportSection 
                title="Islamitische opvoeding" 
                titleAr="التربية الإسلامية" 
                items={reportDataStructure.islamicEducation} 
                grades={report.grades} 
                onGradeChange={handleGradeChange}
                disabled={!isEditable}
              />
            </table>

            <table className="w-full text-sm border-collapse border border-gray-300">
              <ReportSection 
                title="Gedrag in de klas" 
                titleAr="السلوك في القسم" 
                items={reportDataStructure.behavior} 
                grades={report.grades} 
                onGradeChange={handleGradeChange}
                disabled={!isEditable}
              />
            </table>

            {/* Attendance Table */}
            <table className="w-full text-sm border-collapse border border-gray-300">
              <AttendanceSection 
                stats={report.attendanceStats} 
                grades={report.grades} 
                onGradeChange={handleGradeChange}
                disabled={!isEditable}
              />
            </table>
          </div>

          {/* Comments section */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-3">Opmerkingen</h3>
            <textarea 
              className={`w-full h-32 p-3 border border-gray-300 rounded-md text-sm resize-none ${
                !isEditable ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-emerald-500 focus:border-emerald-500'
              }`}
              value={report.comments}
              onChange={handleCommentsChange}
              placeholder={isEditable ? "Algemene opmerkingen over de voortgang van de leerling..." : "Geen opmerkingen"}
              disabled={!isEditable}
              maxLength={1000}
            />
            {isEditable && (
              <div className="text-xs text-gray-500 mt-1">
                {report.comments.length}/1000 karakters
              </div>
            )}
          </div>

          {/* Permission notice */}
          {!isEditable && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Alleen de klassenleraar kan dit rapport bewerken.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer met knoppen */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-100 print:hidden">
        <div className="text-sm text-gray-600">
          {report.attendanceStats && (
            <span>
              Totaal lessen: {Object.values(report.attendanceStats).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            icon={Printer} 
            onClick={handlePrint}
          >
            Afdrukken
          </Button>
          {isEditable && (
            <Button 
              icon={Save} 
              onClick={handleSaveReport} 
              disabled={isSaving}
            >
              {isSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReport;