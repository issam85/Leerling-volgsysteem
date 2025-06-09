// src/components/Sidebar.js - VERNIEUWD met dynamisch ouder-submenu
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext'; // We hebben data nodig voor de kinderen
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UserCheck, 
  Baby, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  Circle
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { realData } = useData(); // Haal de data op
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // NIEUWE STATE voor het uitklappen van het kindermenu
  const [isChildrenMenuOpen, setIsChildrenMenuOpen] = useState(true); // Standaard open

  // Auto-open het kindermenu als we op een kind-specifieke pagina zijn
  useEffect(() => {
    if (location.pathname.includes('/parent/my-children/') && !isChildrenMenuOpen) {
      setIsChildrenMenuOpen(true);
    }
  }, [location.pathname, isChildrenMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!currentUser) return null;

  // Haal de kinderen van de ouder op uit de DataContext
  const myChildren = (currentUser.role === 'parent' && realData?.students)
    ? realData.students.filter(student => String(student.parent_id) === String(currentUser.id))
    : [];

  // Navigation items per role (voor admin en teacher)
  const getNavigationItems = () => {
    const baseItems = [
      { 
        to: '/dashboard', 
        icon: LayoutDashboard, 
        label: 'Dashboard' 
      }
    ];

    if (currentUser.role === 'admin') {
      return [
        ...baseItems,
        { 
          to: '/admin/classes', 
          icon: GraduationCap, 
          label: 'Klassen' 
        },
        { 
          to: '/admin/teachers', 
          icon: UserCheck, 
          label: 'Leraren' 
        },
        { 
          to: '/admin/parents', 
          icon: Users, 
          label: 'Ouders' 
        },
        { 
          to: '/admin/students', 
          icon: Baby, 
          label: 'Leerlingen' 
        },
        { 
          to: '/admin/payments', 
          icon: CreditCard, 
          label: 'Betalingen' 
        },
        { 
          to: '/admin/settings', 
          icon: Settings, 
          label: 'Instellingen' 
        }
      ];
    }

    if (currentUser.role === 'teacher') {
      return [
        ...baseItems,
        { 
          to: '/teacher/my-classes', 
          icon: GraduationCap, 
          label: 'Mijn Klassen' 
        }
      ];
    }

    return baseItems;
  };

  // Render parent navigation (speciale behandeling voor ouders)
  const renderParentNavigation = () => {
    return (
      <>
        {/* Dashboard Link */}
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
            isActive
              ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title={isCollapsed ? 'Dashboard' : ''}
        >
          <LayoutDashboard 
            className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
            size={20} 
          />
          {!isCollapsed && 'Dashboard'}
        </NavLink>
        
        {/* Mijn Kinderen - Uitklapbare sectie */}
        <div className="space-y-1">
          {/* Hoofdknop voor Mijn Kinderen */}
          <button
            onClick={() => setIsChildrenMenuOpen(!isChildrenMenuOpen)}
            className={`flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
              location.pathname.startsWith('/parent/my-children')
                ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={isCollapsed ? 'Mijn Kinderen' : ''}
          >
            <div className="flex items-center">
              <Baby 
                className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
                size={20} 
              />
              {!isCollapsed && 'Mijn Kinderen'}
            </div>
            {!isCollapsed && (
              <span className="ml-2">
                {isChildrenMenuOpen ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </span>
            )}
          </button>
          
          {/* Het uitklapbare submenu voor individuele kinderen */}
          {!isCollapsed && isChildrenMenuOpen && (
            <div className="ml-6 space-y-1">
              {/* Link naar overzichtspagina */}
              <NavLink
                to="/parent/my-children"
                end // Belangrijk: exact match voor deze route
                className={({ isActive }) => `flex items-center w-full px-2 py-1.5 text-xs font-medium rounded-md transition-colors group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Circle size={6} className="mr-3 text-emerald-400 flex-shrink-0" />
                Overzicht
              </NavLink>
              
              {/* Individuele kinderen */}
              {myChildren.length > 0 ? (
                myChildren.map(child => (
                  <NavLink
                    key={child.id}
                    to={`/parent/my-children/${child.id}`}
                    className={({ isActive }) => `flex items-center w-full px-2 py-1.5 text-xs font-medium rounded-md transition-colors group ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <Circle size={6} className="mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{child.name}</span>
                    {child.active === false && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded">
                        !
                      </span>
                    )}
                  </NavLink>
                ))
              ) : (
                <div className="flex items-center w-full px-2 py-1.5 text-xs text-gray-400 italic">
                  <Circle size={6} className="mr-3 text-gray-300 flex-shrink-0" />
                  Geen kinderen gevonden
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  // Render standard navigation items (voor admin en teacher)
  const renderStandardNavigation = () => {
    const navigationItems = getNavigationItems();
    
    return navigationItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
          isActive
            ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        title={isCollapsed ? item.label : ''}
      >
        <item.icon 
          className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
          size={20} 
        />
        {!isCollapsed && (
          <div className="flex-1">
            <div>{item.label}</div>
            {item.description && (
              <div className="text-xs text-gray-500 group-hover:text-gray-600">
                {item.description}
              </div>
            )}
          </div>
        )}
      </NavLink>
    ));
  };

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen`}>
      {/* Header */}
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
            className="p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - Dynamisch gerendered op basis van rol */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {currentUser.role === 'parent' 
            ? renderParentNavigation() 
            : renderStandardNavigation()
          }
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          title={isCollapsed ? 'Uitloggen' : ''}
        >
          <LogOut 
            className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
            size={20} 
          />
          {!isCollapsed && 'Uitloggen'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;