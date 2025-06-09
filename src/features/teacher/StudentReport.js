// src/features/teacher/StudentReport.js - NIEUW BESTAND
import React from 'react';
import { Printer } from 'lucide-react';
import Button from '../../components/Button';
import logo from '../../assets/logo-mijnlvs.png'; // Zorg dat je logo hier beschikbaar is

const ReportSection = ({ title, titleAr, items }) => (
  <tbody>
    <tr className="bg-gray-200">
      <th className="p-2 text-left font-semibold text-gray-700">{title}</th>
      <th className="p-2 text-right font-semibold text-gray-700 font-arabic">{titleAr}</th>
      {['G', 'V', 'M', 'O'].map(grade => <th key={grade} className="p-2 w-10 text-center font-semibold">{grade}</th>)}
    </tr>
    {items.map((item, index) => (
      <tr key={index} className="border-b">
        <td className="p-2">{item.label}</td>
        <td className="p-2 text-right font-arabic">{item.labelAr}</td>
        {['G', 'V', 'M', 'O'].map(grade => <td key={grade} className="p-2 border-l text-center"></td>)}
      </tr>
    ))}
  </tbody>
);

const StudentReport = ({ student, studentClass, teacher }) => {
  const reportData = {
    arabic: [
      { label: 'Schrijven', labelAr: 'الكتابة والخط' },
      { label: 'Lezen', labelAr: 'القراءة' },
      { label: 'Herkennen van letters', labelAr: 'معرفة الحروف' },
      { label: 'Dictee', labelAr: 'الإملاء' },
      { label: 'Presenteren', labelAr: 'العرض' },
    ],
    quran: [
        { label: 'Reciteren', labelAr: 'القراءة' },
        { label: 'Memoriseren', labelAr: 'الحفظ' },
        { label: 'Leerproces', labelAr: 'عملية التعلم' },
        { label: 'Van Surah tot Surah', labelAr: 'من سورة إلى سورة' },
    ],
    workEthic: [
      { label: 'Inzet', labelAr: 'الإجتهاد' },
      { label: 'Concentratie', labelAr: 'التركيز' },
      { label: 'Zelfstandigheid', labelAr: 'الإعتماد على النفس' },
      { label: 'Werktempo', labelAr: 'السرعة في إنجاز الأعمال' },
      { label: 'Huiswerk', labelAr: 'واجبات منزلية' },
    ],
    islamicEducation: [
        { label: 'Begrijpen', labelAr: 'الفهم' },
        { label: 'Leren', labelAr: 'الحفظ' },
    ],
    behavior: [
        { label: 'Tegen docent(e)', labelAr: 'إتجاه الأستاذ(ة)' },
        { label: 'Tegen medeleerlingen', labelAr: 'إتجاه التلاميذ' },
    ],
    attendance: [
        { label: 'Aantal lessen aanwezig', labelAr: 'الحضور' },
        { label: 'Aantal lessen te laat', labelAr: 'التأخير' },
        { label: 'Aantal lessen geoorloofd afwezig', labelAr: 'الغياب المبرر' },
        { label: 'Aantal lessen ongeoorloofd afwezig', labelAr: 'الغياب غير المبرر' },
    ]
  };

  return (
    <div className="bg-white p-8" id="student-report">
      {/* Report Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Voortgangsrapport</h2>
          <p className="text-gray-500">Schooljaar 2024-2025</p>
        </div>
        <img src={logo} alt="Logo" className="h-16" />
      </div>

      {/* Student Info Table */}
      <table className="w-full mb-8 border-collapse">
        <tbody>
          <tr className="border-b">
            <td className="p-2 font-semibold text-gray-600 w-1/4">Leerling:</td>
            <td className="p-2">{student?.name}</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-semibold text-gray-600">Klas:</td>
            <td className="p-2">{studentClass?.name}</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-semibold text-gray-600">Docent(e):</td>
            <td className="p-2">{teacher?.name}</td>
          </tr>
        </tbody>
      </table>
      
      {/* Grades Table */}
      <table className="w-full text-sm border-collapse border">
        <ReportSection title="Arabische Taal" titleAr="اللغة العربية" items={reportData.arabic} />
        <ReportSection title="Koran" titleAr="القرآن الكريم" items={reportData.quran} />
        <ReportSection title="Werkhouding" titleAr="طريقة العمل" items={reportData.workEthic} />
        <ReportSection title="Islamitische opvoeding" titleAr="التربية الإسلامية" items={reportData.islamicEducation} />
        <ReportSection title="Gedrag in de klas" titleAr="السلوك في القسم" items={reportData.behavior} />
      </table>

      {/* Attendance Table */}
       <table className="w-full text-sm border-collapse border mt-6">
        <tbody>
            <tr className="bg-gray-200">
                <th className="p-2 text-left font-semibold text-gray-700">Aanwezigheid</th>
                <th className="p-2 text-right font-semibold text-gray-700 font-arabic">الحضور والغياب</th>
                <th className="p-2 w-24 text-center font-semibold">Aantal</th>
            </tr>
            {reportData.attendance.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{item.label}</td>
                <td className="p-2 text-right font-arabic">{item.labelAr}</td>
                <td className="p-2 border-l text-center"></td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Remarks section */}
      <div className="mt-8">
        <h3 className="font-semibold text-gray-700">Opmerkingen</h3>
        <div className="w-full h-24 mt-2 p-2 border rounded-md text-sm"></div>
      </div>

      {/* Print Button - in de modal footer plaatsen voor betere UX */}
    </div>
  );
};

export default StudentReport;