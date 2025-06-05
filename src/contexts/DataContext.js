// src/contexts/DataContext.js - COMPLETE VERSION met alle functies
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
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
    loading: true,
    error: null,
  });

  console.log("🔍 [DataContext] Render - currentUser:", !!currentUser, "loadingUser:", loadingUser, "subdomain:", currentSubdomain);

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
      let allClasses = realData.classes && realData.classes.length > 0 ? realData.classes : [];
      let allStudents = realData.students && realData.students.length > 0 ? realData.students : [];
      let allUsers = realData.users && realData.users.length > 0 ? realData.users : [];
      
      const dataToFetch = [];
      if (allClasses.length === 0) dataToFetch.push(apiCall(`/api/mosques/${mosqueForDataLoading.id}/classes`).then(res => ({ type: 'classes', data: res || [] })));
      if (allStudents.length === 0) dataToFetch.push(apiCall(`/api/mosques/${mosqueForDataLoading.id}/students`).then(res => ({ type: 'students', data: res || [] })));
      if (allUsers.length === 0) dataToFetch.push(apiCall(`/api/mosques/${mosqueForDataLoading.id}/users`).then(res => ({ type: 'users', data: res || [] })));

      if (dataToFetch.length > 0) {
          console.log(`[DataContext] loadTeacherInitialData: Fetching general mosque data (classes/students/users) as it's not in state.`);
          const results = await Promise.all(dataToFetch);
          results.forEach(result => {
              if (result.type === 'classes') allClasses = result.data;
              if (result.type === 'students') allStudents = result.data;
              if (result.type === 'users') allUsers = result.data;
          });
      }
      
      const assignedClasses = allClasses.filter(c => String(c.teacher_id) === String(currentUser.id) && c.active);
      console.log(`[DataContext] loadTeacherInitialData: Filtered ${assignedClasses.length} assigned classes for teacher ${currentUser.name}. Total classes in mosque: ${allClasses.length}`);

      setRealData(prev => ({
        ...prev,
        users: allUsers.length > 0 ? allUsers : prev.users,
        classes: allClasses.length > 0 ? allClasses : prev.classes,
        students: allStudents.length > 0 ? allStudents : prev.students,
        teacherAssignedClasses: assignedClasses,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[DataContext] loadTeacherInitialData: Error loading teacher data:', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van leraar gegevens." }));
    }
  }, [currentUser, realData.classes, realData.students, realData.users]);

  const fetchLessonsForClass = useCallback(async (classId, startDate, endDate) => {
    if (!currentUser || !realData.mosque?.id || !classId) return [];
    console.log(`[DataContext] fetchLessonsForClass: Fetching for class ${classId}, mosque ${realData.mosque.id}`);
    setRealData(prev => ({...prev, loading: true}));
    
    try {
      const lessons = await apiCall(`/api/mosques/${realData.mosque.id}/classes/${classId}/lessons?startDate=${startDate}&endDate=${endDate}`);
      setRealData(prev => ({ ...prev, currentClassLessons: lessons || [], loading: false }));
      return lessons || [];
    } catch (error) {
      console.error("[DataContext] Error fetching lessons:", error);
      setRealData(prev => ({ ...prev, currentClassLessons: [], error: error.message, loading: false }));
      return [];
    }
  }, [currentUser, realData.mosque?.id]);

  const fetchLessonDetailsForAttendance = useCallback(async (lessonId) => {
      if(!lessonId) return null;
      setRealData(prev => ({...prev, loading: true}));
      
      try {
          const lessonDetails = await apiCall(`/api/lessen/${lessonId}/details-for-attendance`);
          setRealData(prev => ({...prev, loading: false}));
          return lessonDetails;
      } catch (error) {
          console.error("[DataContext] Error fetching lesson details for attendance:", error);
          setRealData(prev => ({ ...prev, error: error.message, loading: false }));
          return null;
      }
  }, []);

  const fetchAttendanceForLesson = useCallback(async (lessonId) => {
    if (!lessonId) return [];
    setRealData(prev => ({...prev, loading: true}));
    
    try {
      const attendance = await apiCall(`/api/lessen/${lessonId}/absenties`);
      setRealData(prev => ({ ...prev, currentLessonAttendance: attendance || [], loading: false }));
      return attendance || [];
    } catch (error) {
      console.error("[DataContext] Error fetching attendance for lesson:", error);
       setRealData(prev => ({ ...prev, currentLessonAttendance: [], error: error.message, loading: false }));
      return [];
    }
  }, []);

  const saveAttendanceForLesson = useCallback(async (lessonId, attendancePayload) => {
    if (!lessonId || !attendancePayload || !currentUser?.id) return false;
    setRealData(prev => ({...prev, loading: true}));
    
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
        await fetchAttendanceForLesson(lessonId);
        return true;
      }
      throw new Error(result.error || "Opslaan van absenties mislukt.");
    } catch (error) {
      console.error("[DataContext] Error saving attendance:", error);
      setRealData(prev => ({...prev, error: error.message, loading: false}));
      return false;
    }
  }, [currentUser?.id, fetchAttendanceForLesson]);

  const createLesson = useCallback(async (mosqueId, classId, lessonData) => {
      if (!mosqueId || !classId || !lessonData) return null;
      setRealData(prev => ({...prev, loading: true}));
      
      try {
          const result = await apiCall(`/api/mosques/${mosqueId}/classes/${classId}/lessons`, {
              method: 'POST',
              body: JSON.stringify(lessonData)
          });
          
          if (result.success && result.data) {
              setRealData(prev => ({...prev, loading: false}));
              return result.data;
          }
          throw new Error(result.error || "Kon les niet aanmaken.");
      } catch (error) {
          console.error("[DataContext] Error creating lesson:", error);
          setRealData(prev => ({...prev, error: error.message, loading: false}));
          return null;
      }
  }, []);

  // Mosque fetch effect
  useEffect(() => {
    console.log("[DataContext] Mosque Fetch useEffect. LoadingUser:", loadingUser, "Subdomain:", currentSubdomain);
    
    if (loadingUser) {
      setRealData(prev => ({ ...prev, loading: true, error: null }));
      return;
    }
    
    if (currentSubdomain === 'register') {
      setRealData({ 
        users: [], classes: [], students: [], payments: [], mosque: null, 
        teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [], 
        loading: false, error: null 
      });
      return;
    }

    if (!realData.mosque || realData.mosque.subdomain !== currentSubdomain) {
      console.log(`[DataContext] Mosque data needs refresh for ${currentSubdomain}. Fetching...`);
      setRealData(prev => ({ ...prev, loading: true, error: null, mosque: null }));
      
      fetchMosqueDataBySubdomain(currentSubdomain)
        .then(mosqueObject => {
          if (mosqueObject) {
            setRealData(prev => ({ ...prev, mosque: mosqueObject, error: null }));
          } else {
            throw new Error(`Moskee voor subdomein '${currentSubdomain}' kon niet worden geladen.`);
          }
        })
        .catch(err => {
          console.error("[DataContext] Error in fetchMosqueDataBySubdomain promise chain:", err);
          setRealData(prev => ({ ...prev, mosque: null, loading: false, error: err.message }));
        });
    } else if (!currentUser && !loadingUser) {
        setRealData(prev => ({ ...prev, loading: false }));
    }
  }, [loadingUser, currentSubdomain, fetchMosqueDataBySubdomain, currentUser, realData.mosque]);

  // Role-based data loading effect
  useEffect(() => {
    console.log("[DataContext] Role-based Data Load useEffect. currentUser:", !!currentUser, "Role:", currentUser?.role, "realData.mosque:", !!realData.mosque?.id, "LoadingUser:", loadingUser);
    
    if (loadingUser || !realData.mosque || !realData.mosque.id) {
        if (realData.mosque && !currentUser && !loadingUser) {
             setRealData(prev => ({...prev, loading: false}));
        }
        return;
    }

    if (currentUser) {
        setRealData(prev => ({ ...prev, loading: true }));
        
        if (currentUser.role === 'admin') {
            console.log("[DataContext] User is ADMIN. Loading admin detailed data.");
            loadAdminDetailedData(realData.mosque);
        } else if (currentUser.role === 'teacher') {
            console.log("[DataContext] User is TEACHER. Loading teacher initial data.");
            loadTeacherInitialData(realData.mosque);
        } else if (currentUser.role === 'parent') {
            console.log("[DataContext] User is PARENT. Loading general data for parent view.");
            loadAdminDetailedData(realData.mosque);
        } else {
            console.warn("[DataContext] Unknown user role or no role, stopping data load.");
            setRealData(prev => ({ ...prev, loading: false }));
        }
    } else {
      console.log("[DataContext] No currentUser (e.g. after logout). Resetting non-mosque data.");
      setRealData(prev => ({
          ...prev,
          users: [], classes: [], students: [], payments: [],
          teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
          loading: false, error: null,
      }));
    }
  }, [currentUser, realData.mosque, loadingUser, loadAdminDetailedData, loadTeacherInitialData]);

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
            await loadAdminDetailedData(mosqueObject);
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
  }, [loadingUser, currentSubdomain, currentUser, fetchMosqueDataBySubdomain, loadAdminDetailedData, loadTeacherInitialData]);

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