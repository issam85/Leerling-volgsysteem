// src/pages/TeacherClassAttendancePage.js - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertCircle, CalendarDays, Check, Users, X } from 'lucide-react';

const ATTENDANCE_STATUSES = [
    { value: 'aanwezig', label: 'Aanwezig', icon: <Check size={16} className="text-green-500" /> },
    { value: 'afwezig_ongeoorloofd', label: 'Afwezig (Ongeoorloofd)', icon: <X size={16} className="text-red-500" /> },
    { value: 'afwezig_geoorloofd', label: 'Afwezig (Geoorloofd)', icon: <X size={16} className="text-yellow-500" /> },
    { value: 'te_laat', label: 'Te laat', icon: <AlertCircle size={16} className="text-orange-500" /> },
];

const TeacherClassAttendancePage = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const {
        realData,
        fetchLessonDetailsForAttendance,
        fetchAttendanceForLesson,
        saveAttendanceForLesson,
        createLesson,
        fetchLessonsForClass,
    } = useData();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentLesson, setCurrentLesson] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState('');
    const [pageMessage, setPageMessage] = useState('');

    // Refs to prevent loops
    const lastLoadedDate = useRef(null);
    const lastLoadedClassId = useRef(null);
    const isLoadingRef = useRef(false);

    const { mosque, classes, students } = realData;
    const currentClassDetails = classes.find(c => c.id === classId);

    // Simplified function without heavy dependencies
    const loadLessonAndAttendanceForDate = useCallback(async (dateToLoad) => {
        // Prevent multiple concurrent calls
        if (isLoadingRef.current) {
            console.log("[Attendance] Already loading, skipping");
            return;
        }

        if (!mosque?.id || !classId || !currentUser?.id) {
            console.log("[Attendance] Missing prerequisites");
            return;
        }

        const dateStr = dateToLoad.toISOString().split('T')[0];
        
        // Prevent reloading same data
        if (lastLoadedDate.current === dateStr && lastLoadedClassId.current === classId) {
            console.log("[Attendance] Already loaded this date/class, skipping");
            return;
        }

        isLoadingRef.current = true;
        setIsLoading(true);
        setPageError('');
        setPageMessage('');
        setCurrentLesson(null);
        setAttendanceRecords({});

        try {
            console.log(`[Attendance] Loading lesson for ${dateStr}, class ${classId}`);
            
            // 1. Check if lesson exists for this class & date
            const existingLessons = await fetchLessonsForClass(classId, dateStr, dateStr);
            let lessonForDate = existingLessons.find(l => l.les_datum === dateStr && !l.is_geannuleerd);

            if (lessonForDate) {
                // 2. Lesson exists, get details and existing attendance
                const lessonDetails = await fetchLessonDetailsForAttendance(lessonForDate.id);
                if (lessonDetails && lessonDetails.klas && lessonDetails.klas.students) {
                    setCurrentLesson(lessonDetails);
                    const existingAttendance = await fetchAttendanceForLesson(lessonForDate.id);
                    const attMap = {};
                    lessonDetails.klas.students.forEach(student => {
                        const record = existingAttendance.find(att => att.leerling_id === student.id);
                        attMap[student.id] = {
                            status: record?.status || 'aanwezig',
                            notities_absentie: record?.notities_absentie || '',
                        };
                    });
                    setAttendanceRecords(attMap);
                } else {
                    setPageError("Kon lesdetails of leerlingen niet laden.");
                }
            } else {
                // No lesson exists yet for this date
                console.log(`[Attendance] No lesson found for ${dateStr}`);
                setCurrentLesson(null);
                
                // Initialize attendance for all students with default 'aanwezig'
                // Use current students data (snapshot at time of loading)
                const currentStudents = students || [];
                const studentsInClass = currentStudents.filter(s => s.class_id === classId && s.active);
                const initialAttMap = {};
                studentsInClass.forEach(student => {
                    initialAttMap[student.id] = { status: 'aanwezig', notities_absentie: '' };
                });
                setAttendanceRecords(initialAttMap);
            }

            // Update refs to prevent reloading
            lastLoadedDate.current = dateStr;
            lastLoadedClassId.current = classId;

        } catch (err) {
            console.error("[Attendance] Error loading lesson/attendance:", err);
            setPageError(err.message || "Er is een fout opgetreden.");
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    }, [mosque?.id, classId, currentUser?.id]); // Removed heavy dependencies

    // Effect with proper guards
    useEffect(() => {
        // Only load if we have the necessary data and it's a new date/class combo
        if (!mosque?.id || !classId || !currentUser?.id) {
            return;
        }

        const dateStr = selectedDate.toISOString().split('T')[0];
        
        // Skip if already loaded this combination
        if (lastLoadedDate.current === dateStr && lastLoadedClassId.current === classId) {
            return;
        }

        // Skip if already loading
        if (isLoadingRef.current) {
            return;
        }

        console.log(`[Attendance] Effect triggered for ${dateStr}, class ${classId}`);
        loadLessonAndAttendanceForDate(selectedDate);
    }, [selectedDate, classId, mosque?.id, currentUser?.id, loadLessonAndAttendanceForDate]);

    const handleCreateAndLoadLesson = async () => {
        if (!mosque?.id || !classId || isLoadingRef.current) return;
        
        setIsLoading(true);
        setPageError('');
        const dateStr = selectedDate.toISOString().split('T')[0];
        const lessonPayload = {
            les_datum: dateStr,
        };
        
        try {
            const newLesson = await createLesson(mosque.id, classId, lessonPayload);
            if (newLesson && newLesson.id) {
                setPageMessage("Nieuwe les succesvol aangemaakt. U kunt nu absenties registreren.");
                // Reset refs to force reload
                lastLoadedDate.current = null;
                lastLoadedClassId.current = null;
                await loadLessonAndAttendanceForDate(selectedDate);
            } else {
                throw new Error("Kon nieuwe les niet aanmaken.");
            }
        } catch (err) {
            console.error("[Attendance] Error creating lesson:", err);
            setPageError(err.message || "Fout bij aanmaken les.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, field, value) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { status: 'aanwezig', notities_absentie: '' }),
                [field]: value,
            },
        }));
    };

    const handleSubmitAttendance = async () => {
        if (!currentLesson || !currentLesson.id) {
            setPageError("Geen actieve les geselecteerd om absenties voor op te slaan.");
            return;
        }
        
        setIsLoading(true);
        setPageError('');
        setPageMessage('');

        const payload = Object.entries(attendanceRecords).map(([studentId, data]) => ({
            leerling_id: studentId,
            status: data.status,
            notities_absentie: data.notities_absentie,
        }));

        try {
            const success = await saveAttendanceForLesson(currentLesson.id, payload);
            if (success) {
                setPageMessage('Absenties succesvol opgeslagen!');
            } else {
                setPageError('Opslaan van absenties mislukt.');
            }
        } catch (err) {
            console.error("[Attendance] Error saving attendance:", err);
            setPageError(err.message || "Fout bij opslaan absenties.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentClassDetails && !isLoading) {
        return (
            <div className="card text-red-600 p-4">
                <AlertCircle className="inline mr-2"/>
                Klas niet gevonden. 
                <Button onClick={() => navigate('/teacher/my-classes')}>
                    Terug naar mijn klassen
                </Button>
            </div>
        );
    }
    
    // Use lesson students if available, otherwise current class students
    const studentsToList = currentLesson?.klas?.students || 
                          (currentClassDetails ? students.filter(s => s.class_id === classId && s.active) : []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="page-title">Absentie Registratie: {currentClassDetails?.name || "Klas"}</h2>
                <div className="flex items-center gap-2">
                    <CalendarDays size={20} className="text-gray-600" />
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => {
                            // Reset refs when date changes
                            lastLoadedDate.current = null;
                            setSelectedDate(date);
                        }}
                        dateFormat="dd/MM/yyyy"
                        className="input-field py-2 px-3 w-auto"
                        filterDate={(date) => {
                            const day = date.getDay();
                            return day === 0 || day === 6; // Sunday or Saturday
                        }}
                    />
                </div>
            </div>

            {pageError && (
                <div className="card text-red-600 bg-red-50 border-red-200 p-3 text-sm">
                    <AlertCircle className="inline mr-2"/>{pageError}
                </div>
            )}
            
            {pageMessage && (
                <div className="card text-green-600 bg-green-50 border-green-200 p-3 text-sm">
                    {pageMessage}
                </div>
            )}

            {isLoading && <LoadingSpinner message="Lesgegevens laden..." />}

            {!isLoading && !currentLesson && selectedDate && (
                <div className="card text-center p-6">
                    <p className="text-gray-700 mb-4">
                        Er is nog geen les geregistreerd voor {selectedDate.toLocaleDateString('nl-NL')} voor deze klas.
                    </p>
                    <Button onClick={handleCreateAndLoadLesson} variant="primary" disabled={isLoading}>
                        Start Les & Registreer Absenties
                    </Button>
                </div>
            )}

            {!isLoading && currentLesson && studentsToList.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-1">
                        Leerlingenlijst voor les op {new Date(currentLesson.les_datum).toLocaleDateString('nl-NL')}:
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Pas de status aan en voeg eventueel notities toe. Standaard staat iedereen op 'Aanwezig'.
                    </p>
                    <div className="space-y-3">
                        {studentsToList.map(student => (
                            <div key={student.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center p-3 border rounded-lg hover:bg-gray-50">
                                <span className="font-medium">{student.name}</span>
                                <div className="flex flex-wrap gap-2">
                                    {ATTENDANCE_STATUSES.map(statusOpt => (
                                        <Button
                                            key={statusOpt.value}
                                            variant={attendanceRecords[student.id]?.status === statusOpt.value ? 'primary' : 'secondary'}
                                            onClick={() => handleAttendanceChange(student.id, 'status', statusOpt.value)}
                                            size="sm"
                                            className={`px-2.5 py-1.5 min-w-[100px] text-xs ${attendanceRecords[student.id]?.status === statusOpt.value ? '' : 'opacity-70'}`}
                                            title={statusOpt.label}
                                        >
                                            {statusOpt.icon} <span className="ml-1.5">{statusOpt.label}</span>
                                        </Button>
                                    ))}
                                </div>
                                <textarea
                                    value={attendanceRecords[student.id]?.notities_absentie || ''}
                                    onChange={(e) => handleAttendanceChange(student.id, 'notities_absentie', e.target.value)}
                                    placeholder="Notities (bijv. reden afwezigheid)"
                                    rows="1"
                                    className="input-field text-sm p-2 w-full"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-right">
                        <Button onClick={handleSubmitAttendance} variant="primary" size="lg" disabled={isLoading}>
                            {isLoading ? "Opslaan..." : "Absenties Opslaan"}
                        </Button>
                    </div>
                </div>
            )}
            
            {!isLoading && currentLesson && studentsToList.length === 0 && (
                <div className="card text-center p-6">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700">Er zijn geen actieve leerlingen in deze klas.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherClassAttendancePage;