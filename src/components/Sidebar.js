// src/components/Sidebar.js - AANGEPAST VOOR LERAAR ACCORDION
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
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
  Circle,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { realData } = useData();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  // Set sidebar collapsed by default on mobile, hidden completely on mobile
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // Collapsed on mobile by default
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setIsCollapsed(true);
          setIsMobileMenuOpen(false); // Close mobile menu on resize
        } else if (!isMobile && isCollapsed && window.innerWidth >= 1024) {
          setIsCollapsed(false);
          setIsMobileMenuOpen(false); // Reset mobile menu state
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isCollapsed]);

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

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
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') }
  ];

  const adminItems = [
    ...baseItems,
    { to: '/admin/classes', icon: GraduationCap, label: t('nav.classes') },
    { to: '/admin/teachers', icon: UserCheck, label: t('nav.teachers') },
    { to: '/admin/parents', icon: Users, label: t('nav.parents') },
    { to: '/admin/students', icon: Baby, label: t('nav.students') },
    { to: '/admin/payments', icon: CreditCard, label: t('nav.payments') },
    { to: '/admin/settings', icon: Settings, label: t('nav.settings') }
  ];

  return (
    <>
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between relative z-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            aria-label={isMobileMenuOpen ? 'Menu sluiten' : 'Menu openen'}
          >
            {isMobileMenuOpen ? (
              <X size={24} className="text-gray-600" />
            ) : (
              <Menu size={24} className="text-gray-600" />
            )}
          </button>
          <div>
            <h2 className="text-lg font-semibold text-emerald-700">MijnLVS</h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Desktop: Always visible, Mobile: Slide-in overlay */}
      <div className={`
        ${/* Desktop styles */ ''}
        md:bg-white md:shadow-lg md:transition-all md:duration-300 
        ${isCollapsed ? 'md:w-16' : 'md:w-64'} 
        md:flex md:flex-col md:h-screen md:sticky md:top-0
        ${/* Mobile styles */ ''}
        ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}
        fixed md:relative top-0 left-0 z-50 md:z-auto
        w-64 md:w-auto h-full md:h-screen
        bg-white shadow-xl md:shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Desktop Header */}
        <div className="hidden md:block p-4 border-b border-gray-200">
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

        {/* Mobile Header inside sidebar */}
        <div className="md:hidden p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop User Info */}
        {!isCollapsed && (
          <div className="hidden md:block p-4 border-b border-gray-200 bg-gray-50">
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
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
              isActive 
                ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-600' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={isCollapsed ? t('nav.dashboard') : ''}
          >
            <LayoutDashboard
              className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
              size={20}
            />
            {!isCollapsed && t('nav.dashboard')}
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
                title={isCollapsed ? t('nav.myClasses') : ''}
              >
                <div className="flex items-center">
                  <GraduationCap
                    className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
                    size={20}
                  />
                  {!isCollapsed && t('nav.myClasses')}
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
                        onClick={handleLinkClick}
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
                      {t('teacher.noClasses')}
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
                onClick={handleLinkClick}
                className={`flex-1 flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors ${
                  isParentSectionActive 
                    ? 'text-emerald-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={isCollapsed ? t('nav.myChildren') : ''}
              >
                <Baby
                  className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
                  size={20}
                />
                {!isCollapsed && t('nav.myChildren')}
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
                    onClick={handleLinkClick}
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
                  {t('parent.noChildren')}
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
                onClick={handleLinkClick}
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

        {/* Language Switcher */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-2">
            <div className="px-2">
              <LanguageSwitcher variant="dropdown" />
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            title={isCollapsed ? t('nav.logout') : ''}
          >
            <LogOut
              className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
              size={20}
            />
            {!isCollapsed && t('nav.logout')}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;