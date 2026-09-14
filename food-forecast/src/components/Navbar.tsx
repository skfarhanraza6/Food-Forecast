import React, { useState } from 'react';
import {
  Utensils,
  BarChart3,
  CalendarDays,
  Sparkles,
  Shield,
  Trash2,
  Sliders,
  MessageSquareQuote,
  Flame,
  UserCheck,
  ChevronDown,
  LogOut,
  Layers,
  Leaf,
  Bell,
  Scale,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  showLanding,
  setShowLanding,
}) => {
  const { user, login, logout } = useAuth();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['STUDENT', 'STAFF', 'ADMIN'] },
    { id: 'meals', label: 'Meals & Menu', icon: CalendarDays, roles: ['STUDENT', 'STAFF', 'ADMIN'] },
    { id: 'predictions', label: 'Prediction Engine', icon: Sparkles, roles: ['STAFF', 'ADMIN'] },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders, roles: ['STUDENT', 'STAFF', 'ADMIN'] },
    { id: 'consumption', label: 'Kitchen Prep', icon: Scale, roles: ['STAFF', 'ADMIN'] },
    { id: 'waste', label: 'Waste Log', icon: Trash2, roles: ['STAFF', 'ADMIN'] },
    { id: 'analytics', label: 'Analytics', icon: Layers, roles: ['STUDENT', 'STAFF', 'ADMIN'] },
    { id: 'queries', label: 'Ask Assistant', icon: Sparkles, roles: ['STUDENT', 'STAFF', 'ADMIN'] },
    { id: 'feedback', label: 'Student Feedback', icon: MessageSquareQuote, roles: ['STUDENT', 'STAFF', 'ADMIN'] },
    { id: 'settings', label: 'Buffer Settings', icon: Sliders, roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  const handleRoleChange = async (role: UserRole) => {
    setIsRoleMenuOpen(false);
    // Real login with verified bcrypt password hash against PostgreSQL
    if (role === 'ADMIN') {
      await login('admin@campus.edu', 'Admin@123');
    } else if (role === 'STAFF') {
      await login('chef.ramesh@campus.edu', 'Chef@123');
    } else {
      await login('aarav.patel@campus.edu', 'Student@123');
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#06090e]/95 backdrop-blur-md border-b border-zinc-800/80 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              type="button"
              onClick={() => {
                setShowLanding(false);
                setCurrentTab('dashboard');
              }}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(16,240,114,0.35)] group-hover:scale-105 transition-transform">
                <img src="/logo-icon.png" alt="Food Forecast logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-white tracking-tight font-display">
                    FOOD <span className="text-[#10f072]">FORECAST</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/30 tracking-wide uppercase">
                    Sustain X
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium -mt-0.5">
                  Intelligent Buffer & Demand Platform
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-landing-toggle"
              type="button"
              onClick={() => setShowLanding(!showLanding)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                showLanding
                  ? 'btn-bubble-green'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {showLanding ? 'App Dashboard' : 'About & Landing'}
            </button>

            {!showLanding && (
              <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 ml-1">
                {filteredNavItems.slice(0, 7).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      id={`nav-item-${item.id}`}
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'btn-bubble-green'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Right Action: Demo Switcher & User Status */}
          <div className="flex items-center gap-3">
            {/* 1-Click Role Switcher */}
            <div className="relative">
              <button
                id="role-switcher-btn"
                type="button"
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors"
                title="Switch demo account"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    user?.role === 'ADMIN'
                      ? 'bg-amber-400'
                      : user?.role === 'STAFF'
                      ? 'bg-sky-400'
                      : 'bg-[#10f072]'
                  }`}
                />
                <span className="hidden sm:inline text-slate-400 font-normal">Role:</span>
                <span className="font-bold">{user?.role || 'Guest'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isRoleMenuOpen && (
                <div
                  id="role-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0d1117] border border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.9)] py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-200"
                >
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Demo Account Switcher
                    </div>
                    <div className="text-xs font-medium text-slate-300 mt-0.5">
                      Switch personas instantly:
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      id="switch-admin-btn"
                      type="button"
                      onClick={() => handleRoleChange('ADMIN')}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-800/60 text-xs ${
                        user?.role === 'ADMIN' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Dr. Rajesh Sharma (ADMIN)
                        </div>
                        <div className="text-[11px] text-slate-400 ml-3">Full analytics, buffer config, meals</div>
                      </div>
                      {user?.role === 'ADMIN' && <UserCheck className="w-4 h-4 text-amber-400" />}
                    </button>

                    <button
                      id="switch-staff-btn"
                      type="button"
                      onClick={() => handleRoleChange('STAFF')}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-800/60 text-xs ${
                        user?.role === 'STAFF' ? 'bg-sky-500/15 text-sky-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          Chef Ramesh Kumar (STAFF)
                        </div>
                        <div className="text-[11px] text-slate-400 ml-3">Log prep, monitor consumption, waste</div>
                      </div>
                      {user?.role === 'STAFF' && <UserCheck className="w-4 h-4 text-sky-400" />}
                    </button>

                    <button
                      id="switch-student-btn"
                      type="button"
                      onClick={() => handleRoleChange('STUDENT')}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-800/60 text-xs ${
                        user?.role === 'STUDENT' ? 'bg-[#10f072]/15 text-[#10f072] font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10f072]" />
                          Aarav Patel (STUDENT)
                        </div>
                        <div className="text-[11px] text-slate-400 ml-3">RSVP intention, feedback, ask AI</div>
                      </div>
                      {user?.role === 'STUDENT' && <UserCheck className="w-4 h-4 text-[#10f072]" />}
                    </button>
                  </div>

                  <div className="pt-2 mt-1 border-t border-zinc-800 px-1 space-y-1">
                    <button
                      id="custom-login-nav-btn"
                      type="button"
                      onClick={() => {
                        setIsRoleMenuOpen(false);
                        setCurrentTab('login');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#10f072]" />
                      <span>Custom Email / Password Login</span>
                    </button>

                    <button
                      id="navbar-logout-btn"
                      type="button"
                      onClick={() => {
                        setIsRoleMenuOpen(false);
                        logout();
                        setCurrentTab('login');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Log Out of Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Name Tag */}
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {user?.name || 'Guest User'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {user?.hostel || 'Campus Mess'}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Mobile/Tablet Navigation Bar */}
        {!showLanding && (
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-zinc-800/80 scrollbar-none">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  id={`mob-nav-${item.id}`}
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'btn-bubble-green'
                      : 'text-slate-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
