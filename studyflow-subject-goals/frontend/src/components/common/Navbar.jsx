import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, PlusCircle, Search, User, Settings, LogOut, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick, onOpenLogModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu & Current Path Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-slate-800">StudyFlow AI</span>
          <span>/</span>
          <span className="text-indigo-600 font-bold">Workspace</span>
        </div>
      </div>

      {/* Right: Quick Actions & Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick Log Button */}
        <button
          onClick={onOpenLogModal}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 transition-all shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Quick Log Time</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <span className="text-xs font-bold text-slate-700 hidden md:inline">
              {user?.name || 'Student'}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xs font-bold uppercase shadow-2xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-slate-500 truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
