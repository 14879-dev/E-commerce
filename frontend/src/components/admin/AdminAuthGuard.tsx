import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
          </div>
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Replace current history entry so back button won't return here after logout
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
