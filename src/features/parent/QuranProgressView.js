// ============================================
// QuranProgressView.js - FIXED VERSION
// ============================================

// src/features/parent/QuranProgressView.js - CORRECTED API ENDPOINTS
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
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  Calendar,
  TrendingUp,
  Star,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const QuranProgressView = ({ childId, childName }) => {
  const { realData } = useData();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllSoerahs, setShowAllSoerahs] = useState(false);

  // Load progress data voor dit kind
  useEffect(() => {
    if (childId) {
      loadQuranProgress();
    }
  }, [childId]);

  const loadQuranProgress = async () => {
    try {
      setLoading(true);
      // ✅ CORRECTED: Use correct backend endpoint
      const progress = await apiCall(`/api/quran/mosque/${realData.mosque.id}/students/${childId}/progress`);
      setProgressData(progress || []);
    } catch (err) {
      console.error('Error loading Quran progress:', err);
      setError('Kon voortgang niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Qor'aan voortgang laden..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  // Rest of the component remains the same...
  const overallProgress = calculateQuranProgress(progressData);
  
  const completedSoerahs = QURAN_SOERAH_LIST.filter(soerah => {
    const progress = progressData.find(p => p.soerah_number === soerah.number);
    return progress?.status === QURAN_PROGRESS_STATUS.COMPLETED;
  });

  const inProgressSoerahs = QURAN_SOERAH_LIST.filter(soerah => {
    const progress = progressData.find(p => p.soerah_number === soerah.number);
    return progress?.status === QURAN_PROGRESS_STATUS.IN_PROGRESS;
  });

  const reviewingSoerahs = QURAN_SOERAH_LIST.filter(soerah => {
    const progress = progressData.find(p => p.soerah_number === soerah.number);
    return progress?.status === QURAN_PROGRESS_STATUS.REVIEWING;
  });

  const recentlyCompleted = progressData
    .filter(p => p.status === QURAN_PROGRESS_STATUS.COMPLETED && p.date_completed)
    .sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed))
    .slice(0, 5)
    .map(p => {
      const soerah = QURAN_SOERAH_LIST.find(s => s.number === p.soerah_number);
      return { ...p, soerah };
    });

  return (
    <div className="space-y-6">
      {/* Header met kind naam en overall progress */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold text-gray-800 flex items-center">
              <BookOpen className="mr-2 text-emerald-600" size={20} />
              Qor'aan Voortgang: {childName}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Memorisatie voortgang van soera's
            </p>
          </div>
          
          <div className="flex gap-3 text-center">
            <div className="bg-white rounded-lg p-2 shadow-sm min-w-0">
              <div className="text-xl font-bold text-emerald-600">{overallProgress.completionPercentage}%</div>
              <div className="text-xs text-gray-500">Voltooid</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm min-w-0">
              <div className="text-xl font-bold text-blue-600">{overallProgress.completed}</div>
              <div className="text-xs text-gray-500">Geleerd</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
            <div 
              className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress.completionPercentage}%` }}
            />
            {overallProgress.inProgress > 0 && (
              <div 
                className="absolute top-0 h-2 bg-blue-400 bg-opacity-70"
                style={{ 
                  left: `${overallProgress.completionPercentage}%`,
                  width: `${(overallProgress.inProgress / overallProgress.total) * 100}%`
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Start</span>
            <span>{overallProgress.completed}/{overallProgress.total} soera's</span>
          </div>
        </div>
      </div>

      {/* Recent voltooid */}
      {recentlyCompleted.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h5 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <Award className="mr-2 text-yellow-500" size={18} />
            Recent Voltooid
          </h5>
          <div className="space-y-2">
            {recentlyCompleted.map(item => (
              <div key={item.soerah_number} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="font-medium text-gray-800">
                    {item.soerah?.number}. {item.soerah?.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.date_completed).toLocaleDateString('nl-NL')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Huidige status overzicht */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Bezig mee */}
        {inProgressSoerahs.length > 0 && (
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <h5 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
              <Clock className="mr-1" size={16} />
              Bezig Mee ({inProgressSoerahs.length})
            </h5>
            <div className="space-y-1">
              {inProgressSoerahs.slice(0, 3).map(soerah => (
                <div key={soerah.number} className="text-xs text-gray-600">
                  {soerah.number}. {soerah.name}
                </div>
              ))}
              {inProgressSoerahs.length > 3 && (
                <div className="text-xs text-blue-600">
                  En {inProgressSoerahs.length - 3} meer...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Herhaling */}
        {reviewingSoerahs.length > 0 && (
          <div className="bg-white rounded-lg border border-purple-200 p-4">
            <h5 className="text-sm font-semibold text-purple-700 mb-2 flex items-center">
              <RotateCcw className="mr-1" size={16} />
              Herhaling ({reviewingSoerahs.length})
            </h5>
            <div className="space-y-1">
              {reviewingSoerahs.slice(0, 3).map(soerah => (
                <div key={soerah.number} className="text-xs text-gray-600">
                  {soerah.number}. {soerah.name}
                </div>
              ))}
              {reviewingSoerahs.length > 3 && (
                <div className="text-xs text-purple-600">
                  En {reviewingSoerahs.length - 3} meer...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voltooid */}
        {completedSoerahs.length > 0 && (
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
              <CheckCircle className="mr-1" size={16} />
              Voltooid ({completedSoerahs.length})
            </h5>
            <div className="space-y-1">
              {completedSoerahs.slice(0, 3).map(soerah => (
                <div key={soerah.number} className="text-xs text-gray-600">
                  {soerah.number}. {soerah.name}
                </div>
              ))}
              {completedSoerahs.length > 3 && (
                <div className="text-xs text-green-600">
                  En {completedSoerahs.length - 3} meer...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Uitgebreide lijst toggle */}
      {progressData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <button
            onClick={() => setShowAllSoerahs(!showAllSoerahs)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
          >
            <span className="font-medium text-gray-800">
              Alle Soera's Bekijken ({overallProgress.total} totaal)
            </span>
            {showAllSoerahs ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showAllSoerahs && (
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QURAN_SOERAH_LIST.map(soerah => {
                  const progress = progressData.find(p => p.soerah_number === soerah.number);
                  const currentStatus = progress?.status || QURAN_PROGRESS_STATUS.NOT_STARTED;
                  const dateCompleted = progress?.date_completed;

                  return (
                    <div 
                      key={soerah.number} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {soerah.number}. {soerah.name}
                        </div>
                        {dateCompleted && (
                          <div className="text-xs text-gray-500">
                            {new Date(dateCompleted).toLocaleDateString('nl-NL')}
                          </div>
                        )}
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${QURAN_STATUS_COLORS[currentStatus]}`}>
                        {currentStatus === QURAN_PROGRESS_STATUS.NOT_STARTED ? '' : 
                         currentStatus === QURAN_PROGRESS_STATUS.IN_PROGRESS ? '📖' :
                         currentStatus === QURAN_PROGRESS_STATUS.COMPLETED ? '✅' :
                         currentStatus === QURAN_PROGRESS_STATUS.REVIEWING ? '🔄' : ''
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Geen voortgang */}
      {progressData.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nog geen Qor'aan voortgang geregistreerd.</p>
          <p className="text-xs text-gray-400 mt-1">De leraar kan de voortgang bijhouden tijdens de lessen.</p>
        </div>
      )}
    </div>
  );
};

export default QuranProgressView;