// src/components/Sidebar.js - Uitgebreid met Absenties & Qor'aan menu items
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UserCheck, 
  Baby, 
  CreditCard, 
  Settings, 
  LogOut,
  BookOpen,
  Calendar,
  BookMarked,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!currentUser) return null;

  // Navigation items per role
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

    if (currentUser.role === 'parent') {
      return [
        ...baseItems,
        { 
          to: '/parent/my-children', 
          icon: Baby, 
          label: 'Mijn Kinderen' 
        },
        { 
          to: '/parent/attendance', 
          icon: Calendar, 
          label: 'Absenties',
          description: 'Aanwezigheid overzicht' 
        },
        { 
          to: '/parent/quran-progress', 
          icon: BookMarked, 
          label: 'Qor\'aan Voortgang',
          description: 'Memorisatie overzicht' 
        }
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

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
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
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
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
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
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
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