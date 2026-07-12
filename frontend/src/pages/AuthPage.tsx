import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../services/types';
import toast from 'react-hot-toast';

export const AuthPage: React.FC = () => {
  const { login, user } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('Raven.k@transitops.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('Dispatcher');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (locked) {
      toast.error('Account is locked. Please contact your Fleet Manager.');
      return;
    }

    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Authenticates against the real backend. If the account doesn't
      // exist yet, it's registered on the fly with the chosen role.
      await login(email, password, role);
      setFailedAttempts(0);
      toast.success(`Successfully signed in as ${role}!`);
    } catch (err: any) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setLocked(true);
        toast.error('Account locked after 5 failed attempts.');
      } else {
        toast.error(err.message || `Invalid credentials. ${5 - attempts} attempts remaining.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Left Banner */}
      <div className="w-full md:w-[40%] bg-[#1e293b] text-white flex flex-col justify-between p-12 relative overflow-hidden">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-[#eab308] flex items-center justify-center font-bold text-slate-900 rounded-lg text-lg">
              T
            </div>
            <span className="text-2xl font-bold tracking-tight">TransitOps</span>
          </div>
          <p className="text-slate-400 text-sm italic uppercase tracking-wider mb-8">
            Smart Transport Operations Platform
          </p>

          <div className="space-y-6 mt-16">
            <h3 className="text-lg font-semibold text-slate-200">One login, four roles:</h3>
            <ul className="space-y-3 pl-4">
              <li className="flex items-center space-x-2 text-slate-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
                <span>Fleet Manager</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
                <span>Dispatcher</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
                <span>Safety Officer</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
                <span>Financial Analyst</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-12 font-semibold">
          TRANSITOPS © 2026 · RBAC ENABLED
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Error state box (Matching screenshot red box) */}
            {(failedAttempts > 0 || locked) && (
              <div className="p-4 border-2 border-dashed border-red-400 bg-red-50 rounded-lg text-red-700 text-sm space-y-1">
                <div className="font-bold flex items-center">
                  ✕ Invalid credentials.
                </div>
                {locked ? (
                  <div className="font-semibold text-red-600">
                    Account locked after 5 failed attempts.
                  </div>
                ) : (
                  <div>
                    Account will be locked after 5 failed attempts ({5 - failedAttempts} left).
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                required
                disabled={locked}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-[#eab308] transition text-sm text-slate-900 bg-slate-50"
                placeholder="Raven.k@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                disabled={locked}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-[#eab308] transition text-sm text-slate-900 bg-slate-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Hint: Use password123</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Role (RBAC)
              </label>
              <select
                disabled={locked}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-[#eab308] transition text-sm text-slate-900 bg-slate-50 appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#eab308] focus:ring-[#eab308]"
                />
                <span className="select-none font-medium text-slate-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => toast.error('Reset link sent to registered email.')}
                className="text-blue-600 hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={locked || isSubmitting}
              className={`w-full py-3.5 rounded-lg font-bold text-white shadow-md transition transform active:scale-95 ${
                locked || isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#eab308] hover:bg-yellow-600'
              }`}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
              Access is scoped by role after login:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">• Fleet Manager</span>
                <p className="pl-3 text-slate-500">Fleet, Maintenance</p>
              </div>
              <div>
                <span className="font-semibold text-slate-800">• Dispatcher</span>
                <p className="pl-3 text-slate-500">Dashboard, Trips</p>
              </div>
              <div>
                <span className="font-semibold text-slate-800">• Safety Officer</span>
                <p className="pl-3 text-slate-500">Drivers, Compliance</p>
              </div>
              <div>
                <span className="font-semibold text-slate-800">• Financial Analyst</span>
                <p className="pl-3 text-slate-500">Fuel & Expenses, Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
