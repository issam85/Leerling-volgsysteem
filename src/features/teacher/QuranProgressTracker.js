// ============================================
// QuranProgressTracker.js - FIXED VERSION
// ============================================

// src/features/teacher/QuranProgressTracker.js - CORRECTED API ENDPOINTS
import React, { useState, useEffect } from 'react';
import { 
  QURAN_SOERAH_LIST, 
  QURAN_PROGRESS_STATUS, 
  QURAN_STATUS_LABELS, 
  QURAN_STATUS_COLORS,
  calculateQuranProgress 
} from '../../utils/quranConstants';
import { apiCall } from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  Calendar,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

const QuranProgressTracker = ({ studentId, studentName, classId }) => {
  const { realData } = useData();
  const { currentUser } = useAuth();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load progress data voor deze student
  useEffect(() => {
    if (studentId) {
      loadQuranProgress();
    }
  }, [studentId]);

  const loadQuranProgress = async () => {
    try {
      setLoading(true);
      // ✅ CORRECTED: Use correct backend endpoint
      const progress = await apiCall(`/api/quran/mosque/${realData.mosque.id}/students/${studentId}/progress`);
      setProgressData(progress || []);
    } catch (err) {
      console.error('Error loading Quran progress:', err);
      setError('Kon voortgang niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updateSoerahStatus = async (soerahNumber, soerahName, newStatus) => {
    setUpdating(true);
    try {
      const payload = {
        student_id: studentId,
        soerah_number: soerahNumber,
        soerah_name: soerahName,
        status: newStatus,
        updated_by_teacher_id: currentUser.id,
        date_completed: newStatus === QURAN_PROGRESS_STATUS.COMPLETED ? new Date().toISOString().split('T')[0] : null
      };

      // ✅ CORRECTED: Use correct backend endpoint
      const result = await apiCall(`/api/quran/mosque/${realData.mosque.id}/students/${studentId}/progress`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        // Update local state
        setProgressData(prev => {
          const existing = prev.find(p => p.soerah_number === soerahNumber);
          if (existing) {
            return prev.map(p => 
              p.soerah_number === soerahNumber 
                ? { ...p, status: newStatus, date_completed: payload.date_completed, updated_at: new Date() }
                : p
            );
          } else {
            return [...prev, { 
              soerah_number: soerahNumber,
              soerah_name: soerahName,
              status: newStatus,
              date_completed: payload.date_completed,
              created_at: new Date(),
              updated_at: new Date()
            }];
          }
        });
      }
    } catch (err) {
      console.error('Error updating Quran progress:', err);
      setError('Kon voortgang niet bijwerken');
    } finally {
      setUpdating(false);
    }
  };

  // Filter soerah's gebaseerd op zoekterm en status
  const filteredSoerahs = QURAN_SOERAH_LIST.filter(soerah => {
    const matchesSearch = searchTerm === '' || 
      soerah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soerah.number.toString().includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    
    const progress = progressData.find(p => p.soerah_number === soerah.number);
    const currentStatus = progress?.status || QURAN_PROGRESS_STATUS.NOT_STARTED;
    
    return matchesSearch && currentStatus === statusFilter;
  });

  // Bereken overall voortgang
  const overallProgress = calculateQuranProgress(progressData);

  if (loading) {
    return <LoadingSpinner message="Qor'aan voortgang laden..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header met student info en overall progress */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <BookOpen className="mr-2 text-emerald-600" size={24} />
              Qor'aan Voortgang: {studentName}
            </h3>
            <p className="text-gray-600 mt-1">
              Track de memorisatie voortgang van soera's
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600">{overallProgress.completionPercentage}%</div>
              <div className="text-xs text-gray-500">Voltooid</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{overallProgress.completed}</div>
              <div className="text-xs text-gray-500">Soera's geleerd</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{overallProgress.inProgress}</div>
              <div className="text-xs text-gray-500">Bezig mee</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div 
              className="h-3 bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress.completionPercentage}%` }}
            />
            {overallProgress.inProgress > 0 && (
              <div 
                className="absolute top-0 h-3 bg-blue-400 bg-opacity-70"
                style={{ 
                  left: `${overallProgress.completionPercentage}%`,
                  width: `${(overallProgress.inProgress / overallProgress.total) * 100}%`
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 soera's</span>
            <span>{overallProgress.total} soera's</span>
          </div>
        </div>
      </div>

      {/* Filters en zoeken */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek soera's..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
        
        <div className="sm:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="all">Alle statussen</option>
              <option value={QURAN_PROGRESS_STATUS.NOT_STARTED}>Niet begonnen</option>
              <option value={QURAN_PROGRESS_STATUS.IN_PROGRESS}>Bezig</option>
              <option value={QURAN_PROGRESS_STATUS.COMPLETED}>Voltooid</option>
              <option value={QURAN_PROGRESS_STATUS.REVIEWING}>Herhaling</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Soera's lijst */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSoerahs.map(soerah => {
          const progress = progressData.find(p => p.soerah_number === soerah.number);
          const currentStatus = progress?.status || QURAN_PROGRESS_STATUS.NOT_STARTED;
          const dateCompleted = progress?.date_completed;

          return (
            <div 
              key={soerah.number} 
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">
                    {soerah.number}. {soerah.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 font-arabic" dir="rtl">
                    {soerah.arabicName}
                  </p>
                </div>
                
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${QURAN_STATUS_COLORS[currentStatus]}`}>
                  {QURAN_STATUS_LABELS[currentStatus]}
                </span>
              </div>

              {dateCompleted && (
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <Calendar size={12} className="mr-1" />
                  Voltooid op {new Date(dateCompleted).toLocaleDateString('nl-NL')}
                </div>
              )}

              {/* Status knoppen */}
              <div className="grid grid-cols-2 gap-2">
                {currentStatus !== QURAN_PROGRESS_STATUS.IN_PROGRESS && (
                  <button
                    onClick={() => updateSoerahStatus(soerah.number, soerah.name, QURAN_PROGRESS_STATUS.IN_PROGRESS)}
                    disabled={updating}
                    className="flex items-center justify-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    <Clock size={12} className="mr-1" />
                    Bezig
                  </button>
                )}
                
                {currentStatus !== QURAN_PROGRESS_STATUS.COMPLETED && (
                  <button
                    onClick={() => updateSoerahStatus(soerah.number, soerah.name, QURAN_PROGRESS_STATUS.COMPLETED)}
                    disabled={updating}
                    className="flex items-center justify-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    <CheckCircle size={12} className="mr-1" />
                    Voltooid
                  </button>
                )}

                {currentStatus === QURAN_PROGRESS_STATUS.COMPLETED && (
                  <button
                    onClick={() => updateSoerahStatus(soerah.number, soerah.name, QURAN_PROGRESS_STATUS.REVIEWING)}
                    disabled={updating}
                    className="flex items-center justify-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    <RotateCcw size={12} className="mr-1" />
                    Herhaling
                  </button>
                )}

                {currentStatus !== QURAN_PROGRESS_STATUS.NOT_STARTED && (
                  <button
                    onClick={() => updateSoerahStatus(soerah.number, soerah.name, QURAN_PROGRESS_STATUS.NOT_STARTED)}
                    disabled={updating}
                    className="flex items-center justify-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSoerahs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Geen soera's gevonden met de huidige filters.</p>
        </div>
      )}
    </div>
  );
};

export default QuranProgressTracker;