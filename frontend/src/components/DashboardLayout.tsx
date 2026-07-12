import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Navigation, 
  Wrench, 
  Fuel, 
  BarChart2, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import type { UserRole } from '../services/types';

export const DashboardLayout: React.FC = () => {
  const { user, logout, updateRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet', path: '/fleet', icon: Truck },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: Navigation },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', path: '/expenses', icon: Fuel },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800">
        <div className="p-6">
          {/* Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-[#eab308] flex items-center justify-center font-bold text-slate-900 rounded-lg text-base">
              T
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TransitOps</span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition duration-150 ${
                      isActive
                        ? 'bg-[#eab308] text-slate-900 shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="w-10 h-10 rounded-full border-2 border-[#eab308] bg-slate-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <div className="relative inline-block text-left w-full mt-0.5">
                <select
                  value={user?.role}
                  onChange={(e) => updateRole(e.target.value as UserRole)}
                  className="bg-transparent text-xs font-semibold text-[#eab308] focus:outline-none cursor-pointer pr-4 appearance-none"
                >
                  <option value="Fleet Manager" className="bg-slate-900 text-white">Fleet Manager</option>
                  <option value="Dispatcher" className="bg-slate-900 text-white">Dispatcher</option>
                  <option value="Safety Officer" className="bg-slate-900 text-white">Safety Officer</option>
                  <option value="Financial Analyst" className="bg-slate-900 text-white">Financial Analyst</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#eab308] absolute right-4 top-1 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-white font-semibold text-sm transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold text-slate-800">
              Operational Mode:{' '}
              <span className="text-[#ca8a04] px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-semibold uppercase">
                {user?.role}
              </span>
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-slate-500 font-medium">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Live Server Connected
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
