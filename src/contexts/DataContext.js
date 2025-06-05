// src/contexts/DataContext.js - VOLLEDIGE VERSIE met syntax fix
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
    loading: false, // Start false to prevent initial loops
    error: null,
  });

  // Refs to prevent infinite loops
  const isDataInitialized = useRef(false);
  const lastLoadedSubdomain = useRef(null);
  const lastLoadedUserId = useRef(null);
  const loadingTimeoutRef = useRef(null);

  console.log("🔍 [DataContext] Render - currentUser:", !!currentUser, "loadingUser:", loadingUser, "subdomain:", currentSubdomain);

  // Emergency loading timeout - force stop loading after 15 seconds
  useEffect(() => {
    if (realData.loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("[DataContext] EMERGENCY TIMEOUT: Forcing loading to stop after 15 seconds");
        setRealData(prev => ({ ...prev, loading: false, error: "Data loading timeout - probeer opnieuw" }));
      }, 15000);
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
    
    console.log(`[DataContext] loadAdminDetailedData: Loading for mosque ID: ${mosqueForDataLoading.id}`);
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
      console.error('[DataContext] loadAdminDetailedData: Error loading detailed data:', error);
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
    
    console.log(`[DataContext] loadTeacherInitialData: Loading data for teacher ID: ${currentUser.id}, Mosque: ${mosqueForDataLoading.name}`);
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
      console.log(`[DataContext] loadTeacherInitialData: Filtered ${assignedClasses.length} assigned classes for teacher ${currentUser.name}. Total classes in mosque: ${allClasses.length}`);

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
      console.error('[DataContext] loadTeacherInitialData: Error loading teacher data:', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van leraar gegevens." }));
    }
  }, [currentUser]);

  const loadParentInitialData = useCallback(async (mosqueForDataLoading) => {
  if (!currentUser || currentUser.role !== 'parent' || !mosqueForDataLoading || !mosqueForDataLoading.id) {
    console.log("[DataContext] loadParentInitialData: Pre-conditions not met for parent. Skipping.");
    setRealData(prev => ({ ...prev, loading: false }));
    return;
  }
  
  console.log(`[DataContext] loadParentInitialData: Loading data for parent ID: ${currentUser.id}`);
  setRealData(prev => ({ ...prev, mosque: mosqueForDataLoading, loading: true, error: null }));

  try {
    // Voor ouders laden we students, classes, users EN absentie statistieken
    const [studentsRes, classesRes, usersRes] = await Promise.all([
      apiCall(`/api/mosques/${mosqueForDataLoading.id}/students`),
      apiCall(`/api/mosques/${mosqueForDataLoading.id}/classes`),
      apiCall(`/api/mosques/${mosqueForDataLoading.id}/users`)
    ]);
    
    const allStudents = studentsRes || [];
    const allClasses = classesRes || [];
    const allUsers = usersRes || [];
    
    // Filter alleen hun eigen kinderen
    const parentChildren = allStudents.filter(s => String(s.parent_id) === String(currentUser.id));
    console.log(`[DataContext] loadParentInitialData: Found ${parentChildren.length} children for parent ${currentUser.name}`);

    // Haal absentie statistieken op voor elk kind
    let attendanceStats = {};
    if (parentChildren.length > 0) {
      try {
        const childIds = parentChildren.map(child => child.id);
        const statsRes = await apiCall(`/api/mosques/${mosqueForDataLoading.id}/students/attendance-stats`, {
          method: 'POST',
          body: JSON.stringify({ student_ids: childIds })
        });
        attendanceStats = statsRes || {};
        console.log(`[DataContext] loadParentInitialData: Loaded attendance stats for ${Object.keys(attendanceStats).length} children`);
      } catch (error) {
        console.error('[DataContext] Error loading attendance stats:', error);
        // Niet fataal - ga door zonder statistieken
      }
    }

    setRealData(prev => ({
      ...prev,
      students: parentChildren, // Alleen hun kinderen
      payments: [], // Leeg voor nu - kan later apart geladen worden
      users: allUsers, // Alle users (zodat leraarsnamen getoond kunnen worden)
      classes: allClasses, // Alle klassen (zodat klasnamen getoond kunnen worden)
      attendanceStats: attendanceStats, // Absentie statistieken per kind
      teacherAssignedClasses: [],
      loading: false,
      error: null,
    }));
  } catch (error) {
    console.error('[DataContext] loadParentInitialData: Error loading parent data:', error);
    setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van ouder gegevens." }));
  }
}, [currentUser]);

// En update je initialState om attendanceStats toe te voegen:
const [realData, setRealData] = useState({
  users: [],
  classes: [],
  students: [],
  payments: [],
  mosque: null,
  teacherAssignedClasses: [],
  currentClassLessons: [],
  currentLessonAttendance: [],
  attendanceStats: {}, // NIEUW: absentie statistieken per leerling
  loading: false,
  error: null,
});

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
  }, [currentUser, realData.mosque?.id]); // Removed loading state changes

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
  }, []); // No dependencies to prevent loops

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
  }, []); // No dependencies to prevent loops

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
    console.log("[DataContext] Mosque Fetch useEffect. LoadingUser:", loadingUser, "Subdomain:", currentSubdomain);
    
    // Prevent running if auth is still loading
    if (loadingUser) {
      return;
    }
    
    // Handle register subdomain
    if (currentSubdomain === 'register') {
      setRealData({ 
        users: [], classes: [], students: [], payments: [], mosque: null, 
        teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [], 
        loading: false, error: null 
      });
      lastLoadedSubdomain.current = currentSubdomain;
      return;
    }

    // Only fetch if subdomain changed and we don't have data for this subdomain
    if (lastLoadedSubdomain.current !== currentSubdomain || !realData.mosque || realData.mosque.subdomain !== currentSubdomain) {
      console.log(`[DataContext] Mosque data needs refresh for ${currentSubdomain}. Fetching...`);
      setRealData(prev => ({ ...prev, loading: true, error: null, mosque: null }));
      lastLoadedSubdomain.current = currentSubdomain;
      
      fetchMosqueDataBySubdomain(currentSubdomain)
        .then(mosqueObject => {
          if (mosqueObject) {
            setRealData(prev => ({ ...prev, mosque: mosqueObject, loading: false, error: null }));
          } else {
            throw new Error(`Moskee voor subdomein '${currentSubdomain}' kon niet worden geladen.`);
          }
        })
        .catch(err => {
          console.error("[DataContext] Error in fetchMosqueDataBySubdomain promise chain:", err);
          setRealData(prev => ({ ...prev, mosque: null, loading: false, error: err.message }));
        });
    }
  }, [loadingUser, currentSubdomain, fetchMosqueDataBySubdomain]);

  // Role-based data loading effect - with loop prevention
  useEffect(() => {
    console.log("[DataContext] Role-based Data Load useEffect. currentUser:", !!currentUser, "Role:", currentUser?.role, "mosque:", !!realData.mosque?.id, "LoadingUser:", loadingUser);
    
    // Prevent running if auth is still loading or no mosque
    if (loadingUser || !realData.mosque || !realData.mosque.id) {
      return;
    }

    // Only load if user changed or not yet loaded for this user
    if (currentUser && lastLoadedUserId.current !== currentUser.id) {
      console.log(`[DataContext] Loading data for new user: ${currentUser.id} (role: ${currentUser.role})`);
      setRealData(prev => ({ ...prev, loading: true }));
      lastLoadedUserId.current = currentUser.id;
      
      if (currentUser.role === 'admin') {
        console.log("[DataContext] User is ADMIN. Loading admin detailed data.");
        loadAdminDetailedData(realData.mosque);
      } else if (currentUser.role === 'teacher') {
        console.log("[DataContext] User is TEACHER. Loading teacher initial data.");
        loadTeacherInitialData(realData.mosque);
      } else if (currentUser.role === 'parent') {
        console.log("[DataContext] User is PARENT. Loading MINIMAL parent data.");
        // Extra timeout for parent loading to prevent race conditions
        setTimeout(() => {
          loadParentInitialData(realData.mosque);
        }, 100);
      } else {
        console.warn("[DataContext] Unknown user role or no role, stopping data load.");
        setRealData(prev => ({ ...prev, loading: false }));
      }
    } else if (!currentUser && lastLoadedUserId.current !== null) {
      console.log("[DataContext] No currentUser (logout detected). Resetting data.");
      lastLoadedUserId.current = null;
      setRealData({
        users: [], classes: [], students: [], payments: [], mosque: null,
        teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
        loading: false, error: null,
      });
    }
  }, [currentUser, realData.mosque?.id, loadingUser, loadAdminDetailedData, loadTeacherInitialData, loadParentInitialData]);

  const refreshAllData = useCallback(async () => {
    console.log("[DataContext] RefreshAllData called.");
    if (loadingUser || !currentSubdomain || currentSubdomain === 'register') {
      console.log("[DataContext] RefreshAllData: Cannot refresh, auth loading, no subdomain or on register page.");
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
            await loadParentInitialData(mosqueObject);
          } else {
             setRealData(prev => ({ ...prev, loading: false }));
          }
        } else {
           setRealData(prev => ({ 
             ...prev, 
             mosque: mosqueObject,
             users: [], classes: [], students: [], payments: [],
             teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
             loading: false 
            }));
        }
      } else {
        throw new Error("Kon moskeegegevens niet opnieuw laden voor volledige refresh.");
      }
    } catch (error) {
      console.error("[DataContext] Error during refreshAllData:", error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, [loadingUser, currentSubdomain, currentUser, fetchMosqueDataBySubdomain, loadAdminDetailedData, loadTeacherInitialData, loadParentInitialData]);

  const value = {
    realData,
    loadData: refreshAllData,
    currentUser,
    fetchLessonsForClass,
    fetchAttendanceForLesson,
    saveAttendanceForLesson,
    fetchLessonDetailsForAttendance,
    createLesson,
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