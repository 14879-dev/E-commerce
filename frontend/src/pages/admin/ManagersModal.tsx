import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface ManagerAccount {
  id: string;
  username: string;
  name?: string;
  role: string;
  createdAt: string;
}

interface ManagersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagersModal: React.FC<ManagersModalProps> = ({ isOpen, onClose }) => {
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'manager' | 'director' | 'admin'>('manager');

  useEffect(() => {
    if (isOpen) {
      loadManagers();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const loadManagers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getManagers();
      setManagers(data);
    } catch {
      setError('Could not load manager accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setCreating(true);
    const result = await apiService.createManager({
      username: username.trim(),
      password: password.trim(),
      name: name.trim() || undefined,
      role: role,
    });

    setCreating(false);
    if (result.success) {
      setSuccess(`${role.toUpperCase()} account "${username.trim()}" created successfully!`);
      setUsername('');
      setPassword('');
      setName('');
      setRole('manager');
      loadManagers();
    } else {
      setError(result.error || 'Failed to create user account.');
    }
  };

  const handleDeleteManager = async (id: string, uname: string) => {
    if (!window.confirm(`Are you sure you want to remove user account "${uname}"?`)) return;
    setError(null);
    setSuccess(null);
    const result = await apiService.deleteManager(id);
    if (result.success) {
      setSuccess(`Account "${uname}" removed.`);
      loadManagers();
    } else {
      setError(result.error || 'Failed to remove account.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Team Roles & Staff Access</h3>
              <p className="text-[11px] text-slate-500">
                Create &amp; manage credentials for Managers, Directors, and Administrators in MongoDB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add New Manager / Director Form */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Add New User / Staff Account
            </h4>

            <form onSubmit={handleCreateManager} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Khan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tariq_mgr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="manager">Manager</option>
                    <option value="director">Director</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Managers List */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Active Team Accounts ({managers.length})
            </h4>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading team accounts...</div>
            ) : managers.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No extra manager or director accounts created yet. You can create one above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {managers.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                        m.role === 'director'
                          ? 'bg-amber-100 text-amber-700'
                          : m.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {m.username.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{m.name || m.username}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{m.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        m.role === 'director'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : m.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {m.role || 'manager'}
                      </span>
                      <button
                        onClick={() => handleDeleteManager(m.id, m.username)}
                        className="p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs hover:scale-105"
                        style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                        title="Remove account"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#DC2626', stroke: '#DC2626' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
