import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { SEOHelmet } from '../../components/common/SEOHelmet';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Lockout timer
  useEffect(() => {
    if (lockCountdown > 0) {
      const timer = setTimeout(() => setLockCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockCountdown === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockCountdown, isLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Both username and password are required.');
      return;
    }

    const result = await login(username.trim(), password);

    if (result.success) {
      navigate('/admin', { replace: true });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockCountdown(30);
        setError('Too many failed attempts. Account locked for 30 seconds.');
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <SEOHelmet
        title="Admin Login — Peshawari Chappal"
        description="Secure admin login portal"
      />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
        backgroundSize: '20px 20px'
      }} />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-1">Admin Control Center</h1>
          <p className="text-slate-400 text-sm">Peshawari Chappal Co. — Secure Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">

          {/* Security Notice */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 mb-6">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-300">
              This is a restricted area. All access is logged and monitored.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username Field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  disabled={isLocked}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={isLocked}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-600/10 border border-rose-500/30">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            {/* Attempt Counter */}
            {attempts > 0 && attempts < 5 && !isLocked && (
              <p className="text-center text-xs text-amber-400">
                {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining before temporary lockout
              </p>
            )}

            {/* Lockout Countdown */}
            {isLocked && (
              <div className="text-center">
                <p className="text-xs text-rose-400 font-bold">
                  Locked — try again in {lockCountdown}s
                </p>
                <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 transition-all duration-1000"
                    style={{ width: `${(lockCountdown / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying credentials...
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  Account Locked
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Sign In to Admin Panel
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-[11px] text-slate-600 mt-6">
            This panel is restricted to authorized personnel only.
            <br />Unauthorized access attempts are logged.
          </p>
        </div>

        {/* Back to Store */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Return to storefront
          </a>
        </div>
      </div>
    </div>
  );
};
