// src/utils/quranConstants.js - Qor'aan Soera's voor voortgang tracking
export const QURAN_SOERAH_LIST = [
  { number: 58, name: "Al-Modjaadalah", arabicName: "المجادلة" },
  { number: 59, name: "Al-Hasjr", arabicName: "الحشر" },
  { number: 60, name: "Al-Momtahanah", arabicName: "الممتحنة" },
  { number: 61, name: "As-Saff", arabicName: "الصف" },
  { number: 62, name: "Al-Djomo'ah", arabicName: "الجمعة" },
  { number: 63, name: "Al-Monaafiqoen", arabicName: "المنافقون" },
  { number: 64, name: "At-Taghaabon", arabicName: "التغابن" },
  { number: 65, name: "At-Talaaq", arabicName: "الطلاق" },
  { number: 66, name: "At-Tahriem", arabicName: "التحريم" },
  { number: 67, name: "Al-Molk", arabicName: "الملك" },
  { number: 68, name: "Al-Qalam", arabicName: "القلم" },
  { number: 69, name: "Al-Haaqqah", arabicName: "الحاقة" },
  { number: 70, name: "Al-Ma'aaridj", arabicName: "المعارج" },
  { number: 71, name: "Noeh", arabicName: "نوح" },
  { number: 72, name: "Al-Djinn", arabicName: "الجن" },
  { number: 73, name: "Al-Mozzammil", arabicName: "المزمل" },
  { number: 74, name: "Al-Moddassir", arabicName: "المدثر" },
  { number: 75, name: "Al-Qi'jaamah", arabicName: "القيامة" },
  { number: 76, name: "Al-Insaan", arabicName: "الإنسان" },
  { number: 77, name: "Al-Morsalaat", arabicName: "المرسلات" },
  { number: 78, name: "An-Naba", arabicName: "النبأ" },
  { number: 79, name: "An-Naziaat", arabicName: "النازعات" },
  { number: 80, name: "Abasa", arabicName: "عبس" },
  { number: 81, name: "At-Takwier", arabicName: "التكوير" },
  { number: 82, name: "Al-Infitaar", arabicName: "الانفطار" },
  { number: 83, name: "Al-Motaffifeen", arabicName: "المطففين" },
  { number: 84, name: "Al-Insjiqaaq", arabicName: "الانشقاق" },
  { number: 85, name: "Al-Boroej", arabicName: "البروج" },
  { number: 86, name: "At-Taariq", arabicName: "الطارق" },
  { number: 87, name: "Al-Ala", arabicName: "الأعلى" },
  { number: 88, name: "Al-Ghaasjijah", arabicName: "الغاشية" },
  { number: 89, name: "Al-Fadjr", arabicName: "الفجر" },
  { number: 90, name: "Al-Balad", arabicName: "البلد" },
  { number: 91, name: "Asj-Sjams", arabicName: "الشمس" },
  { number: 92, name: "Al-Lail", arabicName: "الليل" },
  { number: 93, name: "Ad-Dhohaa", arabicName: "الضحى" },
  { number: 94, name: "Asj-Sjarh", arabicName: "الشرح" },
  { number: 95, name: "At-Tien", arabicName: "التين" },
  { number: 96, name: "Al-Alaq", arabicName: "العلق" },
  { number: 97, name: "Al-Qadr", arabicName: "القدر" },
  { number: 98, name: "Al-Bajjinah", arabicName: "البينة" },
  { number: 99, name: "Az-Zalzalah", arabicName: "الزلزلة" },
  { number: 100, name: "Al-Aadi'jaat", arabicName: "العاديات" },
  { number: 101, name: "Al-Qaariah", arabicName: "القارعة" },
  { number: 102, name: "At-Takaathor", arabicName: "التكاثر" },
  { number: 103, name: "Al-Asr", arabicName: "العصر" },
  { number: 104, name: "Al-Homazah", arabicName: "الهمزة" },
  { number: 105, name: "Al-Fiel", arabicName: "الفيل" },
  { number: 106, name: "Qoraisj", arabicName: "قريش" },
  { number: 107, name: "Al-Maa'oen", arabicName: "الماعون" },
  { number: 108, name: "Al-Kauthar", arabicName: "الكوثر" },
  { number: 109, name: "Al-Kaafiroen", arabicName: "الكافرون" },
  { number: 110, name: "A-Nasr", arabicName: "النصر" },
  { number: 111, name: "Al-Masad", arabicName: "المسد" },
  { number: 112, name: "Al-Ikhlaas", arabicName: "الإخلاص" },
  { number: 113, name: "Al-Falaq", arabicName: "الفلق" },
  { number: 114, name: "A-Naas", arabicName: "الناس" },
  { number: 1, name: "Al-Faatiha", arabicName: "الفاتحة" }
];

// Status opties voor Qor'aan voortgang
export const QURAN_PROGRESS_STATUS = {
  NOT_STARTED: 'niet_begonnen',
  IN_PROGRESS: 'bezig', 
  COMPLETED: 'voltooid',
  REVIEWING: 'herhaling'
};

export const QURAN_STATUS_LABELS = {
  [QURAN_PROGRESS_STATUS.NOT_STARTED]: 'Niet begonnen',
  [QURAN_PROGRESS_STATUS.IN_PROGRESS]: 'Bezig',
  [QURAN_PROGRESS_STATUS.COMPLETED]: 'Voltooid',
  [QURAN_PROGRESS_STATUS.REVIEWING]: 'Herhaling'
};

export const QURAN_STATUS_COLORS = {
  [QURAN_PROGRESS_STATUS.NOT_STARTED]: 'text-gray-500 bg-gray-100',
  [QURAN_PROGRESS_STATUS.IN_PROGRESS]: 'text-blue-700 bg-blue-100',
  [QURAN_PROGRESS_STATUS.COMPLETED]: 'text-green-700 bg-green-100',
  [QURAN_PROGRESS_STATUS.REVIEWING]: 'text-purple-700 bg-purple-100'
};

// Helper functies
export const getSoerahByNumber = (number) => {
  return QURAN_SOERAH_LIST.find(s => s.number === number);
};

export const calculateQuranProgress = (progressData = []) => {
  const total = QURAN_SOERAH_LIST.length;
  const completed = progressData.filter(p => p.status === QURAN_PROGRESS_STATUS.COMPLETED).length;
  const inProgress = progressData.filter(p => p.status === QURAN_PROGRESS_STATUS.IN_PROGRESS).length;
  const reviewing = progressData.filter(p => p.status === QURAN_PROGRESS_STATUS.REVIEWING).length;
  
  return {
    total,
    completed,
    inProgress,
    reviewing,
    notStarted: total - completed - inProgress - reviewing,
    completionPercentage: Math.round((completed / total) * 100)
  };
};