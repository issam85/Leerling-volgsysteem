// src/components/Sidebar.js - VOLLEDIGE EN DEFINITIEVE VERSIE

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/api'; 
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UserCheck, 
  Baby, 
  CreditCard, 
  Settings, 
  LogOut,
  BookMarked,
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State voor het klassenmenu van de docent
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [isClassesMenuOpen, setIsClassesMenuOpen] = useState(false);

  // Effect om de klassen van de docent op te halen
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      // Draai deze code alleen als de gebruiker een docent is
      if (currentUser?.role === 'teacher') {
        try {
          // Haal de klassen op van de backend.
          // LET OP: Pas de URL '/api/teacher/classes' eventueel aan als je backend een ander endpoint gebruikt.
          const response = await apiCall('/api/teacher/classes');
          
          // Robuuste check om de .map() error te voorkomen
          if (Array.isArray(response)) {
            setTeacherClasses(response);
          } else if (response && Array.isArray(response.classes)) { // Veelvoorkomend patroon: { classes: [...] }
            setTeacherClasses(response.classes);
          } else {
            console.warn("API voor klassen gaf geen array terug:", response);
            setTeacherClasses([]); // Zet naar lege array om crashes te voorkomen
          }
        } catch (error) {
          console.error('Fout bij het ophalen van de docentklassen:', error);
          setTeacherClasses([]); // Zet altijd naar een lege array bij een fout
        }
      }
    };
    fetchTeacherClasses();
  }, [currentUser]); // Draai opnieuw als de gebruiker verandert

  // Effect om het menu open te houden als we op een klassenpagina zijn
  useEffect(() => {
    if (location.pathname.startsWith('/teacher/my-classes')) {
      setIsClassesMenuOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!currentUser) return null;

  // Navigatie-items per rol (jouw bestaande, goede logica)
  const getNavigationItems = () => {
    const baseItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
    ];

    if (currentUser.role === 'admin') {
      return [
        ...baseItems,
        { to: '/admin/classes', icon: GraduationCap, label: 'Klassen' },
        { to: '/admin/teachers', icon: UserCheck, label: 'Leraren' },
        { to: '/admin/parents', icon: Users, label: 'Ouders' },
        { to: '/admin/students', icon: Baby, label: 'Leerlingen' },
        { to: '/admin/payments', icon: CreditCard, label: 'Betalingen' },
        { to: '/admin/settings', icon: Settings, label: 'Instellingen' }
      ];
    }

    if (currentUser.role === 'teacher') {
      return [
        ...baseItems,
        { to: '/teacher/my-classes', icon: GraduationCap, label: 'Mijn Klassen' }
      ];
    }

    if (currentUser.role === 'parent') {
      return [
        ...baseItems,
        { to: '/parent/my-children', icon: Baby, label: 'Mijn Kinderen' },
        { to: '/parent/attendance', icon: Calendar, label: 'Absenties', description: 'Aanwezigheid overzicht' },
        { to: '/parent/quran-progress', icon: BookMarked, label: 'Qor\'aan Voortgang', description: 'Memorisatie overzicht' }
      ];
    }
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // CSS classes voor de links
  const baseLinkClasses = 'flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group';
  const activeLinkClasses = 'bg-emerald-100 text-emerald-700';
  const inactiveLinkClasses = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-emerald-700">MijnLVS</h2>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {navigationItems.map((item) => {
            
            // Speciale logica voor het docentenmenu "Mijn Klassen"
            if (item.label === 'Mijn Klassen' && currentUser.role === 'teacher') {
              const isMenuActive = location.pathname.startsWith('/teacher/my-classes');
              return (
                <div key="teacher-classes-menu">
                  <button
                    onClick={() => setIsClassesMenuOpen(!isClassesMenuOpen)}
                    className={`${baseLinkClasses} w-full text-left ${isMenuActive ? 'text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <item.icon className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} size={20} />
                    {!isCollapsed && <span className="flex-1">{item.label}</span>}
                    {!isCollapsed && (isClassesMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                  </button>
                  {isClassesMenuOpen && !isCollapsed && (
                    <div className="mt-1 pl-7 space-y-1">
                      {Array.isArray(teacherClasses) && teacherClasses.length > 0 ? teacherClasses.map(cls => (
                        <NavLink
                          key={cls.id}
                          to={`/teacher/my-classes/${cls.id}`}
                          className={({ isActive }) => `${baseLinkClasses} py-1.5 ${isActive ? activeLinkClasses + ' font-semibold' : inactiveLinkClasses}`}
                        >
                          {cls.name}
                        </NavLink>
                      )) : (
                        <p className="px-2 py-1.5 text-xs text-gray-400">Geen klassen</p>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Standaard render voor alle andere items
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses + ' border-r-2 border-emerald-600' : inactiveLinkClasses}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} size={20} />
                {!isCollapsed && (
                  <div className="flex-1">
                    <div>{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 group-hover:text-gray-600">{item.description}</div>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-2">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title={isCollapsed ? 'Uitloggen' : ''}
        >
          <LogOut className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} size={20} />
          {!isCollapsed && 'Uitloggen'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;