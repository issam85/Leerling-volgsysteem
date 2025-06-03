// src/App.js
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'; // Outlet toegevoegd
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import TeachersPage from './pages/TeachersPage';
import ParentsPage from './pages/ParentsPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import MyChildrenPage from './pages/MyChildrenPage'; // NIEUW
// import MyClassPage from './pages/MyClassPage'; // Voor leraren (nog niet volledig geïmplementeerd)
import LoadingSpinner from './components/LoadingSpinner';

// Helper component om routes te beschermen
const ProtectedRoute = ({ children, adminOnly = false, teacherOnly = false, parentOnly = false }) => {
  const { currentUser, loadingUser } = useAuth();
  const location = useLocation();

  if (loadingUser) {
    return <LoadingSpinner message="Sessie valideren..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let authorized = true;
  if (adminOnly && currentUser.role !== 'admin') authorized = false;
  if (teacherOnly && currentUser.role !== 'teacher') authorized = false;
  if (parentOnly && currentUser.role !== 'parent') authorized = false;
  // Je kunt hier ook combineren, bijv. admin OR teacher

  if (!authorized) {
    // Stuur naar dashboard als niet geautoriseerd voor specifieke rol-route
    // De DashboardPage zelf kan dan een "Geen toegang" melding tonen als nodig,
    // of de gebruiker ziet daar de content voor zijn/haar eigen rol.
    console.warn(`User ${currentUser.email} (role: ${currentUser.role}) tried to access a restricted route.`);
    return <Navigate to="/dashboard" state={{ unauthorizedAttempt: true, requiredRole: adminOnly ? 'admin' : (teacherOnly ? 'teacher' : (parentOnly ? 'parent' : 'unknown')) }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { currentUser, loadingUser, currentSubdomain } = useAuth();
  const location = useLocation();

  if (loadingUser && !currentUser) {
    return <LoadingSpinner message="Applicatie initialiseren..." />;
  }

  if (currentSubdomain === 'register') {
    return (
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    );
  }

  return (
    <DataProvider>
      {location.state?.unauthorizedAttempt && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-[200] animate-pulse" role="alert">
              <strong className="font-bold">Geen Toegang! </strong>
              <span className="block sm:inline">U heeft geen rechten ({location.state.requiredRole} vereist) voor de vorige pagina.</span>
          </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} /> {/* Als men toch hier komt */}

        {/* Routes die MainLayout gebruiken en een ingelogde gebruiker vereisen */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Admin specifieke sub-routes onder /admin/ */}
          <Route path="admin" element={<ProtectedRoute adminOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="classes" element={<ClassesPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="parents" element={<ParentsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
             {/* Eventueel een index route voor /admin als je een admin-specifiek overzicht wilt */}
            <Route index element={<Navigate to="/dashboard" replace />} /> {/* Of naar een admin overzicht */}
          </Route>

          {/* Leraar specifieke sub-routes onder /teacher/ */}
          {/* <Route path="teacher" element={<ProtectedRoute teacherOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="my-class" element={<MyClassPage />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route> */}

          {/* Ouder specifieke sub-routes onder /parent/ */}
          <Route path="parent" element={<ProtectedRoute parentOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="my-children" element={<MyChildrenPage />} /> {/* NIEUWE ROUTE */}
            {/* Voeg hier meer ouder-specifieke routes toe, bijv. betalingsoverzicht */}
            {/* <Route path="payments" element={<ParentPaymentsPage />} /> */}
            <Route index element={<Navigate to="/dashboard" replace />} /> {/* Standaard voor /parent naar dashboard */}
          </Route>

        </Route>

        {/* Fallback voor alle andere paden */}
        <Route path="*" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </DataProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;