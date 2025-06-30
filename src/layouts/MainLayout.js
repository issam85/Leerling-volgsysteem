import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Building } from 'lucide-react'; // Icoon voor foutmeldingen

const MainLayout = () => {
  const { realData, loadData } = useData();
  const { currentUser, logout } = useAuth();

  // ProtectedRoute in App.js handelt al af als currentUser null is.
  // Dit is een extra check.
  if (!currentUser) {
    console.warn("MainLayout: No currentUser, redirecting to login. This should have been caught by ProtectedRoute.");
    return <Navigate to="/login" replace />;
  }

  // Specifiek laadscherm als we nog wachten op moskee-data of andere data
  if (realData.loading || !realData.mosque) {
    // Als er een error is tijdens het laden van moskee, toon die
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
    // Algemeen laadscherm als er nog geen error is
    return <LoadingSpinner message="Gegevens laden..." />;
  }

  // Als er een algemene data error is (na het laden van moskee)
  if (realData.error && realData.mosque) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <Building className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-red-700 mb-2">Fout bij laden van Applicatiegegevens</h2>
        <p className="text-gray-600 mb-6">{realData.error}</p>
        <div className="space-x-4">
            <Button onClick={() => loadData()} variant="primary"> {/* loadData om specifieke data opnieuw te proberen */}
                Opnieuw proberen
            </Button>
            <Button onClick={logout} variant="secondary">
                Uitloggen
            </Button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // HIER ZIT DE CORRECTIE
  // We wrappen de Sidebar en main in een div met "md:flex"
  // en halen de overbodige padding van de main tag weg.
  // ==========================================================
  return (
    <div className="relative min-h-screen md:flex">
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