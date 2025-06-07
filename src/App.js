// src/App.js
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
// Admin Pages
import ClassesPage from './pages/ClassesPage';
import TeachersPage from './pages/TeachersPage';
import ParentsPage from './pages/ParentsPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
// Parent Pages
import MyChildrenPage from './pages/MyChildrenPage';
// Teacher Pages
import TeacherMyClassesPage from './pages/TeacherMyClassesPage';
import TeacherClassAttendancePage from './pages/TeacherClassAttendancePage';
import TeacherSingleClassPage from './pages/TeacherSingleClassPage';

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
  
  if (!authorized) {
    console.warn(`User ${currentUser.email} (role: ${currentUser.role}) tried to access a restricted route.`);
    const requiredRole = adminOnly ? 'admin' : (teacherOnly ? 'teacher' : (parentOnly ? 'parent' : 'unknown'));
    return <Navigate to="/dashboard" state={{ unauthorizedAttempt: true, requiredRole: requiredRole }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { currentUser, loadingUser, currentSubdomain } = useAuth();
  const location = useLocation();

  if (loadingUser && (!currentSubdomain || currentSubdomain === '' )) { 
    return <LoadingSpinner message="Applicatie initialiseren..." />;
  }

  if (currentSubdomain === 'register') {
    if (location.pathname !== '/register') {
        return <Navigate to="/register" state={location.state ? { from: location } : undefined} replace />;
    }
    return (
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="*" element={<Navigate to="/register" replace />} /> 
      </Routes>
    );
  }

  if (loadingUser) { 
      return <LoadingSpinner message="Gebruikerssessie controleren..." />;
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
        <Route path="/register" element={<Navigate to="/login" replace />} /> 

        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="admin" element={<ProtectedRoute adminOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="classes" element={<ClassesPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="parents" element={<ParentsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="teacher" element={<ProtectedRoute teacherOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="my-classes" element={<TeacherMyClassesPage />} />
            {/* 🆕 NIEUWE ROUTE VOOR INDIVIDUELE KLAS */}
            <Route path="my-classes/:classId" element={<TeacherSingleClassPage />} />
            <Route path="class/:classId/attendance" element={<TeacherClassAttendancePage />} />
            <Route index element={<Navigate to="my-classes" replace />} /> 
          </Route>

          <Route path="parent" element={<ProtectedRoute parentOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="my-children" element={<MyChildrenPage />} />
            <Route index element={<Navigate to="my-children" replace />} />
          </Route>
        </Route>

        <Route path="*" element={ currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace /> } />
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