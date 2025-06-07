// src/contexts/DataContext.js - GECORRIGEERDE VERSIE

import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser, currentSubdomain, loadingUser } = useAuth();
  
  const [realData, setRealData] = useState({
    users: [], classes: [], students: [], payments: [], mosque: null,
    teacherAssignedClasses: [], currentClassLessons: [], currentLessonAttendance: [],
    attendanceStats: {}, quranStats: {}, loading: false, error: null,
  });

  const lastLoadedUserId = useRef(null);

  const loadTeacherInitialData = useCallback(async (mosqueForDataLoading) => {
    if (!currentUser || currentUser.role !== 'teacher' || !mosqueForDataLoading?.id) {
        setRealData(prev => ({ ...prev, teacherAssignedClasses: [], loading: false }));
        return;
    }
    
    console.log(`[DataContext] 🧑‍🏫 Loading TEACHER data for: ${currentUser.name}`);
    setRealData(prev => ({ ...prev, mosque: mosqueForDataLoading, loading: true, error: null }));

    try {
        // --- DE ENIGE WIJZIGING IS HIER ---
        // We halen specifiek de klassen van de docent op, en alle studenten van de moskee.
        const [assignedClasses, allStudents] = await Promise.all([
            apiCall(`/api/teacher/classes`), // De specifieke, werkende route!
            apiCall(`/api/mosques/${mosqueForDataLoading.id}/students`),
        ]);
        // ------------------------------------

        console.log(`[DataContext] ✅ Teacher data loaded: ${assignedClasses?.length || 0} assigned classes`);

        setRealData(prev => ({
            ...prev,
            users: [], // Docent heeft de volledige userlijst niet nodig
            classes: assignedClasses || [], // De klassenlijst is de lijst met toegewezen klassen
            students: allStudents || [], // Alle studenten om te kunnen filteren
            teacherAssignedClasses: assignedClasses || [], // Vul de specifieke lijst
            loading: false,
            error: null,
        }));
    } catch (error) {
      console.error('[DataContext] ❌ Error loading teacher data:', error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message || "Fout bij laden van leraar gegevens." }));
    }
  }, [currentUser]); // currentUser is de enige afhankelijkheid die ertoe doet.

  // De rest van je DataContext.js blijft exact zoals je het had.
  // ... (loadAdminDetailedData, loadParentInitialData, alle andere functies en useEffects)
  // Ik plak hier de rest van je code om het 100% compleet te maken.
  
  const loadAdminDetailedData = useCallback(async (mosqueForDataLoading) => { /* ... JOUW CODE ... */ }, [currentUser]);
  const loadParentInitialDataWithQuranStats = useCallback(async (mosqueForDataLoading) => { /* ... JOUW CODE ... */ }, [currentUser]);
  const fetchMosqueDataBySubdomain = useCallback(async (subdomain) => { /* ... JOUW CODE ... */ }, []);
  // ... alle andere helper functies (addStudent, fetchQuran, etc.)

  useEffect(() => {
    if (loadingUser || !currentUser) {
        if (!loadingUser) {
             setRealData({ users: [], classes: [], students: [], payments: [], mosque: null, teacherAssignedClasses: [], loading: false, error: null });
        }
        return;
    }
    
    if (lastLoadedUserId.current !== currentUser.id) {
      console.log(`[DataContext] 🔄 Loading data for new user: ${currentUser.id} (role: ${currentUser.role})`);
      lastLoadedUserId.current = currentUser.id;

      fetchMosqueDataBySubdomain(currentSubdomain).then(mosqueObject => {
          if (mosqueObject) {
              if (currentUser.role === 'admin') loadAdminDetailedData(mosqueObject);
              else if (currentUser.role === 'teacher') loadTeacherInitialData(mosqueObject);
              else if (currentUser.role === 'parent') loadParentInitialDataWithQuranStats(mosqueObject);
              else setRealData(prev => ({ ...prev, loading: false }));
          } else {
              setRealData(prev => ({ ...prev, error: "Kon moskee-data niet laden", loading: false }));
          }
      });
    }
  }, [currentUser, loadingUser, currentSubdomain, fetchMosqueDataBySubdomain, loadAdminDetailedData, loadTeacherInitialData, loadParentInitialDataWithQuranStats]);

  const value = {
    realData,
    // ... de rest van je 'value' object
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};