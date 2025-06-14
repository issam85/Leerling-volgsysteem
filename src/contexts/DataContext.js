// src/contexts/DataContext.js - VOLLEDIG GECORRIGEERDE VERSIE met juiste API endpoints
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser, currentSubdomain, loadingUser } = useAuth();
  
  const [realData, setRealData] = useState({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    teacherAssignedClasses: [],
    currentClassLessons: [],
    currentLessonAttendance: [],
    attendanceStats: {},
    quranStats: {}, // ✨ Qor'aan statistieken per leerling
    loading: false,
    error: null,
  });

  // Refs to prevent infinite loops
  const isDataInitialized = useRef(false);
  const lastLoadedSubdomain = useRef(null);
  const lastLoadedUserId = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const forceResetTimeoutRef = useRef(null);

  console.log("🔍 [DataContext] Render - currentUser:", !!currentUser, "loadingUser:", loadingUser, "subdomain:", currentSubdomain, "loading:", realData.loading);

  // FORCE RESET FUNCTIE
  const forceResetDataContext = useCallback(() => {
    console.warn("[DataContext] 🚨 FORCE RESET - Clearing all data and loading states");
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (forceResetTimeoutRef.current) {
      clearTimeout(forceResetTimeoutRef.current);
      forceResetTimeoutRef.current = null;
    }
    
    isDataInitialized.current = false;
    lastLoadedSubdomain.current = null;
    lastLoadedUserId.current = null;
    
    setRealData({
      users: [],
      classes: [],
      students: [],
      payments: [],
      mosque: null,
      teacherAssignedClasses: [],
      currentClassLessons: [],
      currentLessonAttendance: [],
      attendanceStats: {},
      quranStats: {},
      loading: false,
      error: null,
    });
    
    console.log("[DataContext] ✅ Force reset completed");
  }, []);

  // Emergency loading timeout
  useEffect(() => {
    if (realData.loading) {
      console.log("[DataContext] ⏰ Starting emergency timeout (10 seconds)");
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("[DataContext] 🚨 EMERGENCY TIMEOUT: Forcing loading to stop after 10 seconds");
        setRealData(prev => ({ 
          ...prev, 
          loading: false, 
          error: "Data loading timeout - probeer opnieuw of herlaad de pagina" 
        }));
      }, 10000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [realData.loading]);

  // WATCH FOR STUCK LOADING
  useEffect(() => {
    if (realData.loading) {
      forceResetTimeoutRef.current = setTimeout(() => {
        console.error("[DataContext] 🚨 STUCK LOADING DETECTED - Force resetting after 15 seconds");
        forceResetDataContext();
      }, 15000);
    } else {
      if (forceResetTimeoutRef.current) {
        clearTimeout(forceResetTimeoutRef.current);
        forceResetTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (forceResetTimeoutRef.current) {
        clearTimeout(forceResetTimeoutRef.current);
      }
    };
  }, [realData.loading, forceResetDataContext]);

  // ✅ CORRECT: Mosque data fetching
  const fetchMosqueDataBySubdomain = useCallback(async (subdomain) => {
    if (!subdomain || subdomain === 'register') return null;
    
    try {
      console.log(`[DataContext] Fetching mosque for subdomain: ${subdomain}`);
      const cacheBuster = `timestamp=${Date.now()}`;
      
      // ✅ CORRECT ENDPOINT
      const endpoint = `/api/mosques/subdomain/${subdomain}?${cacheBuster}`;
      const mosqueDetails = await apiCall(endpoint);
      
      if (mosqueDetails && mosqueDetails.id) {
        console.log("✅ [DataContext] Mosque found:", mosqueDetails.name);
        return mosqueDetails;
      } else {
        throw new Error(`Moskee voor subdomein '${subdomain}' niet gevonden.`);
      }
    } catch (error) {
      console.error(`❌ [DataContext] Error fetching mosque for ${subdomain}:`, error.message);
      throw error;
    }
  }, []);

  // ✅ CORRECT: Admin data loading
  const loadAdminDetailedData = useCallback(async (mosqueForDataLoading) => {
    if (!currentUser || currentUser.role !== 'admin' || !mosqueForDataLoading || !mosqueForDataLoading.id) {
      console.log("[DataContext] loadAdminDetailedData: Pre-conditions not met for admin. Skipping.");
      setRealData(prev => ({ ...prev, users: [], classes: [], students: [], payments: [], loading: false }));
      return;
    }
    
    console.log(`[DataContext] 👑 Loading ADMIN data for mosque: ${mosqueForDataLoading.name}`);
    setRealData(prev => ({ 
        ...prev, 
        mosque: mosqueForDataLoading, 
        loading: true, 
        error: null 
    }));

    try {
      const mosqueId = mosqueForDataLoading.id;
      
      // ✅ CORRECT ENDPOINTS - these are all correct already
      const [usersRes, classesRes, studentsRes, paymentsRes] = await Promise.all([
        apiCall(`/api/users/mosque/${mosqueId}`),
        apiCall(`/api/classes/mosque/${mosqueId}`),
        apiCall(`/api/students/mosque/${mosqueId}`),
        apiCall(`/api/payments/mosque/${mosqueId}`),
      ]);
      
      console.log(`[DataContext] ✅ Admin data loaded successfully for ${mosqueForDataLoading.name}`);
      setRealData(prev => ({
        ...prev,
        users: usersRes || [],
        classes: classesRes || [],
        students: studentsRes || [],
        payments: paymentsRes || [],
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[DataContext] ❌ Error loading admin data:', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van admin gegevens." }));
    }
  }, [currentUser]);

  // ✅ CORRECT: Teacher data loading
  const loadTeacherInitialData = useCallback(async (mosqueForDataLoading) => {
    if (!currentUser || currentUser.role !== 'teacher' || !mosqueForDataLoading || !mosqueForDataLoading.id) {
      console.log("[DataContext] loadTeacherInitialData: Pre-conditions not met for teacher. Skipping.");
      setRealData(prev => ({ 
          ...prev, 
          teacherAssignedClasses: [],
          currentClassLessons: [], 
          currentLessonAttendance: [], 
          loading: false 
      }));
      return;
    }
    
    console.log(`[DataContext] 🧑‍🏫 Loading TEACHER data for: ${currentUser.name} at ${mosqueForDataLoading.name}`);
    setRealData(prev => ({ ...prev, mosque: mosqueForDataLoading, loading: true, error: null }));

    try {
      // ✅ CORRECT ENDPOINTS - these are all correct already
      const [classesRes, studentsRes, usersRes] = await Promise.all([
        apiCall(`/api/classes/mosque/${mosqueForDataLoading.id}`),
        apiCall(`/api/students/mosque/${mosqueForDataLoading.id}`),
        apiCall(`/api/users/mosque/${mosqueForDataLoading.id}`),
      ]);
      
      const allClasses = classesRes || [];
      const allStudents = studentsRes || [];
      const allUsers = usersRes || [];
      
      const assignedClasses = allClasses.filter(c => String(c.teacher_id) === String(currentUser.id) && c.active);
      console.log(`[DataContext] ✅ Teacher data loaded: ${assignedClasses.length} assigned classes`);

      setRealData(prev => ({
        ...prev,
        users: allUsers,
        classes: allClasses,
        students: allStudents,
        teacherAssignedClasses: assignedClasses,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[DataContext] ❌ Error loading teacher data:', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van leraar gegevens." }));
    }
  }, [currentUser]);

  // ✅ CORRECTED: Parent data loading with FIXED Qor'aan endpoints
  const loadParentInitialDataWithQuranStats = useCallback(async (mosqueForDataLoading) => {
    if (!currentUser || currentUser.role !== 'parent' || !mosqueForDataLoading || !mosqueForDataLoading.id) {
      console.log("[DataContext] loadParentInitialDataWithQuranStats: Pre-conditions not met for parent. Skipping.");
      setRealData(prev => ({ ...prev, loading: false }));
      return;
    }
    
    console.log(`[DataContext] 👨‍👩‍👧‍👦 Loading PARENT data for: ${currentUser.name} at ${mosqueForDataLoading.name}`);
    setRealData(prev => ({ ...prev, mosque: mosqueForDataLoading, loading: true, error: null }));

    try {
      console.log(`[DataContext] 📡 Fetching parent data from API...`);
      
      // ✅ CORRECT ENDPOINTS - these are all correct already
      const [studentsRes, classesRes, usersRes] = await Promise.all([
        apiCall(`/api/students/mosque/${mosqueForDataLoading.id}`),
        apiCall(`/api/classes/mosque/${mosqueForDataLoading.id}`),
        apiCall(`/api/users/mosque/${mosqueForDataLoading.id}`)
      ]);
      
      const allStudents = studentsRes || [];
      const allClasses = classesRes || [];
      const allUsers = usersRes || [];
      
      console.log(`[DataContext] 📊 API Response - Students: ${allStudents.length}, Classes: ${allClasses.length}, Users: ${allUsers.length}`);
      
      const parentChildren = allStudents.filter(s => String(s.parent_id) === String(currentUser.id));
      console.log(`[DataContext] 👶 Found ${parentChildren.length} children for parent ${currentUser.name} (parent_id: ${currentUser.id})`);

      let attendanceStats = {};
      let quranStats = {};
      
      if (parentChildren.length > 0) {
        const childIds = parentChildren.map(child => child.id);
        
        try {
          // ✅ CORRECT ENDPOINT - attendance stats
          console.log(`[DataContext] 📈 Loading attendance stats for children...`);
          const statsRes = await apiCall(`/api/students/mosque/${mosqueForDataLoading.id}/attendance-stats`, {
            method: 'POST',
            body: JSON.stringify({ student_ids: childIds })
          });
          attendanceStats = statsRes || {};
          console.log(`[DataContext] ✅ Loaded attendance stats for ${Object.keys(attendanceStats).length} children`);
        } catch (error) {
          console.error('[DataContext] ⚠️ Error loading attendance stats (non-fatal):', error);
        }

        try {
          // ✅ CORRECTED: Simplified Qor'aan stats endpoint
          console.log(`[DataContext] 📖 Loading Quran stats for children...`);
          const quranStatsRes = await apiCall(`/api/quran/students/stats`, {
            method: 'POST',
            body: JSON.stringify({ student_ids: childIds })
          });
          quranStats = quranStatsRes || {};
          console.log(`[DataContext] ✅ Loaded Quran stats for ${Object.keys(quranStats).length} children`);
        } catch (error) {
          console.error('[DataContext] ⚠️ Error loading Quran stats (non-fatal):', error);
        }
      }

      console.log(`[DataContext] ✅ Parent data loaded successfully for ${currentUser.name}`);
      setRealData(prev => ({
        ...prev,
        students: parentChildren,
        payments: [],
        users: allUsers,
        classes: allClasses,
        attendanceStats: attendanceStats,
        quranStats: quranStats, // ✅ CORRECTED Qor'aan stats
        teacherAssignedClasses: [],
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[DataContext] ❌ Error loading parent data:', error);
      setRealData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || "Fout bij laden van ouder gegevens." 
      }));
    }
  }, [currentUser]);

  // ===== GECORRIGEERDE FUNCTIES VOOR QOR'AAN & LEERLING BEHEER =====

  // ✅ CORRECTED: Student toevoegen (SIMPLIFIED endpoint)
  const addStudentToClass = useCallback(async (studentData) => {
    if (!currentUser || currentUser.role !== 'teacher' || !realData.mosque?.id) {
      throw new Error('Alleen leraren kunnen leerlingen toevoegen');
    }

    try {
      console.log(`[DataContext] Adding student to system`);
      
      const payload = {
        ...studentData,
        mosque_id: realData.mosque.id, // mosqueId goes in payload now
        added_by_teacher_id: currentUser.id
      };

      // ✅ CORRECTED: Simplified endpoint without mosqueId in URL
      const result = await apiCall(`/api/students`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        await refreshAllData();
        return result;
      }
      
      throw new Error(result.error || 'Kon leerling niet toevoegen');
    } catch (error) {
      console.error('[DataContext] Error adding student:', error);
      setRealData(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [currentUser, realData.mosque?.id]);

  // ✅ CORRECTED: Qor'aan voortgang ophalen - SIMPLIFIED endpoint
  const fetchQuranProgressForStudent = useCallback(async (studentId) => {
    if (!currentUser || !studentId) {
      return [];
    }

    try {
      console.log(`[DataContext] Fetching Quran progress for student ${studentId}`);
      
      // ✅ CORRECTED: Simplified endpoint without mosqueId in URL
      const progress = await apiCall(`/api/quran/student/${studentId}/progress`);
      return progress || [];
    } catch (error) {
      console.error('[DataContext] Error fetching Quran progress:', error);
      setRealData(prev => ({ ...prev, error: error.message }));
      return [];
    }
  }, [currentUser]);

  // ✅ CORRECTED: Qor'aan voortgang bijwerken - SIMPLIFIED endpoint
  const updateQuranProgress = useCallback(async (studentId, progressData) => {
    if (!currentUser || currentUser.role !== 'teacher' || !studentId) {
      throw new Error('Alleen leraren kunnen Qor\'aan voortgang bijwerken');
    }

    try {
      console.log(`[DataContext] Updating Quran progress for student ${studentId}`);
      
      const payload = {
        ...progressData,
        updated_by_teacher_id: currentUser.id
      };

      // ✅ CORRECTED: Simplified endpoint without mosqueId in URL
      const result = await apiCall(`/api/quran/student/${studentId}/progress`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        console.log(`[DataContext] Successfully updated Quran progress`);
        return result;
      }
      
      throw new Error(result.error || 'Kon voortgang niet bijwerken');
    } catch (error) {
      console.error('[DataContext] Error updating Quran progress:', error);
      setRealData(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [currentUser]);

  // ✅ CORRECTED: Bulk Qor'aan statistieken - SIMPLIFIED endpoint
  const fetchQuranStatsForChildren = useCallback(async (studentIds) => {
    if (!currentUser || currentUser.role !== 'parent' || !studentIds?.length) {
      return {};
    }

    try {
      console.log(`[DataContext] Fetching Quran stats for ${studentIds.length} children`);
      
      // ✅ CORRECTED: Simplified endpoint without mosqueId in URL
      const stats = await apiCall(`/api/quran/students/stats`, {
        method: 'POST',
        body: JSON.stringify({ student_ids: studentIds })
      });
      
      return stats || {};
    } catch (error) {
      console.error('[DataContext] Error fetching Quran stats:', error);
      return {};
    }
  }, [currentUser]);

  // ===== GECORRIGEERDE LESSON FUNCTIES =====

  // ✅ CORRECTED: Lessons ophalen - SIMPLIFIED endpoint
  const fetchLessonsForClass = useCallback(async (classId, startDate, endDate) => {
    if (!currentUser || !classId) return [];
    console.log(`[DataContext] fetchLessonsForClass: Fetching for class ${classId}`);
    
    try {
      // ✅ CORRECTED: Simplified endpoint - no mosqueId needed
      const lessons = await apiCall(`/api/lessons/class/${classId}?startDate=${startDate}&endDate=${endDate}`);
      setRealData(prev => ({ ...prev, currentClassLessons: lessons || [] }));
      return lessons || [];
    } catch (error) {
      console.error("[DataContext] Error fetching lessons:", error);
      setRealData(prev => ({ ...prev, currentClassLessons: [], error: error.message }));
      return [];
    }
  }, [currentUser]);

  // ✅ CORRECTED: Lesson details ophalen - SIMPLIFIED endpoint
  const fetchLessonDetailsForAttendance = useCallback(async (lessonId) => {
      if(!lessonId) return null;
      
      try {
          // ✅ CORRECTED: Updated endpoint path
          const lessonDetails = await apiCall(`/api/lessons/${lessonId}/details-for-attendance`);
          return lessonDetails;
      } catch (error) {
          console.error("[DataContext] Error fetching lesson details for attendance:", error);
          setRealData(prev => ({ ...prev, error: error.message }));
          return null;
      }
  }, []);

  // ✅ CORRECTED: Attendance ophalen - SIMPLIFIED endpoint
  const fetchAttendanceForLesson = useCallback(async (lessonId) => {
    if (!lessonId) return [];
    
    try {
      // ✅ CORRECTED: Updated endpoint path
      const attendance = await apiCall(`/api/lessons/${lessonId}/absenties`);
      setRealData(prev => ({ ...prev, currentLessonAttendance: attendance || [] }));
      return attendance || [];
    } catch (error) {
      console.error("[DataContext] Error fetching attendance for lesson:", error);
       setRealData(prev => ({ ...prev, currentLessonAttendance: [], error: error.message }));
      return [];
    }
  }, []);

  // ✅ CORRECTED: Attendance opslaan - SIMPLIFIED endpoint
  const saveAttendanceForLesson = useCallback(async (lessonId, attendancePayload) => {
    if (!lessonId || !attendancePayload || !currentUser?.id) return false;
    
    const payloadWithTeacher = attendancePayload.map(att => ({
        ...att,
        geregistreerd_door_leraar_id: currentUser.id
    }));
    
    try {
      // ✅ CORRECTED: Updated endpoint path
      const result = await apiCall(`/api/lessons/${lessonId}/absenties`, {
        method: 'POST',
        body: JSON.stringify(payloadWithTeacher)
      });
      
      if (result.success) {
        try {
          console.log("[DataContext] Save successful, refreshing attendance from database...");
          const freshAttendance = await apiCall(`/api/lessons/${lessonId}/absenties`);
          setRealData(prev => ({ ...prev, currentLessonAttendance: freshAttendance || [] }));
          console.log("[DataContext] Fresh attendance data loaded:", freshAttendance?.length || 0, "records");
          return { success: true, freshData: freshAttendance || [] };
        } catch (fetchError) {
          console.error("[DataContext] Could not refresh attendance after save:", fetchError);
          return { success: true, freshData: null };
        }
      }
      throw new Error(result.error || "Opslaan van absenties mislukt.");
    } catch (error) {
      console.error("[DataContext] Error saving attendance:", error);
      setRealData(prev => ({...prev, error: error.message }));
      return { success: false, error: error.message };
    }
  }, [currentUser?.id]);

  // ✅ CORRECTED: Lesson aanmaken - SIMPLIFIED endpoint
  const createLesson = useCallback(async (lessonData) => {
      if (!lessonData) return null;
      
      try {
          // ✅ CORRECTED: Simplified endpoint - mosqueId and classId now in payload
          const result = await apiCall(`/api/lessons`, {
              method: 'POST',
              body: JSON.stringify(lessonData)
          });
          
          if (result.success && result.data) {
              return result.data;
          }
          throw new Error(result.error || "Kon les niet aanmaken.");
      } catch (error) {
          console.error("[DataContext] Error creating lesson:", error);
          setRealData(prev => ({...prev, error: error.message }));
          return null;
      }
  }, []);

  // Mosque fetch effect
  useEffect(() => {
    console.log("[DataContext] 🏗️ Mosque Fetch useEffect. LoadingUser:", loadingUser, "Subdomain:", currentSubdomain);
    
    if (loadingUser) {
      console.log("[DataContext] ⏳ Auth still loading, skipping mosque fetch");
      return;
    }
    
    if (currentSubdomain === 'register') {
      console.log("[DataContext] 📝 Register subdomain detected, clearing data");
      setRealData({ 
        users: [], classes: [], students: [], payments: [], mosque: null, 
        teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
        attendanceStats: {}, quranStats: {}, loading: false, error: null 
      });
      lastLoadedSubdomain.current = currentSubdomain;
      return;
    }

    if (lastLoadedSubdomain.current !== currentSubdomain || !realData.mosque || realData.mosque.subdomain !== currentSubdomain) {
      console.log(`[DataContext] 🔄 Mosque data needs refresh for ${currentSubdomain}. Fetching...`);
      setRealData(prev => ({ ...prev, loading: true, error: null, mosque: null }));
      lastLoadedSubdomain.current = currentSubdomain;
      
      fetchMosqueDataBySubdomain(currentSubdomain)
        .then(mosqueObject => {
          if (mosqueObject) {
            console.log(`[DataContext] ✅ Mosque loaded: ${mosqueObject.name}`);
            setRealData(prev => ({ ...prev, mosque: mosqueObject, loading: false, error: null }));
          } else {
            throw new Error(`Moskee voor subdomein '${currentSubdomain}' kon niet worden geladen.`);
          }
        })
        .catch(err => {
          console.error("[DataContext] ❌ Error in fetchMosqueDataBySubdomain promise chain:", err);
          setRealData(prev => ({ ...prev, mosque: null, loading: false, error: err.message }));
        });
    } else {
      console.log("[DataContext] ✅ Mosque data already loaded for", currentSubdomain);
    }
  }, [loadingUser, currentSubdomain, fetchMosqueDataBySubdomain, realData.mosque?.subdomain]);

  // Role-based data loading effect
  useEffect(() => {
    console.log("[DataContext] 👤 Role-based Data Load useEffect. currentUser:", !!currentUser, "Role:", currentUser?.role, "mosque:", !!realData.mosque?.id, "LoadingUser:", loadingUser);
    
    if (loadingUser || !realData.mosque || !realData.mosque.id) {
      console.log("[DataContext] ⏳ Waiting for auth or mosque data...");
      return;
    }

    if (currentUser && lastLoadedUserId.current !== currentUser.id) {
      console.log(`[DataContext] 🔄 Loading data for new user: ${currentUser.id} (role: ${currentUser.role})`);
      lastLoadedUserId.current = currentUser.id;
      
      if (currentUser.role === 'admin') {
        console.log("[DataContext] 👑 User is ADMIN. Loading admin detailed data.");
        loadAdminDetailedData(realData.mosque);
      } else if (currentUser.role === 'teacher') {
        console.log("[DataContext] 🧑‍🏫 User is TEACHER. Loading teacher initial data.");
        loadTeacherInitialData(realData.mosque);
      } else if (currentUser.role === 'parent') {
        console.log("[DataContext] 👨‍👩‍👧‍👦 User is PARENT. Loading parent data with Quran stats.");
        setTimeout(() => {
          loadParentInitialDataWithQuranStats(realData.mosque);
        }, 100);
      } else {
        console.warn("[DataContext] ❓ Unknown user role or no role, stopping data load.");
        setRealData(prev => ({ ...prev, loading: false }));
      }
    } else if (!currentUser && lastLoadedUserId.current !== null) {
      console.log("[DataContext] 🚪 No currentUser (logout detected). Resetting data.");
      lastLoadedUserId.current = null;
      setRealData({
        users: [], classes: [], students: [], payments: [], mosque: null,
        teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
        attendanceStats: {}, quranStats: {}, loading: false, error: null,
      });
    } else {
      console.log("[DataContext] ✅ User data already loaded or no user change");
    }
  }, [currentUser?.id, realData.mosque?.id, loadingUser, loadAdminDetailedData, loadTeacherInitialData, loadParentInitialDataWithQuranStats]);

  // ✅ REFRESH ALL DATA functie
  const refreshAllData = useCallback(async () => {
    console.log("[DataContext] 🔄 RefreshAllData called.");
    if (loadingUser || !currentSubdomain || currentSubdomain === 'register') {
      console.log("[DataContext] ❌ RefreshAllData: Cannot refresh, auth loading, no subdomain or on register page.");
      return;
    }
    
    setRealData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const mosqueObject = await fetchMosqueDataBySubdomain(currentSubdomain);
      if (mosqueObject && mosqueObject.id) {
        setRealData(prev => ({ ...prev, mosque: mosqueObject, loading: true }));
        
        if (currentUser) {
          if (currentUser.role === 'admin') {
            await loadAdminDetailedData(mosqueObject);
          } else if (currentUser.role === 'teacher') {
            await loadTeacherInitialData(mosqueObject);
          } else if (currentUser.role === 'parent') {
            await loadParentInitialDataWithQuranStats(mosqueObject);
          } else {
             setRealData(prev => ({ ...prev, loading: false }));
          }
        } else {
           setRealData(prev => ({ 
             ...prev, 
             mosque: mosqueObject,
             users: [], classes: [], students: [], payments: [],
             teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
             attendanceStats: {}, quranStats: {}, loading: false 
            }));
        }
      } else {
        throw new Error("Kon moskeegegevens niet opnieuw laden voor volledige refresh.");
      }
    } catch (error) {
      console.error("[DataContext] Error during refreshAllData:", error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, [loadingUser, currentSubdomain, currentUser, fetchMosqueDataBySubdomain, loadAdminDetailedData, loadTeacherInitialData, loadParentInitialDataWithQuranStats]);

  // ✅ COMPLETE VALUE OBJECT
  const value = {
    realData,
    loadData: refreshAllData,
    currentUser,
    // Mosque functie
    fetchMosqueDataBySubdomain,
    // Lesson functies
    fetchLessonsForClass,
    fetchAttendanceForLesson,
    saveAttendanceForLesson,
    fetchLessonDetailsForAttendance,
    createLesson,
    // Student functie
    addStudentToClass,
    // Qor'aan functies
    fetchQuranProgressForStudent,
    updateQuranProgress,
    fetchQuranStatsForChildren,
    // Utility functies
    forceResetDataContext,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};