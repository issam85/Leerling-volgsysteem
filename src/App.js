// src/App.js
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ErrorBoundary';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; // ✅ NIEUWE IMPORT
import DashboardPage from './pages/DashboardPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NetworkStatus from './components/NetworkStatus';

// Admin Pages
import ClassesPage from './pages/ClassesPage';
import TeachersPage from './pages/TeachersPage';
import ParentsPage from './pages/ParentsPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';

// Parent Pages
import MyChildrenPage from './pages/MyChildrenPage';
import ChildDetailPage from './pages/ChildDetailPage';

// Teacher Pages
import TeacherMyClassesPage from './pages/TeacherMyClassesPage';
import TeacherClassAttendancePage from './pages/TeacherClassAttendancePage';

import LoadingSpinner from './components/LoadingSpinner';

// Helper component om routes te beschermen (jouw bestaande, goede code)
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

// ✅ AANGEPASTE AppRoutes component met ResetPasswordPage
const AppRoutes = () => {
  const { currentUser, loadingUser, currentSubdomain } = useAuth();
  const location = useLocation();

  const hostname = window.location.hostname;
  const isMainDomain = hostname === 'mijnlvs.nl' || hostname === 'www.mijnlvs.nl';
  
  // Scenario 1: Bezoeker is op het hoofddomein (mijnlvs.nl of www.mijnlvs.nl)
  if (isMainDomain) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        {/* ✅ NIEUWE ROUTE: Password reset ook op hoofddomein */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Vang alle andere paden af en stuur ze naar de hoofdpagina */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Toon een algemene laadindicator zolang AuthContext nog bezig is met initialiseren
  // en er nog geen subdomein is vastgesteld of als het nog niet duidelijk is of er een user is.
  // Deze check is cruciaal om te wachten tot currentSubdomain een betrouwbare waarde heeft.
  if (loadingUser && (!currentSubdomain || currentSubdomain === '' )) { 
    return <LoadingSpinner message="Applicatie initialiseren..." />;
  }

  // Scenario 2: Bezoeker is op register.mijnlvs.nl
  if (currentSubdomain === 'register') {
    // Als we op het register subdomein zijn, maar nog niet op /register pad, redirect.
    // Dit gebeurt nadat loadingUser false is, dus currentSubdomain is betrouwbaar.
    if (location.pathname !== '/register' && location.pathname !== '/reset-password') {
        // Zorg dat de state meegaat als die er was, anders geen state
        return <Navigate to="/register" state={location.state ? { from: location } : undefined} replace />;
    }
    // Render alleen de registratie en reset routes
    return (
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        {/* ✅ NIEUWE ROUTE: Password reset ook op register subdomein */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/register" replace />} /> 
      </Routes>
    );
  }

  // Scenario 3: Bezoeker is op een klant subdomein (test.mijnlvs.nl, al-hijra.mijnlvs.nl, etc.)
  // Vanaf hier zijn we NIET op het 'register' subdomein of hoofddomein.
  // Als AuthContext nog aan het laden is voor een niet-register subdomein (bijv. sessie checken), toon spinner.
  if (loadingUser) { 
      return <LoadingSpinner message="Gebruikerssessie controleren..." />;
  }

  // Als we hier komen, is loadingUser false, en zijn we op een klant subdomein.
  // Alle volgende routes vereisen DataProvider.
  return (
    <DataProvider>
      {/* Deze code is nu BINNEN de DataProvider */}
      {location.state?.unauthorizedAttempt && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-[200]">
              <strong className="font-bold">Geen Toegang! </strong>
              <span className="block sm:inline">U heeft geen rechten ({location.state.requiredRole} vereist) voor de vorige pagina.</span>
          </div>
      )}
      
      {/* Network Status Indicator */}
      <NetworkStatus />
      
      {/* PWA Install Prompt - only show for authenticated users */}
      {currentUser && <PWAInstallPrompt />}
      
      <Routes>
        {/* ✅ NIEUWE ROUTE: Password reset op alle klant subdomeinen */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* LoginPage heeft nu toegang tot de data uit DataProvider */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* De beveiligde routes blijven zoals ze waren */}
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
            {/* De nieuwe dynamische route voor het klassen-dashboard */}
            <Route path="my-classes/:classId" element={<TeacherMyClassesPage />} />
            <Route path="class/:classId/attendance" element={<TeacherClassAttendancePage />} />
            {/* De index route stuurt nu naar een placeholder of de eerste klas (logica in sidebar) */}
            <Route index element={<Navigate to="/dashboard" replace />} /> 
          </Route>

          <Route path="parent" element={<ProtectedRoute parentOnly={true}><Outlet /></ProtectedRoute>}>
            <Route path="my-children" element={<MyChildrenPage />} />
            <Route path="my-children/:studentId" element={<ChildDetailPage />} />
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
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;