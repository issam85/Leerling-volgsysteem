import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Building } from 'lucide-react';

const MainLayout = () => {
  const { realData, loadData } = useData();
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    console.warn("MainLayout: No currentUser, redirecting to login. This should have been caught by ProtectedRoute.");
    return <Navigate to="/login" replace />;
  }

  if (realData.loading || !realData.mosque) {
    if (realData.error && !realData.mosque) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <Building className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-red-700 mb-2">Fout bij laden Moskee</h2>
                <p className="text-gray-600 mb-6">{realData.error}</p>
                <div className="space-x-4">
                    <Button onClick={() => window.location.reload()} variant="primary">
                        Pagina Herladen
                    </Button>
                    <Button onClick={logout} variant="secondary">
                        Uitloggen
                    </Button>
                </div>
            </div>
        );
    }
    return <LoadingSpinner message="Gegevens laden..." />;
  }

  if (realData.error && realData.mosque) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <Building className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-red-700 mb-2">Fout bij laden van Applicatiegegevens</h2>
        <p className="text-gray-600 mb-6">{realData.error}</p>
        <div className="space-x-4">
            <Button onClick={() => loadData()} variant="primary">
                Opnieuw proberen
            </Button>
            <Button onClick={logout} variant="secondary">
                Uitloggen
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 md:p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;