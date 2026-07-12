import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Settings, Shield, Moon, Bell, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://api.transitops.internal/v1');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System preferences updated successfully!');
  };

  const handleResetSim = () => {
    localStorage.clear();
    toast.success('Simulation state reset! Reloading page...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-900">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
          <Settings className="w-8 h-8 text-[#eab308]" />
          <span>System Settings</span>
        </h1>
        <p className="text-slate-500 mt-1">Configure TransitOps workspace, user preferences, API endpoint tunnels, and simulation states.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Category Tab Info */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-amber-50 text-slate-900 font-bold text-sm">
              <Settings className="w-4 h-4 text-amber-600" />
              <span>General Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold text-sm transition">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Security & Roles</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold text-sm transition">
              <Bell className="w-4 h-4 text-slate-500" />
              <span>Alert Dispatches</span>
            </button>
          </div>

          {/* Current Profile Card */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-amber-500/10 text-amber-400 rounded-bl-xl font-bold text-[10px] uppercase tracking-widest">
              Active Session
            </div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">User Profile</p>
            <h4 className="text-lg font-black mt-1">{user?.name || 'Simulator User'}</h4>
            <p className="text-xs text-slate-400 font-semibold">{user?.email}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned Role:</span>
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow">
                {user?.role || 'Fleet Manager'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Preference Forms */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-black text-slate-950 border-b border-slate-100 pb-4">Workspace Customization</h3>
            
            {/* Dark Mode toggle simulation */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Simulate Dark Theme</span>
                </label>
                <p className="text-xs text-slate-500 font-semibold">Toggles responsive dark background shades</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDarkMode(!darkMode);
                  toast.success(darkMode ? 'Theme changed to Light Mode' : 'Theme changed to Dark Mode');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-[#eab308]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Email Notifications log */}
            <div className="flex items-center justify-between py-2 border-t border-slate-100 pt-4">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  <span>E-mail Notification Reminders</span>
                </label>
                <p className="text-xs text-slate-500 font-semibold">Notify Safety Officer automatically when license expiration draws near</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-[#eab308]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Simulated API base endpoint URL */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">FastAPI Target Proxy URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-sm"
                  placeholder="https://your-api.domain/v1"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                By default, Axios routing switches dynamically to match environment values if configured in <code>VITE_API_URL</code>.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="bg-[#eab308] text-slate-950 font-bold hover:bg-yellow-600 px-6 py-2.5 rounded-lg shadow-md transition"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Danger zone resetting simulation */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-wide">Developer Tools & Clean State</h4>
              <p className="text-xs text-rose-700 font-semibold">This deletes all local storage drivers, vehicles, maintenance reports, and fuel logs, resetting back to seeded mock assets.</p>
            </div>
            
            <div>
              <button
                onClick={handleResetSim}
                className="bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition inline-flex items-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Simulation Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
