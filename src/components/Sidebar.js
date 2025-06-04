import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { LayoutDashboard, BookOpen, Users, User as UserIcon, Building2, LogOut, DollarSign, Settings as SettingsIcon, ClipboardCheck } from 'lucide-react';
import appLogo from '../assets/logo-mijnlvs-64.png'; // <-- LOGO IMPORT HIER

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { realData } = useData();

  const handleLogoutClick = () => {
    logout();
  };

  if (!currentUser) {
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
    <div className="w-64 bg-white shadow-xl flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-emerald-500 rounded-lg mr-3">
            {/* Gebruik de geïmporteerde logo variabele */}
            <img src={appLogo} alt="MijnLVS Logo" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-md text-gray-800 truncate" title={mosqueName}>{mosqueName}</h1>
            <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            <LayoutDashboard className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
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
              <SettingsIcon className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Instellingen
            </NavLink>
          </>
        )}

        {currentUser.role === 'teacher' && (
          <>
            <NavLink to="/teacher/my-classes" className={getNavLinkClass}>
              <BookOpen className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-emerald-700" />
              Mijn Klassen
            </NavLink>
            {/* Voeg hier eventueel meer leraar-specifieke links toe */}
          </>
        )}
        {currentUser.role === 'parent' && (
             <NavLink to="/parent/my-children" className={getNavLinkClass}>
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

export default Sidebar;