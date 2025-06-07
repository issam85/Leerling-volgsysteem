// src/contexts/DataContext.js - VERNIEUWDE, LOGISCHE VERSIE

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser, loadingUser } = useAuth();
  
  const [realData, setRealData] = useState({
    users: [],
    classes: [],
    students: [],
    payments: [],
    mosque: null,
    teacherAssignedClasses: [], // Belangrijke state voor de docent
    loading: true, // Start true, we wachten op de user
    error: null,
  });

  const loadDataForUser = useCallback(async (user) => {
    setRealData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const mosqueId = user.mosque_id;
      
      // Stap 1: Haal ALTIJD de basisgegevens van de moskee op
      const mosqueData = await apiCall(`/api/mosque/${user.mosque.subdomain}`);
      
      // Stap 2: Haal data op basis van de rol van de gebruiker
      let users = [], classes = [], students = [], payments = [], teacherAssignedClasses = [];

      if (user.role === 'admin') {
        [users, classes, students, payments] = await Promise.all([
          apiCall(`/api/mosques/${mosqueId}/users`),
          apiCall(`/api/mosques/${mosqueId}/classes`),
          apiCall(`/api/mosques/${mosqueId}/students`),
          apiCall(`/api/mosques/${mosqueId}/payments`),
        ]);
      } else if (user.role === 'teacher') {
        // Voor een docent halen we zijn/haar specifieke klassen op, en ALLE leerlingen van de moskee.
        // De TeacherMyClassesPage kan dan zelf filteren welke leerlingen in de geselecteerde klas zitten.
        [teacherAssignedClasses, students] = await Promise.all([
          apiCall(`/api/teacher/classes`), // De specifieke, werkende route!
          apiCall(`/api/mosques/${mosqueId}/students`),
        ]);
        classes = teacherAssignedClasses; // Voor de leraar is de volledige klassenlijst zijn eigen lijst.
      } else if (user.role === 'parent') {
        // Logica voor ouders...
        [students, classes] = await Promise.all([
            apiCall(`/api/mosques/${mosqueId}/students`),
            apiCall(`/api/mosques/${mosqueId}/classes`),
        ]);
        // Filter alleen de eigen kinderen van de ouder
        students = students.filter(s => String(s.parent_id) === String(user.id));
      }

      setRealData({
        users: users || [],
        classes: classes || [],
        students: students || [],
        payments: payments || [],
        mosque: mosqueData || null,
        teacherAssignedClasses: teacherAssignedClasses || [],
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error("[DataContext] Fout bij laden van data:", error);
      setRealData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  // De ENIGE useEffect die de data laadt.
  useEffect(() => {
    // Als de auth-context nog laadt, doe niks.
    if (loadingUser) {
      return;
    }
    // Als er een gebruiker is, laad zijn/haar data.
    if (currentUser) {
      loadDataForUser(currentUser);
    } else {
      // Geen gebruiker, reset alles naar de beginstaat.
      setRealData({
        users: [], classes: [], students: [], payments: [], mosque: null,
        teacherAssignedClasses: [], loading: false, error: null,
      });
    }
  }, [currentUser, loadingUser, loadDataForUser]);


  const value = {
    realData,
    // Voeg hier eventuele andere functies toe die je nodig hebt, zoals refreshData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};