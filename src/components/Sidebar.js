import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { BookOpen, Users, User as UserIcon, Building2, LogOut, DollarSign, Settings as SettingsIcon } from 'lucide-react'; // SettingsIcon toegevoegd

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { realData } = useData();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout(); // AuthContext handelt navigatie naar /login af
  };

  // currentUser check is belangrijk, anders crasht het als het kort null is
  if (!currentUser) {
      // Kan een minimalistische sidebar tonen of null
      return null;
  }

  const getNavLinkClass = ({ isActive }) =>
    `w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 group ${
      isActive
        ? 'bg-emerald-600 text-white shadow-md'
        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
    }`;

  const mosqueName = realData.mosque?.name || "Leerling Volgsysteem";

  return (
    <div className="w-64 bg-white shadow-xl flex flex-col h-screen fixed left-0 top-0 z-30"> {/* fixed voor echte sidebar */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-emerald-500 rounded-lg mr-3">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-md text-gray-800 truncate" title={mosqueName}>{mosqueName}</h1>
            <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            <BookOpen className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
            Dashboard
          </NavLink>

        {currentUser.role === 'admin' && (
          <>
            <NavLink to="/admin/classes" className={getNavLinkClass}>
              <BookOpen className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Klassen
            </NavLink>
            <NavLink to="/admin/teachers" className={getNavLinkClass}>
              <UserIcon className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Leraren
            </NavLink>
            <NavLink to="/admin/parents" className={getNavLinkClass}>
              <Users className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Ouders
            </NavLink>
            <NavLink to="/admin/students" className={getNavLinkClass}>
              <Users className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Leerlingen
            </NavLink>
            <NavLink to="/admin/payments" className={getNavLinkClass}>
              <DollarSign className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Betalingen
            </NavLink>
            <NavLink to="/admin/settings" className={getNavLinkClass}>
              <SettingsIcon className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" /> {/* SettingsIcon */}
              Instellingen
            </NavLink>
          </>
        )}

        {currentUser.role === 'teacher' && (
          <NavLink to="/teacher/my-class" className={getNavLinkClass}> {/* TODO: Maak deze route en pagina */}
            <Users className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
            Mijn Klas
          </NavLink>
        )}
        {currentUser.role === 'parent' && (
             <NavLink to="/parent/overview" className={getNavLinkClass}> {/* TODO: Maak deze route en pagina */}
                <Users className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
                Mijn Kinderen
            </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-150 group"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-red-600" />
          Uitloggen
        </button>
      </div>
    </div>
  );
};
// Belangrijk: Omdat de sidebar nu `fixed` is, moet de `MainLayout` een `padding-left` krijgen
// die gelijk is aan de breedte van de sidebar (w-64 -> pl-64).
// In MainLayout.js, in de <main> tag:
// <main className="flex-1 overflow-x-hidden overflow-y-auto pl-64">
// En de Sidebar zelf hoeft niet meer in de flex-container van MainLayout.

export default Sidebar;