import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AdminUser {
  username: string;
  role: 'superadmin' | 'manager' | 'staff';
  name?: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCredentials: (newUsername?: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const SESSION_KEY = 'psh_admin_token';
const SESSION_USER_KEY = 'psh_admin_user';
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};
const API_BASE = getApiBase();

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = sessionStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(SESSION_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Verify token on mount (check it's not expired)
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (tkn: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (!res.ok) {
        // Token invalid/expired — clear session
        clearSession();
      }
    } catch {
      // Network error — keep session but will fail on next API call
    }
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setToken(null);
    setUser(null);
  };

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const adminUser: AdminUser = { username: data.username, role: data.role };

      // Store in sessionStorage and localStorage for resilience
      sessionStorage.setItem(SESSION_KEY, data.token);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(adminUser));
      localStorage.setItem(SESSION_KEY, data.token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(adminUser));

      setToken(data.token);
      setUser(adminUser);

      return { success: true };
    } catch {
      return { success: false, error: 'Cannot reach server. Check if backend is running.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    // Replace history state so back button cannot return to admin
    window.history.replaceState(null, '', '/admin/login');
    window.location.href = '/admin/login';
  }, []);

  const updateCredentials = useCallback(async (newUsername?: string, newPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${API_BASE}/api/admin/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to update credentials' };

      const updatedUser: AdminUser = {
        username: data.username,
        role: data.role,
        name: data.username,
      };
      sessionStorage.setItem(SESSION_KEY, data.token);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(SESSION_KEY, data.token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      setToken(data.token);
      setUser(updatedUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error updating credentials' };
    }
  }, [token]);

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated: !!token && !!user,
      user,
      token,
      login,
      logout,
      updateCredentials,
      isLoading,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
};

// Helper: get auth headers for admin API calls
export const getAdminAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem(SESSION_KEY);
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};
