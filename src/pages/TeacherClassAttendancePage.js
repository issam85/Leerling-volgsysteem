// src/pages/TeacherClassAttendancePage.js
import React, { useState, useEffect, useCallback } from 'react';
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
        fetchLessonsForClass, // Om te checken of een les al bestaat
    } = useData();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentLesson, setCurrentLesson] = useState(null); // { id, les_datum, klas: { id, name, students: [...] } }
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status, notes_absentie } }
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState('');
    const [pageMessage, setPageMessage] = useState('');

    const { mosque, classes } = realData;
    const currentClassDetails = classes.find(c => c.id === classId);

    // Functie om de les en absenties te laden voor de geselecteerde datum
    const loadLessonAndAttendanceForDate = useCallback(async (dateToLoad) => {
        if (!mosque?.id || !classId || !currentUser?.id) return;
        setIsLoading(true);
        setPageError('');
        setPageMessage('');
        setCurrentLesson(null);
        setAttendanceRecords({});

        const dateStr = dateToLoad.toISOString().split('T')[0];

        try {
            // 1. Check of er al een les bestaat voor deze klas & datum
            const existingLessons = await fetchLessonsForClass(classId, dateStr, dateStr);
            let lessonForDate = existingLessons.find(l => l.les_datum === dateStr && !l.is_geannuleerd);

            if (lessonForDate) {
                // 2. Les bestaat, haal details en bestaande absenties op
                const lessonDetails = await fetchLessonDetailsForAttendance(lessonForDate.id);
                if (lessonDetails && lessonDetails.klas && lessonDetails.klas.students) {
                    setCurrentLesson(lessonDetails);
                    const existingAttendance = await fetchAttendanceForLesson(lessonForDate.id);
                    const attMap = {};
                    lessonDetails.klas.students.forEach(student => {
                        const record = existingAttendance.find(att => att.leerling_id === student.id);
                        attMap[student.id] = {
                            status: record?.status || 'aanwezig', // Default 'aanwezig'
                            notities_absentie: record?.notities_absentie || '',
                        };
                    });
                    setAttendanceRecords(attMap);
                } else {
                    setPageError("Kon lesdetails of leerlingen niet laden.");
                }
            } else {
                // Les bestaat nog niet voor deze datum. UI toont knop om les aan te maken.
                console.log(`Geen les gevonden voor ${dateStr}. Leraar kan er een aanmaken.`);
                setCurrentLesson(null); // Zorgt ervoor dat "Start Les" knop getoond wordt
                 // Initialize attendance for all students of the class with default 'aanwezig'
                if (currentClassDetails) {
                    const studentsInClass = realData.students.filter(s => s.class_id === classId && s.active);
                    const initialAttMap = {};
                    studentsInClass.forEach(student => {
                        initialAttMap[student.id] = { status: 'aanwezig', notities_absentie: '' };
                    });
                    setAttendanceRecords(initialAttMap);
                }
            }
        } catch (err) {
            console.error("Fout bij laden les/absenties:", err);
            setPageError(err.message || "Er is een fout opgetreden.");
        } finally {
            setIsLoading(false);
        }
    }, [mosque?.id, classId, currentUser?.id, fetchLessonsForClass, fetchLessonDetailsForAttendance, fetchAttendanceForLesson, currentClassDetails, realData.students]);

    useEffect(() => {
        loadLessonAndAttendanceForDate(selectedDate);
    }, [selectedDate, classId, loadLessonAndAttendanceForDate]); // loadLessonAndAttendanceForDate is nu een dependency

    const handleCreateAndLoadLesson = async () => {
        if (!mosque?.id || !classId) return;
        setIsLoading(true);
        setPageError('');
        const dateStr = selectedDate.toISOString().split('T')[0];
        const lessonPayload = {
            les_datum: dateStr,
            // onderwerp: `Les op ${selectedDate.toLocaleDateString()}`, // Optioneel
        };
        try {
            const newLesson = await createLesson(mosque.id, classId, lessonPayload);
            if (newLesson && newLesson.id) {
                setPageMessage("Nieuwe les succesvol aangemaakt. U kunt nu absenties registreren.");
                await loadLessonAndAttendanceForDate(selectedDate); // Herlaad alles voor de nieuwe les
            } else {
                throw new Error("Kon nieuwe les niet aanmaken.");
            }
        } catch (err) {
            console.error("Fout bij aanmaken les:", err);
            setPageError(err.message || "Fout bij aanmaken les.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, field, value) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { status: 'aanwezig', notities_absentie: '' }), // Zorg dat studentId key bestaat
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
            console.error("Fout bij opslaan absenties (submit):", err);
            setPageError(err.message || "Fout bij opslaan absenties.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentClassDetails && !isLoading) {
        return <div className="card text-red-600 p-4"><AlertCircle className="inline mr-2"/>Klas niet gevonden. <Button onClick={() => navigate('/teacher/my-classes')}>Terug naar mijn klassen</Button></div>;
    }
    
    const studentsToList = currentLesson?.klas?.students || (currentClassDetails ? realData.students.filter(s => s.class_id === classId && s.active) : []);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="page-title">Absentie Registratie: {currentClassDetails?.name || "Klas"}</h2>
                <div className="flex items-center gap-2">
                    <CalendarDays size={20} className="text-gray-600" />
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="dd/MM/yyyy"
                        className="input-field py-2 px-3 w-auto"
                        filterDate={(date) => { // Optioneel: filter alleen weekenddagen
                            const day = date.getDay();
                            return day === 0 || day === 6; // Zondag of Zaterdag
                        }}
                    />
                </div>
            </div>

            {pageError && <div className="card text-red-600 bg-red-50 border-red-200 p-3 text-sm"><AlertCircle className="inline mr-2"/>{pageError}</div>}
            {pageMessage && <div className="card text-green-600 bg-green-50 border-green-200 p-3 text-sm">{pageMessage}</div>}

            {isLoading && <LoadingSpinner message="Lesgegevens laden..." />}

            {!isLoading && !currentLesson && selectedDate && (
                <div className="card text-center p-6">
                    <p className="text-gray-700 mb-4">Er is nog geen les geregistreerd voor {selectedDate.toLocaleDateString('nl-NL')} voor deze klas.</p>
                    <Button onClick={handleCreateAndLoadLesson} variant="primary" disabled={isLoading}>
                        Start Les & Registreer Absenties
                    </Button>
                </div>
            )}

            {!isLoading && currentLesson && studentsToList.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-1">Leerlingenlijst voor les op {new Date(currentLesson.les_datum).toLocaleDateString('nl-NL')}:</h3>
                    <p className="text-xs text-gray-500 mb-4">Pas de status aan en voeg eventueel notities toe. Standaard staat iedereen op 'Aanwezig'.</p>
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