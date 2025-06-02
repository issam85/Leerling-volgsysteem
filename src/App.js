import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
// import MyClassPage from './pages/MyClassPage'; // Placeholder, nog niet volledig uitgewerkt
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { currentUser, loadingUser } = useAuth();
  const location = useLocation();

  if (loadingUser) {
    return <LoadingSpinner message="Gebruikerssessie laden..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />; // Of een "Unauthorized" pagina
  }

  return children;
};

const AppRoutes = () => {
  const { currentUser, loadingUser, currentSubdomain } = useAuth(); // Haal currentSubdomain hier

  // Eerst de loading state afhandelen voordat we beslissingen nemen
  if (loadingUser) {
    return <LoadingSpinner message="Applicatie laden..." />;
  }

  // Subdomain-gebaseerde "routing" voor registratie
  // Dit zou idealiter ook via echte subdomein DNS-routing gaan
  if (currentSubdomain === 'register' && window.location.pathname !== '/register') {
      return <Navigate to="/register" replace />;
  }
  if (currentSubdomain === 'register' && window.location.pathname === '/register') {
    return (
        <Routes>
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
    );
  }


  // Routes voor ingelogde gebruikers of login pagina
  return (
    <DataProvider> {/* DataProvider alleen nodig voor de beschermde routes */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} /> {/* Voor directe navigatie, hoewel al afgevangen */}

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} /> {/* Default naar dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Hier kun je meer specifieke role checks toevoegen indien nodig */}
        </Route>

        {/* Admin specifieke routes */}
        <Route element={<ProtectedRoute adminOnly={true}><MainLayout /></ProtectedRoute>}>
          <Route path="/admin/classes" element={<ClassesPage />} />
          <Route path="/admin/teachers" element={<TeachersPage />} />
          <Route path="/admin/parents" element={<ParentsPage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>

        {/* Teacher specifieke routes (Nog verder uit te werken) */}
        {/* <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            {currentUser?.role === 'teacher' && (
                <Route path="/teacher/my-class" element={<MyClassPage />} />
            )}
        </Route> */}

        {/* Fallback: als ingelogd en geen match, naar dashboard. Anders naar login. */}
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
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