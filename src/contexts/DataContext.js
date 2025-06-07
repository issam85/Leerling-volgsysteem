// src/contexts/DataContext.js - COMPLETE VERSIE met alle nieuwe functies
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser, currentSubdomain, loadingUser } = useAuth();
  
  // COMPLETE useState declaratie - met alle nieuwe velden
  const [realData, setRealData] = useState({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    teacherAssignedClasses: [],
    currentClassLessons: [],
    currentLessonAttendance: [],
    attendanceStats: {}, // Absentie statistieken per leerling
    quranStats: {}, // ✨ NIEUW: Qor'aan statistieken per leerling
    loading: false, // Start false to prevent initial loops
    error: null,
  });

  // Refs to prevent infinite loops
  const isDataInitialized = useRef(false);
  const lastLoadedSubdomain = useRef(null);
  const lastLoadedUserId = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const forceResetTimeoutRef = useRef(null);

  console.log("🔍 [DataContext] Render - currentUser:", !!currentUser, "loadingUser:", loadingUser, "subdomain:", currentSubdomain, "loading:", realData.loading);

  // FORCE RESET FUNCTIE - om uit loading loops te komen
  const forceResetDataContext = useCallback(() => {
    console.warn("[DataContext] 🚨 FORCE RESET - Clearing all data and loading states");
    
    // Clear alle timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (forceResetTimeoutRef.current) {
      clearTimeout(forceResetTimeoutRef.current);
      forceResetTimeoutRef.current = null;
    }
    
    // Reset alle refs
    isDataInitialized.current = false;
    lastLoadedSubdomain.current = null;
    lastLoadedUserId.current = null;
    
    // Reset state - inclusief nieuwe velden
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

  // Emergency loading timeout - force stop loading after 10 seconds
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

  // WATCH FOR STUCK LOADING - als we 15 seconden in loading blijven, force reset
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

  const fetchMosqueDataBySubdomain = useCallback(async (subdomain) => {
    if (!subdomain || subdomain === 'register') return null;
    
    try {
      console.log(`🔍 [DataContext] Fetching mosque for subdomain: ${subdomain}`);
      const cacheBuster = `timestamp=${Date.now()}`;
      const endpoint = `/api/mosque/${subdomain}?${cacheBuster}`;
      const mosqueDetails = await apiCall(endpoint);
      
      if (mosqueDetails && mosqueDetails.id) {
        console.log("✅ [DataContext] Mosque found:", mosqueDetails.name);
        return mosqueDetails;
      } else {
        throw new Error(`Moskee voor subdomein '${subdomain}' niet gevonden.`);
      }
    } catch (error) {
      console.error(`❌ [DataContext] Error fetching mosque for ${subdomain}:`, error);
      throw error;
    }
  }, []);

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
      const [usersRes, classesRes, studentsRes, paymentsRes] = await Promise.all([
        apiCall(`/api/mosques/${mosqueId}/users`),
        apiCall(`/api/mosques/${mosqueId}/classes`),
        apiCall(`/api/mosques/${mosqueId}/students`),
        apiCall(`/api/mosques/${mosqueId}/payments`),
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
      // Always fetch fresh data for teachers to avoid dependency loops
      const [classesRes, studentsRes, usersRes] = await Promise.all([
        apiCall(`/api/mosques/${mosqueForDataLoading.id}/classes`),
        apiCall(`/api/mosques/${mosqueForDataLoading.id}/students`),
        apiCall(`/api/mosques/${mosqueForDataLoading.id}/users`),
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

  // ✨ NIEUWE ENHANCED PARENT DATA LOADING MET QOR'AAN STATS
  const loadParentInitialDataWithQuranStats = useCallback(async (mosqueForDataLoading) => {
    if (!currentUser || currentUser.role !== 'parent' || !mosqueForDataLoading || !mosqueForDataLoading.id) {
      console.log("[DataContext] loadParentInitialDataWithQuranStats: Pre-conditions not met for parent. Skipping.");
      setRealData(prev => ({ ...prev, loading: false }));
      return;
    }
    
    console.log(`[DataContext] 👨‍👩‍👧‍👦 Loading PARENT data for: ${currentUser.name} at ${mosqueForDataLoading.name}`);
    setRealData(prev => ({ ...prev, mosque: mosqueForDataLoading, loading: true, error: null }));

    try {
      // Voor ouders laden we students, classes, users
      console.log(`[DataContext] 📡 Fetching parent data from API...`);
      const [studentsRes, classesRes, usersRes] = await Promise.all([
        apiCall(`/api/mosques/${mosqueForDataLoading.id}/students`),
        apiCall(`/api/mosques/${mosqueForDataLoading.id}/classes`),
        apiCall(`/api/mosques/${mosqueForDataLoading.id}/users`)
      ]);
      
      const allStudents = studentsRes || [];
      const allClasses = classesRes || [];
      const allUsers = usersRes || [];
      
      console.log(`[DataContext] 📊 API Response - Students: ${allStudents.length}, Classes: ${allClasses.length}, Users: ${allUsers.length}`);
      
      // Filter alleen hun eigen kinderen
      const parentChildren = allStudents.filter(s => String(s.parent_id) === String(currentUser.id));
      console.log(`[DataContext] 👶 Found ${parentChildren.length} children for parent ${currentUser.name} (parent_id: ${currentUser.id})`);

      // Haal ZOWEL absentie als Qor'aan statistieken op
      let attendanceStats = {};
      let quranStats = {};
      
      if (parentChildren.length > 0) {
        const childIds = parentChildren.map(child => child.id);
        
        try {
          // Attendance stats
          console.log(`[DataContext] 📈 Loading attendance stats for children...`);
          const statsRes = await apiCall(`/api/mosques/${mosqueForDataLoading.id}/students/attendance-stats`, {
            method: 'POST',
            body: JSON.stringify({ student_ids: childIds })
          });
          attendanceStats = statsRes || {};
          console.log(`[DataContext] ✅ Loaded attendance stats for ${Object.keys(attendanceStats).length} children`);
        } catch (error) {
          console.error('[DataContext] ⚠️ Error loading attendance stats (non-fatal):', error);
        }

        try {
          // ✨ NIEUW: Qor'aan stats
          console.log(`[DataContext] 📖 Loading Quran stats for children...`);
          const quranStatsRes = await apiCall(`/api/mosques/${mosqueForDataLoading.id}/students/quran-stats`, {
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
        students: parentChildren, // Alleen hun kinderen
        payments: [], // Leeg voor nu - kan later apart geladen worden
        users: allUsers, // Alle users (zodat leraarsnamen getoond kunnen worden)
        classes: allClasses, // Alle klassen (zodat klasnamen getoond kunnen worden)
        attendanceStats: attendanceStats, // Absentie statistieken per kind
        quranStats: quranStats, // ✨ NIEUW: Qor'aan statistieken per kind
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

  // ===== NIEUWE FUNCTIES VOOR QOR'AAN & LEERLING BEHEER =====

  // ✨ LEERLING TOEVOEGEN (ALLEEN VOOR LERAREN)
  const addStudentToClass = useCallback(async (classId, studentData) => {
    if (!currentUser || currentUser.role !== 'teacher' || !realData.mosque?.id) {
      throw new Error('Alleen leraren kunnen leerlingen toevoegen');
    }

    try {
      console.log(`[DataContext] Adding student to class ${classId}`);
      
      const payload = {
        ...studentData,
        added_by_teacher_id: currentUser.id
      };

      const result = await apiCall(`/api/mosques/${realData.mosque.id}/students`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        // Refresh data om nieuwe student te tonen
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

  // ✨ QOR'AAN VOORTGANG OPHALEN
  const fetchQuranProgressForStudent = useCallback(async (studentId) => {
    if (!currentUser || !realData.mosque?.id || !studentId) {
      return [];
    }

    try {
      console.log(`[DataContext] Fetching Quran progress for student ${studentId}`);
      
      const progress = await apiCall(`/api/mosques/${realData.mosque.id}/students/${studentId}/quran-progress`);
      return progress || [];
    } catch (error) {
      console.error('[DataContext] Error fetching Quran progress:', error);
      setRealData(prev => ({ ...prev, error: error.message }));
      return [];
    }
  }, [currentUser, realData.mosque?.id]);

  // ✨ QOR'AAN VOORTGANG BIJWERKEN (ALLEEN VOOR LERAREN)
  const updateQuranProgress = useCallback(async (studentId, progressData) => {
    if (!currentUser || currentUser.role !== 'teacher' || !realData.mosque?.id || !studentId) {
      throw new Error('Alleen leraren kunnen Qor\'aan voortgang bijwerken');
    }

    try {
      console.log(`[DataContext] Updating Quran progress for student ${studentId}`);
      
      const payload = {
        ...progressData,
        updated_by_teacher_id: currentUser.id
      };

      const result = await apiCall(`/api/mosques/${realData.mosque.id}/students/${studentId}/quran-progress`, {
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
  }, [currentUser, realData.mosque?.id]);

  // ✨ BULK QOR'AAN STATISTIEKEN (VOOR OUDERS)
  const fetchQuranStatsForChildren = useCallback(async (studentIds) => {
    if (!currentUser || currentUser.role !== 'parent' || !realData.mosque?.id || !studentIds?.length) {
      return {};
    }

    try {
      console.log(`[DataContext] Fetching Quran stats for ${studentIds.length} children`);
      
      const stats = await apiCall(`/api/mosques/${realData.mosque.id}/students/quran-stats`, {
        method: 'POST',
        body: JSON.stringify({ student_ids: studentIds })
      });
      
      return stats || {};
    } catch (error) {
      console.error('[DataContext] Error fetching Quran stats:', error);
      // Niet fataal voor parent data loading
      return {};
    }
  }, [currentUser, realData.mosque?.id]);

  // ===== BESTAANDE FUNCTIES =====

  const fetchLessonsForClass = useCallback(async (classId, startDate, endDate) => {
    if (!currentUser || !realData.mosque?.id || !classId) return [];
    console.log(`[DataContext] fetchLessonsForClass: Fetching for class ${classId}, mosque ${realData.mosque.id}`);
    
    try {
      const lessons = await apiCall(`/api/mosques/${realData.mosque.id}/classes/${classId}/lessons?startDate=${startDate}&endDate=${endDate}`);
      setRealData(prev => ({ ...prev, currentClassLessons: lessons || [] }));
      return lessons || [];
    } catch (error) {
      console.error("[DataContext] Error fetching lessons:", error);
      setRealData(prev => ({ ...prev, currentClassLessons: [], error: error.message }));
      return [];
    }
  }, [currentUser, realData.mosque?.id]);

  const fetchLessonDetailsForAttendance = useCallback(async (lessonId) => {
      if(!lessonId) return null;
      
      try {
          const lessonDetails = await apiCall(`/api/lessen/${lessonId}/details-for-attendance`);
          return lessonDetails;
      } catch (error) {
          console.error("[DataContext] Error fetching lesson details for attendance:", error);
          setRealData(prev => ({ ...prev, error: error.message }));
          return null;
      }
  }, []);

  const fetchAttendanceForLesson = useCallback(async (lessonId) => {
    if (!lessonId) return [];
    
    try {
      const attendance = await apiCall(`/api/lessen/${lessonId}/absenties`);
      setRealData(prev => ({ ...prev, currentLessonAttendance: attendance || [] }));
      return attendance || [];
    } catch (error) {
      console.error("[DataContext] Error fetching attendance for lesson:", error);
       setRealData(prev => ({ ...prev, currentLessonAttendance: [], error: error.message }));
      return [];
    }
  }, []);

  const saveAttendanceForLesson = useCallback(async (lessonId, attendancePayload) => {
    if (!lessonId || !attendancePayload || !currentUser?.id) return false;
    
    const payloadWithTeacher = attendancePayload.map(att => ({
        ...att,
        geregistreerd_door_leraar_id: currentUser.id
    }));
    
    try {
      const result = await apiCall(`/api/lessen/${lessonId}/absenties`, {
        method: 'POST',
        body: JSON.stringify(payloadWithTeacher)
      });
      
      if (result.success) {
        // ALWAYS refresh attendance data from database after save
        try {
          console.log("[DataContext] Save successful, refreshing attendance from database...");
          const freshAttendance = await apiCall(`/api/lessen/${lessonId}/absenties`);
          setRealData(prev => ({ ...prev, currentLessonAttendance: freshAttendance || [] }));
          console.log("[DataContext] Fresh attendance data loaded:", freshAttendance?.length || 0, "records");
          return { success: true, freshData: freshAttendance || [] };
        } catch (fetchError) {
          console.error("[DataContext] Could not refresh attendance after save:", fetchError);
          // Save was successful, but refresh failed - still return success
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

  const createLesson = useCallback(async (mosqueId, classId, lessonData) => {
      if (!mosqueId || !classId || !lessonData) return null;
      
      try {
          const result = await apiCall(`/api/mosques/${mosqueId}/classes/${classId}/lessons`, {
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

  // Mosque fetch effect - with loop prevention
  useEffect(() => {
    console.log("[DataContext] 🏗️ Mosque Fetch useEffect. LoadingUser:", loadingUser, "Subdomain:", currentSubdomain);
    
    // Prevent running if auth is still loading
    if (loadingUser) {
      console.log("[DataContext] ⏳ Auth still loading, skipping mosque fetch");
      return;
    }
    
    // Handle register subdomain
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

    // Only fetch if subdomain changed and we don't have data for this subdomain
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

  // Role-based data loading effect - with loop prevention - ✨ UPDATED to use new parent function
  useEffect(() => {
    console.log("[DataContext] 👤 Role-based Data Load useEffect. currentUser:", !!currentUser, "Role:", currentUser?.role, "mosque:", !!realData.mosque?.id, "LoadingUser:", loadingUser);
    
    // Prevent running if auth is still loading or no mosque
    if (loadingUser || !realData.mosque || !realData.mosque.id) {
      console.log("[DataContext] ⏳ Waiting for auth or mosque data...");
      return;
    }

    // Only load if user changed or not yet loaded for this user
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
        // ✨ UPDATED: Gebruik nieuwe functie met Qor'aan stats
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
            // ✨ UPDATED: Gebruik nieuwe functie met Qor'aan stats
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

  // ✨ COMPLETE VALUE OBJECT met alle functies
  const value = {
    realData,
    loadData: refreshAllData,
    currentUser,
    // Bestaande functies
    fetchLessonsForClass,
    fetchAttendanceForLesson,
    saveAttendanceForLesson,
    fetchLessonDetailsForAttendance,
    createLesson,
    forceResetDataContext,
    // ✨ NIEUWE FUNCTIES:
    addStudentToClass,
    fetchQuranProgressForStudent,
    updateQuranProgress,
    fetchQuranStatsForChildren,
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