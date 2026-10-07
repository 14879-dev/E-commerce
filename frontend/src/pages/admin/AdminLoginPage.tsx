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
      try {
        localStorage.setItem('psh_admin_active_tab', 'dashboard');
      } catch {}
      navigate('/admin?tab=dashboard', { replace: true });
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
      try {
        localStorage.setItem('psh_admin_active_tab', 'dashboard');
      } catch {}
      navigate('/admin?tab=dashboard', { replace: true });
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
    <div className="min-h-screen bg-[#F7F4EB] flex items-center justify-center p-4 relative overflow-hidden text-[#1A1A18]">
      <SEOHelmet
        title="Admin Login — Peshawari Chappal"
        description="Secure admin login portal"
      />

      {/* Subtle ambient luxury orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A0988A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#565449]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#565449] text-[#F7F4EB] flex items-center justify-center mx-auto mb-4 shadow-xl border border-[#A0988A]/40">
            <ShieldCheck className="w-8 h-8 text-[#F7F4EB]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1A18] mb-1">Admin Control Center</h1>
          <p className="text-[#1A1A18]/80 text-sm">Peshawari Chappal Co. — Secure Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#F7F4EB] border border-[#565449]/20 rounded-3xl p-8 shadow-2xl">

          {/* Security Notice */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#565449]/10 border border-[#565449]/20 mb-6">
            <Lock className="w-4 h-4 text-[#1A1A18] shrink-0" />
            <p className="text-xs text-[#1A1A18] font-medium">
              This is a restricted area. All access is logged and monitored.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username Field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#1A1A18] block mb-2">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A18]/60" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  disabled={isLocked}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-[#1A1A18] text-sm focus:outline-none focus:border-[#565449] placeholder-[#565449]/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#1A1A18] block mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A18]/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={isLocked}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-[#1A1A18] text-sm focus:outline-none focus:border-[#565449] placeholder-[#565449]/50 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A18]/70 hover:text-[#1A1A18] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#565449]/15 border border-[#565449]/40">
                <AlertCircle className="w-4 h-4 text-[#1A1A18] shrink-0 mt-0.5" />
                <p className="text-xs text-[#1A1A18] font-bold">{error}</p>
              </div>
            )}

            {/* Attempt Counter */}
            {attempts > 0 && attempts < 5 && !isLocked && (
              <p className="text-center text-xs text-[#1A1A18] font-bold">
                {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining before temporary lockout
              </p>
            )}

            {/* Lockout Countdown */}
            {isLocked && (
              <div className="text-center">
                <p className="text-xs text-[#1A1A18] font-bold">
                  Locked — try again in {lockCountdown}s
                </p>
                <div className="mt-2 h-1 bg-[#A0988A]/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#565449] transition-all duration-1000"
                    style={{ width: `${(lockCountdown / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-3.5 rounded-xl bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold text-sm transition-all shadow-lg border border-[#565449] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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
          <p className="text-center text-[11px] text-[#1A1A18]/70 mt-6">
            This panel is restricted to authorized personnel only.
            <br />Unauthorized access attempts are logged.
          </p>
        </div>

        {/* Back to Store */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-[#1A1A18] hover:underline font-bold transition-colors"
          >
            ← Return to storefront
          </a>
        </div>
      </div>
    </div>
  );
};
