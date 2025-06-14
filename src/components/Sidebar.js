// src/components/Sidebar.js - AANGEPAST VOOR LERAAR ACCORDION
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
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
  const { realData } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChildrenMenuOpen, setIsChildrenMenuOpen] = useState(true);
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(true);

  const isParentSectionActive = location.pathname.startsWith('/parent/my-children');
  const isTeacherSectionActive = location.pathname.startsWith('/teacher/my-classes');

  useEffect(() => {
    if (isParentSectionActive) {
      setIsChildrenMenuOpen(true);
    }
    if (isTeacherSectionActive) {
      setIsTeacherMenuOpen(true);
    }
  }, [isParentSectionActive, isTeacherSectionActive]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!currentUser) return null;

  // Data voor verschillende rollen
  const myChildren = (currentUser.role === 'parent' && realData?.students)
    ? realData.students.filter(student => String(student.parent_id) === String(currentUser.id))
    : [];
    
  const myClasses = (currentUser.role === 'teacher' && realData?.teacherAssignedClasses)
    ? realData.teacherAssignedClasses
    : [];
  
  const baseItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
  ];
  
  const adminItems = [
    ...baseItems,
    { to: '/admin/classes', icon: GraduationCap, label: 'Klassen' },
    { to: '/admin/teachers', icon: UserCheck, label: 'Leraren' },
    { to: '/admin/parents', icon: Users, label: 'Ouders' },
    { to: '/admin/students', icon: Baby, label: 'Leerlingen' },
    { to: '/admin/payments', icon: CreditCard, label: 'Betalingen' },
    { to: '/admin/settings', icon: Settings, label: 'Instellingen' }
  ];

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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {/* Dashboard altijd bovenaan */}
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
          
          {/* Leraar Accordion Menu */}
          {currentUser.role === 'teacher' && (
            <div className="space-y-1">
              <button
                onClick={() => setIsTeacherMenuOpen(!isTeacherMenuOpen)}
                className={`flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                  isTeacherSectionActive
                    ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={isCollapsed ? 'Mijn Klassen' : ''}
              >
                <div className="flex items-center">
                  <GraduationCap 
                    className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
                    size={20} 
                  />
                  {!isCollapsed && 'Mijn Klassen'}
                </div>
                {!isCollapsed && (
                  <span className="ml-2">
                    {isTeacherMenuOpen ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </span>
                )}
              </button>
              
              {!isCollapsed && isTeacherMenuOpen && (
                <div className="ml-6 space-y-1">
                  {myClasses.length > 0 ? (
                    myClasses.map(cls => (
                      <NavLink 
                        key={cls.id} 
                        to={`/teacher/my-classes/${cls.id}`} 
                        className={({ isActive }) => `flex items-center w-full px-2 py-1.5 text-xs font-medium rounded-md transition-colors group ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                      >
                        <Circle size={6} className="mr-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{cls.name}</span>
                      </NavLink>
                    ))
                  ) : (
                    <div className="flex items-center w-full px-2 py-1.5 text-xs text-gray-400 italic">
                      <Circle size={6} className="mr-3 text-gray-300 flex-shrink-0" />
                      Geen klassen toegewezen
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ouder sectie (bestaande code) */}
          {currentUser.role === 'parent' && (
            <div className={`flex items-center rounded-md transition-colors group ${
              isParentSectionActive 
                ? 'bg-emerald-100' 
                : 'hover:bg-gray-100'
            }`}>
              <NavLink 
                to="/parent/my-children" 
                className={`flex-1 flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors ${
                  isParentSectionActive 
                    ? 'text-emerald-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={isCollapsed ? 'Mijn Kinderen' : ''}
              >
                <Baby 
                  className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} 
                  size={20} 
                />
                {!isCollapsed && 'Mijn Kinderen'}
              </NavLink>
              {!isCollapsed && (
                <button 
                  onClick={() => setIsChildrenMenuOpen(!isChildrenMenuOpen)} 
                  className={`p-2 rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                    isParentSectionActive 
                      ? 'text-emerald-700 hover:text-emerald-800' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Toon kinderen"
                >
                  {isChildrenMenuOpen ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Submenu voor de kinderen */}
          {currentUser.role === 'parent' && !isCollapsed && isChildrenMenuOpen && (
            <div className="ml-6 space-y-1">
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

          {/* Admin navigatie */}
          {currentUser.role === 'admin' && (
            adminItems.slice(1).map((item) => (
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
                {!isCollapsed && item.label}
              </NavLink>
            ))
          )}
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